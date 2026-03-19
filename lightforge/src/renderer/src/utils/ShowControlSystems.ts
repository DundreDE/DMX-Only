/**
 * BlindModeSystem - Blind Mode Operation
 * 
 * Professional feature: Edit/program without affecting live output
 * - Create/edit cues while other cues play
 * - Two separate DMX worlds: Live and Blind
 * - Swap instantly between them
 */

export interface BlindState {
  isEnabled: boolean
  blindDmx: Map<number, Uint8Array>      // Blind workspace DMX
  liveDmx: Map<number, Uint8Array>       // Current live output
  lastSwapTime: number
}

export class BlindModeSystem {
  private state: BlindState = {
    isEnabled: false,
    blindDmx: new Map(),
    liveDmx: new Map(),
    lastSwapTime: 0
  }

  private subscribers: ((state: BlindState) => void)[] = []

  /**
   * Enable blind mode
   */
  enableBlindMode(): void {
    if (this.state.isEnabled) return

    this.state.isEnabled = true
    // Copy current live DMX to blind
    this.state.blindDmx = new Map(this.state.liveDmx)
    this.publish()
  }

  /**
   * Disable blind mode
   */
  disableBlindMode(): void {
    this.state.isEnabled = false
    this.publish()
  }

  /**
   * Swap blind and live (go blind)
   */
  swapToBlind(): void {
    if (!this.state.isEnabled) return

    const temp = this.state.liveDmx
    this.state.liveDmx = this.state.blindDmx
    this.state.blindDmx = temp

    this.state.lastSwapTime = Date.now()
    this.publish()
  }

  /**
   * Return to live (exit blind)
   */
  swapToLive(): void {
    if (!this.state.isEnabled) return
    this.swapToBlind()  // Swap back
  }

  /**
   * Get appropriate DMX output (live or blind depending on mode)
   */
  getActiveDmx(): Map<number, Uint8Array> {
    return this.state.isEnabled && this.state.isEnabled ? this.state.blindDmx : this.state.liveDmx
  }

  /**
   * Set DMX in blind workspace
   */
  setBlindDmx(universeIndex: number, dmx: Uint8Array): void {
    if (!this.state.isEnabled) {
      this.state.liveDmx.set(universeIndex, dmx)
    } else {
      this.state.blindDmx.set(universeIndex, dmx)
    }
    this.publish()
  }

  /**
   * Get state
   */
  getState(): BlindState {
    return { ...this.state }
  }

  /**
   * Subscribe to changes
   */
  subscribe(callback: (state: BlindState) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) this.subscribers.splice(index, 1)
    }
  }

  private publish(): void {
    this.subscribers.forEach(sub => sub(this.state))
  }
}

// Global singleton
export const blindModeSystem = new BlindModeSystem()

/**
 * TrackingSheetSystem - Live DMX Value Display
 * 
 * Show live DMX values for all universes/channels
 * - History tracking (last N values)
 * - Change detection
 * - Peak hold
 */

export interface DmxChannel {
  value: number
  changed: boolean
  changeTime: number
  history: number[]
  peak: number
  label?: string
}

export interface TrackingSheet {
  universeIndex: number
  channels: Map<number, DmxChannel>
  updateTime: number
}

export class TrackingSheetSystem {
  private sheets = new Map<number, TrackingSheet>()
  private historySize = 100
  private subscribers: ((sheet: TrackingSheet) => void)[] = []

  /**
   * Update channel value
   */
  updateValue(universeIndex: number, channelNum: number, value: number): void {
    let sheet = this.sheets.get(universeIndex)
    if (!sheet) {
      sheet = {
        universeIndex,
        channels: new Map(),
        updateTime: Date.now()
      }
      this.sheets.set(universeIndex, sheet)
    }

    let channel = sheet.channels.get(channelNum)
    if (!channel) {
      channel = {
        value: 0,
        changed: false,
        changeTime: 0,
        history: [],
        peak: 0
      }
      sheet.channels.set(channelNum, channel)
    }

    const changed = channel.value !== value
    channel.value = value
    channel.changed = changed
    if (changed) channel.changeTime = Date.now()

    channel.history.push(value)
    if (channel.history.length > this.historySize) {
      channel.history.shift()
    }

    channel.peak = Math.max(...channel.history)
    sheet.updateTime = Date.now()

    this.publish(sheet)
  }

  /**
   * Get tracking sheet for universe
   */
  getSheet(universeIndex: number): TrackingSheet | undefined {
    return this.sheets.get(universeIndex)
  }

  /**
   * Get value history for channel
   */
  getHistory(universeIndex: number, channelNum: number): number[] {
    const sheet = this.sheets.get(universeIndex)
    return sheet?.channels.get(channelNum)?.history || []
  }

  /**
   * Clear all tracking data
   */
  clearAll(): void {
    this.sheets.clear()
  }

  /**
   * Subscribe to updates
   */
  subscribe(callback: (sheet: TrackingSheet) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) this.subscribers.splice(index, 1)
    }
  }

  private publish(sheet: TrackingSheet): void {
    this.subscribers.forEach(sub => sub(sheet))
  }
}

// Global singleton
export const trackingSheetSystem = new TrackingSheetSystem()

/**
 * MidiShowControlSystem - External Show Triggering
 * 
 * MIDI Show Control (MSC) implementation
 * - Go button via MIDI
 * - Cue selection via MIDI
 * - Master fader via MIDI CC
 */

export interface MidiShowControlMapping {
  goButtonCC: number          // MIDI CC for Go
  masterCC: number            // MIDI CC for Master Dimmer
  blackoutCC: number          // MIDI CC for Blackout
  cueSelectCC: number         // MIDI CC for cue selection
  channel: number             // MIDI channel (1-16)
}

export class MidiShowControlSystem {
  private mapping: MidiShowControlMapping = {
    goButtonCC: 64,
    masterCC: 7,
    blackoutCC: 120,
    cueSelectCC: 50,
    channel: 1
  }

  private subscribers: ((command: MidiCommand) => void)[] = []

  /**
   * Handle incoming MIDI message
   */
  handleMidiMessage(cc: number, value: number, midiChannel: number): MidiCommand | null {
    if (midiChannel !== this.mapping.channel) return null

    let command: MidiCommand | null = null

    if (cc === this.mapping.goButtonCC) {
      command = {
        type: 'go',
        value: value > 64 ? 1 : 0
      }
    } else if (cc === this.mapping.masterCC) {
      command = {
        type: 'master',
        value: Math.round((value / 127) * 255)
      }
    } else if (cc === this.mapping.blackoutCC) {
      command = {
        type: 'blackout',
        value: value > 64 ? 1 : 0
      }
    } else if (cc === this.mapping.cueSelectCC) {
      // Map 0-127 to cue numbers (0-127)
      command = {
        type: 'cue-select',
        value: Math.round((value / 127) * 999) + 1
      }
    }

    if (command) {
      this.publish(command)
    }

    return command
  }

  /**
   * Set MIDI mapping
   */
  setMapping(mapping: Partial<MidiShowControlMapping>): void {
    this.mapping = { ...this.mapping, ...mapping }
  }

  /**
   * Get mapping
   */
  getMapping(): MidiShowControlMapping {
    return { ...this.mapping }
  }

  /**
   * Subscribe to commands
   */
  subscribe(callback: (command: MidiCommand) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) this.subscribers.splice(index, 1)
    }
  }

  private publish(command: MidiCommand): void {
    this.subscribers.forEach(sub => sub(command))
  }
}

export interface MidiCommand {
  type: 'go' | 'master' | 'blackout' | 'cue-select'
  value: number
}

// Global singleton
export const midiShowControlSystem = new MidiShowControlSystem()
