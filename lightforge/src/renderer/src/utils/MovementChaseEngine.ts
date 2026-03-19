/**
 * MovementChaseEngine - Automatic Movement Chasing like DasLight
 * 
 * Handles automatic movement of fixtures between positions:
 * - Pan/Tilt transitions
 * - Movement patterns (circle, line, zigzag, figure-8, etc)
 * - Speed control (degrees/second)
 * - Multi-fixture synchronization
 * - Keyframe-based paths
 */

export type MovementPattern = 'linear' | 'circle' | 'zigzag' | 'figure8' | 'spiral' | 'random' | 'pendulum' | 'custom'
export type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'sine' | 'cosine'

export interface MovementKeyframe {
  pan: number          // 0-255 DMX value
  tilt: number         // 0-255 DMX value
  dwell: number        // Time to hold position (ms)
  speed?: number       // Degrees/second for this segment
  easing?: EasingType  // Easing function
}

export interface MovementPath {
  id: string
  name: string
  pattern: MovementPattern
  keyframes: MovementKeyframe[]
  speed: number                // Degrees per second (default)
  loop: boolean
  reverse: boolean
  scale: number                // 0.1-2.0x size multiplier
  offset: { pan: number, tilt: number } // Center point offset
}

export interface FixtureMovement {
  fixtureId: string
  universeIndex: number
  panChannel: number           // 1-512
  tiltChannel: number          // 1-512
  panRange: number             // Pan max (usually 255 for 8-bit, 65535 for 16-bit)
  tiltRange: number            // Tilt max
  speed: number                // Override speed
}

export interface MovementChase {
  id: string
  name: string
  paths: MovementPath[]        // Can have multiple paths running
  fixtures: FixtureMovement[]
  isRunning: boolean
  speed: number                // Master speed multiplier (0.1x - 5x)
  bpm?: number                 // Sync to BPM
}

interface ChaseState {
  startTime: number
  pausedTime: number
  pathStates: Map<string, PathState>
  subscribers: ((chase: MovementChase) => void)[]
}

interface PathState {
  currentKeyframeIndex: number
  nextKeyframeIndex: number
  progress: number             // 0-1 between keyframes
  totalDwellTime: number
  elapsedDwellTime: number
}

export class MovementChaseEngine {
  private chases = new Map<string, MovementChase>()
  private states = new Map<string, ChaseState>()
  private animationFrameId: number | null = null
  private subscribers: ((chase: MovementChase, dmxUpdate: DmxUpdate) => void)[] = []

  /**
   * Create a new movement chase
   */
  createChase(name: string, fixtures: FixtureMovement[]): MovementChase {
    const id = crypto.randomUUID()
    const chase: MovementChase = {
      id,
      name,
      paths: [],
      fixtures,
      isRunning: false,
      speed: 1.0
    }
    this.chases.set(id, chase)
    return chase
  }

  /**
   * Add a movement path to a chase
   */
  addPath(chaseId: string, path: MovementPath): void {
    const chase = this.chases.get(chaseId)
    if (!chase) throw new Error(`Chase ${chaseId} not found`)
    chase.paths.push(path)
  }

  /**
   * Generate circular movement pattern
   */
  generateCirclePattern(center: { pan: number, tilt: number }, radius: number, speed: number): MovementPath {
    const keyframes: MovementKeyframe[] = []
    const steps = 12  // 30 degree intervals
    const radiusDmx = radius * 255 / 270  // Convert degrees to DMX range

    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2
      const panDelta = radiusDmx * Math.cos(angle)
      const tiltDelta = radiusDmx * Math.sin(angle)

      keyframes.push({
        pan: Math.max(0, Math.min(255, center.pan + panDelta)),
        tilt: Math.max(0, Math.min(255, center.tilt + tiltDelta)),
        dwell: 100,
        speed,
        easing: 'linear'
      })
    }

    return {
      id: crypto.randomUUID(),
      name: 'Circle Pattern',
      pattern: 'circle',
      keyframes,
      speed,
      loop: true,
      reverse: false,
      scale: 1.0,
      offset: center
    }
  }

  /**
   * Generate zigzag movement pattern
   */
  generateZigzagPattern(start: { pan: number, tilt: number }, amplitude: number, count: number, speed: number): MovementPath {
    const keyframes: MovementKeyframe[] = []
    const amplitudeDmx = amplitude * 255 / 270

    for (let i = 0; i <= count * 2; i++) {
      const direction = i % 2 === 0 ? 1 : -1
      keyframes.push({
        pan: Math.max(0, Math.min(255, start.pan + (amplitudeDmx * direction))),
        tilt: start.tilt + ((i / (count * 2)) * amplitudeDmx),
        dwell: 50,
        speed,
        easing: 'linear'
      })
    }

    return {
      id: crypto.randomUUID(),
      name: 'Zigzag Pattern',
      pattern: 'zigzag',
      keyframes,
      speed,
      loop: true,
      reverse: false,
      scale: 1.0,
      offset: start
    }
  }

  /**
   * Generate figure-8 pattern
   */
  generateFigure8Pattern(center: { pan: number, tilt: number }, sizeX: number, sizeY: number, speed: number): MovementPath {
    const keyframes: MovementKeyframe[] = []
    const steps = 24
    const sizeXDmx = sizeX * 255 / 270
    const sizeYDmx = sizeY * 255 / 270

    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2
      const panDelta = sizeXDmx * Math.sin(t)
      const tiltDelta = sizeYDmx * Math.sin(t) * Math.cos(t)

      keyframes.push({
        pan: Math.max(0, Math.min(255, center.pan + panDelta)),
        tilt: Math.max(0, Math.min(255, center.tilt + tiltDelta)),
        dwell: 50,
        speed,
        easing: 'linear'
      })
    }

    return {
      id: crypto.randomUUID(),
      name: 'Figure-8 Pattern',
      pattern: 'figure8',
      keyframes,
      speed,
      loop: true,
      reverse: false,
      scale: 1.0,
      offset: center
    }
  }

  /**
   * Generate spiral pattern
   */
  generateSpiralPattern(center: { pan: number, tilt: number }, startRadius: number, endRadius: number, speed: number): MovementPath {
    const keyframes: MovementKeyframe[] = []
    const steps = 24
    const startRadiusDmx = startRadius * 255 / 270
    const endRadiusDmx = endRadius * 255 / 270

    for (let i = 0; i < steps; i++) {
      const t = i / steps
      const angle = t * Math.PI * 4  // 2 full rotations
      const radius = startRadiusDmx + (endRadiusDmx - startRadiusDmx) * t

      keyframes.push({
        pan: Math.max(0, Math.min(255, center.pan + radius * Math.cos(angle))),
        tilt: Math.max(0, Math.min(255, center.tilt + radius * Math.sin(angle))),
        dwell: 50,
        speed,
        easing: 'linear'
      })
    }

    return {
      id: crypto.randomUUID(),
      name: 'Spiral Pattern',
      pattern: 'spiral',
      keyframes,
      speed,
      loop: true,
      reverse: false,
      scale: 1.0,
      offset: center
    }
  }

  /**
   * Generate pendulum pattern (swinging movement)
   */
  generatePendulumPattern(center: { pan: number, tilt: number }, amplitude: number, axis: 'pan' | 'tilt', speed: number): MovementPath {
    const keyframes: MovementKeyframe[] = []
    const amplitudeDmx = amplitude * 255 / 270
    const steps = 16

    for (let i = 0; i < steps; i++) {
      const t = i / steps
      const angle = Math.sin(t * Math.PI) * amplitudeDmx

      if (axis === 'pan') {
        keyframes.push({
          pan: Math.max(0, Math.min(255, center.pan + angle)),
          tilt: center.tilt,
          dwell: 50,
          speed,
          easing: 'sine'
        })
      } else {
        keyframes.push({
          pan: center.pan,
          tilt: Math.max(0, Math.min(255, center.tilt + angle)),
          dwell: 50,
          speed,
          easing: 'sine'
        })
      }
    }

    return {
      id: crypto.randomUUID(),
      name: `Pendulum (${axis})`,
      pattern: 'pendulum',
      keyframes,
      speed,
      loop: true,
      reverse: false,
      scale: 1.0,
      offset: center
    }
  }

  /**
   * Add custom keyframes to create custom paths
   */
  createCustomPath(positions: Array<{ pan: number, tilt: number, dwell?: number }>, speed: number): MovementPath {
    const keyframes: MovementKeyframe[] = positions.map(pos => ({
      pan: pos.pan,
      tilt: pos.tilt,
      dwell: pos.dwell || 100,
      speed,
      easing: 'linear'
    }))

    return {
      id: crypto.randomUUID(),
      name: 'Custom Path',
      pattern: 'custom',
      keyframes,
      speed,
      loop: true,
      reverse: false,
      scale: 1.0,
      offset: { pan: 128, tilt: 128 }
    }
  }

  /**
   * Start chase playback
   */
  startChase(chaseId: string): void {
    const chase = this.chases.get(chaseId)
    if (!chase) return

    chase.isRunning = true
    
    // Initialize state for all paths
    const state: ChaseState = {
      startTime: Date.now(),
      pausedTime: 0,
      pathStates: new Map(),
      subscribers: []
    }

    for (const path of chase.paths) {
      state.pathStates.set(path.id, {
        currentKeyframeIndex: 0,
        nextKeyframeIndex: 1,
        progress: 0,
        totalDwellTime: 0,
        elapsedDwellTime: 0
      })
    }

    this.states.set(chaseId, state)
    
    // Start animation loop if not running
    if (!this.animationFrameId) {
      this.animate()
    }
  }

  /**
   * Pause chase
   */
  pauseChase(chaseId: string): void {
    const chase = this.chases.get(chaseId)
    if (!chase) return

    chase.isRunning = false
    const state = this.states.get(chaseId)
    if (state) {
      state.pausedTime = Date.now()
    }
  }

  /**
   * Resume paused chase
   */
  resumeChase(chaseId: string): void {
    const chase = this.chases.get(chaseId)
    if (!chase) return

    const state = this.states.get(chaseId)
    if (state) {
      state.startTime += Date.now() - state.pausedTime
      chase.isRunning = true
    }
  }

  /**
   * Stop chase and reset
   */
  stopChase(chaseId: string): void {
    const chase = this.chases.get(chaseId)
    if (!chase) return

    chase.isRunning = false
    this.states.delete(chaseId)
  }

  /**
   * Set chase speed multiplier
   */
  setSpeed(chaseId: string, speed: number): void {
    const chase = this.chases.get(chaseId)
    if (!chase) return
    chase.speed = Math.max(0.1, Math.min(5.0, speed))
  }

  /**
   * Set path speed
   */
  setPathSpeed(chaseId: string, pathId: string, speed: number): void {
    const chase = this.chases.get(chaseId)
    if (!chase) return

    const path = chase.paths.find(p => p.id === pathId)
    if (path) {
      path.speed = speed
    }
  }

  /**
   * Calculate easing value
   */
  private easeValue(t: number, easing: EasingType): number {
    switch (easing) {
      case 'ease-in':
        return t * t
      case 'ease-out':
        return 1 - (1 - t) * (1 - t)
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      case 'sine':
        return Math.sin(t * Math.PI / 2)
      case 'cosine':
        return 1 - Math.cos(t * Math.PI / 2)
      case 'linear':
      default:
        return t
    }
  }

  /**
   * Main animation loop
   */
  private animate = (): void => {
    const now = Date.now()
    const dmxUpdates: DmxUpdate[] = []

    for (const [chaseId, chase] of this.chases) {
      if (!chase.isRunning) continue

      const state = this.states.get(chaseId)
      if (!state) continue

      const elapsedTime = (now - state.startTime) / 1000  // Convert to seconds

      // Process each path
      for (const path of chase.paths) {
        const pathState = state.pathStates.get(path.id)
        if (!pathState) continue

        // Get current and next keyframes
        const currentKf = path.keyframes[pathState.currentKeyframeIndex]
        const nextKf = path.keyframes[pathState.nextKeyframeIndex]

        if (!currentKf || !nextKf) continue

        // Calculate transition time
        const speed = (path.speed || 1) * (chase.speed || 1)
        const panDiff = Math.abs(nextKf.pan - currentKf.pan)
        const tiltDiff = Math.abs(nextKf.tilt - currentKf.tilt)
        const maxDiff = Math.max(panDiff, tiltDiff)
        const transitionTime = maxDiff > 0 ? maxDiff / (speed * 2.55) : 0.1  // Normalized to DMX range

        // Check if we should move to next keyframe
        if (pathState.elapsedDwellTime >= (currentKf.dwell || 100) / 1000 + transitionTime) {
          pathState.currentKeyframeIndex = (pathState.currentKeyframeIndex + 1) % path.keyframes.length
          pathState.nextKeyframeIndex = (pathState.nextKeyframeIndex + 1) % path.keyframes.length
          pathState.elapsedDwellTime = 0
          pathState.progress = 0
          continue
        }

        // Update progress
        pathState.elapsedDwellTime += 0.016  // ~60fps
        pathState.progress = Math.min(1, (pathState.elapsedDwellTime * 1000 - (currentKf.dwell || 100)) / (transitionTime * 1000))

        if (pathState.progress < 0) pathState.progress = 0
        if (pathState.progress > 1) pathState.progress = 1

        // Interpolate between keyframes with easing
        const eased = this.easeValue(pathState.progress, currentKf.easing || 'linear')
        const interpPan = currentKf.pan + (nextKf.pan - currentKf.pan) * eased
        const interpTilt = currentKf.tilt + (nextKf.tilt - currentKf.tilt) * eased

        // Generate DMX updates for each fixture
        for (const fixture of chase.fixtures) {
          dmxUpdates.push({
            fixtureId: fixture.fixtureId,
            universe: fixture.universeIndex,
            channels: {
              [fixture.panChannel]: Math.round(interpPan),
              [fixture.tiltChannel]: Math.round(interpTilt)
            }
          })
        }
      }
    }

    // Publish DMX updates
    for (const update of dmxUpdates) {
      this.subscribers.forEach(sub => sub(null as any, update))
    }

    // Continue animation loop
    this.animationFrameId = requestAnimationFrame(this.animate)
  }

  /**
   * Subscribe to chase updates
   */
  subscribe(callback: (chase: MovementChase | null, dmxUpdate: DmxUpdate) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) this.subscribers.splice(index, 1)
    }
  }

  /**
   * Get chase by ID
   */
  getChase(chaseId: string): MovementChase | undefined {
    return this.chases.get(chaseId)
  }

  /**
   * Get all chases
   */
  getAllChases(): MovementChase[] {
    return Array.from(this.chases.values())
  }

  /**
   * Delete chase
   */
  deleteChase(chaseId: string): void {
    this.chases.delete(chaseId)
    this.states.delete(chaseId)
  }

  /**
   * Export chase to JSON
   */
  exportChase(chaseId: string): string {
    const chase = this.chases.get(chaseId)
    if (!chase) throw new Error(`Chase ${chaseId} not found`)
    return JSON.stringify(chase, null, 2)
  }

  /**
   * Import chase from JSON
   */
  importChase(json: string): MovementChase {
    const chase = JSON.parse(json) as MovementChase
    this.chases.set(chase.id, chase)
    return chase
  }
}

interface DmxUpdate {
  fixtureId: string
  universe: number
  channels: Record<number, number>
}

// Global singleton
export const movementChaseEngine = new MovementChaseEngine()
