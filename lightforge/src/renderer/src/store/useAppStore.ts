import { create } from 'zustand'

export type AppTab = 'setup' | 'control' | 'live' | 'settings'

interface AppStore {
  tab: AppTab
  isBlackout: boolean
  outputConnected: boolean
  outputName: string
  projectName: string
  isDirty: boolean

  setTab: (tab: AppTab) => void
  setOutputStatus: (connected: boolean, name: string) => void
  setProjectName: (name: string) => void
  markDirty: () => void
  markClean: () => void
}

export const useAppStore = create<AppStore>((set) => ({
  tab: 'setup',
  isBlackout: false,
  outputConnected: false,
  outputName: 'Preview',
  projectName: 'Neues Projekt',
  isDirty: false,

  setTab: (tab) => set({ tab }),
  setOutputStatus: (connected, name) => set({ outputConnected: connected, outputName: name }),
  setProjectName: (name) => set({ projectName: name }),
  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false })
}))
