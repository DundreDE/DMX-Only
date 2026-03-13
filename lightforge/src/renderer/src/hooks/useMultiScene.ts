// ════════════════════════════════════════════════════════════════════════════
//  useMultiScene — React hook for multi-scene playback
// ════════════════════════════════════════════════════════════════════════════

import { useCallback } from 'react'
import { useMultiSceneStore } from '../stores/multiSceneStore'
import { mergeDMXChannels } from '../utils/sceneGroupManager'

export function useMultiScene() {
  const {
    activeScenes,
    releaseMode,
    playScene,
    stopScene,
    stopAll,
    updateScenePlayback,
    setReleaseMode,
    setSoloed,
    setMuted,
    setVolume,
    getActiveScenesArray,
    isScenePlaying,
  } = useMultiSceneStore()

  /**
   * Play a scene with auto release mode handling
   */
  const play = useCallback(
    (sceneId: string, priority?: number) => {
      playScene(sceneId, priority)
    },
    [playScene]
  )

  /**
   * Stop a scene
   */
  const stop = useCallback(
    (sceneId: string) => {
      stopScene(sceneId)
    },
    [stopScene]
  )

  /**
   * Stop all scenes
   */
  const stopAllScenes = useCallback(() => {
    stopAll()
  }, [stopAll])

  /**
   * Get merged DMX output from all active scenes
   * This would be called in the DMX output loop
   */
  const getMergedDMXOutput = useCallback(
    (sceneDMXMap: Map<string, number[]>): number[] => {
      const scenes = getActiveScenesArray()
      const channelsToMerge = scenes.map(scene => {
        const channels = sceneDMXMap.get(scene.sceneId) || []
        const volume = scene.isMuted ? 0 : scene.volume

        // Apply volume/mute
        return channels.map(ch => Math.round(ch * volume))
      })

      return mergeDMXChannels(channelsToMerge)
    },
    [getActiveScenesArray]
  )

  /**
   * Get active scene count
   */
  const getActiveCount = useCallback(() => {
    return activeScenes.size
  }, [activeScenes])

  /**
   * Check if scene is playing
   */
  const isPlaying = useCallback(
    (sceneId: string) => {
      return isScenePlaying(sceneId)
    },
    [isScenePlaying]
  )

  return {
    play,
    stop,
    stopAllScenes,
    setReleaseMode,
    setSoloed,
    setMuted,
    setVolume,
    updateScenePlayback,
    getMergedDMXOutput,
    getActiveScenes: getActiveScenesArray,
    getActiveCount,
    isPlaying,
    releaseMode,
    activeSceneCount: activeScenes.size,
  }
}
