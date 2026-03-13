/**
 * MIDIOSCIntegration.ts
 * MIDI and OSC Controller Integration for Daslight 5
 * Connects hardware controllers and networked devices
 */

export interface MIDIDevice {
  id: string
  name: string
  inputs: number
  outputs: number
}

export interface MIDIMessage {
  type: 'noteOn' | 'noteOff' | 'controlChange' | 'pitchBend' | 'programChange'
  channel: number
  note?: number
  velocity?: number
  controller?: number
  value: number
  timestamp: number
}

export interface OSCAddress {
  path: string
  typeTag: string
  values: (number | string | boolean)[]
}

export interface ControllerMapping {
  id: string
  name: string
  source: 'midi' | 'osc'
  sourceId: string
  targetControl: string  // e.g., 'playback-speed', 'scene-select', 'dimmer'
  min: number
  max: number
  invert?: boolean
  enabled: boolean
}

/**
 * MIDI/OSC Integration - hardware and network control
 */
export class MIDIOSCIntegration {
  private midiDevices: Map<string, MIDIDevice> = new Map()
  private midiInputs: Map<string, any> = new Map()
  private oscReceivers: Map<string, any> = new Map()
  private mappings: Map<string, ControllerMapping> = new Map()
  private messageHandlers: Map<string, (msg: MIDIMessage | OSCAddress) => void> =
    new Map()

  constructor() {
    this.initializeMIDI()
    this.initializeOSC()
  }

  /**
   * Initialize MIDI access
   */
  private initializeMIDI(): void {
    if (!navigator.requestMIDIAccess) {
      console.warn('Web MIDI API not available')
      return
    }

    navigator
      .requestMIDIAccess?.()
      .then((midiAccess) => {
        const inputs = midiAccess.inputs.values()
        for (let input of inputs) {
          this.attachMIDIInput(input)
        }

        const outputs = midiAccess.outputs.values()
        for (let output of outputs) {
          this.registerMIDIDevice(output.id, output.name, 1, 0)
        }
      })
      .catch(() => {
        console.warn('MIDI access denied')
      })
  }

  /**
   * Attach MIDI input handler
   */
  private attachMIDIInput(input: any): void {
    this.registerMIDIDevice(input.id, input.name, 1, 0)
    this.midiInputs.set(input.id, input)

    input.onmidimessage = (event: any) => {
      const [status, data1, data2] = event.data
      const message = this.parseMIDIMessage(status, data1, data2, event.timeStamp)
      this.handleMIDIMessage(message)
    }
  }

  /**
   * Register MIDI device
   */
  private registerMIDIDevice(
    id: string,
    name: string,
    inputs: number,
    outputs: number
  ): void {
    this.midiDevices.set(id, {
      id,
      name,
      inputs,
      outputs,
    })
  }

  /**
   * Parse MIDI status byte
   */
  private parseMIDIMessage(
    status: number,
    data1: number,
    data2: number,
    timestamp: number
  ): MIDIMessage {
    const statusCommand = status & 0xf0
    const channel = (status & 0x0f) + 1

    let type: MIDIMessage['type']
    let value = data2

    switch (statusCommand) {
      case 0x90:
        type = data2 > 0 ? 'noteOn' : 'noteOff'
        break
      case 0x80:
        type = 'noteOff'
        break
      case 0xb0:
        type = 'controlChange'
        break
      case 0xe0:
        type = 'pitchBend'
        value = ((data2 << 7) | data1) - 8192
        break
      case 0xc0:
        type = 'programChange'
        value = data1
        break
      default:
        type = 'controlChange'
    }

    return {
      type,
      channel,
      note: data1,
      velocity: data2,
      controller: data1,
      value,
      timestamp,
    }
  }

  /**
   * Handle incoming MIDI message
   */
  private handleMIDIMessage(message: MIDIMessage): void {
    for (const mapping of this.mappings.values()) {
      if (mapping.source === 'midi' && mapping.enabled) {
        const handler = this.messageHandlers.get(mapping.id)
        if (handler) {
          handler(message)
        }
      }
    }
  }

  /**
   * Initialize OSC receiver
   */
  private initializeOSC(): void {
    if (typeof WebSocket === 'undefined') {
      console.warn('WebSocket not available for OSC')
      return
    }
  }

  /**
   * Send MIDI message
   */
  public sendMIDIMessage(
    deviceId: string,
    type: MIDIMessage['type'],
    channel: number,
    data1: number,
    data2: number
  ): void {
    const output = this.midiInputs.get(deviceId)
    if (!output?.send) return

    let status = channel - 1

    switch (type) {
      case 'noteOn':
        status |= 0x90
        break
      case 'noteOff':
        status |= 0x80
        break
      case 'controlChange':
        status |= 0xb0
        break
      case 'programChange':
        status |= 0xc0
        data2 = 0
        break
      case 'pitchBend':
        status |= 0xe0
        break
    }

    output.send([status, data1, data2], performance.now())
  }

  /**
   * Create controller mapping
   */
  public createMapping(
    name: string,
    source: 'midi' | 'osc',
    sourceId: string,
    targetControl: string,
    min: number = 0,
    max: number = 127
  ): ControllerMapping {
    const id = `mapping-${Date.now()}`
    const mapping: ControllerMapping = {
      id,
      name,
      source,
      sourceId,
      targetControl,
      min,
      max,
      enabled: true,
    }

    this.mappings.set(id, mapping)
    return mapping
  }

  /**
   * Update mapping handler
   */
  public setMappingHandler(
    mappingId: string,
    handler: (msg: MIDIMessage | OSCAddress) => void
  ): void {
    this.messageHandlers.set(mappingId, handler)
  }

  /**
   * Get MIDI devices
   */
  public getMIDIDevices(): MIDIDevice[] {
    return Array.from(this.midiDevices.values())
  }

  /**
   * Get mappings
   */
  public getMappings(): ControllerMapping[] {
    return Array.from(this.mappings.values())
  }

  /**
   * Enable/disable mapping
   */
  public toggleMapping(mappingId: string, enabled: boolean): void {
    const mapping = this.mappings.get(mappingId)
    if (mapping) {
      mapping.enabled = enabled
    }
  }

  /**
   * Remove mapping
   */
  public removeMapping(mappingId: string): boolean {
    this.messageHandlers.delete(mappingId)
    return this.mappings.delete(mappingId)
  }

  /**
   * Export mappings
   */
  public exportMappings(): string {
    return JSON.stringify(Array.from(this.mappings.values()), null, 2)
  }

  /**
   * Import mappings
   */
  public importMappings(json: string): boolean {
    try {
      const mappings = JSON.parse(json)
      for (const mapping of mappings) {
        this.mappings.set(mapping.id, mapping)
      }
      return true
    } catch {
      return false
    }
  }

  /**
   * Get statistics
   */
  public getStats(): {
    midiDevices: number
    mappings: number
    activeMappings: number
  } {
    let activeMappings = 0
    for (const mapping of this.mappings.values()) {
      if (mapping.enabled) activeMappings++
    }

    return {
      midiDevices: this.midiDevices.size,
      mappings: this.mappings.size,
      activeMappings,
    }
  }
}

export const globalMIDIOSCIntegration = new MIDIOSCIntegration()
