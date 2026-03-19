/**
 * Scene Morphing - Smooth transitions between scenes
 * DasLight-style scene blending and morphing
 */

export type MorphTransitionType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'sine'

export interface SceneMorphConfig {
  duration: number // ms
  transitionType: MorphTransitionType
  holdTime: number // ms to hold after transition
}

export interface MorphingScene {
  fromSceneId: string
  toSceneId: string
  progress: number // 0-1
  startTime: number
  config: SceneMorphConfig
}

/**
 * Scene Morphing Engine
 */
export class SceneMorphingEngine {
  private activeMorphs: Map<string, MorphingScene> = new Map()
  private subscribers: Set<(morph: MorphingScene) => void> = new Set()
  private animationFrames: Map<string, number> = new Map()

  /**
   * Calculate easing function value
   */
  private easeValue(progress: number, type: MorphTransitionType): number {
    progress = Math.max(0, Math.min(1, progress))

    switch (type) {
      case 'linear':
        return progress

      case 'ease-in':
        return progress * progress

      case 'ease-out':
        return 1 - (1 - progress) * (1 - progress)

      case 'ease-in-out':
        return progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress

      case 'sine':
        return Math.sin(progress * Math.PI) / 2

      default:
        return progress
    }
  }

  /**
   * Start morphing transition
   */
  startMorph(
    morphId: string,
    fromSceneId: string,
    toSceneId: string,
    config: SceneMorphConfig
  ): void {
    // Stop existing morph if any
    this.stopMorph(morphId)

    const morph: MorphingScene = {
      fromSceneId,
      toSceneId,
      progress: 0,
      startTime: Date.now(),
      config
    }

    this.activeMorphs.set(morphId, morph)
    this.animateMorph(morphId)
  }

  /**
   * Animate morph frame by frame
   */
  private animateMorph(morphId: string): void {
    const morph = this.activeMorphs.get(morphId)
    if (!morph) return

    const elapsed = Date.now() - morph.startTime
    const progress = elapsed / morph.config.duration

    if (progress >= 1.0) {
      morph.progress = 1.0
      this.publishMorph(morph)

      // Hold time
      const holdTimeout = setTimeout(() => {
        this.stopMorph(morphId)
      }, morph.config.holdTime)

      this.animationFrames.set(morphId, holdTimeout as any)
      return
    }

    morph.progress = this.easeValue(progress, morph.config.transitionType)
    this.publishMorph(morph)

    const frameId = requestAnimationFrame(() => this.animateMorph(morphId))
    this.animationFrames.set(morphId, frameId)
  }

  /**
   * Stop morphing
   */
  stopMorph(morphId: string): void {
    const frameId = this.animationFrames.get(morphId)
    if (frameId) {
      cancelAnimationFrame(frameId)
      this.animationFrames.delete(morphId)
    }

    this.activeMorphs.delete(morphId)
  }

  /**
   * Get morph progress
   */
  getMorphProgress(morphId: string): number {
    const morph = this.activeMorphs.get(morphId)
    return morph ? morph.progress : 0
  }

  /**
   * Get interpolated channel value between two scenes
   */
  interpolateChannelValue(
    fromValue: number,
    toValue: number,
    morphId: string
  ): number {
    const progress = this.getMorphProgress(morphId)
    return Math.round(fromValue + (toValue - fromValue) * progress)
  }

  /**
   * Get all active morphs
   */
  getActiveMorphs(): MorphingScene[] {
    return Array.from(this.activeMorphs.values())
  }

  /**
   * Check if morphing is active
   */
  isMorphing(morphId: string): boolean {
    return this.activeMorphs.has(morphId)
  }

  /**
   * Pause morph
   */
  pauseMorph(morphId: string): void {
    const morph = this.activeMorphs.get(morphId)
    if (morph) {
      const frameId = this.animationFrames.get(morphId)
      if (frameId) {
        cancelAnimationFrame(frameId)
      }
    }
  }

  /**
   * Resume morph
   */
  resumeMorph(morphId: string): void {
    const morph = this.activeMorphs.get(morphId)
    if (morph) {
      this.animateMorph(morphId)
    }
  }

  /**
   * Reverse morph direction
   */
  reverseMorph(morphId: string): void {
    const morph = this.activeMorphs.get(morphId)
    if (morph) {
      // Swap scenes
      const temp = morph.fromSceneId
      morph.fromSceneId = morph.toSceneId
      morph.toSceneId = temp

      // Reverse progress
      morph.progress = 1 - morph.progress
      morph.startTime = Date.now() - morph.progress * morph.config.duration

      this.animateMorph(morphId)
    }
  }

  /**
   * Create preset morph configuration
   */
  getPresets(): Record<string, SceneMorphConfig> {
    return {
      'Quick (500ms)': {
        duration: 500,
        transitionType: 'linear',
        holdTime: 0
      },
      'Normal (2s)': {
        duration: 2000,
        transitionType: 'ease-in-out',
        holdTime: 0
      },
      'Smooth (5s)': {
        duration: 5000,
        transitionType: 'sine',
        holdTime: 1000
      },
      'Gradual (10s)': {
        duration: 10000,
        transitionType: 'ease-out',
        holdTime: 2000
      }
    }
  }

  /**
   * Subscribe to morph updates
   */
  subscribe(callback: (morph: MorphingScene) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Publish morph to subscribers
   */
  private publishMorph(morph: MorphingScene): void {
    this.subscribers.forEach(cb => cb(morph))
  }

  /**
   * Create morph sequence
   */
  createMorphSequence(
    sceneIds: string[],
    config: SceneMorphConfig
  ): Array<{
    id: string
    fromSceneId: string
    toSceneId: string
  }> {
    const sequence = []

    for (let i = 0; i < sceneIds.length - 1; i++) {
      sequence.push({
        id: `morph_${i}`,
        fromSceneId: sceneIds[i]!,
        toSceneId: sceneIds[i + 1]!
      })
    }

    return sequence
  }

  /**
   * Play morph sequence
   */
  playMorphSequence(
    morphSequence: Array<{
      id: string
      fromSceneId: string
      toSceneId: string
    }>,
    config: SceneMorphConfig,
    onComplete?: () => void
  ): void {
    let currentIndex = 0

    const playNext = () => {
      if (currentIndex >= morphSequence.length) {
        if (onComplete) onComplete()
        return
      }

      const morph = morphSequence[currentIndex]!
      const totalTime = config.duration + config.holdTime

      this.startMorph(morph.id, morph.fromSceneId, morph.toSceneId, config)

      currentIndex++

      setTimeout(playNext, totalTime)
    }

    playNext()
  }
}

export const sceneMorphingEngine = new SceneMorphingEngine()
