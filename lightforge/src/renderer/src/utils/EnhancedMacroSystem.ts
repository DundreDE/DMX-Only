/**
 * EnhancedMacroSystem - Professional Macro Recording & Playback
 * 
 * Record complex sequences and replay them
 * - Record DMX changes
 * - Playback with speed control
 * - Save/load macros
 * - Use as building blocks
 */

export interface MacroStep {
  timestamp: number         // Relative to macro start (ms)
  universeIndex: number
  channels: Record<number, number>  // Channel -> value
  description?: string
}

export interface Macro {
  id: string
  name: string
  steps: MacroStep[]
  duration: number          // Total length in seconds
  playCount: number
  speedMultiplier: number   // 0.1x - 5x
  fadeTime: number          // Fade between steps (ms)
  isLooping: boolean
  tags: string[]
  createdAt: Date
  lastUsed?: Date
}

export class EnhancedMacroSystem {
  private macros = new Map<string, Macro>()
  private isRecording = false
  private recordingStartTime = 0
  private recordedSteps: MacroStep[] = []
  private currentMacroId: string | null = null
  private subscribers: ((macro: Macro | null, recording: boolean) => void)[] = []

  /**
   * Start recording macro
   */
  startRecording(name: string): void {
    if (this.isRecording) return

    this.isRecording = true
    this.recordingStartTime = Date.now()
    this.recordedSteps = []

    // Create new macro
    const macro: Macro = {
      id: crypto.randomUUID(),
      name,
      steps: [],
      duration: 0,
      playCount: 0,
      speedMultiplier: 1.0,
      fadeTime: 100,
      isLooping: false,
      tags: [],
      createdAt: new Date()
    }

    this.macros.set(macro.id, macro)
    this.currentMacroId = macro.id
    this.publish(null, true)
  }

  /**
   * Stop recording and save
   */
  stopRecording(): Macro | null {
    if (!this.isRecording || !this.currentMacroId) return null

    const macro = this.macros.get(this.currentMacroId)
    if (!macro) return null

    // Add recorded steps to macro
    macro.steps = this.recordedSteps
    macro.duration = (Date.now() - this.recordingStartTime) / 1000

    this.isRecording = false
    this.recordedSteps = []
    const result = { ...macro }

    this.publish(null, false)
    return result
  }

  /**
   * Record DMX change
   */
  recordChange(universeIndex: number, channels: Record<number, number>): void {
    if (!this.isRecording) return

    const timestamp = Date.now() - this.recordingStartTime

    this.recordedSteps.push({
      timestamp,
      universeIndex,
      channels,
      description: `Universe ${universeIndex}`
    })
  }

  /**
   * Play macro
   */
  playMacro(macroId: string, speed: number = 1.0): void {
    const macro = this.macros.get(macroId)
    if (!macro) return

    macro.playCount++
    macro.lastUsed = new Date()
    macro.speedMultiplier = Math.max(0.1, Math.min(5.0, speed))

    // Generate playback sequence
    for (const step of macro.steps) {
      const delayMs = step.timestamp / speed
      setTimeout(() => {
        this.subscribers.forEach(sub => sub(macro, false))
      }, delayMs)
    }
  }

  /**
   * Create macro from cue (snapshot)
   */
  createMacroFromDmx(name: string, dmxStates: Map<number, Uint8Array>): Macro {
    const macro: Macro = {
      id: crypto.randomUUID(),
      name,
      steps: [],
      duration: 0.1,
      playCount: 0,
      speedMultiplier: 1.0,
      fadeTime: 100,
      isLooping: false,
      tags: ['snapshot'],
      createdAt: new Date()
    }

    // Create single step from DMX
    for (const [universeIdx, dmxArray] of dmxStates) {
      const channels: Record<number, number> = {}
      for (let i = 0; i < dmxArray.length; i++) {
        if (dmxArray[i] > 0) {
          channels[i + 1] = dmxArray[i]
        }
      }

      macro.steps.push({
        timestamp: 0,
        universeIndex: universeIdx,
        channels,
        description: `Universe ${universeIdx}`
      })
    }

    this.macros.set(macro.id, macro)
    return macro
  }

  /**
   * Combine macros
   */
  combineMacros(name: string, macroIds: string[], spacing: number = 0.5): Macro | null {
    const combined: Macro = {
      id: crypto.randomUUID(),
      name,
      steps: [],
      duration: 0,
      playCount: 0,
      speedMultiplier: 1.0,
      fadeTime: 100,
      isLooping: false,
      tags: ['combined'],
      createdAt: new Date()
    }

    let currentTime = 0
    for (const id of macroIds) {
      const macro = this.macros.get(id)
      if (!macro) continue

      for (const step of macro.steps) {
        combined.steps.push({
          ...step,
          timestamp: currentTime + step.timestamp
        })
      }

      currentTime += macro.duration * 1000 + spacing * 1000
    }

    combined.duration = currentTime / 1000
    this.macros.set(combined.id, combined)
    return combined
  }

  /**
   * Get macro
   */
  getMacro(macroId: string): Macro | undefined {
    return this.macros.get(macroId)
  }

  /**
   * Get all macros
   */
  getAllMacros(tag?: string): Macro[] {
    const all = Array.from(this.macros.values())
    if (tag) {
      return all.filter(m => m.tags.includes(tag))
    }
    return all
  }

  /**
   * Delete macro
   */
  deleteMacro(macroId: string): void {
    this.macros.delete(macroId)
  }

  /**
   * Export macro
   */
  exportMacro(macroId: string): string {
    const macro = this.macros.get(macroId)
    if (!macro) throw new Error(`Macro ${macroId} not found`)
    return JSON.stringify(macro, null, 2)
  }

  /**
   * Import macro
   */
  importMacro(json: string): Macro {
    const macro = JSON.parse(json) as Macro
    this.macros.set(macro.id, macro)
    return macro
  }

  /**
   * Get recording status
   */
  isRecordingActive(): boolean {
    return this.isRecording
  }

  /**
   * Subscribe to macro events
   */
  subscribe(callback: (macro: Macro | null, recording: boolean) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) this.subscribers.splice(index, 1)
    }
  }

  private publish(macro: Macro | null, recording: boolean): void {
    this.subscribers.forEach(sub => sub(macro, recording))
  }
}

// Global singleton
export const enhancedMacroSystem = new EnhancedMacroSystem()
