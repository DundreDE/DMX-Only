import { SerialPort } from 'serialport'
import type { IDmxOutput } from './IDmxOutput'
import type { DmxOutputInfo } from '../../shared/types'

const DMX_BAUD = 250000
const BREAK_MS = 1  // ≥88µs; 1ms is the minimum reliable Node.js timer resolution
const MAB_MS = 1    // ≥8µs mark-after-break

export class SerialDmxOutput implements IDmxOutput {
  private port: SerialPort | null = null
  private _info: DmxOutputInfo
  private busy = false
  private portPath: string

  constructor(portPath: string, displayName?: string) {
    this.portPath = portPath
    this._info = {
      id: `serial:${portPath}`,
      name: displayName ?? portPath,
      type: 'enttec-open',
      connected: false
    }
  }

  get info(): DmxOutputInfo {
    return this._info
  }

  async start(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.port = new SerialPort({
        path: this.portPath,
        baudRate: DMX_BAUD,
        dataBits: 8,
        stopBits: 2,
        parity: 'none',
        autoOpen: false
      })
      this.port.open((err) => {
        if (err) return reject(new Error(`Port ${this.portPath} konnte nicht geöffnet werden: ${err.message}`))
        this._info = { ...this._info, connected: true }
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    if (!this.port) return
    await new Promise<void>((resolve) => {
      this.port!.close(() => resolve())
    })
    this._info = { ...this._info, connected: false }
    this.port = null
  }

  async send(_universe: number, data: Uint8Array): Promise<void> {
    if (!this.port?.isOpen || this.busy) return
    this.busy = true
    try {
      await this._sendBreak()
      const frame = Buffer.allocUnsafe(513)
      frame[0] = 0x00 // DMX start code
      for (let i = 0; i < 512; i++) frame[i + 1] = data[i] ?? 0
      await new Promise<void>((resolve, reject) => {
        this.port!.write(frame, (err) => (err ? reject(err) : resolve()))
      })
    } catch {
      // Swallow frame errors to keep the engine running
    } finally {
      this.busy = false
    }
  }

  private _sendBreak(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.port!.set({ brk: true }, (err) => {
        if (err) return resolve() // driver doesn't support break; skip it
        setTimeout(() => {
          this.port!.set({ brk: false }, (err2) => {
            if (err2) return resolve()
            setTimeout(resolve, MAB_MS)
          })
        }, BREAK_MS)
      })
    })
  }
}

export interface SerialPortEntry {
  path: string
  displayName: string
  manufacturer?: string
}

export async function listSerialPorts(): Promise<SerialPortEntry[]> {
  const ports = await SerialPort.list()
  return ports.map((p) => {
    const friendly = (p as Record<string, string>).friendlyName
    const displayName = friendly ?? p.manufacturer
      ? `${friendly ?? p.manufacturer} (${p.path})`
      : p.path
    return { path: p.path, displayName, manufacturer: p.manufacturer }
  })
}
