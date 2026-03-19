/**
 * effectBuilderEngine.ts
 * Effect calculation and management engine for Phase 4 Scene Builder
 * Handles waveform generation, effect sequencing, and preview calculations
 */

// Waveform Types
type WaveType = 'sine' | 'triangle' | 'square' | 'sawtooth' | 'custom'

interface EffectConfig {
  type: string
  speed: number
  phase: number
  amplitude: number
  offset: number
  waveType: WaveType
  fixtures: string[]
  targetChannels: string[]
  blendMode: 'add' | 'multiply' | 'override' | 'lerp'
}

interface WaveformPoint {
  x: number
  y: number
  time: number
}

/**
 * Calculate waveform data points for visualization
 */
export function calculateWaveformData(
  waveType: WaveType,
  speed: number,
  phase: number,
  amplitude: number,
  offset: number,
  width: number,
  samplesPerCycle: number = 64
): WaveformPoint[] {
  const points: WaveformPoint[] = []
  const cycles = speed * 3
  const totalSamples = width

  for (let i = 0; i < totalSamples; i++) {
    const t =
      ((i / totalSamples) * Math.PI * 2 * cycles) + (phase * Math.PI * 2)

    let value = 0

    switch (waveType) {
      case 'sine':
        value = Math.sin(t)
        break
      case 'triangle':
        value = Math.asin(Math.sin(t)) * (2 / Math.PI)
        break
      case 'square':
        value = Math.sin(t) > 0 ? 1 : -1
        break
      case 'sawtooth':
        value =
          2 *
          ((t / (Math.PI * 2)) - Math.floor(t / (Math.PI * 2) + 0.5))
        break
      case 'custom':
        value = Math.sin(t) * Math.cos(t)
        break
      default:
        value = Math.sin(t)
    }

    const y =
      (value * amplitude) / 255 + offset / 255

    points.push({
      x: i,
      y: y,
      time: (i / totalSamples) * (1 / speed),
    })
  }

  return points
}

/**
 * Generate effect sequence for a scene
 */
export function generateEffectSequence(
  config: EffectConfig,
  duration: number,
  dmxChannelCount: number = 512
): Record<number, number>[] {
  const sequence: Record<number, number>[] = []
  const framerate = 50 // 50fps
  const frameCount = (duration / 1000) * framerate

  for (let frame = 0; frame < frameCount; frame++) {
    const t = (frame / frameCount) * Math.PI * 2 * config.speed +
      config.phase * Math.PI * 2
    const frameData: Record<number, number> = {}

    let value = 0
    switch (config.waveType) {
      case 'sine':
        value = Math.sin(t)
        break
      case 'triangle':
        value = Math.asin(Math.sin(t)) * (2 / Math.PI)
        break
      case 'square':
        value = Math.sin(t) > 0 ? 1 : -1
        break
      case 'sawtooth':
        value =
          2 *
          ((t / (Math.PI * 2)) - Math.floor(t / (Math.PI * 2) + 0.5))
        break
      default:
        value = Math.sin(t)
    }

    const dmxValue = Math.max(
      0,
      Math.min(255, (value * config.amplitude) / 2 + config.offset)
    )

    // Apply to target fixtures/channels only
    for (const channelId of config.targetChannels) {
      const chNum = parseInt(channelId.replace('ch-', ''), 10)
      if (!isNaN(chNum) && chNum >= 0 && chNum < dmxChannelCount) {
        frameData[chNum] = dmxValue
      }
    }

    sequence.push(frameData)
  }

  return sequence
}

/**
 * Preview effect on current DMX state
 */
export function previewEffect(
  config: EffectConfig,
  currentDmxValues: Record<number, number>,
  time: number
): Record<number, number> {
  const result = { ...currentDmxValues }

  const t =
    (time / 1000) * Math.PI * 2 * config.speed +
    config.phase * Math.PI * 2

  let value = 0
  switch (config.waveType) {
    case 'sine':
      value = Math.sin(t)
      break
    case 'triangle':
      value = Math.asin(Math.sin(t)) * (2 / Math.PI)
      break
    case 'square':
      value = Math.sin(t) > 0 ? 1 : -1
      break
    case 'sawtooth':
      value =
        2 *
        ((t / (Math.PI * 2)) - Math.floor(t / (Math.PI * 2) + 0.5))
      break
    default:
      value = Math.sin(t)
  }

  const dmxValue = Math.max(
    0,
    Math.min(255, (value * config.amplitude) / 2 + config.offset)
  )

  // Blend based on blend mode
  for (const channel of config.targetChannels) {
    const ch = parseInt(channel.replace('ch-', ''))
    switch (config.blendMode) {
      case 'add':
        result[ch] = Math.min(255, (result[ch] || 0) + dmxValue)
        break
      case 'multiply':
        result[ch] = Math.floor(((result[ch] || 255) * dmxValue) / 255)
        break
      case 'override':
        result[ch] = dmxValue
        break
      case 'lerp':
        result[ch] = Math.floor(
          (result[ch] || 0) * 0.5 + dmxValue * 0.5
        )
        break
    }
  }

  return result
}

/**
 * Validate effect configuration
 */
export function validateEffectConfig(config: EffectConfig): string[] {
  const errors: string[] = []

  if (config.speed < 0.1 || config.speed > 10) {
    errors.push('Speed must be between 0.1 and 10')
  }

  if (config.phase < 0 || config.phase > 1) {
    errors.push('Phase must be between 0 and 1')
  }

  if (config.amplitude < 0 || config.amplitude > 255) {
    errors.push('Amplitude must be between 0 and 255')
  }

  if (config.offset < 0 || config.offset > 255) {
    errors.push('Offset must be between 0 and 255')
  }

  if (config.fixtures.length === 0) {
    errors.push('At least one fixture must be selected')
  }

  if (config.targetChannels.length === 0) {
    errors.push('At least one target channel must be selected')
  }

  return errors
}

/**
 * Export effect preset
 */
export function exportEffectPreset(
  config: EffectConfig,
  name: string
): string {
  const preset = {
    name,
    config,
    timestamp: Date.now(),
  }

  return JSON.stringify(preset, null, 2)
}

/**
 * Import effect preset
 */
export function importEffectPreset(json: string): EffectConfig | null {
  try {
    const preset = JSON.parse(json)
    return preset.config || null
  } catch {
    return null
  }
}

/**
 * Blend two DMX states based on mode
 */
export function blendDMXStates(
  state1: Record<number, number>,
  state2: Record<number, number>,
  mode: 'add' | 'multiply' | 'override' | 'lerp',
  alpha: number = 0.5
): Record<number, number> {
  const result: Record<number, number> = { ...state1 }
  const allChannels = new Set([
    ...Object.keys(state1),
    ...Object.keys(state2),
  ])

  for (const ch of allChannels) {
    const chNum = parseInt(ch)
    const v1 = state1[chNum] || 0
    const v2 = state2[chNum] || 0

    switch (mode) {
      case 'add':
        result[chNum] = Math.min(255, v1 + v2)
        break
      case 'multiply':
        result[chNum] = Math.floor((v1 * v2) / 255)
        break
      case 'override':
        result[chNum] = v2
        break
      case 'lerp':
        result[chNum] = Math.floor(v1 * (1 - alpha) + v2 * alpha)
        break
    }
  }

  return result
}
