// ════════════════════════════════════════════════════════════════════════════
//  OSCEngine — Open Sound Control message handling (mock implementation)
// ════════════════════════════════════════════════════════════════════════════
//  NOTE: Full osc.js integration would be added with: npm install osc-js
// ════════════════════════════════════════════════════════════════════════════

export const OSC_ENDPOINTS = {
  // Scene control
  SCENE_PLAY: '/scene/play/{sceneId}',
  SCENE_STOP: '/scene/stop/{sceneId}',
  SCENE_STOP_ALL: '/scene/stop/all',

  // DMX control
  DMX_CHANNEL: '/dmx/channel/{channel}/{value}',
  DMX_ALL: '/dmx/all',

  // Effect control
  EFFECT_SPEED: '/effect/{effectId}/speed',
  EFFECT_PHASE: '/effect/{effectId}/phase',
  EFFECT_INTENSITY: '/effect/{effectId}/intensity',

  // Playback control
  PLAYBACK_MODE: '/playback/mode/{mode}',
  PLAYBACK_PLAY: '/playback/play',
  PLAYBACK_PAUSE: '/playback/pause',
  PLAYBACK_STOP: '/playback/stop',

  // Release mode
  RELEASE_MODE: '/release/mode/{mode}',

  // Status queries
  STATUS_SCENE: '/status/scene',
  STATUS_DMX: '/status/dmx/all',
  STATUS_PLAYBACK: '/status/playback',
}

export type OSCCallback = (address: string, args: any[]) => void

export class OSCEngine {
  private enabled: boolean = false
  private localPort: number = 9000
  private remoteHost: string = 'localhost'
  private remotePort: number = 9001
  private callbacks: Map<string, OSCCallback[]> = new Map()
  private messageLog: Array<{ time: number; address: string; args: any[] }> = []

  /**
   * Initialize OSC connection
   */
  public initialize(config: {
    localPort: number
    remoteHost: string
    remotePort: number
  }): void {
    this.localPort = config.localPort
    this.remoteHost = config.remoteHost
    this.remotePort = config.remotePort

    // Mock: In real implementation, initialize osc.js here
    console.log(
      `OSC initialized: ${this.remoteHost}:${this.remotePort} (local: ${this.localPort})`
    )
  }

  /**
   * Connect to OSC network
   */
  public async connect(): Promise<boolean> {
    try {
      // Mock: In real implementation, establish connection
      this.enabled = true
      console.log('OSC connected')
      return true
    } catch (error) {
      console.error('OSC connection failed:', error)
      return false
    }
  }

  /**
   * Disconnect from OSC network
   */
  public disconnect(): void {
    this.enabled = false
    this.callbacks.clear()
    console.log('OSC disconnected')
  }

  /**
   * Send OSC message
   */
  public sendMessage(address: string, args: any[] = []): void {
    if (!this.enabled) {
      console.warn('OSC not connected, cannot send')
      return
    }

    // Mock: In real implementation, send via osc.js
    this.messageLog.push({
      time: Date.now(),
      address,
      args,
    })

    console.log(`OSC sent: ${address}`, args)
  }

  /**
   * Register callback for OSC address
   */
  public onMessage(address: string, callback: OSCCallback): void {
    if (!this.callbacks.has(address)) {
      this.callbacks.set(address, [])
    }
    this.callbacks.get(address)!.push(callback)
  }

  /**
   * Handle incoming OSC message
   */
  public handleMessage(address: string, args: any[]): void {
    // Mock: In real implementation, called by osc.js
    this.messageLog.push({
      time: Date.now(),
      address,
      args,
    })

    const callbacks = this.callbacks.get(address) || []
    for (const callback of callbacks) {
      try {
        callback(address, args)
      } catch (error) {
        console.error(`Error handling OSC message ${address}:`, error)
      }
    }
  }

  /**
   * Send scene play command
   */
  public playScene(sceneId: string): void {
    this.sendMessage(`/scene/play/${sceneId}`)
  }

  /**
   * Send scene stop command
   */
  public stopScene(sceneId: string): void {
    this.sendMessage(`/scene/stop/${sceneId}`)
  }

  /**
   * Send DMX value
   */
  public setDMXChannel(channel: number, value: number): void {
    this.sendMessage(`/dmx/channel/${channel}/${value}`)
  }

  /**
   * Send playback mode
   */
  public setPlaybackMode(mode: string): void {
    this.sendMessage(`/playback/mode/${mode}`)
  }

  /**
   * Get message log
   */
  public getMessageLog(): Array<{ time: number; address: string; args: any[] }> {
    return [...this.messageLog]
  }

  /**
   * Clear message log
   */
  public clearMessageLog(): void {
    this.messageLog = []
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.enabled
  }
}

// Export singleton
export const oscEngine = new OSCEngine()
