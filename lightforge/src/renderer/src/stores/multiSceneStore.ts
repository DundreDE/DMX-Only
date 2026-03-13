// ════════════════════════════════════════════════════════════════════════════
//  MultiSceneStore — Zustand store for multi-scene playback
// ════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand'
import type { ReleaseMode } from '../utils/sceneGroupManager'

export interface ScenePlaybackState {
  sceneId: string
  isPlaying: boolean
  priority: number
  fadeIn: number
  fadeOut: number
  volume: number // 0-1
  isMuted: boolean
  isSolo: boolean
}

export interface MultiSceneStore {
  // State
  activeScenes: Map<string, ScenePlaybackState>
  releaseMode: ReleaseMode
  defaultPriority: number

  // Queries
  isScenePlaying: (sceneId: string) => boolean
  getActiveScenesArray: () => ScenePlaybackState[]
  getActiveSceneCount: () => number
  getScenePlaybackState: (sceneId: string) => ScenePlaybackState | null
  getSoloScene: () => ScenePlaybackState | null
  getMutedScenes: () => string[]

  // Actions
  playScene: (sceneId: string, priority?: number, fadeIn?: number) => void
  stopScene: (sceneId: string, fadeOut?: number) => void
  stopAll: () => void
  updateScenePlayback: (sceneId: string, updates: Partial<ScenePlaybackState>) => void
  setReleaseMode: (mode: ReleaseMode) => void
  setSoloed: (sceneId: string, solo: boolean) => void
  setMuted: (sceneId: string, muted: boolean) => void
  setVolume: (sceneId: string, volume: number) => void
  setPriority: (sceneId: string, priority: number) => void
  clear: () => void
}

export const useMultiSceneStore = create<MultiSceneStore>((set, get) => ({
  // Initial state
  activeScenes: new Map(),
  releaseMode: 'group',
  defaultPriority: 1,

  // Queries
  isScenePlaying: (sceneId: string) => {
    return get().activeScenes.has(sceneId)
  },

  getActiveScenesArray: () => {
    return Array.from(get().activeScenes.values()).sort(
      (a, b) => b.priority - a.priority
    )
  },

  getActiveSceneCount: () => {
    return get().activeScenes.size
  },

  getScenePlaybackState: (sceneId: string) => {
    return get().activeScenes.get(sceneId) || null
  },

  getSoloScene: () => {
    const scenes = get().getActiveScenesArray()
    return scenes.find(s => s.isSolo) || null
  },

  getMutedScenes: () => {
    return Array.from(get().activeScenes.values())
      .filter(s => s.isMuted)
      .map(s => s.sceneId)
  },

  // Actions
  playScene: (sceneId: string, priority?: number, fadeIn?: number) => {
    set(state => {
      const newMap = new Map(state.activeScenes)
      newMap.set(sceneId, {
        sceneId,
        isPlaying: true,
        priority: priority ?? state.defaultPriority,
        fadeIn: fadeIn ?? 0,
        fadeOut: 0,
        volume: 1,
        isMuted: false,
        isSolo: false,
      })
      return { activeScenes: newMap }
    })
  },

  stopScene: (sceneId: string, fadeOut?: number) => {
    set(state => {
      const newMap = new Map(state.activeScenes)
      const scene = newMap.get(sceneId)
      if (scene) {
        scene.isPlaying = false
        scene.fadeOut = fadeOut ?? 0
        // Remove after fade completes
        setTimeout(() => {
          set(s => {
            const map = new Map(s.activeScenes)
            map.delete(sceneId)
            return { activeScenes: map }
          })
        }, (fadeOut ?? 0) + 50)
      }
      return { activeScenes: newMap }
    })
  },

  stopAll: () => {
    set({ activeScenes: new Map() })
  },

  updateScenePlayback: (sceneId: string, updates: Partial<ScenePlaybackState>) => {
    set(state => {
      const newMap = new Map(state.activeScenes)
      const scene = newMap.get(sceneId)
      if (scene) {
        Object.assign(scene, updates)
      }
      return { activeScenes: newMap }
    })
  },

  setReleaseMode: (mode: ReleaseMode) => {
    set({ releaseMode: mode })
  },

  setSoloed: (sceneId: string, solo: boolean) => {
    set(state => {
      const newMap = new Map(state.activeScenes)
      const scene = newMap.get(sceneId)
      if (scene) {
        if (solo) {
          // Unsolo others
          for (const s of newMap.values()) {
            if (s.sceneId !== sceneId) {
              s.isSolo = false
            }
          }
        }
        scene.isSolo = solo
      }
      return { activeScenes: newMap }
    })
  },

  setMuted: (sceneId: string, muted: boolean) => {
    set(state => {
      const newMap = new Map(state.activeScenes)
      const scene = newMap.get(sceneId)
      if (scene) {
        scene.isMuted = muted
      }
      return { activeScenes: newMap }
    })
  },

  setVolume: (sceneId: string, volume: number) => {
    set(state => {
      const newMap = new Map(state.activeScenes)
      const scene = newMap.get(sceneId)
      if (scene) {
        scene.volume = Math.max(0, Math.min(1, volume))
      }
      return { activeScenes: newMap }
    })
  },

  setPriority: (sceneId: string, priority: number) => {
    set(state => {
      const newMap = new Map(state.activeScenes)
      const scene = newMap.get(sceneId)
      if (scene) {
        scene.priority = priority
      }
      return { activeScenes: newMap }
    })
  },

  clear: () => {
    set({ activeScenes: new Map() })
  },
}))
