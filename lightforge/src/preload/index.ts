import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { FixtureDefinition, DmxOutputInfo, Project } from '../shared/types'

const dmxAPI = {
  setChannel: (universe: number, channel: number, value: number) =>
    ipcRenderer.invoke('dmx:setChannel', universe, channel, value),
  setChannels: (universe: number, start: number, values: number[]) =>
    ipcRenderer.invoke('dmx:setChannels', universe, start, values),
  setMaster: (value: number) =>
    ipcRenderer.invoke('dmx:setMaster', value),
  setBlackout: (active: boolean) =>
    ipcRenderer.invoke('dmx:setBlackout', active),
  getUniverse: (universe: number): Promise<number[]> =>
    ipcRenderer.invoke('dmx:getUniverse', universe),
  getOutputInfo: (): Promise<DmxOutputInfo | null> =>
    ipcRenderer.invoke('dmx:getOutputInfo'),
  usePreview: (): Promise<DmxOutputInfo> =>
    ipcRenderer.invoke('dmx:usePreview'),
  listSerialPorts: (): Promise<Array<{ path: string; displayName: string; manufacturer?: string }>> =>
    ipcRenderer.invoke('dmx:listSerialPorts'),
  connectSerial: (path: string, displayName: string): Promise<{ success: boolean; info?: DmxOutputInfo; error?: string }> =>
    ipcRenderer.invoke('dmx:connectSerial', path, displayName),
  onUniverseUpdate: (cb: (data: { universe: number; values: number[] }) => void) => {
    ipcRenderer.on('dmx:universe-update', (_e, data) => cb(data))
    return () => ipcRenderer.removeAllListeners('dmx:universe-update')
  }
}

const fixtureAPI = {
  importQxf: (): Promise<FixtureDefinition[]> =>
    ipcRenderer.invoke('fixture:importQxf'),
  importFolder: () =>
    ipcRenderer.invoke('fixture:importFolder')
}

const projectAPI = {
  save: (project: Project): Promise<boolean> =>
    ipcRenderer.invoke('project:save', project),
  open: (): Promise<Project | null> =>
    ipcRenderer.invoke('project:open')
}

const windowAPI = {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('dmx', dmxAPI)
    contextBridge.exposeInMainWorld('fixture', fixtureAPI)
    contextBridge.exposeInMainWorld('project', projectAPI)
    contextBridge.exposeInMainWorld('windowAPI', windowAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.dmx = dmxAPI
  // @ts-ignore
  window.fixture = fixtureAPI
  // @ts-ignore
  window.project = projectAPI
  // @ts-ignore
  window.windowAPI = windowAPI
}
