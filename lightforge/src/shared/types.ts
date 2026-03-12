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

export interface Scene {
  id: string
  name: string
  fadeTime: number
  bankId?: string              // reference to Bank.id
  values: Record<string, number[]>  // universeIndex → sparse channel values (length 512)
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
