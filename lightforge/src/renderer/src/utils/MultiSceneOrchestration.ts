/**
 * Multi-Scene Orchestration System
 * Advanced scene sequencing with crossfade timing and BPM sync
 */

import type { Scene } from '../../../shared/types'

export interface SceneTransition {
  fromSceneId: string
  toSceneId: string
  crossfadeTime: number // ms
  type: 'linear' | 'smooth' | 'stepped' | 'custom'
  delay: number // ms
}

export interface SceneSequence {
  id: string
  name: string
  scenes: Scene[]
  transitions: SceneTransition[]
  loop: boolean
  masterTempo: number // BPM
  syncMode: 'free' | 'beat' | 'bar'
}

export interface OrchestratorState {
  currentSceneIndex: number
  currentTime: number // ms since sequence start
  isPlaying: boolean
  transitionProgress: number // 0-1
}

/**
 * Multi-Scene Orchestrator
 * Handles complex scene sequences with synchronized transitions
 */
export class MultiSceneOrchestrator {
  private state: OrchestratorState = {
    currentSceneIndex: 0,
    currentTime: 0,
    isPlaying: false,
    transitionProgress: 0
  }

  private animationFrameId: number | null = null
  private startTime: number = 0
  private subscribers: Set<(state: OrchestratorState) => void> = new Set()

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: OrchestratorState) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Notify subscribers
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(cb => cb(this.state))
  }

  /**
   * Play sequence
   */
  play(sequence: SceneSequence): void {
    this.state.isPlaying = true
    this.state.currentTime = 0
    this.state.currentSceneIndex = 0
    this.startTime = performance.now()

    this.animate(sequence)
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.state.isPlaying = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.state.isPlaying = false
  }

  /**
   * Resume playback
   */
  resume(): void {
    this.state.isPlaying = true
    this.startTime = performance.now() - this.state.currentTime
    this.animate
  }

  /**
   * Seek to time in sequence
   */
  seek(time: number): void {
    this.state.currentTime = time
  }

  /**
   * Animation loop
   */
  private animate(sequence: SceneSequence): void {
    if (!this.state.isPlaying) return

    const now = performance.now()
    this.state.currentTime = now - this.startTime

    // Calculate total sequence duration
    const totalDuration = this.calculateSequenceDuration(sequence)

    if (this.state.currentTime > totalDuration) {
      if (sequence.loop) {
        this.state.currentTime = 0
        this.startTime = now
      } else {
        this.state.isPlaying = false
        return
      }
    }

    // Update current scene and transition
    this.updateSceneTransition(sequence)
    this.notifySubscribers()

    this.animationFrameId = requestAnimationFrame(() => this.animate(sequence))
  }

  /**
   * Update scene and transition progress
   */
  private updateSceneTransition(sequence: SceneSequence): void {
    let accumulatedTime = 0

    for (let i = 0; i < sequence.scenes.length; i++) {
      const scene = sequence.scenes[i]
      const duration = this.getSceneDuration(scene, sequence.masterTempo)
      const nextScene = sequence.scenes[(i + 1) % sequence.scenes.length]
      const transition = sequence.transitions.find(
        t => t.fromSceneId === scene.id && t.toSceneId === nextScene.id
      )
      const transitionDuration = transition?.crossfadeTime || 0

      const segmentEnd = accumulatedTime + duration + transitionDuration

      if (this.state.currentTime >= accumulatedTime && this.state.currentTime < segmentEnd) {
        const segmentTime = this.state.currentTime - accumulatedTime

        if (segmentTime < duration) {
          // In scene
          this.state.currentSceneIndex = i
          this.state.transitionProgress = 0
        } else {
          // In transition
          const transitionTime = segmentTime - duration
          this.state.currentSceneIndex = i
          this.state.transitionProgress = Math.min(1, transitionTime / transitionDuration)
        }

        return
      }

      accumulatedTime = segmentEnd
    }
  }

  /**
   * Calculate scene duration based on BPM
   */
  private getSceneDuration(scene: Scene, bpm: number): number {
    // Default: 4 bars = 4 beats
    const bars = 4
    const beatDuration = (60 / bpm) * 1000 // ms per beat
    return bars * 4 * beatDuration
  }

  /**
   * Calculate total sequence duration
   */
  private calculateSequenceDuration(sequence: SceneSequence): number {
    let total = 0

    sequence.scenes.forEach((scene, idx) => {
      total += this.getSceneDuration(scene, sequence.masterTempo)

      const nextScene = sequence.scenes[(idx + 1) % sequence.scenes.length]
      const transition = sequence.transitions.find(
        t => t.fromSceneId === scene.id && t.toSceneId === nextScene.id
      )

      if (transition) {
        total += transition.crossfadeTime
      }
    })

    return total
  }

  /**
   * Get current state
   */
  getState(): OrchestratorState {
    return { ...this.state }
  }

  /**
   * Get transition for current state
   */
  getCurrentTransition(sequence: SceneSequence): SceneTransition | null {
    if (this.state.transitionProgress === 0) return null

    const scene = sequence.scenes[this.state.currentSceneIndex]
    const nextScene = sequence.scenes[(this.state.currentSceneIndex + 1) % sequence.scenes.length]

    return (
      sequence.transitions.find(
        t => t.fromSceneId === scene.id && t.toSceneId === nextScene.id
      ) || null
    )
  }
}

/**
 * Crossfade Engine
 * Handles smooth transitions between scenes
 */
export function calculateCrossfadeValue(
  fromValue: number,
  toValue: number,
  progress: number,
  type: 'linear' | 'smooth' | 'stepped' | 'custom'
): number {
  switch (type) {
    case 'linear':
      return Math.round(fromValue + (toValue - fromValue) * progress)

    case 'smooth':
      // Ease-in-out
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress
      return Math.round(fromValue + (toValue - fromValue) * easeProgress)

    case 'stepped':
      // Step at 50%
      return progress < 0.5 ? fromValue : toValue

    case 'custom':
      // S-curve
      const s = progress * Math.PI
      const customProgress = (Math.sin(s - Math.PI / 2) + 1) / 2
      return Math.round(fromValue + (toValue - fromValue) * customProgress)

    default:
      return fromValue
  }
}

/**
 * Scene Synchronization Manager
 * Keeps multiple scenes in sync with BPM
 */
export class SceneSyncManager {
  private masterBPM: number = 120

  /**
   * Calculate beat time
   */
  getBeatTime(beats: number): number {
    return (60 / this.masterBPM) * 1000 * beats
  }

  /**
   * Calculate bar time (4 beats per bar)
   */
  getBarTime(bars: number): number {
    return this.getBeatTime(bars * 4)
  }

  /**
   * Quantize time to nearest beat
   */
  quantizeToBeat(time: number): number {
    const beatTime = this.getBeatTime(1)
    return Math.round(time / beatTime) * beatTime
  }

  /**
   * Quantize time to nearest bar
   */
  quantizeToBar(time: number): number {
    const barTime = this.getBarTime(1)
    return Math.round(time / barTime) * barTime
  }

  /**
   * Set master BPM
   */
  setMasterBPM(bpm: number): void {
    this.masterBPM = Math.max(20, Math.min(240, bpm))
  }

  /**
   * Get current BPM
   */
  getMasterBPM(): number {
    return this.masterBPM
  }

  /**
   * Calculate time until next beat
   */
  timeToNextBeat(currentTime: number): number {
    const beatTime = this.getBeatTime(1)
    const nextBeat = Math.ceil(currentTime / beatTime) * beatTime
    return nextBeat - currentTime
  }

  /**
   * Calculate time until next bar
   */
  timeToNextBar(currentTime: number): number {
    const barTime = this.getBarTime(1)
    const nextBar = Math.ceil(currentTime / barTime) * barTime
    return nextBar - currentTime
  }
}
