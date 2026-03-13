// ════════════════════════════════════════════════════════════════════════════
//  FadeTransitionEngine — Smooth DMX value transitions with easing
// ════════════════════════════════════════════════════════════════════════════

export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'

export interface EasingFunction {
  name: EasingType
  calculate: (t: number) => number
}

// Easing functions (t: 0-1)
const EASING_FUNCTIONS: Record<EasingType, (t: number) => number> = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-out': (t) => t * (2 - t),
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
}

export function getEasingFunction(type: EasingType): (t: number) => number {
  return EASING_FUNCTIONS[type] || EASING_FUNCTIONS.linear
}

/**
 * Linear interpolation between two values
 * @param from Starting value
 * @param to Ending value
 * @param progress Progress 0-1
 * @param easing Easing function
 * @returns Interpolated value
 */
export function lerpValue(
  from: number,
  to: number,
  progress: number,
  easing: EasingType = 'linear'
): number {
  const easingFn = getEasingFunction(easing)
  const easedProgress = easingFn(Math.min(1, Math.max(0, progress)))
  return from + (to - from) * easedProgress
}

/**
 * Lerp entire DMX channel array
 * @param fromChannels Starting channel values (0-255)
 * @param toChannels Target channel values (0-255)
 * @param progress Progress 0-1
 * @param easing Easing type
 * @returns Interpolated channel array
 */
export function lerpDMXChannels(
  fromChannels: number[],
  toChannels: number[],
  progress: number,
  easing: EasingType = 'linear'
): number[] {
  return fromChannels.map((fromVal, idx) => {
    const toVal = toChannels[idx] ?? 0
    return Math.round(lerpValue(fromVal, toVal, progress, easing))
  })
}

/**
 * Fade manager for handling transitions
 */
export class FadeTransitionManager {
  private rafId: number | null = null
  private startTime: number = 0
  private duration: number = 1000
  private easing: EasingType = 'ease-in-out'
  private fromValues: number[] = []
  private toValues: number[] = []
  private callback: (channels: number[]) => void = () => {}
  private onComplete: () => void = () => {}

  /**
   * Start a fade transition
   */
  public fade(
    from: number[],
    to: number[],
    duration: number,
    easing: EasingType = 'ease-in-out',
    onUpdate: (channels: number[]) => void,
    onComplete?: () => void
  ): void {
    this.stop()

    this.fromValues = from
    this.toValues = to
    this.duration = duration
    this.easing = easing
    this.callback = onUpdate
    this.onComplete = onComplete || (() => {})
    this.startTime = Date.now()

    this.animate()
  }

  /**
   * Stop current fade
   */
  public stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  /**
   * Animation loop
   */
  private animate = (): void => {
    const elapsed = Date.now() - this.startTime
    const progress = Math.min(1, elapsed / this.duration)

    const channels = lerpDMXChannels(
      this.fromValues,
      this.toValues,
      progress,
      this.easing
    )

    this.callback(channels)

    if (progress < 1) {
      this.rafId = requestAnimationFrame(this.animate)
    } else {
      this.rafId = null
      this.onComplete()
    }
  }

  /**
   * Get current progress (0-1)
   */
  public getProgress(): number {
    if (this.duration === 0) return 1
    const elapsed = Date.now() - this.startTime
    return Math.min(1, elapsed / this.duration)
  }

  /**
   * Check if currently fading
   */
  public isActive(): boolean {
    return this.rafId !== null
  }
}

// Export singleton instance
export const globalFadeManager = new FadeTransitionManager()
