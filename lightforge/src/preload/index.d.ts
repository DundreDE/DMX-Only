import type { FixtureDefinition, DmxOutputInfo, Project } from '../shared/types'
import type { FolderScanResult } from '../main/fixtures/QxfParser'

interface DmxAPI {
  setChannel(universe: number, channel: number, value: number): Promise<void>
  setChannels(universe: number, start: number, values: number[]): Promise<void>
  setMaster(value: number): Promise<void>
  setBlackout(active: boolean): Promise<void>
  getUniverse(universe: number): Promise<number[]>
  getOutputInfo(): Promise<DmxOutputInfo | null>
  usePreview(): Promise<DmxOutputInfo>
  listSerialPorts(): Promise<Array<{ path: string; displayName: string; manufacturer?: string }>>
  connectSerial(path: string, displayName: string): Promise<{ success: boolean; info?: DmxOutputInfo; error?: string }>
  onUniverseUpdate(cb: (data: { universe: number; values: number[] }) => void): () => void
}

interface FixtureAPI {
  importQxf(): Promise<FixtureDefinition[]>
  importFolder(): Promise<FolderScanResult | null>
}

interface ProjectAPI {
  save(project: Project): Promise<boolean>
  open(): Promise<Project | null>
}

interface WindowAPI {
  minimize(): void
  maximize(): void
  close(): void
}

declare global {
  interface Window {
    electron: import('@electron-toolkit/preload').ElectronAPI
    dmx: DmxAPI
    fixture: FixtureAPI
    project: ProjectAPI
    windowAPI: WindowAPI
  }
}
