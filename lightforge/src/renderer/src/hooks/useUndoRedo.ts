// ════════════════════════════════════════════════════════════════════════════
//  useUndoRedo — React hook for automatic undo/redo tracking
// ════════════════════════════════════════════════════════════════════════════

import { useCallback } from 'react'
import { useUndoRedoStore, type ActionType } from '../stores/undoRedoStore'

export function useUndoRedo() {
  const { recordAction, undo, redo, canUndo, canRedo } = useUndoRedoStore()

  /**
   * Wrap an action to automatically record it in undo/redo
   */
  const trackAction = useCallback(
    (
      actionType: ActionType,
      description: string,
      previousState: Record<string, any>,
      newState: Record<string, any>,
      metadata?: Record<string, any>
    ) => {
      recordAction({
        type: actionType,
        description,
        previousState,
        newState,
        metadata,
      })
    },
    [recordAction]
  )

  /**
   * Convenience function for scene operations
   */
  const trackSceneChange = useCallback(
    (
      operation: 'create' | 'delete' | 'rename' | 'edit',
      sceneId: string,
      previousState: any,
      newState: any
    ) => {
      const actionTypeMap = {
        create: 'scene-create' as ActionType,
        delete: 'scene-delete' as ActionType,
        rename: 'scene-rename' as ActionType,
        edit: 'scene-edit' as ActionType,
      }

      trackAction(
        actionTypeMap[operation],
        `Scene ${operation}: ${sceneId}`,
        previousState,
        newState
      )
    },
    [trackAction]
  )

  /**
   * Convenience function for DMX changes
   */
  const trackDMXChange = useCallback(
    (channel: number, previousValue: number, newValue: number) => {
      trackAction(
        'dmx-channel-change',
        `DMX Channel ${channel}: ${previousValue} → ${newValue}`,
        { channel, value: previousValue },
        { channel, value: newValue }
      )
    },
    [trackAction]
  )

  return {
    trackAction,
    trackSceneChange,
    trackDMXChange,
    undo: () => {
      const result = undo()
      if (result) {
        console.log('Undo:', result.description)
      }
      return result
    },
    redo: () => {
      const result = redo()
      if (result) {
        console.log('Redo:', result.description)
      }
      return result
    },
    canUndo: canUndo(),
    canRedo: canRedo(),
  }
}
