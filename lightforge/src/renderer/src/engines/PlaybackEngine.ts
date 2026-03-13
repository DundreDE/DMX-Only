/**
 * PlaybackEngine.ts
 * Scene Playback Engine for Daslight 5
 * Controls scene playback, timeline, BPM sync, live control dials
 */

import { DMXEngine, DMXState } from './DMXEngine'
import { ColorFXEngine, ColorFXConfig } from './ColorFXEngine'
import { ChaserFXEngine, ChaserFXConfig } from './ChaserFXEngine'
import { MoveFXEngine, MoveFXConfig } from './MoveFXEngine'
import { ValueFXEngine, ValueFXConfig } from './ValueFXEngine'
import { CurveFXEngine, CurveFXConfig } from './CurveFXEngine'

export interface Scene {
  id: string
  name: string
  duration: number // in milliseconds
  fadeIn: number // milliseconds
  fadeOut: number // milliseconds
  type: 'static' | 'steps' | 'fx' | 'superScene'
  bpmSync: boolean
  bpm?: number
  baseState: Record<number, Record<number, number>> // universe -> channel -> value
  fx: FXStack[]
}

export interface FXStack {
  id: string
  type: 'color' | 'chaser' | 'move' | 'value' | 'curve'
  config: ColorFXConfig | ChaserFXConfig | MoveFXConfig | ValueFXConfig | CurveFXConfig
  priority: number
  enabled: boolean
}

export interface PlaybackState {
  currentScene: Scene | null
  isPlaying: boolean
  currentTime: number // 0-duration
  speed: number // 0.5 = half speed, 2 = double speed
  direction: 'forward' | 'reverse' | 'bounce'
  bounceDirection: 'forward' | 'backward'
  liveControl: {
    speed: number    // 0.1-10x
    size: number     // 0-1 (amplitude multiplier)
    phase: number    // 0-1
    dimmer: number   // 0-255
  }
}

/**
 * PlaybackEngine - manages scene playback and real-time effects
 */
export class PlaybackEngine {
  private state: PlaybackState = {
    currentScene: null,
    isPlaying: false,
    currentTime: 0,
    speed: 1,
    direction: 'forward',
    bounceDirection: 'forward',
    liveControl: {
      speed: 1,
      size: 1,
      phase: 0,
      dimmer: 255,
    },
  }

  private dmxEngine: DMXEngine
  private colorFX: Map<string, ColorFXEngine> = new Map()
  private chaserFX: Map<string, ChaserFXEngine> = new Map()
  private moveFX: Map<string, MoveFXEngine> = new Map()
  private valueFX: Map<string, ValueFXEngine> = new Map()
  private curveFX: Map<string, CurveFXEngine> = new Map()

  private startTime: number = 0
  private pausedTime: number = 0
  private updateHandlers: ((state: PlaybackState) => void)[] = []
  private rafId: number | null = null

  constructor(dmxEngine: DMXEngine) {
    this.dmxEngine = dmxEngine
  }

  /**
   * Load scene for playback
   */
  public loadScene(scene: Scene): void {
    this.state.currentScene = scene
    this.state.currentTime = 0

    this.initializeFXEngines(scene)
  }

  /**
   * Initialize FX engines for scene
   */
  private initializeFXEngines(scene: Scene): void {
    this.colorFX.clear()
    this.chaserFX.clear()
    this.moveFX.clear()
    this.valueFX.clear()
    this.curveFX.clear()

    for (const fx of scene.fx) {
      if (fx.type === 'color') {
        this.colorFX.set(fx.id, new ColorFXEngine(fx.config as ColorFXConfig))
      } else if (fx.type === 'chaser') {
        this.chaserFX.set(fx.id, new ChaserFXEngine(fx.config as ChaserFXConfig))
      } else if (fx.type === 'move') {
        this.moveFX.set(fx.id, new MoveFXEngine(fx.config as MoveFXConfig))
      } else if (fx.type === 'value') {
        this.valueFX.set(fx.id, new ValueFXEngine(fx.config as ValueFXConfig))
      } else if (fx.type === 'curve') {
        this.curveFX.set(fx.id, new CurveFXEngine(fx.config as CurveFXConfig))
      }
    }
  }

  /**
   * Play scene
   */
  public play(): void {
    if (!this.state.currentScene) return
    if (this.state.isPlaying) return

    this.state.isPlaying = true
    this.startTime = performance.now() - this.state.currentTime
    this.update()
  }

  /**
   * Pause playback
   */
  public pause(): void {
    this.state.isPlaying = false
    this.pausedTime = this.state.currentTime
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  /**
   * Stop playback
   */
  public stop(): void {
    this.pause()
    this.state.currentTime = 0
  }

  /**
   * Seek to time
   */
  public seek(time: number): void {
    if (!this.state.currentScene) return
    this.state.currentTime = Math.max(
      0,
      Math.min(time, this.state.currentScene.duration)
    )
    this.startTime = performance.now() - this.state.currentTime
    this.notifyUpdate()
  }

  /**
   * Set playback speed
   */
  public setSpeed(speed: number): void {
    this.state.speed = Math.max(0.1, Math.min(10, speed))
  }

  /**
   * Set playback direction
   */
  public setDirection(direction: 'forward' | 'reverse' | 'bounce'): void {
    this.state.direction = direction
    if (direction === 'bounce') {
      this.state.bounceDirection = 'forward'
    }
  }

  /**
   * Update live control dials
   */
  public setLiveControl(control: Partial<PlaybackState['liveControl']>): void {
    this.state.liveControl = { ...this.state.liveControl, ...control }
  }

  /**
   * Main update loop
   */
  private update = (): void => {
    if (!this.state.isPlaying || !this.state.currentScene) {
      this.rafId = null
      return
    }

    const now = performance.now()
    const elapsed = (now - this.startTime) * this.state.speed

    let newTime = elapsed

    if (this.state.direction === 'reverse') {
      newTime = this.state.currentScene.duration - elapsed
    } else if (this.state.direction === 'bounce') {
      const fullCycle = this.state.currentScene.duration * 2
      const cyclePos = elapsed % fullCycle
      if (cyclePos > this.state.currentScene.duration) {
        newTime = fullCycle - cyclePos
        this.state.bounceDirection = 'backward'
      } else {
        newTime = cyclePos
        this.state.bounceDirection = 'forward'
      }
    }

    if (newTime < 0 || newTime > this.state.currentScene.duration) {
      this.state.isPlaying = false
      this.state.currentTime = this.state.currentScene.duration
      this.notifyUpdate()
      return
    }

    this.state.currentTime = newTime
    this.renderFrame()
    this.notifyUpdate()

    this.rafId = requestAnimationFrame(this.update)
  }

  /**
   * Render current frame to DMX
   */
  private renderFrame(): void {
    if (!this.state.currentScene) return

    const scene = this.state.currentScene
    const time = this.state.currentTime

    for (let u = 0; u < 1; u++) {
      for (let ch = 1; ch <= 512; ch++) {
        const baseValue = scene.baseState[u]?.[ch] || 0
        this.dmxEngine.setChannel(u, ch, baseValue)
      }
    }

    // Apply fade in
    if (time < scene.fadeIn) {
      const fadeProgress = time / scene.fadeIn
      for (let u = 0; u < 1; u++) {
        for (let ch = 1; ch <= 512; ch++) {
          const current = this.dmxEngine.getChannel(u, ch)
          const faded = Math.floor(current * fadeProgress)
          this.dmxEngine.setChannel(u, ch, faded)
        }
      }
    }

    // Apply fade out
    const timeToEnd = scene.duration - time
    if (timeToEnd < scene.fadeOut) {
      const fadeProgress = timeToEnd / scene.fadeOut
      for (let u = 0; u < 1; u++) {
        for (let ch = 1; ch <= 512; ch++) {
          const current = this.dmxEngine.getChannel(u, ch)
          const faded = Math.floor(current * fadeProgress)
          this.dmxEngine.setChannel(u, ch, faded)
        }
      }
    }

    // Apply FX
    for (const [fxId, fx] of this.colorFX) {
      const dmx = fx.renderDMX(time)
      for (const [ch, val] of Object.entries(dmx)) {
        this.dmxEngine.blendChannel(0, parseInt(ch), val as number, 'add')
      }
    }

    for (const [fxId, fx] of this.chaserFX) {
      const dmx = fx.renderDMX(time)
      for (const [ch, val] of Object.entries(dmx)) {
        this.dmxEngine.blendChannel(0, parseInt(ch), val as number, 'add')
      }
    }

    for (const [fxId, fx] of this.valueFX) {
      const dmx = fx.renderDMX(time)
      for (const [ch, val] of Object.entries(dmx)) {
        this.dmxEngine.setChannel(0, parseInt(ch), val as number)
      }
    }

    for (const [fxId, fx] of this.curveFX) {
      const dmx = fx.renderDMX(time)
      for (const [ch, val] of Object.entries(dmx)) {
        this.dmxEngine.setChannel(0, parseInt(ch), val as number)
      }
    }

    // Apply dimmer control
    const dimmerfactor = this.state.liveControl.dimmer / 255
    for (let ch = 1; ch <= 512; ch++) {
      const current = this.dmxEngine.getChannel(0, ch)
      const dimmed = Math.floor(current * dimmerfactor)
      this.dmxEngine.setChannel(0, ch, dimmed)
    }
  }

  /**
   * Subscribe to state updates
   */
  public onStateUpdate(handler: (state: PlaybackState) => void): () => void {
    this.updateHandlers.push(handler)
    return () => {
      const idx = this.updateHandlers.indexOf(handler)
      if (idx > -1) this.updateHandlers.splice(idx, 1)
    }
  }

  private notifyUpdate(): void {
    for (const handler of this.updateHandlers) {
      handler(this.state)
    }
  }

  /**
   * Get current playback state
   */
  public getState(): PlaybackState {
    return { ...this.state }
  }

  /**
   * Get current scene
   */
  public getCurrentScene(): Scene | null {
    return this.state.currentScene
  }

  /**
   * Get playback progress (0-1)
   */
  public getProgress(): number {
    if (!this.state.currentScene) return 0
    return this.state.currentTime / this.state.currentScene.duration
  }

  /**
   * Export state
   */
  public export(): string {
    return JSON.stringify(
      {
        state: this.state,
        currentScene: this.state.currentScene,
      },
      null,
      2
    )
  }
}

export const globalPlaybackEngine = new PlaybackEngine(
  require('./DMXEngine').globalDMXEngine
)
