/**
 * CurveFXEngine.ts
 * Curve FX Engine for Daslight 5
 * Custom curve interpolation for advanced effects
 */

export interface CurvePoint {
  time: number  // 0-1 (normalized)
  value: number // 0-255
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'cubic'
}

export interface CurveFXConfig {
  curves: CurvePoint[][]  // Multiple curves
  channels: number[]      // Which DMX channels
  speed: number          // 0.1 - 10x
  loopMode: 'loop' | 'pingPong' | 'hold' | 'off'
}

/**
 * Curve FX Engine - custom curve interpolation
 */
export class CurveFXEngine {
  constructor(private config: CurveFXConfig) {}

  /**
   * Find interpolated value at progress
   */
  private interpolateValue(
    curve: CurvePoint[],
    progress: number
  ): number {
    if (curve.length === 0) return 0
    if (curve.length === 1) return curve[0].value
    if (progress <= 0) return curve[0].value
    if (progress >= 1) return curve[curve.length - 1].value

    let p1: CurvePoint | null = null
    let p2: CurvePoint | null = null

    for (let i = 0; i < curve.length - 1; i++) {
      if (curve[i].time <= progress && progress <= curve[i + 1].time) {
        p1 = curve[i]
        p2 = curve[i + 1]
        break
      }
    }

    if (!p1 || !p2) return 0

    const range = p2.time - p1.time
    const local = (progress - p1.time) / range
    const easing = p2.easing || 'linear'
    const eased = this.easeValue(local, easing)

    return Math.floor(p1.value + (p2.value - p1.value) * eased)
  }

  /**
   * Apply easing function
   */
  private easeValue(t: number, easing: string): number {
    switch (easing) {
      case 'easeIn':
        return t * t
      case 'easeOut':
        return 1 - (1 - t) * (1 - t)
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      case 'cubic':
        return t * t * t
      case 'linear':
      default:
        return t
    }
  }

  /**
   * Calculate value for time
   */
  public calculateValue(curveIdx: number, time: number): number {
    if (curveIdx >= this.config.curves.length) return 0

    const curve = this.config.curves[curveIdx]
    const cycleTime = (1 / this.config.speed) * 1000
    let progress = (time % cycleTime) / cycleTime

    if (this.config.loopMode === 'pingPong') {
      if (progress > 0.5) {
        progress = 1 - progress
      }
      progress = progress * 2
    } else if (this.config.loopMode === 'hold') {
      progress = Math.min(progress, 1)
    } else if (this.config.loopMode === 'off') {
      if (progress > 1) progress = 1
    }

    return this.interpolateValue(curve, progress)
  }

  /**
   * Render to DMX
   */
  public renderDMX(time: number): Record<number, number> {
    const dmx: Record<number, number> = {}

    for (let i = 0; i < this.config.channels.length; i++) {
      const value = this.calculateValue(i, time)
      dmx[this.config.channels[i]] = value
    }

    return dmx
  }

  /**
   * Get curve at 100 sample points for visualization
   */
  public getSamples(curveIdx: number): number[] {
    if (curveIdx >= this.config.curves.length) return []

    const curve = this.config.curves[curveIdx]
    const samples: number[] = []

    for (let i = 0; i <= 100; i++) {
      const progress = i / 100
      const value = this.interpolateValue(curve, progress)
      samples.push(value)
    }

    return samples
  }

  /**
   * Add point to curve
   */
  public addPoint(curveIdx: number, point: CurvePoint): void {
    if (curveIdx >= this.config.curves.length) return

    const curve = this.config.curves[curveIdx]
    curve.push(point)
    curve.sort((a, b) => a.time - b.time)
  }

  /**
   * Remove point from curve
   */
  public removePoint(curveIdx: number, timeIdx: number): void {
    if (curveIdx >= this.config.curves.length) return
    const curve = this.config.curves[curveIdx]
    curve.splice(timeIdx, 1)
  }

  /**
   * Update point
   */
  public updatePoint(
    curveIdx: number,
    timeIdx: number,
    point: Partial<CurvePoint>
  ): void {
    if (curveIdx >= this.config.curves.length) return
    const curve = this.config.curves[curveIdx]
    if (timeIdx >= curve.length) return

    curve[timeIdx] = { ...curve[timeIdx], ...point }
    curve.sort((a, b) => a.time - b.time)
  }

  /**
   * Create preset curves
   */
  public static createPreset(
    preset: 'linear' | 'ramp' | 'sine' | 'triangle' | 'random'
  ): CurvePoint[] {
    switch (preset) {
      case 'linear':
        return [
          { time: 0, value: 0 },
          { time: 1, value: 255 },
        ]
      case 'ramp':
        return [
          { time: 0, value: 0 },
          { time: 0.5, value: 255 },
          { time: 1, value: 0 },
        ]
      case 'sine':
        return [
          { time: 0, value: 128 },
          { time: 0.25, value: 255 },
          { time: 0.5, value: 128 },
          { time: 0.75, value: 0 },
          { time: 1, value: 128 },
        ]
      case 'triangle':
        return [
          { time: 0, value: 0 },
          { time: 0.5, value: 255 },
          { time: 1, value: 0 },
        ]
      case 'random':
        const random: CurvePoint[] = []
        for (let i = 0; i <= 10; i++) {
          random.push({
            time: i / 10,
            value: Math.floor(Math.random() * 256),
          })
        }
        return random
      default:
        return []
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<CurveFXConfig>): void {
    this.config = { ...this.config, ...config }
  }
}
