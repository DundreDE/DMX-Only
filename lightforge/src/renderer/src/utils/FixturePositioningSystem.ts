/**
 * FixturePositioningSystem - Automatic Fixture Positioning & DMX Mapping
 * 
 * Similar to DasLight: Smart Pan/Tilt positioning for stage layouts
 * - Position fixtures visually on stage
 * - Automatic DMX value calculation
 * - Multi-fixture positioning with snap-to-grid
 */

export interface StagePosition {
  x: number          // Stage X position (0-100%)
  y: number          // Stage Y position (0-100%)
  name: string       // Position name (e.g., "Front Center", "Back Left")
}

export interface FixtureDmxMapping {
  fixtureId: string
  panChannel: number
  tiltChannel: number
  panMin: number     // DMX value at stage left/bottom
  panMax: number     // DMX value at stage right/top
  tiltMin: number
  tiltMax: number
  panInvert: boolean
  tiltInvert: boolean
}

export interface StageLayout {
  id: string
  name: string
  width: number      // Stage width in meters
  height: number     // Stage height in meters
  stageX: number     // Camera pan position (DMX 0-255)
  stageY: number     // Camera tilt position (DMX 0-255)
  positions: Map<string, StagePosition>
  fixtureMapping: Map<string, FixtureDmxMapping>
}

export class FixturePositioningSystem {
  private layouts = new Map<string, StageLayout>()
  private activeLayout: StageLayout | null = null
  private subscribers: ((layout: StageLayout) => void)[] = []

  /**
   * Create stage layout
   */
  createLayout(name: string, width: number = 10, height: number = 10): StageLayout {
    const id = crypto.randomUUID()
    const layout: StageLayout = {
      id,
      name,
      width,
      height,
      stageX: 128,
      stageY: 128,
      positions: new Map(),
      fixtureMapping: new Map()
    }

    this.layouts.set(id, layout)
    this.activeLayout = layout
    return layout
  }

  /**
   * Add position to layout (e.g., stage positions like "Front Center", "Back Left")
   */
  addPosition(layoutId: string, name: string, x: number, y: number): void {
    const layout = this.layouts.get(layoutId)
    if (!layout) throw new Error(`Layout ${layoutId} not found`)

    // Normalize to 0-100%
    const normX = Math.max(0, Math.min(100, x))
    const normY = Math.max(0, Math.min(100, y))

    layout.positions.set(name, { x: normX, y: normY, name })
    this.publish(layout)
  }

  /**
   * Add fixture with DMX mapping
   */
  addFixtureToLayout(layoutId: string, fixtureId: string, mapping: FixtureDmxMapping): void {
    const layout = this.layouts.get(layoutId)
    if (!layout) throw new Error(`Layout ${layoutId} not found`)

    mapping.fixtureId = fixtureId
    layout.fixtureMapping.set(fixtureId, mapping)
    this.publish(layout)
  }

  /**
   * Calculate DMX values for given stage position
   * Returns {panValue, tiltValue}
   */
  calculateDmxForPosition(layoutId: string, fixtureId: string, stagePosition: { x: number, y: number }): { pan: number, tilt: number } {
    const layout = this.layouts.get(layoutId)
    if (!layout) throw new Error(`Layout ${layoutId} not found`)

    const mapping = layout.fixtureMapping.get(fixtureId)
    if (!mapping) throw new Error(`Fixture ${fixtureId} not found in layout`)

    // Normalize input (0-100% to 0-1)
    const normalizedX = Math.max(0, Math.min(100, stagePosition.x)) / 100
    const normalizedY = Math.max(0, Math.min(100, stagePosition.y)) / 100

    // Calculate DMX values
    let panValue = mapping.panMin + (mapping.panMax - mapping.panMin) * normalizedX
    let tiltValue = mapping.tiltMin + (mapping.tiltMax - mapping.tiltMin) * normalizedY

    // Apply inversion if needed
    if (mapping.panInvert) panValue = 255 - panValue
    if (mapping.tiltInvert) tiltValue = 255 - tiltValue

    return {
      pan: Math.round(Math.max(0, Math.min(255, panValue))),
      tilt: Math.round(Math.max(0, Math.min(255, tiltValue)))
    }
  }

  /**
   * Position fixture at named stage location
   */
  positionFixtureAtLocation(layoutId: string, fixtureId: string, locationName: string): { pan: number, tilt: number } | null {
    const layout = this.layouts.get(layoutId)
    if (!layout) return null

    const position = layout.positions.get(locationName)
    if (!position) return null

    return this.calculateDmxForPosition(layoutId, fixtureId, position)
  }

  /**
   * Position multiple fixtures in formation
   * e.g., Circle, Line, Grid formation
   */
  positionFixturesInFormation(
    layoutId: string,
    fixtureIds: string[],
    formationType: 'circle' | 'line' | 'grid' | 'triangle',
    centerX: number,
    centerY: number,
    size: number  // Radius or side length
  ): Map<string, { pan: number, tilt: number }> {
    const results = new Map<string, { pan: number, tilt: number }>()

    if (formationType === 'circle') {
      const angleStep = (Math.PI * 2) / fixtureIds.length
      for (let i = 0; i < fixtureIds.length; i++) {
        const angle = angleStep * i
        const x = centerX + (size * Math.cos(angle))
        const y = centerY + (size * Math.sin(angle))
        const dmx = this.calculateDmxForPosition(layoutId, fixtureIds[i], { x, y })
        results.set(fixtureIds[i], dmx)
      }
    } else if (formationType === 'line') {
      const spacing = size / (fixtureIds.length - 1)
      for (let i = 0; i < fixtureIds.length; i++) {
        const x = centerX + (spacing * i)
        const dmx = this.calculateDmxForPosition(layoutId, fixtureIds[i], { x, y: centerY })
        results.set(fixtureIds[i], dmx)
      }
    } else if (formationType === 'grid') {
      const gridSize = Math.ceil(Math.sqrt(fixtureIds.length))
      const spacing = size / gridSize
      for (let i = 0; i < fixtureIds.length; i++) {
        const row = Math.floor(i / gridSize)
        const col = i % gridSize
        const x = centerX + (col * spacing)
        const y = centerY + (row * spacing)
        const dmx = this.calculateDmxForPosition(layoutId, fixtureIds[i], { x, y })
        results.set(fixtureIds[i], dmx)
      }
    } else if (formationType === 'triangle') {
      const baseY = centerY + size / 2
      const topY = centerY - size / 2
      for (let i = 0; i < fixtureIds.length; i++) {
        const row = Math.floor((-1 + Math.sqrt(1 + 8 * i)) / 2)
        const colInRow = i - (row * (row + 1)) / 2
        const totalInRow = row + 1
        const x = centerX + (colInRow - row / 2) * (size / row)
        const y = baseY - (row / fixtureIds.length) * (baseY - topY)
        const dmx = this.calculateDmxForPosition(layoutId, fixtureIds[i], { x, y })
        results.set(fixtureIds[i], dmx)
      }
    }

    return results
  }

  /**
   * Sweep fixture across stage
   * Returns array of {pan, tilt, dwell} for chaser programming
   */
  generateStageSweep(
    layoutId: string,
    fixtureId: string,
    sweepType: 'horizontal' | 'vertical' | 'diagonal',
    steps: number = 10
  ): Array<{ pan: number, tilt: number, dwell: number }> {
    const keyframes: Array<{ pan: number, tilt: number, dwell: number }> = []

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps
      let x = 50, y = 50

      if (sweepType === 'horizontal') {
        x = progress * 100
      } else if (sweepType === 'vertical') {
        y = progress * 100
      } else if (sweepType === 'diagonal') {
        x = progress * 100
        y = progress * 100
      }

      const dmx = this.calculateDmxForPosition(layoutId, fixtureId, { x, y })
      keyframes.push({ pan: dmx.pan, tilt: dmx.tilt, dwell: 100 })
    }

    return keyframes
  }

  /**
   * Create preset positions on stage
   */
  createPresetPositions(layoutId: string): void {
    const layout = this.layouts.get(layoutId)
    if (!layout) return

    // Standard theater positions
    const presets = [
      { name: 'Front Center', x: 50, y: 80 },
      { name: 'Front Left', x: 25, y: 80 },
      { name: 'Front Right', x: 75, y: 80 },
      { name: 'Center Stage', x: 50, y: 50 },
      { name: 'Left Stage', x: 25, y: 50 },
      { name: 'Right Stage', x: 75, y: 50 },
      { name: 'Back Left', x: 25, y: 20 },
      { name: 'Back Center', x: 50, y: 20 },
      { name: 'Back Right', x: 75, y: 20 },
      { name: 'Overhead', x: 50, y: 5 }
    ]

    for (const preset of presets) {
      this.addPosition(layoutId, preset.name, preset.x, preset.y)
    }
  }

  /**
   * Calculate fixture pan range based on stage width
   */
  calculatePanRange(stageWidth: number, FOV: number = 60): { min: number, max: number } {
    // Convert fixture FOV to pan range in DMX values
    // Simplified: assuming full 270-degree pan
    const coverageAngle = Math.atan((stageWidth / 2) / 5) * 2 * (180 / Math.PI)  // Distance to stage = 5m
    const panPerDegree = 255 / 270  // Full range of 270 degrees
    const panRange = coverageAngle * panPerDegree

    return {
      min: Math.round(128 - panRange / 2),
      max: Math.round(128 + panRange / 2)
    }
  }

  /**
   * Calculate fixture tilt range based on stage height
   */
  calculateTiltRange(stageHeight: number, FOV: number = 60): { min: number, max: number } {
    // Similar calculation for tilt
    const coverageAngle = Math.atan((stageHeight / 2) / 5) * 2 * (180 / Math.PI)
    const tiltPerDegree = 255 / 270
    const tiltRange = coverageAngle * tiltPerDegree

    return {
      min: Math.round(128 - tiltRange / 2),
      max: Math.round(128 + tiltRange / 2)
    }
  }

  /**
   * Get preset stage positions
   */
  getPresetPositions(layoutId: string): Array<{ name: string, x: number, y: number }> {
    const layout = this.layouts.get(layoutId)
    if (!layout) return []

    return Array.from(layout.positions.values())
  }

  /**
   * Export layout
   */
  exportLayout(layoutId: string): string {
    const layout = this.layouts.get(layoutId)
    if (!layout) throw new Error(`Layout ${layoutId} not found`)

    const exportData = {
      ...layout,
      positions: Array.from(layout.positions.entries()),
      fixtureMapping: Array.from(layout.fixtureMapping.entries())
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Import layout
   */
  importLayout(json: string): StageLayout {
    const data = JSON.parse(json)
    const layout: StageLayout = {
      ...data,
      positions: new Map(data.positions),
      fixtureMapping: new Map(data.fixtureMapping)
    }

    this.layouts.set(layout.id, layout)
    return layout
  }

  /**
   * Get active layout
   */
  getActiveLayout(): StageLayout | null {
    return this.activeLayout
  }

  /**
   * Set active layout
   */
  setActiveLayout(layoutId: string): void {
    const layout = this.layouts.get(layoutId)
    if (layout) {
      this.activeLayout = layout
    }
  }

  /**
   * Get all layouts
   */
  getAllLayouts(): StageLayout[] {
    return Array.from(this.layouts.values())
  }

  /**
   * Subscribe to layout changes
   */
  subscribe(callback: (layout: StageLayout) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) this.subscribers.splice(index, 1)
    }
  }

  private publish(layout: StageLayout): void {
    this.subscribers.forEach(sub => sub(layout))
  }
}

// Global singleton
export const fixturePositioningSystem = new FixturePositioningSystem()
