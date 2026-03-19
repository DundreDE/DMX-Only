/**
 * Macro Recorder - Record and playback control sequences
 * Professional automation system for complex lighting sequences
 */

export interface MacroEvent {
  timestamp: number // relative time from start in ms
  type: 'channel-set' | 'fixture-group' | 'scene-trigger' | 'effect-param' | 'fade'
  target: string // fixture ID, group ID, or scene ID
  value: any
  duration?: number
}

export interface RecordedMacro {
  id: string
  name: string
  description: string
  events: MacroEvent[]
  duration: number // total duration in ms
  loopable: boolean
  speed: number // playback speed multiplier (1.0 = normal)
  tags: string[]
  createdAt: Date
  modifiedAt: Date
}

export interface MacroPlaybackState {
  macroId: string
  isPlaying: boolean
  currentTime: number
  speed: number
  loop: boolean
}

/**
 * Macro Recorder
 */
export class MacroRecorder {
  private macros: Map<string, RecordedMacro> = new Map()
  private recording: {
    active: boolean
    name: string
    events: MacroEvent[]
    startTime: number
  } | null = null

  private playbackStates: Map<string, MacroPlaybackState> = new Map()
  private subscribers: Set<(macro: RecordedMacro, event: MacroEvent) => void> = new Set()

  /**
   * Start recording macro
   */
  startRecording(name: string): void {
    this.recording = {
      active: true,
      name,
      events: [],
      startTime: Date.now()
    }
    console.log(`Recording macro: ${name}`)
  }

  /**
   * Stop recording and save macro
   */
  stopRecording(): RecordedMacro | null {
    if (!this.recording) return null

    const duration = Date.now() - this.recording.startTime
    const macro: RecordedMacro = {
      id: `macro_${Date.now()}`,
      name: this.recording.name,
      description: '',
      events: this.recording.events,
      duration,
      loopable: true,
      speed: 1.0,
      tags: [],
      createdAt: new Date(),
      modifiedAt: new Date()
    }

    this.macros.set(macro.id, macro)
    this.recording = null
    this.saveMacros()

    console.log(`Macro saved: ${macro.name} (${duration}ms, ${macro.events.length} events)`)
    return macro
  }

  /**
   * Record event during recording
   */
  recordEvent(
    type: MacroEvent['type'],
    target: string,
    value: any,
    duration?: number
  ): void {
    if (!this.recording?.active) return

    const event: MacroEvent = {
      timestamp: Date.now() - this.recording.startTime,
      type,
      target,
      value,
      duration
    }

    this.recording.events.push(event)
  }

  /**
   * Play macro
   */
  playMacro(macroId: string, loop: boolean = false, speed: number = 1.0): boolean {
    const macro = this.macros.get(macroId)
    if (!macro) return false

    const playbackState: MacroPlaybackState = {
      macroId,
      isPlaying: true,
      currentTime: 0,
      speed,
      loop
    }

    this.playbackStates.set(macroId, playbackState)
    this.playMacroEvents(macro, playbackState)

    return true
  }

  /**
   * Play macro events with timing
   */
  private playMacroEvents(macro: RecordedMacro, state: MacroPlaybackState): void {
    let eventIndex = 0

    const playNextEvent = () => {
      if (!state.isPlaying || eventIndex >= macro.events.length) {
        if (state.loop && state.isPlaying) {
          eventIndex = 0
          playNextEvent()
        } else {
          state.isPlaying = false
        }
        return
      }

      const event = macro.events[eventIndex]!
      const delay = eventIndex === 0 ? 0 : event.timestamp - macro.events[eventIndex - 1]!.timestamp

      setTimeout(() => {
        if (state.isPlaying) {
          this.subscribers.forEach(cb => cb(macro, event))
          eventIndex++
          playNextEvent()
        }
      }, delay / state.speed)
    }

    playNextEvent()
  }

  /**
   * Stop macro playback
   */
  stopMacro(macroId: string): void {
    const state = this.playbackStates.get(macroId)
    if (state) {
      state.isPlaying = false
    }
  }

  /**
   * Pause macro playback
   */
  pauseMacro(macroId: string): void {
    const state = this.playbackStates.get(macroId)
    if (state) {
      state.isPlaying = false
    }
  }

  /**
   * Resume macro playback
   */
  resumeMacro(macroId: string): void {
    const state = this.playbackStates.get(macroId)
    if (state && !state.isPlaying) {
      const macro = this.macros.get(macroId)
      if (macro) {
        state.isPlaying = true
        this.playMacroEvents(macro, state)
      }
    }
  }

  /**
   * Combine macros sequentially
   */
  combineMacros(macroIds: string[], name: string): RecordedMacro | null {
    const macros = macroIds
      .map(id => this.macros.get(id))
      .filter((m): m is RecordedMacro => m !== undefined)

    if (macros.length === 0) return null

    let timeOffset = 0
    const combinedEvents: MacroEvent[] = []

    macros.forEach(macro => {
      macro.events.forEach(event => {
        combinedEvents.push({
          ...event,
          timestamp: event.timestamp + timeOffset
        })
      })
      timeOffset += macro.duration
    })

    const combined: RecordedMacro = {
      id: `combined_macro_${Date.now()}`,
      name,
      description: `Combination of ${macros.length} macros`,
      events: combinedEvents,
      duration: timeOffset,
      loopable: true,
      speed: 1.0,
      tags: [],
      createdAt: new Date(),
      modifiedAt: new Date()
    }

    this.macros.set(combined.id, combined)
    this.saveMacros()

    return combined
  }

  /**
   * Subscribe to macro playback events
   */
  subscribe(callback: (macro: RecordedMacro, event: MacroEvent) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Get all macros
   */
  getAllMacros(): RecordedMacro[] {
    return Array.from(this.macros.values())
  }

  /**
   * Get macro by ID
   */
  getMacro(macroId: string): RecordedMacro | undefined {
    return this.macros.get(macroId)
  }

  /**
   * Delete macro
   */
  deleteMacro(macroId: string): void {
    this.macros.delete(macroId)
    this.playbackStates.delete(macroId)
    this.saveMacros()
  }

  /**
   * Export macro
   */
  exportMacro(macroId: string): string | null {
    const macro = this.macros.get(macroId)
    if (!macro) return null

    return JSON.stringify(macro, null, 2)
  }

  /**
   * Import macro
   */
  importMacro(jsonData: string): RecordedMacro | null {
    try {
      const macro = JSON.parse(jsonData) as RecordedMacro
      macro.createdAt = new Date(macro.createdAt)
      macro.modifiedAt = new Date(macro.modifiedAt)
      this.macros.set(macro.id, macro)
      this.saveMacros()
      return macro
    } catch (error) {
      console.error('Failed to import macro:', error)
      return null
    }
  }

  /**
   * Save macros to localStorage
   */
  private saveMacros(): void {
    const data = Array.from(this.macros.values())
    localStorage.setItem('recorded_macros', JSON.stringify(data))
  }

  /**
   * Load macros from localStorage
   */
  loadMacros(): void {
    try {
      const data = localStorage.getItem('recorded_macros')
      if (data) {
        const macros = JSON.parse(data) as RecordedMacro[]
        macros.forEach(m => {
          m.createdAt = new Date(m.createdAt)
          m.modifiedAt = new Date(m.modifiedAt)
          this.macros.set(m.id, m)
        })
      }
    } catch (error) {
      console.error('Failed to load macros:', error)
    }
  }

  /**
   * Get playback state
   */
  getPlaybackState(macroId: string): MacroPlaybackState | undefined {
    return this.playbackStates.get(macroId)
  }

  /**
   * Change playback speed
   */
  setPlaybackSpeed(macroId: string, speed: number): void {
    const state = this.playbackStates.get(macroId)
    if (state) {
      state.speed = Math.max(0.1, Math.min(5.0, speed))
    }
  }
}

export const macroRecorder = new MacroRecorder()
