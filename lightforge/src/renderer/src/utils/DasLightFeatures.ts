/**
 * Music Trigger Engine - Sync effects to music beats
 * BPM detection and beat-triggered lighting
 */

export interface BeatDetectionConfig {
  autoDetect: boolean
  bpm: number
  beatSensitivity: number // 0-1
  measureDivision: number // 4, 8, 16
}

export interface BeatTrigger {
  id: string
  beat: number // which beat (1-16)
  action: 'scene-change' | 'effect-trigger' | 'dmx-pulse' | 'blackout'
  targetId: string
  enabled: boolean
}

/**
 * Music Trigger Engine
 */
export class MusicTriggerEngine {
  private config: BeatDetectionConfig = {
    autoDetect: false,
    bpm: 120,
    beatSensitivity: 0.8,
    measureDivision: 4
  }

  private triggers: Map<string, BeatTrigger[]> = new Map()
  private currentBeat: number = 1
  private isListening: boolean = false
  private subscribers: Set<(beat: number) => void> = new Set()
  private beatInterval: NodeJS.Timeout | null = null

  /**
   * Start beat detection
   */
  startBeatDetection(): void {
    if (this.isListening) return

    this.isListening = true
    const beatDuration = (60000 / this.config.bpm) / this.config.measureDivision

    this.beatInterval = setInterval(() => {
      this.currentBeat = (this.currentBeat % this.config.measureDivision) + 1
      this.publishBeat()
      this.executeTriggers()
    }, beatDuration)
  }

  /**
   * Stop beat detection
   */
  stopBeatDetection(): void {
    if (this.beatInterval) {
      clearInterval(this.beatInterval)
      this.beatInterval = null
    }
    this.isListening = false
  }

  /**
   * Execute triggers for current beat
   */
  private executeTriggers(): void {
    const triggersForBeat = this.triggers.get(String(this.currentBeat)) || []

    triggersForBeat.forEach(trigger => {
      if (trigger.enabled) {
        console.log(`Executing trigger: ${trigger.action} on beat ${trigger.beat}`)
      }
    })
  }

  /**
   * Add beat trigger
   */
  addBeatTrigger(beat: number, trigger: Omit<BeatTrigger, 'id'>): BeatTrigger {
    const newTrigger: BeatTrigger = {
      ...trigger,
      id: `trigger_${Date.now()}`
    }

    const key = String(beat)
    if (!this.triggers.has(key)) {
      this.triggers.set(key, [])
    }

    this.triggers.get(key)!.push(newTrigger)
    return newTrigger
  }

  /**
   * Remove trigger
   */
  removeTrigger(beat: number, triggerId: string): void {
    const key = String(beat)
    const triggers = this.triggers.get(key)
    if (triggers) {
      const index = triggers.findIndex(t => t.id === triggerId)
      if (index >= 0) {
        triggers.splice(index, 1)
      }
    }
  }

  /**
   * Set BPM
   */
  setBPM(bpm: number): void {
    this.config.bpm = Math.max(40, Math.min(240, bpm))

    if (this.isListening) {
      this.stopBeatDetection()
      this.startBeatDetection()
    }
  }

  /**
   * Subscribe to beats
   */
  subscribe(callback: (beat: number) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Publish beat
   */
  private publishBeat(): void {
    this.subscribers.forEach(cb => cb(this.currentBeat))
  }
}

export const musicTriggerEngine = new MusicTriggerEngine()

/**
 * Gobo Selector - Visual effect wheel selection
 */
export interface GoboWheel {
  id: string
  name: string
  positions: Array<{
    number: number
    name: string
    icon?: string
  }>
  maxPosition: number
}

export class GoboSelector {
  private wheels: Map<string, GoboWheel> = new Map()

  /**
   * Create gobo wheel
   */
  createWheel(name: string, positions: number): GoboWheel {
    const wheel: GoboWheel = {
      id: `wheel_${Date.now()}`,
      name,
      positions: Array.from({ length: positions }, (_, i) => ({
        number: i + 1,
        name: `Position ${i + 1}`
      })),
      maxPosition: positions
    }

    this.wheels.set(wheel.id, wheel)
    return wheel
  }

  /**
   * Get gobo value (0-255 for DMX)
   */
  getGoboValue(wheelId: string, position: number): number {
    const wheel = this.wheels.get(wheelId)
    if (!wheel) return 0

    const clamped = Math.max(0, Math.min(wheel.maxPosition - 1, position))
    return Math.round((clamped / (wheel.maxPosition - 1)) * 255)
  }

  /**
   * Get position from DMX value
   */
  getPositionFromValue(wheelId: string, value: number): number {
    const wheel = this.wheels.get(wheelId)
    if (!wheel) return 0

    const normalized = value / 255
    return Math.round(normalized * (wheel.maxPosition - 1)) + 1
  }
}

export const goboSelector = new GoboSelector()

/**
 * Blackout Management - Quick blackout snapshots
 */
export interface BlackoutSnapshot {
  id: string
  name: string
  timestamp: number
  previousState: Record<string, number> // fixture -> level
}

export class BlackoutManager {
  private snapshots: Map<string, BlackoutSnapshot> = new Map()

  /**
   * Create blackout snapshot (before blackout)
   */
  createSnapshot(previousState: Record<string, number>): BlackoutSnapshot {
    const snapshot: BlackoutSnapshot = {
      id: `blackout_${Date.now()}`,
      name: `Blackout ${new Date().toLocaleTimeString()}`,
      timestamp: Date.now(),
      previousState
    }

    this.snapshots.set(snapshot.id, snapshot)
    return snapshot
  }

  /**
   * Recall snapshot
   */
  recallSnapshot(snapshotId: string): Record<string, number> | null {
    const snapshot = this.snapshots.get(snapshotId)
    return snapshot ? snapshot.previousState : null
  }

  /**
   * Get last snapshot
   */
  getLastSnapshot(): BlackoutSnapshot | null {
    const sorted = Array.from(this.snapshots.values())
      .sort((a, b) => b.timestamp - a.timestamp)
    return sorted[0] || null
  }
}

export const blackoutManager = new BlackoutManager()

/**
 * Fixture Remote Control - Individual fixture addressing
 */
export interface FixtureRemoteCommand {
  fixtureId: string
  command: 'reset' | 'lamp-on' | 'lamp-off' | 'set-address' | 'custom'
  parameters?: Record<string, any>
}

export class FixtureRemoteControl {
  /**
   * Send command to fixture
   */
  sendCommand(cmd: FixtureRemoteCommand): boolean {
    console.log(`Remote: ${cmd.command} for fixture ${cmd.fixtureId}`, cmd.parameters)
    return true
  }

  /**
   * Reset fixture to defaults
   */
  resetFixture(fixtureId: string): void {
    this.sendCommand({
      fixtureId,
      command: 'reset'
    })
  }

  /**
   * Turn lamp on
   */
  lampOn(fixtureId: string): void {
    this.sendCommand({
      fixtureId,
      command: 'lamp-on'
    })
  }

  /**
   * Turn lamp off
   */
  lampOff(fixtureId: string): void {
    this.sendCommand({
      fixtureId,
      command: 'lamp-off'
    })
  }

  /**
   * Set DMX address
   */
  setAddress(fixtureId: string, address: number, universe: number = 1): void {
    this.sendCommand({
      fixtureId,
      command: 'set-address',
      parameters: { address, universe }
    })
  }
}

export const fixtureRemoteControl = new FixtureRemoteControl()
