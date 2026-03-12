import type { DmxOutputInfo } from '../../shared/types'
import type { IDmxOutput } from './IDmxOutput'

export class PreviewOutput implements IDmxOutput {
  readonly info: DmxOutputInfo = {
    id: 'preview',
    name: 'Preview (kein Hardware)',
    type: 'preview',
    connected: true
  }

  async start(): Promise<void> {
    // Nothing to initialize for preview
  }

  async stop(): Promise<void> {
    // Nothing to clean up
  }

  async send(_universe: number, _data: Uint8Array): Promise<void> {
    // In preview mode data is sent via IPC to the renderer for display
  }
}
