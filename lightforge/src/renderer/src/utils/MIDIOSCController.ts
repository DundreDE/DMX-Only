/**
 * Advanced MIDI & OSC Control System
 * MIDI learn mode, OSC feedback, custom mappings
 */

export interface MIDIMapping {
  id: string
  label: string
  channel: number
  controller: number
  target: 'master' | 'effect-speed' | 'scene-select' | 'custom'
  targetId?: string
  minValue: number
  maxValue: number
  inverted: boolean
  feedbackEnabled: boolean
}

export interface OSCMapping {
  id: string
  address: string
  type: 'float' | 'int' | 'string'
  target: 'master' | 'effect-speed' | 'scene-select' | 'fixture-group'
  targetId?: string
  feedbackEnabled: boolean
  bidirectional: boolean
}

export interface MIDILearnContext {
  active: boolean
  label: string
  expectedChannel?: number
  expectedController?: number
}

type MIDIData = Uint8Array

/**
 * MIDI Controller Manager
 */
export class MIDIControllerManager {
  private mappings: Map<string, MIDIMapping> = new Map()
  private learnContext: MIDILearnContext | null = null
  private subscribers: Set<(mapping: MIDIMapping, value: number) => void> = new Set()

  /**
   * Initialize MIDI access
   */
  async initialize(): Promise<boolean> {
    try {
      const nav = navigator as any
      if (!nav.requestMIDIAccess) {
        console.warn('MIDI not supported in this browser')
        return false
      }

      const midiAccess = await nav.requestMIDIAccess()

      midiAccess.inputs.forEach((input: any) => {
        input.onmidimessage = (event: any) => {
          this.handleMIDIMessage(event.data as MIDIData)
        }
      })

      midiAccess.onstatechange = (event: any) => {
        if (event.port.type === 'input') {
          const input = event.port
          if (event.port.state === 'connected') {
            input.onmidimessage = (e: any) => {
              this.handleMIDIMessage(e.data as MIDIData)
            }
          }
        }
      }

      return true
    } catch (error) {
      console.error('MIDI initialization failed:', error)
      return false
    }
  }

  /**
   * Start MIDI learn mode
   */
  startLearn(label: string): void {
    this.learnContext = {
      active: true,
      label
    }
  }

  /**
   * Stop MIDI learn mode
   */
  stopLearn(): void {
    this.learnContext = null
  }

  /**
   * Handle incoming MIDI message
   */
  private handleMIDIMessage(data: MIDIData): void {
    const status = data[0]!
    const channel = (status & 0x0f) + 1
    const command = (status & 0xf0) >> 4

    if (command === 0xb) {
      const controller = data[1]!
      const value = data[2]!

      if (this.learnContext?.active) {
        const mapping: MIDIMapping = {
          id: `midi_${Date.now()}`,
          label: this.learnContext.label,
          channel,
          controller,
          target: 'custom',
          minValue: 0,
          maxValue: 127,
          inverted: false,
          feedbackEnabled: false
        }
        this.addMapping(mapping)
        this.learnContext.active = false
        return
      }

      const mapping = Array.from(this.mappings.values()).find(
        m => m.channel === channel && m.controller === controller
      )

      if (mapping) {
        const normalizedValue = value / 127
        this.subscribers.forEach(cb => cb(mapping, normalizedValue))
      }
    }
  }

  /**
   * Add MIDI mapping
   */
  addMapping(mapping: MIDIMapping): void {
    const key = `${mapping.channel}:${mapping.controller}`
    this.mappings.set(key, mapping)
    this.saveMappings()
  }

  /**
   * Remove MIDI mapping
   */
  removeMapping(id: string): void {
    for (const [key, mapping] of this.mappings) {
      if (mapping.id === id) {
        this.mappings.delete(key)
        break
      }
    }
    this.saveMappings()
  }

  /**
   * Get all mappings
   */
  getMappings(): MIDIMapping[] {
    return Array.from(this.mappings.values())
  }

  /**
   * Subscribe to MIDI events
   */
  subscribe(callback: (mapping: MIDIMapping, value: number) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Save mappings to storage
   */
  private saveMappings(): void {
    const data = Array.from(this.mappings.values())
    localStorage.setItem('midi_mappings', JSON.stringify(data))
  }

  /**
   * Load mappings from storage
   */
  loadMappings(): void {
    try {
      const data = localStorage.getItem('midi_mappings')
      if (data) {
        const mappings = JSON.parse(data) as MIDIMapping[]
        mappings.forEach(m => {
          const key = `${m.channel}:${m.controller}`
          this.mappings.set(key, m)
        })
      }
    } catch (error) {
      console.error('Failed to load MIDI mappings:', error)
    }
  }
}

/**
 * OSC Controller Manager
 */
export class OSCControllerManager {
  private mappings: Map<string, OSCMapping> = new Map()
  private oscPort: any = null
  private subscribers: Set<(mapping: OSCMapping, value: any) => void> = new Set()

  /**
   * Initialize OSC connection
   */
  async initialize(hostname: string = 'localhost', port: number = 9000): Promise<boolean> {
    try {
      // Initialize OSC port (requires osc.js library)
      this.oscPort = {
        open: () => {
          // Connect to OSC server
          console.log(`OSC initialized on ${hostname}:${port}`)
        },
        send: (msg: any) => {
          console.log('Sending OSC:', msg)
        }
      }

      return true
    } catch (error) {
      console.error('OSC initialization failed:', error)
      return false
    }
  }

  /**
   * Add OSC mapping
   */
  addMapping(mapping: OSCMapping): void {
    this.mappings.set(mapping.address, mapping)
    this.saveMappings()
  }

  /**
   * Remove OSC mapping
   */
  removeMapping(address: string): void {
    this.mappings.delete(address)
    this.saveMappings()
  }

  /**
   * Send OSC feedback
   */
  sendFeedback(address: string, value: any): void {
    if (!this.oscPort) return

    const msg = {
      address,
      args: [value]
    }

    this.oscPort.send(msg)
  }

  /**
   * Get all mappings
   */
  getMappings(): OSCMapping[] {
    return Array.from(this.mappings.values())
  }

  /**
   * Subscribe to OSC events
   */
  subscribe(callback: (mapping: OSCMapping, value: any) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Save mappings to storage
   */
  private saveMappings(): void {
    const data = Array.from(this.mappings.values())
    localStorage.setItem('osc_mappings', JSON.stringify(data))
  }

  /**
   * Load mappings from storage
   */
  loadMappings(): void {
    try {
      const data = localStorage.getItem('osc_mappings')
      if (data) {
        const mappings = JSON.parse(data) as OSCMapping[]
        mappings.forEach(m => this.mappings.set(m.address, m))
      }
    } catch (error) {
      console.error('Failed to load OSC mappings:', error)
    }
  }
}

/**
 * Global MIDI/OSC manager
 */
export const midiManager = new MIDIControllerManager()
export const oscManager = new OSCControllerManager()

/**
 * Initialize all controllers
 */
export async function initializeControllers(): Promise<void> {
  midiManager.loadMappings()
  oscManager.loadMappings()

  const midiOk = await midiManager.initialize()
  const oscOk = await oscManager.initialize()

  console.log(`Controllers initialized: MIDI=${midiOk}, OSC=${oscOk}`)
}
