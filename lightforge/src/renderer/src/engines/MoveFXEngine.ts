/**
 * MoveFXEngine.ts
 * Movement FX Engine for Daslight 5
 * Creates Pan/Tilt patterns: waves, circles, grids, spirals
 */

export interface Position {
  x: number  // 0-1 (normalized stage width)
  y: number  // 0-1 (normalized stage height)
}

export interface MoveFXConfig {
  mode: 'wave' | 'circle' | 'grid' | 'spiral' | 'bounce'
  speed: number           // 0.1 - 10x
  fixtures: number[]      // Which fixtures are involved
  amplitude: number       // 0-255: how far to move
  panChannel: number      // DMX channel for pan
  tiltChannel: number     // DMX channel for tilt
  centerX: number         // 0.5 (center of stage)
  centerY: number         // 0.5 (center of stage)
}

/**
 * Movement FX Engine - creates Pan/Tilt patterns
 */
export class MoveFXEngine {
  private fixtureCount: number = 0

  constructor(private config: MoveFXConfig) {
    this.fixtureCount = config.fixtures.length
  }

  /**
   * Calculate position for a fixture at time
   */
  public calculatePosition(fixtureIdx: number, time: number): Position {
    const cycleTime = (1 / this.config.speed) * 1000
    const progress = (time % cycleTime) / cycleTime

    switch (this.config.mode) {
      case 'wave':
        return this.wavePattern(fixtureIdx, progress)
      case 'circle':
        return this.circlePattern(fixtureIdx, progress)
      case 'grid':
        return this.gridPattern(fixtureIdx, progress)
      case 'spiral':
        return this.spiralPattern(fixtureIdx, progress)
      case 'bounce':
        return this.bouncePattern(fixtureIdx, progress)
      default:
        return { x: 0.5, y: 0.5 }
    }
  }

  /**
   * Wave pattern (horizontal sine wave)
   */
  private wavePattern(fixtureIdx: number, progress: number): Position {
    const phase = (fixtureIdx / this.fixtureCount) * Math.PI * 2
    const x =
      this.config.centerX +
      Math.sin(progress * Math.PI * 2 + phase) *
        (this.config.amplitude / 255) *
        0.4
    const y = this.config.centerY

    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    }
  }

  /**
   * Circle pattern (fixtures move in a circle)
   */
  private circlePattern(fixtureIdx: number, progress: number): Position {
    const angle =
      (progress * Math.PI * 2) +
      (fixtureIdx / this.fixtureCount) * Math.PI * 2
    const radius = (this.config.amplitude / 255) * 0.4

    const x = this.config.centerX + Math.cos(angle) * radius
    const y = this.config.centerY + Math.sin(angle) * radius

    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    }
  }

  /**
   * Grid pattern (arrange fixtures in grid, move together)
   */
  private gridPattern(fixtureIdx: number, progress: number): Position {
    const gridSize = Math.ceil(Math.sqrt(this.fixtureCount))
    const row = Math.floor(fixtureIdx / gridSize)
    const col = fixtureIdx % gridSize

    const baseX = this.config.centerX + ((col / gridSize) - 0.5) * 0.4
    const baseY = this.config.centerY + ((row / gridSize) - 0.5) * 0.4

    const offset = (this.config.amplitude / 255) * 0.3
    const x = baseX + Math.sin(progress * Math.PI * 2) * offset
    const y = baseY + Math.cos(progress * Math.PI * 2) * offset

    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    }
  }

  /**
   * Spiral pattern
   */
  private spiralPattern(fixtureIdx: number, progress: number): Position {
    const angle = progress * Math.PI * 4
    const radius = ((this.config.amplitude / 255) * 0.4) * (fixtureIdx / this.fixtureCount)

    const x = this.config.centerX + Math.cos(angle) * radius
    const y = this.config.centerY + Math.sin(angle) * radius

    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    }
  }

  /**
   * Bounce pattern (fixtures bounce around randomly)
   */
  private bouncePattern(fixtureIdx: number, progress: number): Position {
    const seed = fixtureIdx * 12345
    const randomX = Math.sin(seed) * 0.8 + 0.5
    const randomY = Math.cos(seed * 1.1) * 0.8 + 0.5

    const bounceX = Math.abs(Math.sin(progress * Math.PI)) 
    const bounceY = Math.abs(Math.cos(progress * Math.PI * 0.7))

    const x = randomX * bounceX
    const y = randomY * bounceY

    return {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
    }
  }

  /**
   * Convert position to Pan/Tilt DMX values
   * Pan/Tilt: 0-255 maps to 0-540 degrees
   */
  public renderDMX(time: number): Record<number, Record<number, number>> {
    const dmxByFixture: Record<number, Record<number, number>> = {}

    for (let i = 0; i < this.fixtureCount; i++) {
      const pos = this.calculatePosition(i, time)

      const panValue = Math.floor(pos.x * 255)
      const tiltValue = Math.floor(pos.y * 255)

      const fixture = this.config.fixtures[i]
      dmxByFixture[fixture] = {
        [this.config.panChannel]: panValue,
        [this.config.tiltChannel]: tiltValue,
      }
    }

    return dmxByFixture
  }

  /**
   * Get all fixture positions at time
   */
  public getAllPositions(time: number): Position[] {
    const positions: Position[] = []
    for (let i = 0; i < this.fixtureCount; i++) {
      positions.push(this.calculatePosition(i, time))
    }
    return positions
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<MoveFXConfig>): void {
    this.config = { ...this.config, ...config }
    this.fixtureCount = config.fixtures?.length || this.fixtureCount
  }
}
