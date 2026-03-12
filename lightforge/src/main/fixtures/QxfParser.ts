import { readFile, readdir } from "fs/promises"
import { join, extname, basename } from "path"
import { randomUUID } from "crypto"
import type {
  FixtureDefinition,
  FixtureMode,
  FixtureChannel,
  FixtureCapability,
  FixtureCapabilityType
} from "../../shared/types"

// ─── Minimal XML helpers ─────────────────────────────────────────────────────

function getTagContent(xml: string, tag: string): string | null {
  const open = `<${tag}`
  const close = `</${tag}>`
  const start = xml.indexOf(open)
  if (start === -1) return null
  const contentStart = xml.indexOf(">", start) + 1
  const end = xml.indexOf(close, contentStart)
  if (end === -1) return null
  return xml.slice(contentStart, end).trim()
}

function getTagWithAttrs(
  xml: string,
  tag: string
): Array<{ attrs: Record<string, string>; content: string }> {
  const results: Array<{ attrs: Record<string, string>; content: string }> = []
  const open = `<${tag}`
  const close = `</${tag}>`
  let searchFrom = 0

  while (true) {
    const start = xml.indexOf(open, searchFrom)
    if (start === -1) break
    const tagEnd = xml.indexOf(">", start)
    if (tagEnd === -1) break
    const tagHeader = xml.slice(start, tagEnd + 1)
    const isSelfClosing = tagHeader.endsWith("/>")
    const attrs: Record<string, string> = {}
    const attrRegex = /(\w+)="([^"]*)"/g
    let match: RegExpExecArray | null
    while ((match = attrRegex.exec(tagHeader)) !== null) {
      attrs[match[1]] = match[2]
    }
    let content = ""
    if (!isSelfClosing) {
      const contentStart = tagEnd + 1
      const end = xml.indexOf(close, contentStart)
      if (end === -1) { searchFrom = tagEnd + 1; continue }
      content = xml.slice(contentStart, end).trim()
      searchFrom = end + close.length
    } else {
      searchFrom = tagEnd + 1
    }
    results.push({ attrs, content })
  }
  return results
}

// ─── Capability type mapping ──────────────────────────────────────────────────

function mapCapabilityType(preset: string, name: string): FixtureCapabilityType {
  const p = (preset || '').toLowerCase()
  const n = (name || '').toLowerCase()

  // Exact channel-level Preset matches (highest priority)
  if (p === 'intensityred') return 'Red'
  if (p === 'intensitygreen') return 'Green'
  if (p === 'intensityblue') return 'Blue'
  if (p === 'intensitywhite') return 'White'
  if (p === 'intensityamber') return 'Amber'
  if (p === 'intensityuv' || p === 'intensitycuv') return 'UV'
  if (p === 'intensitydimmer' || p === 'intensitymasterdimmer') return 'Dimmer'
  if (p === 'positionpan') return 'Pan'
  if (p === 'positionpanfine') return 'PanFine'
  if (p === 'positiontilt') return 'Tilt'
  if (p === 'positiontiltfine') return 'TiltFine'
  if (p.startsWith('speedpantilt') || p === 'speedoverall') return 'Speed'
  if (p.includes('gobo')) return 'Gobo'
  if (p.includes('shutter') || p.includes('strobe')) return 'Shutter'
  if (p.includes('colorwheel') || p.includes('colourwheel')) return 'ColorWheel'
  if (p.includes('maintenance') || p.includes('reset')) return 'Maintenance'

  // Name-based fallback — colors checked BEFORE generic "intensity/dimmer"
  if (n.includes('red') || n.includes(' rot') || n === 'rot') return 'Red'
  if (n.includes('green') || n.includes('grün') || n.includes('gruen')) return 'Green'
  if (n.includes('blue') || n.includes('blau')) return 'Blue'
  if (n.includes('white') || n.includes('weiß') || n.includes('weiss')) return 'White'
  if (n.includes('amber')) return 'Amber'
  if (n === 'uv' || n.includes('ultraviolet') || n.includes('u.v.') || n.endsWith(' uv')) return 'UV'
  if (n === 'pan') return 'Pan'
  if (n.includes('pan fine') || n === 'pan fein') return 'PanFine'
  if (n === 'tilt') return 'Tilt'
  if (n.includes('tilt fine') || n === 'tilt fein') return 'TiltFine'
  if (n.includes('gobo')) return 'Gobo'
  if (n.includes('shutter')) return 'Shutter'
  if (n.includes('strobe')) return 'Strobe'
  if (n.includes('speed')) return 'Speed'
  if (n.includes('color wheel') || n.includes('colour wheel')) return 'ColorWheel'
  if (n.includes('reset') || n.includes('maintenance')) return 'Maintenance'
  // Dimmer / master AFTER colors so "Intensity Red" doesn't match here
  if (n === 'dimmer' || n === 'master' || n === 'master dimmer' || n === 'intensity' || n.startsWith('dimmer')) return 'Dimmer'
  if (n.includes('dimmer') || n.includes('intensity')) return 'Dimmer'
  if (n === 'nothing' || n.includes('no function')) return 'Nothing'
  return 'Generic'
}

function parseChannel(channelXml: string, number: number, name: string, channelPreset?: string): FixtureChannel {
  const capabilityTags = getTagWithAttrs(channelXml, "Capability")
  const capabilities: FixtureCapability[] = capabilityTags.map((cap) => ({
    min: parseInt(cap.attrs["Min"] ?? "0", 10),
    max: parseInt(cap.attrs["Max"] ?? "255", 10),
    name: cap.content,
    type: mapCapabilityType(cap.attrs["Preset"] ?? "", cap.content)
  }))
  const groupMatch = channelXml.match(/<Group[^>]*>([^<]*)<\/Group>/)
  const groupName = groupMatch ? groupMatch[1] : ""
  // Channel-level Preset takes priority over <Group> text
  const primaryType = mapCapabilityType(channelPreset ?? groupName, name)
  return { number, name, capabilities, primaryType }
}

// ─── Parse a single .qxf file ────────────────────────────────────────────────

export async function parseQxfFile(
  filePath: string,
  overrideManufacturer?: string
): Promise<FixtureDefinition> {
  const raw = await readFile(filePath, "utf-8")
  const manufacturer = overrideManufacturer ?? getTagContent(raw, "Manufacturer") ?? "Unknown"
  const model = getTagContent(raw, "Model") ?? basename(filePath, ".qxf")
  const type = getTagContent(raw, "Type") ?? "Generic"

  const channelDefs = getTagWithAttrs(raw, "Channel")
  const channelMap = new Map<string, { xml: string; name: string; preset: string }>()
  channelDefs.forEach((ch) => {
    if (ch.attrs["Name"]) channelMap.set(ch.attrs["Name"], {
      xml: ch.content,
      name: ch.attrs["Name"],
      preset: ch.attrs["Preset"] ?? ""
    })
  })

  const modeTags = getTagWithAttrs(raw, "Mode")
  const modes: FixtureMode[] = modeTags.map((modeTag) => {
    const modeName = modeTag.attrs["Name"] || "Default"
    // Filter to only channel refs that have a Number attribute (excludes <Head> child channels)
    const channelRefs = getTagWithAttrs(modeTag.content, "Channel").filter(
      (ref) => ref.attrs["Number"] !== undefined
    )
    const channels: FixtureChannel[] = channelRefs.map((ref, idx) => {
      const chNumber = parseInt(ref.attrs["Number"] ?? String(idx), 10) + 1
      const chName = ref.content
      const chDef = channelMap.get(chName)
      if (chDef) return parseChannel(chDef.xml, chNumber, chName, chDef.preset)
      return { number: chNumber, name: chName, capabilities: [], primaryType: "Generic" as FixtureCapabilityType }
    })
    return { name: modeName, channels }
  })

  if (modes.length === 0 && channelMap.size > 0) {
    const channels: FixtureChannel[] = []
    let num = 1
    for (const [name, def] of channelMap) channels.push(parseChannel(def.xml, num++, name))
    modes.push({ name: "Default", channels })
  }

  return { id: randomUUID(), manufacturer, model, type, modes }
}

// ─── Scan an entire QLC+ fixture folder ──────────────────────────────────────
//
// Expected layout (matches what QLC+ ships and what the user drops in):
//
//   <root>/
//     Manufacturer Name/          ← folder name = manufacturer
//       Fixture Model.qxf
//       Another Model.qxf
//     Another Manufacturer/
//       ...
//
// Optional manufacturer meta file inside each subfolder:
//   manufacturer.yml / manufacturer.yaml  →  key "name:" overrides display name
//
// The function also handles one extra level of nesting (series folders).

export interface FolderScanResult {
  fixtures: FixtureDefinition[]
  errors: { file: string; error: string }[]
  manufacturerCount: number
  fixtureCount: number
}

async function resolveManufacturerName(manufacturerPath: string, fallback: string): Promise<string> {
  try {
    const files = await readdir(manufacturerPath)
    for (const f of files) {
      const ext = extname(f).toLowerCase()
      if ((ext === ".yml" || ext === ".yaml") && f.toLowerCase().includes("manufacturer")) {
        const content = await readFile(join(manufacturerPath, f), "utf-8")
        const m = content.match(/^name:\s*['"]?(.+?)['"]?\s*$/m)
        if (m) return m[1].trim()
      }
    }
  } catch { /* ignore */ }
  return fallback
}

async function scanQxfFilesInDir(
  dir: string,
  manufacturer: string,
  fixtures: FixtureDefinition[],
  errors: { file: string; error: string }[]
): Promise<boolean> {
  let any = false
  let entries
  try { entries = await readdir(dir, { withFileTypes: true }) } catch { return false }

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      // One level of nesting (series subfolder)
      const sub = await scanQxfFilesInDir(fullPath, manufacturer, fixtures, errors)
      if (sub) any = true
    } else if (entry.isFile() && extname(entry.name).toLowerCase() === ".qxf") {
      try {
        fixtures.push(await parseQxfFile(fullPath, manufacturer))
        any = true
      } catch (e) {
        errors.push({ file: entry.name, error: String(e) })
      }
    }
  }
  return any
}

export async function scanFixtureFolder(folderPath: string): Promise<FolderScanResult> {
  const fixtures: FixtureDefinition[] = []
  const errors: { file: string; error: string }[] = []
  let manufacturerCount = 0

  let entries
  try {
    entries = await readdir(folderPath, { withFileTypes: true })
  } catch {
    return { fixtures, errors: [{ file: folderPath, error: "Cannot read folder" }], manufacturerCount: 0, fixtureCount: 0 }
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const manufacturerPath = join(folderPath, entry.name)
    const manufacturerName = await resolveManufacturerName(manufacturerPath, entry.name)
    const hadFixtures = await scanQxfFilesInDir(manufacturerPath, manufacturerName, fixtures, errors)
    if (hadFixtures) manufacturerCount++
  }

  return { fixtures, errors, manufacturerCount, fixtureCount: fixtures.length }
}
