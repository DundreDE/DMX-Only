import { BrowserWindow } from 'electron'
import type { IDmxOutput } from './IDmxOutput'
import type { DmxOutputInfo } from '../../shared/types'
import { PreviewOutput } from './PreviewOutput'

const DMX_UNIVERSE_SIZE = 512
const REFRESH_RATE_MS = 1000 / 40 // 40 Hz

export class DmxEngine {
  private universes: Map<number, Uint8Array> = new Map()
  private master = 255
  private blackout = false
  private output: IDmxOutput | null = null
  private refreshTimer: ReturnType<typeof setInterval> | null = null
  private mainWindow: BrowserWindow | null = null

  constructor() {
    this.universes.set(1, new Uint8Array(DMX_UNIVERSE_SIZE))
  }

  setWindow(win: BrowserWindow): void {
    this.mainWindow = win
  }

  getUniverseBuffer(universe: number): Uint8Array {
    if (!this.universes.has(universe)) {
      this.universes.set(universe, new Uint8Array(DMX_UNIVERSE_SIZE))
    }
    return this.universes.get(universe)!
  }

  setChannel(universe: number, channel: number, value: number): void {
    if (channel < 1 || channel > 512) return
    const buf = this.getUniverseBuffer(universe)
    buf[channel - 1] = Math.max(0, Math.min(255, value))
  }

  setChannels(universe: number, startChannel: number, values: number[]): void {
    for (let i = 0; i < values.length; i++) {
      this.setChannel(universe, startChannel + i, values[i])
    }
  }

  setMaster(value: number): void {
    this.master = Math.max(0, Math.min(255, value))
  }

  setBlackout(active: boolean): void {
    this.blackout = active
  }

  getChannel(universe: number, channel: number): number {
    const buf = this.universes.get(universe)
    if (!buf) return 0
    return buf[channel - 1] ?? 0
  }

  getUniverseSnapshot(universe: number): number[] {
    return Array.from(this.getUniverseBuffer(universe))
  }

  async setOutput(output: IDmxOutput | null): Promise<void> {
    if (this.output) {
      await this.output.stop()
    }
    this.output = output
    if (output) {
      await output.start()
    }
  }

  async usePreview(): Promise<void> {
    await this.setOutput(new PreviewOutput())
  }

  getOutputInfo(): DmxOutputInfo | null {
    return this.output?.info ?? null
  }

  startRefresh(): void {
    if (this.refreshTimer) return
    this.refreshTimer = setInterval(() => this.tick(), REFRESH_RATE_MS)
  }

  stopRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  private async tick(): Promise<void> {
    if (!this.output) return

    for (const [universe, buf] of this.universes) {
      const out = new Uint8Array(DMX_UNIVERSE_SIZE)
      if (!this.blackout) {
        const masterFactor = this.master / 255
        for (let i = 0; i < DMX_UNIVERSE_SIZE; i++) {
          out[i] = Math.round(buf[i] * masterFactor)
        }
      }
      await this.output.send(universe, out)

      // Push snapshot to renderer for preview display
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('dmx:universe-update', {
          universe,
          values: Array.from(out)
        })
      }
    }
  }
}

export const dmxEngine = new DmxEngine()
