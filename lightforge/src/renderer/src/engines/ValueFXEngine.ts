/**
 * ValueFXEngine.ts
 * Value FX Engine for Daslight 5
 * Creates channel modulation: dimmer pulse, strobe, flicker, sinewave
 */

export interface ValueFXConfig {
  mode: 'pulse' | 'strobe' | 'flicker' | 'sinewave' | 'sawtooth'
  speed: number           // 0.1 - 10x
  channels: number[]      // Which DMX channels to modulate
  amplitude: number       // 0-255: how much to modulate
  offset: number          // 0-255: base value
}

/**
 * Value FX Engine - modulates channel values over time
 */
export class ValueFXEngine {
  constructor(private config: ValueFXConfig) {}

  /**
   * Calculate modulated value for time
   */
  public calculateValue(time: number): number {
    const cycleTime = (1 / this.config.speed) * 1000
    const progress = (time % cycleTime) / cycleTime

    let modulation = 0

    switch (this.config.mode) {
      case 'pulse':
        modulation = this.pulseModulation(progress)
        break
      case 'strobe':
        modulation = this.strobeModulation(progress)
        break
      case 'flicker':
        modulation = this.flickerModulation(time)
        break
      case 'sinewave':
        modulation = this.sinewaveModulation(progress)
        break
      case 'sawtooth':
        modulation = this.sawtoothModulation(progress)
        break
      default:
        modulation = 0
    }

    return Math.floor(
      Math.max(0, Math.min(255, this.config.offset + modulation))
    )
  }

  /**
   * Pulse modulation (fade in, fade out)
   */
  private pulseModulation(progress: number): number {
    const pulse = Math.abs(Math.sin(progress * Math.PI))
    return pulse * this.config.amplitude
  }

  /**
   * Strobe modulation (on/off flashing)
   */
  private strobeModulation(progress: number): number {
    const strobeRate = this.config.speed * 10
    const cycleTime = 1000 / strobeRate
    const isOn = (Date.now() % cycleTime) < cycleTime * 0.5

    if (isOn) {
      return this.config.amplitude
    } else {
      return -this.config.offset
    }
  }

  /**
   * Flicker modulation (random on/off)
   */
  private flickerModulation(time: number): number {
    const seed = Math.sin(time * 0.001) * 10000
    const random = Math.sin(seed) * 0.5 + 0.5
    const frequency = this.config.speed * 5

    const hasFlicker = Math.sin(time * 0.01 * frequency) > 0.7

    if (hasFlicker) {
      return random * this.config.amplitude
    } else {
      return 0
    }
  }

  /**
   * Sine wave modulation (smooth oscillation)
   */
  private sinewaveModulation(progress: number): number {
    const sine = Math.sin(progress * Math.PI * 2)
    return sine * this.config.amplitude
  }

  /**
   * Sawtooth modulation (linear rise, quick fall)
   */
  private sawtoothModulation(progress: number): number {
    let sawtooth = 0

    if (progress < 0.95) {
      sawtooth = (progress / 0.95) * 2 - 1
    } else {
      sawtooth = -1
    }

    return sawtooth * this.config.amplitude
  }

  /**
   * Render to DMX
   */
  public renderDMX(time: number): Record<number, number> {
    const value = this.calculateValue(time)
    const dmx: Record<number, number> = {}

    for (const channel of this.config.channels) {
      dmx[channel] = value
    }

    return dmx
  }

  /**
   * Get curve at 50 points for visualization
   */
  public getCurve(): number[] {
    const curve: number[] = []
    const cycleTime = (1 / this.config.speed) * 1000

    for (let i = 0; i <= 50; i++) {
      const time = (i / 50) * cycleTime
      const progress = time / cycleTime
      const value = this.calculateValue(time)
      curve.push(value)
    }

    return curve
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ValueFXConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get statistics
   */
  public getStats(): {
    mode: string
    speed: number
    amplitude: number
    offset: number
    channels: number
  } {
    return {
      mode: this.config.mode,
      speed: this.config.speed,
      amplitude: this.config.amplitude,
      offset: this.config.offset,
      channels: this.config.channels.length,
    }
  }
}
