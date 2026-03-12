import { create } from 'zustand'
import { randomUUID } from '../utils/uuid'
import type { FixtureDefinition, PatchedFixture, Scene, Chaser, Bank } from '../../../shared/types'

interface FixtureStore {
  // Library (all known fixture definitions)
  library: FixtureDefinition[]
  addToLibrary: (fixtures: FixtureDefinition[]) => void
  clearLibrary: () => void

  // Patch (fixtures placed in universes)
  patch: PatchedFixture[]
  patchFixture: (def: FixtureDefinition, modeIndex: number, universe: number, startAddress: number, name: string) => void
  unpatchFixture: (id: string) => void
  updatePatched: (id: string, changes: Partial<PatchedFixture>) => void

  // Banks
  banks: Bank[]
  addBank: (name: string, color: string) => string
  updateBank: (id: string, changes: Partial<Bank>) => void
  deleteBank: (id: string) => void

  // Scenes
  scenes: Scene[]
  addScene: (scene: Omit<Scene, 'id'>) => string
  updateScene: (id: string, changes: Partial<Scene>) => void
  deleteScene: (id: string) => void

  // Chasers
  chasers: Chaser[]
  addChaser: (chaser: Omit<Chaser, 'id'>) => string
  updateChaser: (id: string, changes: Partial<Chaser>) => void
  deleteChaser: (id: string) => void

  // Derived helpers
  getManufacturers: () => string[]
  getByManufacturer: (manufacturer: string) => FixtureDefinition[]
  getPatchedByUniverse: (universe: number) => PatchedFixture[]
}

export const useFixtureStore = create<FixtureStore>((set, get) => ({
  library: [],
  patch: [],
  banks: [],
  scenes: [],
  chasers: [],

  addToLibrary: (fixtures) =>
    set((s) => {
      // Deduplicate by manufacturer+model
      const existing = new Set(s.library.map((f) => `${f.manufacturer}::${f.model}`))
      const newOnes = fixtures.filter((f) => !existing.has(`${f.manufacturer}::${f.model}`))
      return { library: [...s.library, ...newOnes] }
    }),

  clearLibrary: () => set({ library: [] }),

  patchFixture: (def, modeIndex, universe, startAddress, name) => {
    const mode = def.modes[modeIndex]
    if (!mode) return
    set((s) => ({
      patch: [
        ...s.patch,
        {
          id: randomUUID(),
          definitionId: def.id,
          name,
          universe,
          startAddress,
          modeIndex,
          channelCount: mode.channels.length
        }
      ]
    }))
  },

  unpatchFixture: (id) =>
    set((s) => ({ patch: s.patch.filter((p) => p.id !== id) })),

  updatePatched: (id, changes) =>
    set((s) => ({ patch: s.patch.map((p) => (p.id === id ? { ...p, ...changes } : p)) })),

  addBank: (name, color) => {
    const id = randomUUID()
    set((s) => ({ banks: [...s.banks, { id, name, color }] }))
    return id
  },

  updateBank: (id, changes) =>
    set((s) => ({ banks: s.banks.map((b) => (b.id === id ? { ...b, ...changes } : b)) })),

  deleteBank: (id) =>
    set((s) => ({
      banks: s.banks.filter((b) => b.id !== id),
      // detach scenes from deleted bank
      scenes: s.scenes.map((sc) => sc.bankId === id ? { ...sc, bankId: undefined } : sc)
    })),

  addScene: (scene) => {
    const id = randomUUID()
    set((s) => ({ scenes: [...s.scenes, { ...scene, id }] }))
    return id
  },

  updateScene: (id, changes) =>
    set((s) => ({ scenes: s.scenes.map((sc) => (sc.id === id ? { ...sc, ...changes } : sc)) })),

  deleteScene: (id) =>
    set((s) => ({ scenes: s.scenes.filter((sc) => sc.id !== id) })),

  addChaser: (chaser) => {
    const id = randomUUID()
    set((s) => ({ chasers: [...s.chasers, { ...chaser, id }] }))
    return id
  },

  updateChaser: (id, changes) =>
    set((s) => ({ chasers: s.chasers.map((ch) => (ch.id === id ? { ...ch, ...changes } : ch)) })),

  deleteChaser: (id) =>
    set((s) => ({ chasers: s.chasers.filter((ch) => ch.id !== id) })),

  getManufacturers: () => {
    const set_ = new Set(get().library.map((f) => f.manufacturer))
    return Array.from(set_).sort()
  },

  getByManufacturer: (manufacturer) =>
    get().library.filter((f) => f.manufacturer === manufacturer).sort((a, b) => a.model.localeCompare(b.model)),

  getPatchedByUniverse: (universe) =>
    get().patch.filter((p) => p.universe === universe)
}))
