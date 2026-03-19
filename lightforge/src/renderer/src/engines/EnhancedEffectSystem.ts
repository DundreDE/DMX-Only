/**
 * Enhanced Effect System for LightForge
 * Includes new wave types, ADSR envelope, LFO modulation, and blending
 */

export type EfxWaveExtended = 'sine' | 'triangle' | 'square' | 'sawtooth' | 'random' | 'damping' | 'echo' | 'pulse'

export interface ADSREnvelope {
  attack: number // 0-1000ms
  decay: number // 0-1000ms
  sustain: number // 0-255 (level)
  release: number // 0-1000ms
}

export interface LFO {
  enabled: boolean
  target: 'speed' | 'size' | 'base'
  wave: EfxWaveExtended
  frequency: number // Hz
  depth: number // 0-100 (%)
}

export interface AdvancedSceneEffect {
  id: string
  label: string
  target: string // FixtureCapabilityType
  wave: EfxWaveExtended
  speed: number // BPM
  size: number // amplitude 0-255
  base: number // centre 0-255
  offset: number // phase spread
  fixtureIds: string[]
  
  // New features
  envelope?: ADSREnvelope
  lfo?: LFO
  keyframes?: Keyframe[]
  blendMode?: 'add' | 'multiply' | 'screen' | 'overlay'
  opacity?: number // 0-1
}

export interface Keyframe {
  time: number // seconds
  value: number // 0-255
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}

// ──────────────────────────────────────────────────────────────
// Extended Wave Calculations
// ──────────────────────────────────────────────────────────────

export function calcExtendedWave(
  wave: EfxWaveExtended,
  t: number,
  bpm: number,
  size: number,
  base: number,
  deg: number,
  damping?: number
): number {
  const freq = bpm / 60
  const phase = 2 * Math.PI * freq * t + (deg * Math.PI) / 180
  let w = 0

  switch (wave) {
    case 'sine':
      w = Math.sin(phase)
      break

    case 'triangle':
      w = (2 / Math.PI) * Math.asin(Math.sin(phase))
      break

    case 'square':
      w = Math.sign(Math.sin(phase))
      break

    case 'sawtooth':
      w = 2 * (((freq * t + deg / 360) % 1 + 1) % 1) - 1
      break

    case 'random': {
      const beat = Math.floor(freq * t)
      w = ((Math.sin(beat * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1 * 2 - 1
      break
    }

    case 'damping': {
      // Sine wave with exponential decay
      const decay = Math.exp(-t * (damping || 1))
      w = Math.sin(phase) * decay
      break
    }

    case 'echo': {
      // Multiple delayed repetitions of wave
      const echoes = 3
      const echoDelay = 0.1 // seconds
      let sum = 0
      for (let i = 0; i < echoes; i++) {
        const echoTime = t - i * echoDelay
        if (echoTime >= 0) {
          const echoPhase = 2 * Math.PI * freq * echoTime + (deg * Math.PI) / 180
          const decay = Math.pow(0.5, i)
          sum += Math.sin(echoPhase) * decay
        }
      }
      w = sum / echoes
      break
    }

    case 'pulse': {
      // Variable width pulse wave (PWM)
      const pulseWidth = 0.3 + 0.2 * Math.sin(phase / 2)
      w = (phase % (2 * Math.PI)) < 2 * Math.PI * pulseWidth ? 1 : -1
      break
    }
  }

  return clamp(Math.round(base + (size / 2) * w), 0, 255)
}

// ──────────────────────────────────────────────────────────────
// ADSR Envelope
// ──────────────────────────────────────────────────────────────

export function applyADSREnvelope(
  value: number,
  t: number,
  duration: number,
  envelope: ADSREnvelope
): number {
  const attackTime = envelope.attack / 1000
  const decayTime = envelope.decay / 1000
  const releaseTime = envelope.release / 1000
  const sustainLevel = envelope.sustain / 255

  let envelope_val = 0

  if (t < attackTime) {
    // Attack phase
    envelope_val = (t / attackTime) * sustainLevel
  } else if (t < attackTime + decayTime) {
    // Decay phase
    const decayProgress = (t - attackTime) / decayTime
    envelope_val = sustainLevel + (1 - sustainLevel) * (1 - decayProgress)
  } else if (t < duration - releaseTime) {
    // Sustain phase
    envelope_val = sustainLevel
  } else {
    // Release phase
    const releaseProgress = (t - (duration - releaseTime)) / releaseTime
    envelope_val = sustainLevel * (1 - releaseProgress)
  }

  return Math.round(value * envelope_val)
}

// ──────────────────────────────────────────────────────────────
// LFO Modulation
// ──────────────────────────────────────────────────────────────

export function applyLFOModulation(
  baseValue: number,
  t: number,
  lfo: LFO,
  currentSpeed?: number,
  currentSize?: number,
  currentBase?: number
): { speed?: number; size?: number; base?: number } {
  const lfoPhase = 2 * Math.PI * lfo.frequency * t
  const lfoValue = Math.sin(lfoPhase) * (lfo.depth / 100)

  const result: { speed?: number; size?: number; base?: number } = {}

  if (lfo.target === 'speed' && currentSpeed) {
    result.speed = clamp(currentSpeed * (1 + lfoValue), 20, 240)
  } else if (lfo.target === 'size' && currentSize) {
    result.size = clamp(currentSize * (1 + lfoValue), 0, 255)
  } else if (lfo.target === 'base' && currentBase) {
    result.base = clamp(currentBase + lfoValue * 50, 0, 255)
  }

  return result
}

// ──────────────────────────────────────────────────────────────
// Keyframe Interpolation
// ──────────────────────────────────────────────────────────────

export function interpolateKeyframes(
  keyframes: Keyframe[],
  t: number
): number {
  if (keyframes.length === 0) return 0
  if (keyframes.length === 1) return keyframes[0].value

  // Find the current keyframe segment
  let start = keyframes[0]
  let end = keyframes[keyframes.length - 1]

  for (let i = 0; i < keyframes.length - 1; i++) {
    if (t >= keyframes[i].time && t <= keyframes[i + 1].time) {
      start = keyframes[i]
      end = keyframes[i + 1]
      break
    }
  }

  if (t <= start.time) return start.value
  if (t >= end.time) return end.value

  // Normalize progress between keyframes
  const progress = (t - start.time) / (end.time - start.time)
  const eased = applyEasing(progress, start.easing || 'linear')

  // Linear interpolation
  return Math.round(start.value + (end.value - start.value) * eased)
}

function applyEasing(t: number, easing: string): number {
  switch (easing) {
    case 'easeIn':
      return t * t
    case 'easeOut':
      return 1 - (1 - t) * (1 - t)
    case 'easeInOut':
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    case 'linear':
    default:
      return t
  }
}

// ──────────────────────────────────────────────────────────────
// Blend Modes
// ──────────────────────────────────────────────────────────────

export function blendValues(
  base: number,
  effect: number,
  mode: 'add' | 'multiply' | 'screen' | 'overlay' = 'add',
  opacity: number = 1
): number {
  const effected = effect * opacity + base * (1 - opacity)

  switch (mode) {
    case 'add':
      return clamp(Math.round(base + effected - 127), 0, 255)

    case 'multiply':
      return Math.round((base * effected) / 255)

    case 'screen':
      return 255 - Math.round(((255 - base) * (255 - effected)) / 255)

    case 'overlay':
      return base < 128
        ? Math.round((2 * base * effected) / 255)
        : 255 - Math.round((2 * (255 - base) * (255 - effected)) / 255)

    default:
      return base
  }
}

// ──────────────────────────────────────────────────────────────
// Utility Functions
// ──────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function createDefaultADSR(): ADSREnvelope {
  return {
    attack: 10,
    decay: 50,
    sustain: 200,
    release: 100
  }
}

export function createDefaultLFO(): LFO {
  return {
    enabled: false,
    target: 'size',
    wave: 'sine',
    frequency: 1,
    depth: 20
  }
}

export function isValidKeyframeSequence(keyframes: Keyframe[]): boolean {
  if (keyframes.length < 2) return false
  
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (keyframes[i].time >= keyframes[i + 1].time) return false
    if (keyframes[i].value < 0 || keyframes[i].value > 255) return false
  }
  
  return true
}
