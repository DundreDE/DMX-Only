// ════════════════════════════════════════════════════════════════════════════
//  useFadeTransition — React hook for fade transitions
// ════════════════════════════════════════════════════════════════════════════

import { useCallback, useRef } from 'react'
import { globalFadeManager, type EasingType } from '../utils/fadeTransitionEngine'

export function useFadeTransition() {
  const fadeManagerRef = useRef(globalFadeManager)

  /**
   * Start a fade from one DMX state to another
   */
  const fade = useCallback(
    (
      from: number[],
      to: number[],
      duration: number,
      easing: EasingType = 'ease-in-out',
      onUpdate: (channels: number[]) => void,
      onComplete?: () => void
    ) => {
      fadeManagerRef.current.fade(from, to, duration, easing, onUpdate, onComplete)
    },
    []
  )

  /**
   * Stop current fade
   */
  const stop = useCallback(() => {
    fadeManagerRef.current.stop()
  }, [])

  /**
   * Get fade progress (0-1)
   */
  const getProgress = useCallback(() => {
    return fadeManagerRef.current.getProgress()
  }, [])

  /**
   * Check if currently fading
   */
  const isActive = useCallback(() => {
    return fadeManagerRef.current.isActive()
  }, [])

  return {
    fade,
    stop,
    getProgress,
    isActive,
  }
}
