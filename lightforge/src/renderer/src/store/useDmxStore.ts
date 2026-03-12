import { create } from 'zustand'

const UNIVERSE_SIZE = 512

interface DmxStore {
  // Local mirror of the DMX universe values (updated via IPC push)
  universes: Record<number, number[]>
  master: number
  blackout: boolean

  setUniverseValues: (universe: number, values: number[]) => void
  setChannel: (universe: number, channel: number, value: number) => void
  setMaster: (value: number) => void
  setBlackout: (active: boolean) => void
  getChannel: (universe: number, channel: number) => number
}

export const useDmxStore = create<DmxStore>((set, get) => ({
  universes: { 1: new Array(UNIVERSE_SIZE).fill(0) },
  master: 255,
  blackout: false,

  setUniverseValues: (universe, values) =>
    set((s) => ({ universes: { ...s.universes, [universe]: values } })),

  setChannel: (universe, channel, value) => {
    const current = get().universes[universe] ?? new Array(UNIVERSE_SIZE).fill(0)
    const updated = [...current]
    updated[channel - 1] = Math.max(0, Math.min(255, value))
    set((s) => ({ universes: { ...s.universes, [universe]: updated } }))
    // Send to main process
    window.dmx.setChannel(universe, channel, value)
  },

  setMaster: (value) => {
    set({ master: value })
    window.dmx.setMaster(value)
  },

  setBlackout: (active) => {
    set({ blackout: active })
    window.dmx.setBlackout(active)
  },

  getChannel: (universe, channel) => {
    const uni = get().universes[universe]
    if (!uni) return 0
    return uni[channel - 1] ?? 0
  }
}))
