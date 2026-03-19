// ──────────────────────────────────────────────
// Shared types used across main and renderer
// ──────────────────────────────────────────────

export interface FixtureCapability {
  min: number
  max: number
  name: string
  type: FixtureCapabilityType
}

export type FixtureCapabilityType =
  | 'Dimmer'
  | 'Red'
  | 'Green'
  | 'Blue'
  | 'White'
  | 'Amber'
  | 'UV'
  | 'Pan'
  | 'PanFine'
  | 'Tilt'
  | 'TiltFine'
  | 'Gobo'
  | 'Shutter'
  | 'Strobe'
  | 'Speed'
  | 'ColorWheel'
  | 'Maintenance'
  | 'Nothing'
  | 'Generic'

export interface FixtureChannel {
  number: number
  name: string
  capabilities: FixtureCapability[]
  primaryType: FixtureCapabilityType
}

export interface FixtureMode {
  name: string
  channels: FixtureChannel[]
}

export interface FixtureDefinition {
  id: string
  manufacturer: string
  model: string
  type: string
  modes: FixtureMode[]
}

export interface PatchedFixture {
  id: string
  definitionId: string
  name: string
  universe: number
  startAddress: number
  modeIndex: number
  channelCount: number
}

export interface Bank {
  id: string
  name: string
  color: string    // all scenes in this bank use this colour
}

export type EfxWave = 'sine' | 'triangle' | 'square' | 'sawtooth' | 'random' | 'damping' | 'echo' | 'pulse'

export interface ADSREnvelope {
  attack: number    // 0-1000ms
  decay: number     // 0-1000ms
  sustain: number   // 0-255 (level)
  release: number   // 0-1000ms
}

export interface LFO {
  enabled: boolean
  target: 'speed' | 'size' | 'base'
  wave: EfxWave
  frequency: number // Hz
  depth: number     // 0-100 (%)
}

export interface Keyframe {
  time: number      // seconds
  value: number     // 0-255
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}

export interface SceneEffect {
  id: string
  label: string
  target: FixtureCapabilityType
  wave: EfxWave
  speed: number    // BPM
  size: number     // amplitude 0-255
  base: number     // centre 0-255
  offset: number   // per-fixture phase spread in degrees
  fixtureIds: string[]
  
  // Enhanced features
  envelope?: ADSREnvelope
  lfo?: LFO
  keyframes?: Keyframe[]
  blendMode?: 'add' | 'multiply' | 'screen' | 'overlay'
  opacity?: number // 0-1
}

export interface Scene {
  id: string
  name: string
  fadeTime: number
  bankId?: string
  values: Record<string, number[]>  // universeIndex → 512 DMX values
  effects?: SceneEffect[]
}

export interface ChaserStep {
  sceneId: string
  holdTime: number
  fadeTime: number
}

export interface Chaser {
  id: string
  name: string
  steps: ChaserStep[]
  loop: boolean
  running: boolean
}

export interface DmxOutputInfo {
  id: string
  name: string
  type: 'enttec-open' | 'enttec-pro' | 'artnet' | 'udmx' | 'preview'
  connected: boolean
}

export interface AppSettings {
  language: string
  outputId: string | null
  universe: number
}

export interface Project {
  version: string
  name: string
  settings: AppSettings
  fixtures: FixtureDefinition[]
  patch: PatchedFixture[]
  banks: Bank[]
  scenes: Scene[]
  chasers: Chaser[]
}
