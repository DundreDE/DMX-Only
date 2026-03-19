/**
 * GrandMasterSystem - Master Dimmer & Control
 * 
 * Professional lighting control feature
 * - Master dimmer for all channels
 * - Dimmer curve presets
 * - Blackout button
 * - Fade times
 */

export type DimmerCurve = 'linear' | 'square-law' | 'inverse-square' | 'logarithmic' | 'exponential'

export interface GrandMasterState {
  level: number             // 0-255
  curve: DimmerCurve
  fadeTiming: {
    upTime: number          // Seconds
    downTime: number
  }
  blackoutEnabled: boolean
  isTransitioning: boolean
  transitionStartTime: number
  transitionDuration: number
  previousLevel: number
}

export class GrandMasterSystem {
  private state: GrandMasterState = {
    level: 255,
    curve: 'linear',
    fadeTiming: { upTime: 2, downTime: 2 },
    blackoutEnabled: false,
    isTransitioning: false,
    transitionStartTime: 0,
    transitionDuration: 0,
    previousLevel: 255
  }

  private subscribers: ((state: GrandMasterState) => void)[] = []
  private animationFrameId: number | null = null

  /**
   * Set master level with optional fade
   */
  setLevel(level: number, fadeTime: number = 0): void {
    const clampedLevel = Math.max(0, Math.min(255, level))

    if (fadeTime > 0) {
      this.state.previousLevel = this.state.level
      this.state.isTransitioning = true
      this.state.transitionStartTime = Date.now()
      this.state.transitionDuration = fadeTime * 1000

      if (!this.animationFrameId) {
        this.animate()
      }
    } else {
      this.state.level = clampedLevel
      this.state.isTransitioning = false
      this.publish()
    }
  }

  /**
   * Set dimmer curve
   */
  setCurve(curve: DimmerCurve): void {
    this.state.curve = curve
    this.publish()
  }

  /**
   * Apply curve to DMX value
   */
  applyCurve(inputValue: number): number {
    const normalized = inputValue / 255

    switch (this.state.curve) {
      case 'square-law':
        // Professional square law curve - more responsive at lower levels
        return Math.round(255 * normalized * normalized)

      case 'inverse-square':
        // Inverse - linear at low levels, compressed at high
        return Math.round(255 * Math.sqrt(normalized))

      case 'logarithmic':
        // Log curve - smooth throughout
        const logVal = Math.log10(normalized + 0.1) / Math.log10(1.1)
        return Math.round(255 * logVal)

      case 'exponential':
        // Exponential - fast ramp up
        return Math.round(255 * Math.exp(normalized) / Math.E)

      case 'linear':
      default:
        return inputValue
    }
  }

  /**
   * Blackout (quick fade to zero)
   */
  blackout(fadeTime: number = 0.5): void {
    this.state.blackoutEnabled = true
    this.setLevel(0, fadeTime)
  }

  /**
   * Release blackout (fade back to previous level)
   */
  releaseBlackout(fadeTime: number = 0.5): void {
    this.state.blackoutEnabled = false
    this.setLevel(this.state.previousLevel, fadeTime)
  }

  /**
   * Get current effective level (accounting for curve)
   */
  getEffectiveLevel(): number {
    if (this.state.isTransitioning) {
      const now = Date.now()
      const elapsedMs = now - this.state.transitionStartTime
      const progress = Math.min(1, elapsedMs / this.state.transitionDuration)

      const interpolated = this.state.previousLevel + (this.state.level - this.state.previousLevel) * progress
      return Math.round(interpolated)
    }

    return this.state.level
  }

  /**
   * Get state
   */
  getState(): GrandMasterState {
    return { ...this.state }
  }

  /**
   * Animate fade transitions
   */
  private animate = (): void => {
    if (!this.state.isTransitioning) {
      this.animationFrameId = null
      return
    }

    const now = Date.now()
    const elapsedMs = now - this.state.transitionStartTime
    const progress = Math.min(1, elapsedMs / this.state.transitionDuration)

    if (progress >= 1) {
      this.state.isTransitioning = false
      this.state.level = Math.round(this.state.level)
    }

    this.publish()

    if (this.state.isTransitioning) {
      this.animationFrameId = requestAnimationFrame(this.animate)
    } else {
      this.animationFrameId = null
    }
  }

  /**
   * Subscribe to changes
   */
  subscribe(callback: (state: GrandMasterState) => void): () => void {
    this.subscribers.push(callback)
    callback(this.state)  // Immediate update
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) this.subscribers.splice(index, 1)
    }
  }

  private publish(): void {
    this.subscribers.forEach(sub => sub(this.state))
  }
}

// Global singleton
export const grandMasterSystem = new GrandMasterSystem()
