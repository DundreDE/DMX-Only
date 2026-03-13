// ════════════════════════════════════════════════════════════════════════════
//  Scene Editor Helper Functions & Constants
// ════════════════════════════════════════════════════════════════════════════

import type {
  FixtureCapabilityType,
  PatchedFixture,
  FixtureDefinition,
  EfxWave,
} from '../../../shared/types'

// ── Math Utils ───────────────────────────────────────────────────────────────
export const clamp = (v: number, lo: number, hi: number): number =>
  Math.max(lo, Math.min(hi, v))

// ── Color Conversion ─────────────────────────────────────────────────────────
export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h / 60) % 6
  const f = h / 60 - Math.floor(h / 60)
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t2 = v * (1 - (1 - f) * s)
  const rows: [number, number, number][] = [
    [v, q, p],
    [t2, v, p],
    [p, v, q],
    [p, t2, v],
    [q, p, v],
    [v, p, t2],
  ]
  return rows[i].map(x => Math.round(x * 255)) as [number, number, number]
}

export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  const v = max
  const s = max === 0 ? 0 : d / max
  let h = 0
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h = (h * 60 + 360) % 360
  }
  return [h, s, v]
}

// ── Wave Calculation ─────────────────────────────────────────────────────────
export function calcWave(
  wave: EfxWave,
  t: number,
  bpm: number,
  size: number,
  base: number,
  deg: number,
): number {
  const freq = bpm / 60
  const phase = 2 * Math.PI * freq * t + (deg * Math.PI) / 180
  let w = 0
  if (wave === 'sine') w = Math.sin(phase)
  if (wave === 'triangle') w = (2 / Math.PI) * Math.asin(Math.sin(phase))
  if (wave === 'square') w = Math.sign(Math.sin(phase))
  if (wave === 'sawtooth') w = 2 * (((freq * t + deg / 360) % 1 + 1) % 1) - 1
  if (wave === 'random') {
    const beat = Math.floor(freq * t)
    w = ((Math.sin(beat * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1 * 2 - 1
  }
  return clamp(Math.round(base + (size / 2) * w), 0, 255)
}

// ── Fixture Categorization ──────────────────────────────────────────────────
export type FixCat = 'rgb' | 'moving' | 'generic'

export function detectCat(fx: PatchedFixture, lib: FixtureDefinition[]): FixCat {
  const mode = lib.find(d => d.id === fx.definitionId)?.modes[fx.modeIndex]
  if (!mode) return 'generic'
  const t = new Set(mode.channels.map(c => c.primaryType))
  if (t.has('Red') && t.has('Green') && t.has('Blue')) return 'rgb'
  if (t.has('Pan') || t.has('Tilt')) return 'moving'
  return 'generic'
}

// ── Color Mapping for UI ────────────────────────────────────────────────────
export function capColor(type: FixtureCapabilityType): string {
  const m: Record<string, string> = {
    Dimmer: '#ffb300',
    Red: '#ff4d6a',
    Green: '#00d68f',
    Blue: '#6c9cff',
    White: '#e8eaf6',
    Amber: '#ff8800',
    UV: '#cc44ff',
    Pan: '#00ccff',
    Tilt: '#00aaff',
    Gobo: '#9090ff',
    Strobe: '#ff6666',
    Speed: '#88ffcc',
    ColorWheel: '#ff88ff',
    Shutter: '#ffcc44',
  }
  return m[type] ?? '#9097b8'
}

// ── Bank Colors ─────────────────────────────────────────────────────────────
export const BANK_COLOURS = [
  '#e53935',
  '#d81b60',
  '#8e24aa',
  '#5e35b1',
  '#1e88e5',
  '#00acc1',
  '#00897b',
  '#43a047',
  '#fb8c00',
  '#f4511e',
  '#546e7a',
  '#6c63ff',
  '#ff6584',
  '#f9a825',
  '#00d68f',
]

// ── Color Presets ────────────────────────────────────────────────────────────
export const COLOR_PRESETS = [
  { label: 'Rot', r: 255, g: 0, b: 0 },
  { label: 'Grün', r: 0, g: 255, b: 0 },
  { label: 'Blau', r: 0, g: 0, b: 255 },
  { label: 'Weiß', r: 255, g: 255, b: 255 },
  { label: 'Amber', r: 255, g: 176, b: 0 },
  { label: 'Lila', r: 148, g: 0, b: 211 },
  { label: 'Cyan', r: 0, g: 255, b: 255 },
  { label: 'Aus', r: 0, g: 0, b: 0 },
]

// ── Wave Types ──────────────────────────────────────────────────────────────
export const WAVE_TYPES: EfxWave[] = [
  'sine',
  'triangle',
  'square',
  'sawtooth',
  'random',
]

export const WAVE_LABELS: Record<EfxWave, string> = {
  sine: 'Sinus',
  triangle: 'Dreieck',
  square: 'Rechteck',
  sawtooth: 'Sägezahn',
  random: 'Zufall',
}

// ── Fixture Grouping ────────────────────────────────────────────────────────
export function groupFixturesByType(
  patch: PatchedFixture[],
  library: FixtureDefinition[],
): string[] {
  const types = new Set<string>()
  for (const fx of patch) {
    const def = library.find(d => d.id === fx.definitionId)
    if (def) types.add(def.type ?? 'Sonstiges')
  }
  return ['all', ...Array.from(types).sort()]
}

export function filterFixturesByGroup(
  patch: PatchedFixture[],
  library: FixtureDefinition[],
  group: string,
): PatchedFixture[] {
  if (group === 'all') return patch
  return patch.filter(fx => {
    const def = library.find(d => d.id === fx.definitionId)
    return (def?.type ?? 'Sonstiges') === group
  })
}

// ── Channel Types ───────────────────────────────────────────────────────────
export const CHANNEL_TYPE_GROUPS: Record<string, FixtureCapabilityType[]> = {
  Helligkeit: ['Dimmer', 'Shutter'],
  Farbe: ['Red', 'Green', 'Blue', 'White', 'Amber', 'UV', 'ColorWheel'],
  Bewegung: ['Pan', 'Tilt', 'Speed'],
  Effekte: ['Gobo', 'Strobe'],
}

export function getCategoryForCapType(type: FixtureCapabilityType): string {
  for (const [cat, types] of Object.entries(CHANNEL_TYPE_GROUPS)) {
    if (types.includes(type)) return cat
  }
  return 'Sonstiges'
}
