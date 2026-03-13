// ════════════════════════════════════════════════════════════════════════════
//  UndoRedoStore — Zustand store for undo/redo history tracking
// ════════════════════════════════════════════════════════════════════════════

import { create } from 'zustand'

export type ActionType =
  | 'scene-create'
  | 'scene-delete'
  | 'scene-rename'
  | 'scene-edit'
  | 'effect-add'
  | 'effect-remove'
  | 'effect-edit'
  | 'dmx-channel-change'
  | 'playback-mode-change'
  | 'release-mode-change'

export interface UndoRedoAction {
  id: string
  type: ActionType
  timestamp: number
  description: string
  previousState: Record<string, any>
  newState: Record<string, any>
  metadata?: Record<string, any>
}

export interface UndoRedoStore {
  // State
  history: UndoRedoAction[]
  currentIndex: number
  maxHistorySize: number
  isReplaying: boolean

  // Queries
  canUndo: () => boolean
  canRedo: () => boolean
  getHistory: () => UndoRedoAction[]
  getCurrentAction: () => UndoRedoAction | null
  getActionCount: () => number

  // Actions
  recordAction: (action: Omit<UndoRedoAction, 'id' | 'timestamp'>) => void
  undo: () => UndoRedoAction | null
  redo: () => UndoRedoAction | null
  clearHistory: () => void
  clearRedoStack: () => void
  jumpToAction: (index: number) => UndoRedoAction | null
  setMaxHistorySize: (size: number) => void
}

export const useUndoRedoStore = create<UndoRedoStore>((set, get) => ({
  // Initial state
  history: [],
  currentIndex: -1,
  maxHistorySize: 100,
  isReplaying: false,

  // Queries
  canUndo: () => get().currentIndex > 0,
  canRedo: () => get().currentIndex < get().history.length - 1,
  getHistory: () => get().history,
  getCurrentAction: () => {
    const { history, currentIndex } = get()
    return currentIndex >= 0 && currentIndex < history.length ? history[currentIndex] : null
  },
  getActionCount: () => get().history.length,

  // Actions
  recordAction: (action) => {
    set(state => {
      // Remove any redo stack (discard future when new action is recorded)
      const truncatedHistory = state.history.slice(0, state.currentIndex + 1)

      // Create new action with ID and timestamp
      const newAction: UndoRedoAction = {
        ...action,
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      }

      // Add new action
      const updatedHistory = [...truncatedHistory, newAction]

      // Limit history size
      if (updatedHistory.length > state.maxHistorySize) {
        updatedHistory.shift()
      }

      return {
        history: updatedHistory,
        currentIndex: updatedHistory.length - 1,
      }
    })
  },

  undo: () => {
    const state = get()
    if (state.currentIndex <= 0) return null

    const targetIndex = state.currentIndex - 1
    set({
      currentIndex: targetIndex,
      isReplaying: true,
    })

    setTimeout(() => {
      set({ isReplaying: false })
    }, 0)

    return state.history[targetIndex]
  },

  redo: () => {
    const state = get()
    if (state.currentIndex >= state.history.length - 1) return null

    const targetIndex = state.currentIndex + 1
    set({
      currentIndex: targetIndex,
      isReplaying: true,
    })

    setTimeout(() => {
      set({ isReplaying: false })
    }, 0)

    return state.history[targetIndex]
  },

  clearHistory: () => {
    set({
      history: [],
      currentIndex: -1,
    })
  },

  clearRedoStack: () => {
    set(state => ({
      history: state.history.slice(0, state.currentIndex + 1),
    }))
  },

  jumpToAction: (index: number) => {
    const state = get()
    if (index < 0 || index >= state.history.length) return null

    set({
      currentIndex: index,
      isReplaying: true,
    })

    setTimeout(() => {
      set({ isReplaying: false })
    }, 0)

    return state.history[index]
  },

  setMaxHistorySize: (size: number) => {
    set({ maxHistorySize: Math.max(1, size) })
  },
}))
