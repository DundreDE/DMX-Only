/**
 * CueStackEngine - Professional Cue Stack & Show Control
 * 
 * DasLight's #1 feature: Automated light show sequencing
 * - Store cues (snapshots of DMX state)
 * - Execute cues in sequence with timing
 * - Cross-fade between cues
 * - Go button for manual advance
 * - BPM sync for timed sequences
 */

export interface Cue {
  id: string
  number: number              // Cue number (1, 2, 3, etc)
  label: string               // "Intro", "Verse 1", etc
  dmxValues: Map<number, Uint8Array>  // Universe -> DMX array
  timing: {
    upTime: number            // Time to reach this cue (seconds)
    dwell: number             // Time to stay in this cue (seconds)
    downTime: number          // Time to leave this cue (seconds)
  }
  link: 'auto' | 'manual' | 'keys'  // Advance mode
  crossfade: {
    type: 'linear' | 'ease-in' | 'ease-out' | 'sine'
    channels?: string[]       // Specific channels to crossfade, or all
  }
  notes: string
  sceneId?: string            // Link to scene
}

export interface CueStack {
  id: string
  name: string                // "Main Show", "Backup Show"
  cues: Cue[]
  currentCueIndex: number
  isPlaying: boolean
  bpm?: number
  useMusic: boolean           // Sync to music BPM
  grandMasterLevel: number    // 0-255
}

export class CueStackEngine {
  private stacks = new Map<string, CueStack>()
  private currentStack: CueStack | null = null
  private playbackState = {
    cueFadeProgress: 0        // 0-1
    transitionStartTime: 0
    isTransitioning: false
  }
  private animationFrameId: number | null = null
  private subscribers: ((stack: CueStack, dmxUpdate?: any) => void)[] = []

  /**
   * Create new cue stack
   */
  createStack(name: string): CueStack {
    const stack: CueStack = {
      id: crypto.randomUUID(),
      name,
      cues: [],
      currentCueIndex: 0,
      isPlaying: false,
      bpm: 120,
      useMusic: false,
      grandMasterLevel: 255
    }
    this.stacks.set(stack.id, stack)
    this.currentStack = stack
    return stack
  }

  /**
   * Add cue to stack
   */
  addCue(stackId: string, label: string, dmxValues: Map<number, Uint8Array>): Cue {
    const stack = this.stacks.get(stackId)
    if (!stack) throw new Error(`Stack ${stackId} not found`)

    const cue: Cue = {
      id: crypto.randomUUID(),
      number: stack.cues.length + 1,
      label,
      dmxValues,
      timing: {
        upTime: 3,            // 3 second fade by default
        dwell: 2,
        downTime: 0
      },
      link: 'auto',
      crossfade: { type: 'linear' },
      notes: ''
    }

    stack.cues.push(cue)
    return cue
  }

  /**
   * Update cue timing
   */
  setCueTiming(stackId: string, cueNumber: number, upTime: number, dwell: number, downTime: number): void {
    const stack = this.stacks.get(stackId)
    if (!stack) return

    const cue = stack.cues[cueNumber - 1]
    if (cue) {
      cue.timing.upTime = upTime
      cue.timing.dwell = dwell
      cue.timing.downTime = downTime
    }
  }

  /**
   * Set cue crossfade type
   */
  setCueCrossfade(stackId: string, cueNumber: number, type: 'linear' | 'ease-in' | 'ease-out' | 'sine'): void {
    const stack = this.stacks.get(stackId)
    if (!stack) return

    const cue = stack.cues[cueNumber - 1]
    if (cue) {
      cue.crossfade.type = type
    }
  }

  /**
   * Go to cue (manual trigger via Go button)
   */
  goToCue(stackId: string, cueNumber: number): void {
    const stack = this.stacks.get(stackId)
    if (!stack) return

    const cueIndex = cueNumber - 1
    if (cueIndex < 0 || cueIndex >= stack.cues.length) return

    stack.currentCueIndex = cueIndex
    this.playbackState.isTransitioning = true
    this.playbackState.transitionStartTime = Date.now()
    this.playbackState.cueFadeProgress = 0

    if (!stack.isPlaying) {
      stack.isPlaying = true
      this.startAnimation()
    }
  }

  /**
   * Go button - advance to next cue
   */
  goButton(stackId: string): void {
    const stack = this.stacks.get(stackId)
    if (!stack) return

    const nextIndex = stack.currentCueIndex + 1
    if (nextIndex < stack.cues.length) {
      this.goToCue(stackId, nextIndex + 1)
    }
  }

  /**
   * Start automatic playback
   */
  startPlayback(stackId: string): void {
    const stack = this.stacks.get(stackId)
    if (!stack) return

    stack.isPlaying = true
    this.playbackState.transitionStartTime = Date.now()
    this.startAnimation()
  }

  /**
   * Pause playback
   */
  pausePlayback(stackId: string): void {
    const stack = this.stacks.get(stackId)
    if (!stack) return
    stack.isPlaying = false
  }

  /**
   * Stop and reset
   */
  stopPlayback(stackId: string): void {
    const stack = this.stacks.get(stackId)
    if (!stack) return
    stack.isPlaying = false
    stack.currentCueIndex = 0
  }

  /**
   * Set BPM (affects cue timing)
   */
  setBPM(stackId: string, bpm: number): void {
    const stack = this.stacks.get(stackId)
    if (!stack) return
    stack.bpm = Math.max(20, Math.min(300, bpm))
  }

  /**
   * Set grand master level
   */
  setGrandMaster(stackId: string, level: number): void {
    const stack = this.stacks.get(stackId)
    if (!stack) return
    stack.grandMasterLevel = Math.max(0, Math.min(255, level))
  }

  /**
   * Easing functions
   */
  private easeValue(t: number, type: 'linear' | 'ease-in' | 'ease-out' | 'sine'): number {
    switch (type) {
      case 'ease-in':
        return t * t
      case 'ease-out':
        return 1 - (1 - t) * (1 - t)
      case 'sine':
        return Math.sin(t * Math.PI / 2)
      case 'linear':
      default:
        return t
    }
  }

  /**
   * Interpolate between two DMX universes
   */
  private interpolateUniverse(from: Uint8Array, to: Uint8Array, progress: number): Uint8Array {
    const result = new Uint8Array(512)
    for (let i = 0; i < 512; i++) {
      result[i] = Math.round(from[i] + (to[i] - from[i]) * progress)
    }
    return result
  }

  /**
   * Main animation loop
   */
  private startAnimation = (): void => {
    if (this.animationFrameId !== null) return

    const animate = (): void => {
      const stack = this.currentStack
      if (!stack || !stack.isPlaying) {
        this.animationFrameId = null
        return
      }

      const now = Date.now()
      const currentCue = stack.cues[stack.currentCueIndex]
      const nextCue = stack.cues[stack.currentCueIndex + 1]

      if (!currentCue) {
        stack.isPlaying = false
        this.animationFrameId = null
        return
      }

      // Handle timing
      const elapsedMs = now - this.playbackState.transitionStartTime
      const upTimeMs = currentCue.timing.upTime * 1000

      if (elapsedMs < upTimeMs) {
        // Still transitioning to current cue
        this.playbackState.cueFadeProgress = elapsedMs / upTimeMs
        const eased = this.easeValue(this.playbackState.cueFadeProgress, currentCue.crossfade.type)

        // Create interpolated DMX output
        for (const [universeIdx, dmxArray] of currentCue.dmxValues) {
          const prevCue = stack.currentCueIndex > 0 ? stack.cues[stack.currentCueIndex - 1] : null
          const prevArray = prevCue?.dmxValues.get(universeIdx) || new Uint8Array(512)

          const interpolated = this.interpolateUniverse(prevArray, dmxArray, eased)

          // Apply grand master
          for (let i = 0; i < interpolated.length; i++) {
            interpolated[i] = Math.round((interpolated[i] * stack.grandMasterLevel) / 255)
          }

          this.subscribers.forEach(sub => sub(stack, { universeIdx, data: interpolated }))
        }
      } else if (elapsedMs < upTimeMs + (currentCue.timing.dwell * 1000)) {
        // Holding at current cue
        this.playbackState.cueFadeProgress = 1.0

        for (const [universeIdx, dmxArray] of currentCue.dmxValues) {
          const withMaster = new Uint8Array(dmxArray)
          for (let i = 0; i < withMaster.length; i++) {
            withMaster[i] = Math.round((withMaster[i] * stack.grandMasterLevel) / 255)
          }
          this.subscribers.forEach(sub => sub(stack, { universeIdx, data: withMaster }))
        }

        // Auto-advance if link is 'auto'
        if (currentCue.link === 'auto' && nextCue) {
          this.goToCue(stack.id, stack.currentCueIndex + 2)
        }
      }

      this.animationFrameId = requestAnimationFrame(animate)
    }

    this.animationFrameId = requestAnimationFrame(animate)
  }

  /**
   * Subscribe to cue updates
   */
  subscribe(callback: (stack: CueStack, dmxUpdate?: any) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) this.subscribers.splice(index, 1)
    }
  }

  /**
   * Get stack
   */
  getStack(stackId: string): CueStack | undefined {
    return this.stacks.get(stackId)
  }

  /**
   * Get all stacks
   */
  getAllStacks(): CueStack[] {
    return Array.from(this.stacks.values())
  }

  /**
   * Export cue stack
   */
  exportStack(stackId: string): string {
    const stack = this.stacks.get(stackId)
    if (!stack) throw new Error(`Stack ${stackId} not found`)

    // Convert Uint8Arrays to regular arrays for JSON serialization
    const exportData = {
      ...stack,
      cues: stack.cues.map(cue => ({
        ...cue,
        dmxValues: Array.from(cue.dmxValues.entries()).map(([k, v]) => [k, Array.from(v)])
      }))
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Import cue stack
   */
  importStack(json: string): CueStack {
    const data = JSON.parse(json)
    
    // Convert arrays back to Uint8Arrays
    const stack: CueStack = {
      ...data,
      cues: data.cues.map((cue: any) => ({
        ...cue,
        dmxValues: new Map(
          cue.dmxValues.map(([k, v]: [number, number[]]) => [k, new Uint8Array(v)])
        )
      }))
    }

    this.stacks.set(stack.id, stack)
    return stack
  }
}

// Global singleton
export const cueStackEngine = new CueStackEngine()
