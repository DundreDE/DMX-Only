import type { DmxOutputInfo } from '../../shared/types'

export interface IDmxOutput {
  readonly info: DmxOutputInfo
  start(): Promise<void>
  stop(): Promise<void>
  send(universe: number, data: Uint8Array): Promise<void>
}
