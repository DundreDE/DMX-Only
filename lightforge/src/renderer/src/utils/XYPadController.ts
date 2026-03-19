/**
 * XY Pad Controller - Pan/Tilt visual control
 * DasLight-style XY pad for fixture positioning
 */

export interface XYPadConfig {
  width: number
  height: number
  invertX: boolean
  invertY: boolean
  sensitivity: number // 0.1-2.0
  damping: number // 0-0.9 (smoothing)
}

export interface PanTiltValues {
  pan: number // 0-255 (or fine)
  tilt: number // 0-255 (or fine)
  panFine?: number // optional fine control
  tiltFine?: number // optional fine control
}

export interface XYPosition {
  x: number // 0-1
  y: number // 0-1
}

/**
 * XY Pad Controller
 */
export class XYPadController {
  private config: XYPadConfig = {
    width: 400,
    height: 300,
    invertX: false,
    invertY: true,
    sensitivity: 1.0,
    damping: 0.1
  }

  private currentPosition: XYPosition = { x: 0.5, y: 0.5 }
  private smoothedPosition: XYPosition = { x: 0.5, y: 0.5 }
  private subscribers: Set<(values: PanTiltValues) => void> = new Set()
  private recordingPositions: XYPosition[] = []
  private isRecording: boolean = false

  constructor(config?: Partial<XYPadConfig>) {
    if (config) {
      Object.assign(this.config, config)
    }
  }

  /**
   * Update XY position
   */
  updatePosition(x: number, y: number): void {
    // Normalize 0-1
    let normalizedX = Math.max(0, Math.min(1, x / this.config.width))
    let normalizedY = Math.max(0, Math.min(1, y / this.config.height))

    // Apply inversion
    if (this.config.invertX) normalizedX = 1 - normalizedX
    if (this.config.invertY) normalizedY = 1 - normalizedY

    this.currentPosition = { x: normalizedX, y: normalizedY }

    // Apply damping (smoothing)
    this.smoothedPosition.x +=
      (this.currentPosition.x - this.smoothedPosition.x) * (1 - this.config.damping)
    this.smoothedPosition.y +=
      (this.currentPosition.y - this.smoothedPosition.y) * (1 - this.config.damping)

    // Record if recording
    if (this.isRecording) {
      this.recordingPositions.push({ ...this.smoothedPosition })
    }

    // Convert to DMX values
    const values = this.convertToChannelValues()
    this.publishValues(values)
  }

  /**
   * Convert XY to channel values
   */
  private convertToChannelValues(): PanTiltValues {
    const panValue = Math.round(this.smoothedPosition.x * 255 * this.config.sensitivity)
    const tiltValue = Math.round(this.smoothedPosition.y * 255 * this.config.sensitivity)

    return {
      pan: Math.max(0, Math.min(255, panValue)),
      tilt: Math.max(0, Math.min(255, tiltValue))
    }
  }

  /**
   * Get current position
   */
  getCurrentPosition(): XYPosition {
    return { ...this.smoothedPosition }
  }

  /**
   * Set position directly
   */
  setPosition(x: number, y: number): void {
    this.currentPosition = { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) }
    this.smoothedPosition = { ...this.currentPosition }

    const values = this.convertToChannelValues()
    this.publishValues(values)
  }

  /**
   * Center XY pad
   */
  center(): void {
    this.setPosition(0.5, 0.5)
  }

  /**
   * Reset to zero
   */
  reset(): void {
    this.setPosition(0, 0)
  }

  /**
   * Move in direction
   */
  moveDirection(dx: number, dy: number, speed: number = 0.05): void {
    const newX = this.currentPosition.x + dx * speed
    const newY = this.currentPosition.y + dy * speed

    this.updatePosition(
      Math.max(0, Math.min(1, newX)) * this.config.width,
      Math.max(0, Math.min(1, newY)) * this.config.height
    )
  }

  /**
   * Start recording position sequence
   */
  startRecording(): void {
    this.isRecording = true
    this.recordingPositions = []
  }

  /**
   * Stop recording
   */
  stopRecording(): XYPosition[] {
    this.isRecording = false
    return this.recordingPositions
  }

  /**
   * Playback recorded positions
   */
  playbackRecording(positions: XYPosition[], speedMs: number = 100): void {
    positions.forEach((pos, index) => {
      setTimeout(() => {
        this.setPosition(pos.x, pos.y)
      }, speedMs * index)
    })
  }

  /**
   * Subscribe to value changes
   */
  subscribe(callback: (values: PanTiltValues) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Publish values to subscribers
   */
  private publishValues(values: PanTiltValues): void {
    this.subscribers.forEach(cb => cb(values))
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<XYPadConfig>): void {
    Object.assign(this.config, updates)
  }

  /**
   * Get configuration
   */
  getConfig(): XYPadConfig {
    return { ...this.config }
  }

  /**
   * Create preset position
   */
  createPreset(name: string, position: XYPosition): { name: string; position: XYPosition } {
    return { name, position }
  }

  /**
   * Apply preset
   */
  applyPreset(preset: { name: string; position: XYPosition }): void {
    this.setPosition(preset.position.x, preset.position.y)
  }
}

/**
 * Common XY Pad presets
 */
export const XY_PRESETS = {
  center: { name: 'Center', position: { x: 0.5, y: 0.5 } },
  topLeft: { name: 'Top Left', position: { x: 0, y: 1 } },
  topRight: { name: 'Top Right', position: { x: 1, y: 1 } },
  bottomLeft: { name: 'Bottom Left', position: { x: 0, y: 0 } },
  bottomRight: { name: 'Bottom Right', position: { x: 1, y: 0 } },
  topCenter: { name: 'Top Center', position: { x: 0.5, y: 1 } },
  bottomCenter: { name: 'Bottom Center', position: { x: 0.5, y: 0 } },
  leftCenter: { name: 'Left Center', position: { x: 0, y: 0.5 } },
  rightCenter: { name: 'Right Center', position: { x: 1, y: 0.5 } }
}
