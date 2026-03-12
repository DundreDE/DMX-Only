import { useState, useCallback } from 'react'
import { useFixtureStore } from '../../store/useFixtureStore'
import type { FixtureDefinition, FixtureCapabilityType } from '../../../../shared/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const FIXTURE_TYPES = [
  'Generic', 'Moving Head', 'Moving Light', 'Scanner', 'LED Bar', 'PAR',
  'Spot', 'Wash', 'Beam', 'Hazer', 'Fogger', 'Strobe', 'Dimmer', 'Controller',
]

const CAP_TYPES: FixtureCapabilityType[] = [
  'Dimmer', 'Red', 'Green', 'Blue', 'White', 'Amber', 'UV',
  'Pan', 'PanFine', 'Tilt', 'TiltFine',
  'Gobo', 'ColorWheel', 'Shutter', 'Strobe', 'Speed',
  'Maintenance', 'Nothing', 'Generic',
]

const CAP_COLOUR: Record<FixtureCapabilityType, string> = {
  Dimmer: '#ffd700', Red: '#ff4d4d', Green: '#4dff88', Blue: '#4da6ff',
  White: '#e8eaf6', Amber: '#ffaa00', UV: '#aa44ff',
  Pan: '#00d4ff', PanFine: '#00aad4', Tilt: '#00b4ff', TiltFine: '#0090d4',
  Gobo: '#ff88cc', ColorWheel: '#ff44ff', Shutter: '#aaffff',
  Strobe: '#ffffaa', Speed: '#aaffaa', Maintenance: '#ff8844',
  Nothing: '#444', Generic: '#9097b8',
}

// Quick-add channel presets: [label, primaryType, single default cap name]
const CHANNEL_PRESETS: [string, FixtureCapabilityType, string][] = [
  ['Dimmer',      'Dimmer',     'Intensity'],
  ['Red',         'Red',        'Red Intensity'],
  ['Green',       'Green',      'Green Intensity'],
  ['Blue',        'Blue',       'Blue Intensity'],
  ['White',       'White',      'White Intensity'],
  ['Amber',       'Amber',      'Amber Intensity'],
  ['UV',          'UV',         'UV Intensity'],
  ['Pan',         'Pan',        'Pan'],
  ['Pan Fine',    'PanFine',    'Pan Fine'],
  ['Tilt',        'Tilt',       'Tilt'],
  ['Tilt Fine',   'TiltFine',   'Tilt Fine'],
  ['Gobo',        'Gobo',       'Gobo Wheel'],
  ['Color Wheel', 'ColorWheel', 'Color Wheel'],
  ['Strobe',      'Strobe',     'Strobe'],
  ['Speed',       'Speed',      'Speed'],
  ['Generic',     'Generic',    'Function'],
]

// ─── Local data structures ────────────────────────────────────────────────────

interface CapDef {
  id: string
  min: number
  max: number
  name: string
  type: FixtureCapabilityType
}

interface ChDef {
  id: string
  name: string
  primaryType: FixtureCapabilityType
  caps: CapDef[]
}

interface ModeDef {
  id: string
  name: string
  channelIds: string[]  // ordered channel IDs
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function defaultCap(type: FixtureCapabilityType, name: string): CapDef {
  return { id: uid(), min: 0, max: 255, name, type }
}

function makeChannel(name: string, type: FixtureCapabilityType, capName: string): ChDef {
  return { id: uid(), name, primaryType: type, caps: [defaultCap(type, capName)] }
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface FixtureCreatorProps {
  editTarget?: FixtureDefinition   // if set, load this fixture for editing
  onClose?: () => void
}

export function FixtureCreator({ editTarget, onClose }: FixtureCreatorProps): React.JSX.Element {
  const { addToLibrary, library } = useFixtureStore()

  // ── General info ──
  const [mfr,   setMfr]   = useState(editTarget?.manufacturer ?? '')
  const [model, setModel] = useState(editTarget?.model        ?? '')
  const [type,  setType]  = useState(editTarget?.type         ?? 'Generic')

  // ── Channels ──
  const [channels, setChannels] = useState<ChDef[]>(() => {
    if (!editTarget) return []
    const allChs = editTarget.modes[0]?.channels ?? []
    return allChs.map((ch, i) => ({
      id: `ch_${i}`,   // stable index IDs so modes can reference them
      name: ch.name,
      primaryType: ch.primaryType,
      caps: ch.capabilities.map((c) => ({
        id: uid(), min: c.min, max: c.max, name: c.name, type: c.type,
      })),
    }))
  })

  const [selectedChId, setSelectedChId] = useState<string | null>(null)
  const selectedCh = channels.find((c) => c.id === selectedChId) ?? null

  // ── Modes ──
  // For editTarget: channels are indexed ch_0..ch_N from mode[0]. Other modes match by channel name.
  const [modes, setModes] = useState<ModeDef[]>(() => {
    if (!editTarget) return [{ id: uid(), name: 'Mode 1', channelIds: [] }]
    const refChannels = editTarget.modes[0]?.channels ?? []
    const nameToId = new Map(refChannels.map((ch, i) => [ch.name, `ch_${i}`]))
    return editTarget.modes.map((m) => ({
      id: uid(),
      name: m.name,
      channelIds: m.channels
        .map((ch) => nameToId.get(ch.name))
        .filter(Boolean) as string[],
    }))
  })
  const [selectedModeId, setSelectedModeId] = useState<string | null>(
    modes[0]?.id ?? null
  )

  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // ── Channel operations ──
  function addChannelPreset(preset: [string, FixtureCapabilityType, string]): void {
    const [name, type, capName] = preset
    const ch = makeChannel(name, type, capName)
    setChannels((prev) => [...prev, ch])
    setSelectedChId(ch.id)
    // Auto-add to selected mode
    if (selectedModeId) {
      setModes((prev) =>
        prev.map((m) => m.id === selectedModeId
          ? { ...m, channelIds: [...m.channelIds, ch.id] }
          : m
        )
      )
    }
  }

  function addBlankChannel(): void {
    const ch = makeChannel(`Kanal ${channels.length + 1}`, 'Generic', 'Funktion')
    setChannels((prev) => [...prev, ch])
    setSelectedChId(ch.id)
    if (selectedModeId) {
      setModes((prev) =>
        prev.map((m) => m.id === selectedModeId
          ? { ...m, channelIds: [...m.channelIds, ch.id] }
          : m
        )
      )
    }
  }

  function removeChannel(id: string): void {
    setChannels((prev) => prev.filter((c) => c.id !== id))
    setModes((prev) =>
      prev.map((m) => ({ ...m, channelIds: m.channelIds.filter((cid) => cid !== id) }))
    )
    if (selectedChId === id) setSelectedChId(null)
  }

  function updateChannel(id: string, changes: Partial<ChDef>): void {
    setChannels((prev) => prev.map((c) => c.id === id ? { ...c, ...changes } : c))
  }

  // ── Capability operations ──
  function addCap(chId: string): void {
    const ch = channels.find((c) => c.id === chId)
    if (!ch) return
    const lastCap = ch.caps[ch.caps.length - 1]
    const min = lastCap ? Math.min(lastCap.max + 1, 255) : 0
    const newCap: CapDef = { id: uid(), min, max: 255, name: 'Funktion', type: ch.primaryType }
    updateChannel(chId, { caps: [...ch.caps, newCap] })
  }

  function updateCap(chId: string, capId: string, changes: Partial<CapDef>): void {
    const ch = channels.find((c) => c.id === chId)
    if (!ch) return
    updateChannel(chId, {
      caps: ch.caps.map((cap) => cap.id === capId ? { ...cap, ...changes } : cap)
    })
  }

  function removeCap(chId: string, capId: string): void {
    const ch = channels.find((c) => c.id === chId)
    if (!ch) return
    updateChannel(chId, { caps: ch.caps.filter((c) => c.id !== capId) })
  }

  // ── Mode operations ──
  function addMode(): void {
    const m: ModeDef = { id: uid(), name: `Mode ${modes.length + 1}`, channelIds: channels.map((c) => c.id) }
    setModes((prev) => [...prev, m])
    setSelectedModeId(m.id)
  }

  function removeMode(id: string): void {
    setModes((prev) => prev.filter((m) => m.id !== id))
    if (selectedModeId === id) setSelectedModeId(modes.find((m) => m.id !== id)?.id ?? null)
  }

  function updateMode(id: string, changes: Partial<ModeDef>): void {
    setModes((prev) => prev.map((m) => m.id === id ? { ...m, ...changes } : m))
  }

  function toggleModeChannel(modeId: string, chId: string): void {
    const mode = modes.find((m) => m.id === modeId)
    if (!mode) return
    const has = mode.channelIds.includes(chId)
    updateMode(modeId, {
      channelIds: has
        ? mode.channelIds.filter((id) => id !== chId)
        : [...mode.channelIds, chId],
    })
  }

  function moveModeChannel(modeId: string, fromIdx: number, dir: 1 | -1): void {
    const mode = modes.find((m) => m.id === modeId)
    if (!mode) return
    const toIdx = fromIdx + dir
    if (toIdx < 0 || toIdx >= mode.channelIds.length) return
    const ids = [...mode.channelIds]
    ;[ids[fromIdx], ids[toIdx]] = [ids[toIdx], ids[fromIdx]]
    updateMode(modeId, { channelIds: ids })
  }

  // ── Validation ──
  function validate(): string[] {
    const errs: string[] = []
    if (!mfr.trim())    errs.push('Hersteller ist erforderlich.')
    if (!model.trim())  errs.push('Modellname ist erforderlich.')
    if (channels.length === 0) errs.push('Mindestens ein Kanal erforderlich.')
    if (modes.length === 0)    errs.push('Mindestens ein Mode erforderlich.')
    for (const m of modes) {
      if (m.channelIds.length === 0) errs.push(`Mode "${m.name}" hat keine Kanäle.`)
    }
    for (const ch of channels) {
      if (!ch.name.trim()) errs.push(`Kanal hat keinen Namen.`)
      for (let i = 1; i < ch.caps.length; i++) {
        if (ch.caps[i].min <= ch.caps[i - 1].max)
          errs.push(`Kanal "${ch.name}": Capabilities überlappen sich.`)
      }
    }
    return errs
  }

  // ── Save ──
  const saveToLibrary = useCallback((): void => {
    const errs = validate()
    if (errs.length > 0) { setErrors(errs); return }
    setErrors([])

    const chMap = new Map<string, ChDef>(channels.map((ch) => [ch.id, ch]))
    const def: FixtureDefinition = {
      id: editTarget?.id ?? uid(),
      manufacturer: mfr.trim(),
      model: model.trim(),
      type,
      modes: modes.map((mode) => ({
        name: mode.name,
        channels: mode.channelIds
          .map((cid, i) => {
            const ch = chMap.get(cid)
            if (!ch) return null
            return {
              number: i + 1,
              name: ch.name,
              primaryType: ch.primaryType,
              capabilities: ch.caps.map((cap) => ({
                min: cap.min, max: cap.max, name: cap.name, type: cap.type,
              })),
            }
          })
          .filter((x): x is NonNullable<typeof x> => x !== null),
      })),
    }

    addToLibrary([def])
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }, [mfr, model, type, channels, modes, editTarget, addToLibrary])

  // ── Reset ──
  function resetAll(): void {
    if (!confirm('Fixture zurücksetzen? Alle Änderungen gehen verloren.')) return
    setMfr(''); setModel(''); setType('Generic')
    setChannels([]); setModes([{ id: uid(), name: 'Mode 1', channelIds: [] }])
    setSelectedChId(null); setSelectedModeId(null); setErrors([])
  }

  // ── Render ──
  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0a0c12' }}>

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-3 shrink-0"
        style={{ borderBottom: '1px solid #1e2130', background: '#0f1117', height: 44 }}
      >
        <span className="text-sm font-bold" style={{ color: '#6c63ff' }}>🔧 Fixture-Editor</span>

        {/* Load existing */}
        <select
          className="ml-2 px-2 py-1 rounded text-xs"
          style={{ background: '#1e2130', color: '#9097b8', border: '1px solid #2a2d3e', maxWidth: 200 }}
          value=""
          onChange={(e) => {
            const def = library.find((d) => d.id === e.target.value)
            if (!def) return
            setMfr(def.manufacturer); setModel(def.model); setType(def.type)
            const firstMode = def.modes[0]?.channels ?? []
            const chs: ChDef[] = firstMode.map((ch) => ({
              id: uid(), name: ch.name, primaryType: ch.primaryType,
              caps: ch.capabilities.map((c) => ({ id: uid(), ...c })),
            }))
            setChannels(chs)
            setModes(def.modes.map((m) => ({
              id: uid(), name: m.name,
              channelIds: m.channels.map((_, ci) => chs[ci]?.id ?? '').filter(Boolean),
            })))
            setSelectedChId(null); setSelectedModeId(null)
          }}
        >
          <option value="">Aus Bibliothek laden …</option>
          {library.map((d) => (
            <option key={d.id} value={d.id}>{d.manufacturer} — {d.model}</option>
          ))}
        </select>

        <div className="flex-1" />

        <button
          onClick={resetAll}
          className="px-3 py-1.5 rounded text-[10px] transition-colors"
          style={{ background: '#1e2130', color: '#9097b8', border: '1px solid #2a2d3e' }}
        >
          Neu / Reset
        </button>

        <button
          onClick={saveToLibrary}
          className="px-4 py-1.5 rounded text-[10px] font-bold transition-all"
          style={{
            background: saved ? '#00d68f' : '#6c63ff',
            color: '#fff',
            boxShadow: saved ? '0 0 8px #00d68f88' : 'none',
          }}
        >
          {saved ? '✓ Gespeichert!' : '💾 In Bibliothek speichern'}
        </button>

        {onClose && (
          <button onClick={onClose} className="px-2 py-1.5 rounded text-xs" style={{ color: '#555a7a' }}>✕</button>
        )}
      </div>

      {/* ── Validation errors ─────────────────────────────────────── */}
      {errors.length > 0 && (
        <div className="px-4 py-2 flex gap-2 flex-wrap shrink-0" style={{ background: '#ff4d6a15', borderBottom: '1px solid #ff4d6a33' }}>
          {errors.map((e, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded" style={{ background: '#ff4d6a22', color: '#ff4d6a' }}>{e}</span>
          ))}
        </div>
      )}

      {/* ── Body ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Info + channel list + mode list */}
        <LeftPanel
          mfr={mfr} setMfr={setMfr}
          model={model} setModel={setModel}
          type={type} setType={setType}
          channels={channels}
          selectedChId={selectedChId}
          setSelectedChId={setSelectedChId}
          onAddPreset={addChannelPreset}
          onAddBlank={addBlankChannel}
          onRemoveChannel={removeChannel}
          modes={modes}
          selectedModeId={selectedModeId}
          setSelectedModeId={setSelectedModeId}
          onAddMode={addMode}
          onRemoveMode={removeMode}
        />

        {/* Center: Channel editor */}
        <div className="flex-1 overflow-hidden flex flex-col" style={{ borderRight: '1px solid #1e2130' }}>
          {selectedCh ? (
            <ChannelEditor
              ch={selectedCh}
              onChange={(changes) => updateChannel(selectedCh.id, changes)}
              onAddCap={() => addCap(selectedCh.id)}
              onUpdateCap={(capId, changes) => updateCap(selectedCh.id, capId, changes)}
              onRemoveCap={(capId) => removeCap(selectedCh.id, capId)}
            />
          ) : (
            <CenterEmpty channels={channels} onSelectCh={setSelectedChId} />
          )}
        </div>

        {/* Right: Mode builder */}
        <ModePanel
          modes={modes}
          selectedModeId={selectedModeId}
          channels={channels}
          onToggleChannel={toggleModeChannel}
          onMoveChannel={moveModeChannel}
          onUpdateMode={updateMode}
          onSelectMode={setSelectedModeId}
        />

      </div>
    </div>
  )
}

// ─── Left Panel ───────────────────────────────────────────────────────────────

interface LeftPanelProps {
  mfr: string; setMfr: (v: string) => void
  model: string; setModel: (v: string) => void
  type: string; setType: (v: string) => void
  channels: ChDef[]
  selectedChId: string | null
  setSelectedChId: (id: string | null) => void
  onAddPreset: (p: [string, FixtureCapabilityType, string]) => void
  onAddBlank: () => void
  onRemoveChannel: (id: string) => void
  modes: ModeDef[]
  selectedModeId: string | null
  setSelectedModeId: (id: string | null) => void
  onAddMode: () => void
  onRemoveMode: (id: string) => void
}

function LeftPanel({
  mfr, setMfr, model, setModel, type, setType,
  channels, selectedChId, setSelectedChId,
  onAddPreset, onAddBlank, onRemoveChannel,
  modes, selectedModeId, setSelectedModeId, onAddMode, onRemoveMode,
}: LeftPanelProps): React.JSX.Element {
  const [showPresets, setShowPresets] = useState(false)

  return (
    <div
      className="flex flex-col shrink-0 overflow-y-auto gap-4 p-3"
      style={{ width: 220, borderRight: '1px solid #1e2130', background: '#0a0c12' }}
    >
      {/* General info */}
      <section>
        <SectionLabel>Allgemein</SectionLabel>
        <div className="flex flex-col gap-1.5">
          <FieldRow label="Hersteller">
            <input value={mfr} onChange={(e) => setMfr(e.target.value)} placeholder="z.B. Chauvet"
              className="w-full rounded px-2 py-1 text-xs" style={inputStyle} />
          </FieldRow>
          <FieldRow label="Modell">
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="z.B. Spot 250"
              className="w-full rounded px-2 py-1 text-xs" style={inputStyle} />
          </FieldRow>
          <FieldRow label="Typ">
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full rounded px-2 py-1 text-xs" style={inputStyle}>
              {FIXTURE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </FieldRow>
        </div>
      </section>

      {/* Channel list */}
      <section>
        <div className="flex items-center justify-between mb-1.5">
          <SectionLabel nomb>Kanäle ({channels.length})</SectionLabel>
          <div className="flex gap-1">
            <button
              onClick={() => setShowPresets((v) => !v)}
              className="px-1.5 py-0.5 rounded text-[9px]"
              style={{ background: showPresets ? '#6c63ff33' : '#1e2130', color: '#9097b8', border: '1px solid #2a2d3e' }}
              title="Schnell-Preset hinzufügen"
            >⚡ Preset</button>
            <button onClick={onAddBlank}
              className="px-1.5 py-0.5 rounded text-[9px]"
              style={{ background: '#1e2130', color: '#6c63ff', border: '1px solid #6c63ff44' }}
            >+ Leer</button>
          </div>
        </div>

        {/* Preset palette */}
        {showPresets && (
          <div className="flex flex-wrap gap-1 mb-2 p-1.5 rounded-lg" style={{ background: '#131620', border: '1px solid #1e2130' }}>
            {CHANNEL_PRESETS.map((p) => (
              <button
                key={p[0]}
                onClick={() => { onAddPreset(p); setShowPresets(false) }}
                className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                style={{
                  background: `${CAP_COLOUR[p[1]]}22`,
                  color: CAP_COLOUR[p[1]],
                  border: `1px solid ${CAP_COLOUR[p[1]]}44`,
                }}
              >{p[0]}</button>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-0.5">
          {channels.map((ch, i) => (
            <div
              key={ch.id}
              onClick={() => setSelectedChId(ch.id === selectedChId ? null : ch.id)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer group transition-all"
              style={{
                background: selectedChId === ch.id ? '#6c63ff22' : 'transparent',
                border: `1px solid ${selectedChId === ch.id ? '#6c63ff55' : 'transparent'}`,
              }}
            >
              <span className="text-[9px] shrink-0 w-4 text-right" style={{ color: '#3a3f5a' }}>{i + 1}</span>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CAP_COLOUR[ch.primaryType] }} />
              <span className="flex-1 text-[10px] truncate" style={{ color: '#e8eaf6' }}>{ch.name}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveChannel(ch.id) }}
                className="opacity-0 group-hover:opacity-100 text-[9px] px-1 rounded transition-opacity"
                style={{ color: '#ff4d6a' }}
              >✕</button>
            </div>
          ))}
          {channels.length === 0 && (
            <p className="text-[9px] text-center py-3" style={{ color: '#3a3f5a' }}>
              Kein Kanal. Preset oder Leer hinzufügen.
            </p>
          )}
        </div>
      </section>

      {/* Mode list */}
      <section>
        <div className="flex items-center justify-between mb-1.5">
          <SectionLabel nomb>Modes</SectionLabel>
          <button onClick={onAddMode}
            className="px-1.5 py-0.5 rounded text-[9px]"
            style={{ background: '#1e2130', color: '#6c63ff', border: '1px solid #6c63ff44' }}
          >+ Mode</button>
        </div>
        <div className="flex flex-col gap-0.5">
          {modes.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelectedModeId(m.id === selectedModeId ? null : m.id)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer group transition-all"
              style={{
                background: selectedModeId === m.id ? '#6c63ff22' : 'transparent',
                border: `1px solid ${selectedModeId === m.id ? '#6c63ff55' : 'transparent'}`,
              }}
            >
              <span className="flex-1 text-[10px]" style={{ color: '#e8eaf6' }}>
                {m.name}
              </span>
              <span className="text-[9px]" style={{ color: '#555a7a' }}>{m.channelIds.length}ch</span>
              <button
                onClick={(e) => { e.stopPropagation(); if (modes.length > 1) onRemoveMode(m.id) }}
                className="opacity-0 group-hover:opacity-100 text-[9px] px-1 rounded transition-opacity"
                style={{ color: modes.length > 1 ? '#ff4d6a' : '#3a3f5a' }}
              >✕</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// ─── Channel Editor (center) ──────────────────────────────────────────────────

interface ChannelEditorProps {
  ch: ChDef
  onChange: (changes: Partial<ChDef>) => void
  onAddCap: () => void
  onUpdateCap: (capId: string, changes: Partial<CapDef>) => void
  onRemoveCap: (capId: string) => void
}

function ChannelEditor({ ch, onChange, onAddCap, onUpdateCap, onRemoveCap }: ChannelEditorProps): React.JSX.Element {
  // Cap range validation
  function isCapValid(caps: CapDef[], idx: number): boolean {
    const cap = caps[idx]
    if (cap.min > cap.max) return false
    if (idx > 0 && cap.min <= caps[idx - 1].max) return false
    if (idx < caps.length - 1 && cap.max >= caps[idx + 1].min) return false
    return true
  }

  // Visual DMX range bar (0-255)
  const coveragePct = ch.caps.length > 0
    ? Math.round(((ch.caps[ch.caps.length - 1].max - ch.caps[0].min + 1) / 256) * 100)
    : 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 shrink-0" style={{ borderBottom: '1px solid #1e2130' }}>
        <div className="w-3 h-3 rounded-full" style={{ background: CAP_COLOUR[ch.primaryType] }} />
        <input
          value={ch.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="flex-1 text-sm font-bold rounded px-2 py-0.5"
          style={{ background: 'transparent', color: '#e8eaf6', border: '1px solid transparent',
            outline: 'none', transition: 'border-color 0.2s' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#6c63ff55')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
        />
        {/* Primary type selector */}
        <select
          value={ch.primaryType}
          onChange={(e) => onChange({ primaryType: e.target.value as FixtureCapabilityType })}
          className="px-2 py-1 rounded text-xs"
          style={{
            background: `${CAP_COLOUR[ch.primaryType]}22`,
            color: CAP_COLOUR[ch.primaryType],
            border: `1px solid ${CAP_COLOUR[ch.primaryType]}55`,
          }}
        >
          {CAP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* DMX coverage visualiser */}
      <div className="px-4 py-2 shrink-0" style={{ borderBottom: '1px solid #1e2130' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[9px]" style={{ color: '#555a7a' }}>DMX Abdeckung</span>
          <span className="text-[9px]" style={{ color: coveragePct === 100 ? '#00d68f' : '#ffd700' }}>
            {coveragePct}%
          </span>
        </div>
        <div className="flex h-3 rounded overflow-hidden gap-px" style={{ background: '#1e2130' }}>
          {ch.caps.map((cap) => (
            <div
              key={cap.id}
              title={`${cap.name}: ${cap.min}–${cap.max}`}
              style={{
                width: `${((cap.max - cap.min + 1) / 256) * 100}%`,
                marginLeft: `${(cap.min / 256) * 100}%`,
                background: CAP_COLOUR[cap.type],
                minWidth: 2,
              }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[8px]" style={{ color: '#3a3f5a' }}>0</span>
          <span className="text-[8px]" style={{ color: '#3a3f5a' }}>255</span>
        </div>
      </div>

      {/* Capabilities table */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] uppercase tracking-widest" style={{ color: '#3a3f5a' }}>
            Capabilities ({ch.caps.length})
          </span>
          <button
            onClick={onAddCap}
            className="px-2 py-0.5 rounded text-[9px] font-semibold"
            style={{ background: '#6c63ff22', color: '#6c63ff', border: '1px solid #6c63ff44' }}
          >+ Capability</button>
        </div>

        {/* Column headers */}
        <div className="grid gap-1 mb-1" style={{ gridTemplateColumns: '44px 44px 1fr 120px 20px' }}>
          {['Min', 'Max', 'Name', 'Typ', ''].map((h) => (
            <span key={h} className="text-[8px] uppercase px-1" style={{ color: '#3a3f5a' }}>{h}</span>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          {ch.caps.map((cap, idx) => {
            const valid = isCapValid(ch.caps, idx)
            return (
              <div
                key={cap.id}
                className="grid gap-1 items-center rounded px-1 py-0.5"
                style={{
                  gridTemplateColumns: '44px 44px 1fr 120px 20px',
                  background: valid ? 'transparent' : '#ff4d6a11',
                  border: `1px solid ${valid ? 'transparent' : '#ff4d6a44'}`,
                }}
              >
                <input
                  type="number" min={0} max={255} value={cap.min}
                  onChange={(e) => onUpdateCap(cap.id, { min: Number(e.target.value) })}
                  className="w-full rounded px-1 py-0.5 text-xs text-center"
                  style={inputStyle}
                />
                <input
                  type="number" min={0} max={255} value={cap.max}
                  onChange={(e) => onUpdateCap(cap.id, { max: Number(e.target.value) })}
                  className="w-full rounded px-1 py-0.5 text-xs text-center"
                  style={inputStyle}
                />
                <input
                  value={cap.name}
                  onChange={(e) => onUpdateCap(cap.id, { name: e.target.value })}
                  className="w-full rounded px-2 py-0.5 text-xs"
                  style={inputStyle}
                />
                <select
                  value={cap.type}
                  onChange={(e) => onUpdateCap(cap.id, { type: e.target.value as FixtureCapabilityType })}
                  className="rounded px-1 py-0.5 text-xs"
                  style={{
                    ...inputStyle,
                    color: CAP_COLOUR[cap.type],
                    background: `${CAP_COLOUR[cap.type]}22`,
                  }}
                >
                  {CAP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button
                  onClick={() => onRemoveCap(cap.id)}
                  className="text-[9px] text-center rounded"
                  style={{ color: '#ff4d6a', background: 'transparent' }}
                >✕</button>
              </div>
            )
          })}
          {ch.caps.length === 0 && (
            <p className="text-[10px] text-center py-4" style={{ color: '#3a3f5a' }}>
              Keine Capabilities. Klick + Capability.
            </p>
          )}
        </div>
      </div>

      {/* Smart tips */}
      <div className="px-4 py-2 shrink-0 flex flex-wrap gap-2" style={{ borderTop: '1px solid #1e2130' }}>
        <span className="text-[9px]" style={{ color: '#3a3f5a' }}>Schnell-Fill:</span>
        {[
          ['0–255 komplett', () => onUpdateCap(ch.caps[0]?.id ?? '', { min: 0, max: 255 })],
          ['Blackout (0)', () => { const prev = ch.caps; onUpdateCap(prev[0]?.id ?? '', { min: 0, max: 0, name: 'Blackout', type: 'Nothing' }) }],
        ].map(([label, fn]) => (
          <button
            key={label as string}
            onClick={fn as () => void}
            className="px-1.5 py-0.5 rounded text-[9px]"
            style={{ background: '#1e2130', color: '#9097b8', border: '1px solid #2a2d3e' }}
          >{label as string}</button>
        ))}
      </div>
    </div>
  )
}

// ─── Center empty state ───────────────────────────────────────────────────────

function CenterEmpty({ channels, onSelectCh }: { channels: ChDef[]; onSelectCh: (id: string) => void }): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: '#3a3f5a' }}>
      <span className="text-5xl">🎛️</span>
      <p className="text-sm font-medium" style={{ color: '#555a7a' }}>Kanal auswählen</p>
      {channels.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 max-w-xs justify-center">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => onSelectCh(ch.id)}
              className="px-2 py-1 rounded text-[10px]"
              style={{
                background: `${CAP_COLOUR[ch.primaryType]}22`,
                color: CAP_COLOUR[ch.primaryType],
                border: `1px solid ${CAP_COLOUR[ch.primaryType]}55`,
              }}
            >{ch.name}</button>
          ))}
        </div>
      ) : (
        <p className="text-xs">Linkes Panel: Kanal über Preset oder Leer hinzufügen.</p>
      )}
    </div>
  )
}

// ─── Mode Panel (right) ───────────────────────────────────────────────────────

interface ModePanelProps {
  modes: ModeDef[]
  selectedModeId: string | null
  channels: ChDef[]
  onToggleChannel: (modeId: string, chId: string) => void
  onMoveChannel: (modeId: string, fromIdx: number, dir: 1 | -1) => void
  onUpdateMode: (id: string, changes: Partial<ModeDef>) => void
  onSelectMode: (id: string) => void
}

function ModePanel({ modes, selectedModeId, channels, onToggleChannel, onMoveChannel, onUpdateMode, onSelectMode }: ModePanelProps): React.JSX.Element {
  const mode = modes.find((m) => m.id === selectedModeId)

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{ width: 230, background: '#0a0c12' }}
    >
      <div className="px-3 py-2 shrink-0 flex items-center justify-between" style={{ borderBottom: '1px solid #1e2130' }}>
        <SectionLabel nomb>Mode-Builder</SectionLabel>
        {modes.length > 1 && (
          <div className="flex gap-1">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectMode(m.id)}
                className="text-[9px] px-1.5 py-0.5 rounded"
                style={{
                  background: m.id === selectedModeId ? '#6c63ff33' : '#1e2130',
                  color: m.id === selectedModeId ? '#e8eaf6' : '#555a7a',
                  border: `1px solid ${m.id === selectedModeId ? '#6c63ff' : '#2a2d3e'}`,
                }}
              >{m.name}</button>
            ))}
          </div>
        )}
      </div>

      {mode ? (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Mode name */}
          <div className="px-3 pt-2 pb-1 shrink-0">
            <input
              value={mode.name}
              onChange={(e) => onUpdateMode(mode.id, { name: e.target.value })}
              className="w-full rounded px-2 py-1 text-xs font-semibold"
              style={inputStyle}
            />
            <p className="text-[9px] mt-1" style={{ color: '#3a3f5a' }}>
              {mode.channelIds.length} Kanäle aktiv
            </p>
          </div>

          {/* Ordered channel list in this mode */}
          <div className="flex-1 overflow-y-auto px-3 pb-2">
            <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: '#3a3f5a' }}>Kanalreihenfolge</p>
            <div className="flex flex-col gap-0.5">
              {mode.channelIds.map((cid, idx) => {
                const ch = channels.find((c) => c.id === cid)
                if (!ch) return null
                return (
                  <div
                    key={cid}
                    className="flex items-center gap-1.5 px-1.5 py-1 rounded"
                    style={{ background: '#131620', border: '1px solid #1e2130' }}
                  >
                    <span className="text-[8px] w-4 text-right shrink-0" style={{ color: '#3a3f5a' }}>
                      {idx + 1}
                    </span>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CAP_COLOUR[ch.primaryType] }} />
                    <span className="flex-1 text-[10px] truncate" style={{ color: '#e8eaf6' }}>{ch.name}</span>
                    <div className="flex flex-col gap-0">
                      <button onClick={() => onMoveChannel(mode.id, idx, -1)}
                        className="text-[8px] leading-none px-0.5" style={{ color: '#555a7a' }}>▲</button>
                      <button onClick={() => onMoveChannel(mode.id, idx, 1)}
                        className="text-[8px] leading-none px-0.5" style={{ color: '#555a7a' }}>▼</button>
                    </div>
                    <button
                      onClick={() => onToggleChannel(mode.id, cid)}
                      className="text-[9px] px-1 rounded"
                      style={{ color: '#ff4d6a', background: '#ff4d6a11' }}
                    >✕</button>
                  </div>
                )
              })}
            </div>

            {/* Available channels not in this mode */}
            {channels.filter((c) => !mode.channelIds.includes(c.id)).length > 0 && (
              <>
                <p className="text-[9px] uppercase tracking-widest mt-3 mb-1" style={{ color: '#3a3f5a' }}>Verfügbar (+)</p>
                <div className="flex flex-col gap-0.5">
                  {channels
                    .filter((c) => !mode.channelIds.includes(c.id))
                    .map((ch) => (
                      <button
                        key={ch.id}
                        onClick={() => onToggleChannel(mode.id, ch.id)}
                        className="flex items-center gap-1.5 px-1.5 py-1 rounded text-left transition-all"
                        style={{ background: '#131620', border: '1px dashed #2a2d3e' }}
                      >
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: CAP_COLOUR[ch.primaryType] }} />
                        <span className="text-[10px]" style={{ color: '#555a7a' }}>{ch.name}</span>
                        <span className="ml-auto text-[9px]" style={{ color: '#6c63ff' }}>+</span>
                      </button>
                    ))}
                </div>
              </>
            )}

            {mode.channelIds.length === 0 && channels.length === 0 && (
              <p className="text-[9px] text-center py-4" style={{ color: '#3a3f5a' }}>
                Noch keine Kanäle definiert.
              </p>
            )}
          </div>

          {/* Mode summary */}
          <div className="px-3 py-2 shrink-0 flex flex-wrap gap-1" style={{ borderTop: '1px solid #1e2130' }}>
            {mode.channelIds.map((cid, i) => {
              const ch = channels.find((c) => c.id === cid)
              if (!ch) return null
              return (
                <div
                  key={cid}
                  title={`Ch${i + 1}: ${ch.name}`}
                  className="w-4 h-4 rounded"
                  style={{ background: CAP_COLOUR[ch.primaryType] }}
                />
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center flex-1 gap-2" style={{ color: '#3a3f5a' }}>
          <span className="text-3xl">🎚️</span>
          <p className="text-xs">Mode im linken Panel auswählen.</p>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: '#131620',
  color: '#e8eaf6',
  border: '1px solid #2a2d3e',
}

function SectionLabel({ children, nomb }: { children: React.ReactNode; nomb?: boolean }): React.JSX.Element {
  return (
    <p
      className={`text-[9px] uppercase tracking-widest ${nomb ? '' : 'mb-2'}`}
      style={{ color: '#3a3f5a' }}
    >
      {children}
    </p>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[9px]" style={{ color: '#555a7a' }}>{label}</label>
      {children}
    </div>
  )
}
