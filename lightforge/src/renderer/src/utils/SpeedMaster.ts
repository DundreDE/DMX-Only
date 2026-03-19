/**
 * Speed Master - Master speed control for all effects
 * DasLight-style speed control that affects all running effects
 */

export interface SpeedTarget {
  id: string
  type: 'effect' | 'scene' | 'chaser' | 'global'
  speedMultiplier: number // 0.1 - 5.0
}

/**
 * Speed Master Controller
 */
export class SpeedMaster {
  private masterSpeed: number = 1.0 // 1.0 = 100%
  private masterTap: number = 0 // for tap tempo
  private tapTimes: number[] = [] // for BPM calculation
  private baseBPM: number = 120
  private isEnabled: boolean = true
  private subscribers: Set<(speed: number) => void> = new Set()

  /**
   * Set master speed
   */
  setMasterSpeed(speed: number): void {
    this.masterSpeed = Math.max(0.1, Math.min(5.0, speed))
    this.publishSpeed()
  }

  /**
   * Get master speed
   */
  getMasterSpeed(): number {
    return this.masterSpeed
  }

  /**
   * Get effective speed (applied to effects)
   */
  getEffectiveSpeed(): number {
    return this.isEnabled ? this.masterSpeed : 1.0
  }

  /**
   * Increase master speed
   */
  increase(amount: number = 0.1): void {
    this.setMasterSpeed(this.masterSpeed + amount)
  }

  /**
   * Decrease master speed
   */
  decrease(amount: number = 0.1): void {
    this.setMasterSpeed(this.masterSpeed - amount)
  }

  /**
   * Reset to normal speed
   */
  reset(): void {
    this.setMasterSpeed(1.0)
  }

  /**
   * Double speed
   */
  double(): void {
    this.setMasterSpeed(this.masterSpeed * 2)
  }

  /**
   * Half speed
   */
  half(): void {
    this.setMasterSpeed(this.masterSpeed / 2)
  }

  /**
   * Tap tempo (calculate BPM from tap)
   */
  tapTempo(): number {
    const now = Date.now()
    this.tapTimes.push(now)

    // Keep only last 8 taps
    if (this.tapTimes.length > 8) {
      this.tapTimes.shift()
    }

    if (this.tapTimes.length < 2) {
      return this.baseBPM
    }

    // Calculate average interval
    let totalInterval = 0
    for (let i = 1; i < this.tapTimes.length; i++) {
      totalInterval += this.tapTimes[i]! - this.tapTimes[i - 1]!
    }

    const averageInterval = totalInterval / (this.tapTimes.length - 1)
    const calculatedBPM = Math.round(60000 / averageInterval)

    this.baseBPM = calculatedBPM
    this.publishSpeed()

    return calculatedBPM
  }

  /**
   * Clear tap tempo
   */
  clearTapTempo(): void {
    this.tapTimes = []
  }

  /**
   * Set base BPM
   */
  setBaseBPM(bpm: number): void {
    this.baseBPM = Math.max(20, Math.min(300, bpm))
    this.publishSpeed()
  }

  /**
   * Get base BPM
   */
  getBaseBPM(): number {
    return this.baseBPM
  }

  /**
   * Get effective BPM (with master speed applied)
   */
  getEffectiveBPM(): number {
    return Math.round(this.baseBPM * this.masterSpeed)
  }

  /**
   * Sync speed to external BPM
   */
  syncToBPM(externalBPM: number): void {
    this.baseBPM = externalBPM
    this.publishSpeed()
  }

  /**
   * Enable/disable master speed
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    this.publishSpeed()
  }

  /**
   * Toggle master speed on/off
   */
  toggle(): void {
    this.isEnabled = !this.isEnabled
    this.publishSpeed()
  }

  /**
   * Get preset speeds
   */
  getPresets(): Record<string, number> {
    return {
      'Half (50%)': 0.5,
      '75%': 0.75,
      'Normal (100%)': 1.0,
      '125%': 1.25,
      '150%': 1.5,
      'Double (200%)': 2.0,
      'Fast (300%)': 3.0
    }
  }

  /**
   * Apply preset
   */
  applyPreset(presetName: string): void {
    const presets = this.getPresets()
    if (presets[presetName]) {
      this.setMasterSpeed(presets[presetName]!)
    }
  }

  /**
   * Calculate timing with master speed
   */
  calculateTiming(baseDuration: number): number {
    return Math.round(baseDuration / this.getEffectiveSpeed())
  }

  /**
   * Subscribe to speed changes
   */
  subscribe(callback: (speed: number) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Publish speed to subscribers
   */
  private publishSpeed(): void {
    const speed = this.getEffectiveSpeed()
    this.subscribers.forEach(cb => cb(speed))
  }

  /**
   * Get speed info
   */
  getSpeedInfo() {
    return {
      masterSpeed: this.masterSpeed,
      effectiveSpeed: this.getEffectiveSpeed(),
      baseBPM: this.baseBPM,
      effectiveBPM: this.getEffectiveBPM(),
      isEnabled: this.isEnabled,
      recentTaps: this.tapTimes.length
    }
  }
}

export const speedMaster = new SpeedMaster()
