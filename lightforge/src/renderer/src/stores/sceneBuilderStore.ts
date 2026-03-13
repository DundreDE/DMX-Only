import { create } from 'zustand'

interface SceneBuilderState {
  // Scene
  currentSceneId: string
  sceneName: string
  duration: number
  fadeIn: number
  fadeOut: number

  // Effects
  activeEffects: Array<{
    id: string
    type: string
    config: Record<string, any>
  }>

  // Cues
  activeCues: Array<{
    id: string
    name: string
    duration: number
  }>
  selectedCueId: string

  // Channel Config
  channelGroups: Array<{
    id: string
    name: string
    channels: Array<{
      id: string
      name: string
      min: number
      max: number
    }>
  }>

  // UI
  previewMode: 'live' | 'step' | 'timeline'
  selectedFixtures: string[]
  showPreview: boolean

  // Actions
  setSceneName: (name: string) => void
  setDuration: (duration: number) => void
  addEffect: (effect: any) => void
  removeEffect: (effectId: string) => void
  addCue: (cue: any) => void
  selectCue: (cueId: string) => void
  setPreviewMode: (mode: 'live' | 'step' | 'timeline') => void
  selectFixtures: (fixtureIds: string[]) => void
  resetScene: () => void
}

const initialState = {
  currentSceneId: `scene-${Date.now()}`,
  sceneName: 'New Scene',
  duration: 8000,
  fadeIn: 500,
  fadeOut: 500,
  activeEffects: [],
  activeCues: [],
  selectedCueId: '',
  channelGroups: [],
  previewMode: 'live' as const,
  selectedFixtures: [],
  showPreview: true,
}

export const useSceneBuilderStore = create<SceneBuilderState>((set) => ({
  ...initialState,

  setSceneName: (name) => set({ sceneName: name }),
  setDuration: (duration) => set({ duration }),

  addEffect: (effect) =>
    set((state) => ({
      activeEffects: [...state.activeEffects, effect],
    })),

  removeEffect: (effectId) =>
    set((state) => ({
      activeEffects: state.activeEffects.filter((e) => e.id !== effectId),
    })),

  addCue: (cue) =>
    set((state) => ({
      activeCues: [...state.activeCues, cue],
    })),

  selectCue: (cueId) => set({ selectedCueId: cueId }),

  setPreviewMode: (mode) => set({ previewMode: mode }),

  selectFixtures: (fixtureIds) => set({ selectedFixtures: fixtureIds }),

  resetScene: () => set(initialState),
}))
