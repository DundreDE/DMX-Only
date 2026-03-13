/**
 * ChaserFXEngine.ts
 * Chaser FX Engine for Daslight 5
 * Creates sequential patterns: left-right, right-left, ping-pong, matrix
 */

export interface ChaserFXConfig {
  mode: 'leftRight' | 'rightLeft' | 'pingPong' | 'matrix' | 'random'
  speed: number           // 0.1 - 10x
  fixtures: number[]      // Which fixtures are involved
  stepSize: number        // 1-10: how many fixtures light up at once
  color: { r: number; g: number; b: number }
  channels: number[]      // RGB channels per fixture
}

/**
 * Chaser FX Engine - creates chasing light patterns
 */
export class ChaserFXEngine {
  private fixtureCount: number = 0
  private currentStep: number = 0

  constructor(private config: ChaserFXConfig) {
    this.fixtureCount = config.fixtures.length
  }

  /**
   * Calculate which fixtures should be lit at this time
   */
  public calculateActiveLights(time: number): number[] {
    const cycleTime = (1 / this.config.speed) * 1000
    const totalSteps = Math.ceil(this.fixtureCount / this.config.stepSize)
    const progress = (time % cycleTime) / cycleTime
    const currentStep = Math.floor(progress * totalSteps) % totalSteps

    switch (this.config.mode) {
      case 'leftRight':
        return this.getLeftRightLights(currentStep)
      case 'rightLeft':
        return this.getRightLeftLights(currentStep)
      case 'pingPong':
        return this.getPingPongLights(currentStep, totalSteps)
      case 'matrix':
        return this.getMatrixLights(currentStep)
      case 'random':
        return this.getRandomLights(currentStep)
      default:
        return []
    }
  }

  /**
   * Left to right chase
   */
  private getLeftRightLights(step: number): number[] {
    const active: number[] = []
    const start = (step * this.config.stepSize) % this.fixtureCount
    for (let i = 0; i < this.config.stepSize; i++) {
      active.push((start + i) % this.fixtureCount)
    }
    return active
  }

  /**
   * Right to left chase
   */
  private getRightLeftLights(step: number): number[] {
    const active: number[] = []
    const start = (this.fixtureCount - ((step * this.config.stepSize) % this.fixtureCount)) - 1
    for (let i = 0; i < this.config.stepSize; i++) {
      const idx = (start - i) % this.fixtureCount
      if (idx < 0) active.push(idx + this.fixtureCount)
      else active.push(idx)
    }
    return active
  }

  /**
   * Ping-pong chase (bounces back and forth)
   */
  private getPingPongLights(step: number, totalSteps: number): number[] {
    const halfCycle = Math.floor(totalSteps / 2)
    let adjustedStep = step
    if (step > halfCycle) {
      adjustedStep = totalSteps - step
    }
    return this.getLeftRightLights(adjustedStep)
  }

  /**
   * Matrix mode (2D grid pattern)
   */
  private getMatrixLights(step: number): number[] {
    const gridSize = Math.ceil(Math.sqrt(this.fixtureCount))
    const active: number[] = []

    const row = Math.floor(step / gridSize)
    for (let col = 0; col < gridSize; col++) {
      const idx = row * gridSize + col
      if (idx < this.fixtureCount) {
        active.push(idx)
      }
    }

    return active
  }

  /**
   * Random light selection
   */
  private getRandomLights(step: number): number[] {
    const seed = step * 12345
    const active: number[] = []

    for (let i = 0; i < this.config.stepSize && i < this.fixtureCount; i++) {
      const random = Math.sin(seed + i * 12.9898) * 43758.5453
      const idx = Math.floor((random - Math.floor(random)) * this.fixtureCount)
      if (!active.includes(idx)) {
        active.push(idx)
      }
    }

    return active
  }

  /**
   * Render to DMX channels
   */
  public renderDMX(time: number): Record<number, number> {
    const activeLights = this.calculateActiveLights(time)
    const dmx: Record<number, number> = {}

    for (const fixtureIdx of activeLights) {
      const fixture = this.config.fixtures[fixtureIdx]
      if (fixture === undefined) continue

      const channelBase = fixture * 3
      if (this.config.channels[0] !== undefined) {
        dmx[this.config.channels[0]] = this.config.color.r
        dmx[this.config.channels[1]] = this.config.color.g
        dmx[this.config.channels[2]] = this.config.color.b
      }
    }

    return dmx
  }

  /**
   * Get intensity curve for smooth fading between steps
   */
  private getIntensityCurve(step: number, totalSteps: number): number {
    const curve = Math.sin((step / totalSteps) * Math.PI)
    return Math.pow(curve, 2)
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ChaserFXConfig>): void {
    this.config = { ...this.config, ...config }
    this.fixtureCount = config.fixtures?.length || this.fixtureCount
  }

  /**
   * Get current step info
   */
  public getStepInfo(time: number): {
    step: number
    totalSteps: number
    activeLights: number[]
    progress: number
  } {
    const cycleTime = (1 / this.config.speed) * 1000
    const totalSteps = Math.ceil(this.fixtureCount / this.config.stepSize)
    const progress = (time % cycleTime) / cycleTime
    const step = Math.floor(progress * totalSteps) % totalSteps
    const activeLights = this.calculateActiveLights(time)

    return { step, totalSteps, activeLights, progress }
  }
}
