// ════════════════════════════════════════════════════════════════════════════
//  SceneGroupManager — Release mode logic for multi-scene playback
// ════════════════════════════════════════════════════════════════════════════

import type { Scene, Fixture } from '../../../shared/types'

export type ReleaseMode = 'off' | 'group' | 'all' | 'except'

export interface SceneGroup {
  name: string
  sceneIds: string[]
}

/**
 * Determine which scenes should stop when a new scene starts
 * @param newSceneId Scene that is starting
 * @param allScenes All available scenes
 * @param activeScenes Currently playing scene IDs
 * @param releaseMode Release mode setting
 * @param sceneGroups Scene grouping (if applicable)
 * @returns Array of scene IDs that should stop
 */
export function getScenesToStop(
  newSceneId: string,
  allScenes: Scene[],
  activeScenes: string[],
  releaseMode: ReleaseMode,
  sceneGroups: SceneGroup[] = []
): string[] {
  if (!activeScenes.includes(newSceneId)) {
    activeScenes = [...activeScenes, newSceneId]
  }

  const newScene = allScenes.find(s => s.id === newSceneId)
  if (!newScene) return []

  switch (releaseMode) {
    case 'off':
      // No scenes stop - additive playback
      return []

    case 'group': {
      // Stop other scenes in same group
      const newSceneGroup = sceneGroups.find(g => g.sceneIds.includes(newSceneId))
      if (!newSceneGroup) return []

      return activeScenes.filter(
        sceneId => sceneId !== newSceneId && newSceneGroup.sceneIds.includes(sceneId)
      )
    }

    case 'all':
      // Stop all other scenes (solo)
      return activeScenes.filter(sceneId => sceneId !== newSceneId)

    case 'except': {
      // Stop all scenes except those in same group
      const newSceneGroup = sceneGroups.find(g => g.sceneIds.includes(newSceneId))
      if (!newSceneGroup) {
        // If no group, stop all others
        return activeScenes.filter(sceneId => sceneId !== newSceneId)
      }

      return activeScenes.filter(
        sceneId => sceneId !== newSceneId && !newSceneGroup.sceneIds.includes(sceneId)
      )
    }

    default:
      return []
  }
}

/**
 * Merge DMX values from multiple active scenes
 * Using max blending: highest value wins
 * @param sceneChannels Array of channel arrays from different scenes
 * @returns Merged DMX channel array
 */
export function mergeDMXChannels(sceneChannels: number[][]): number[] {
  if (sceneChannels.length === 0) return []

  const maxChannels = Math.max(...sceneChannels.map(ch => ch.length))
  const merged: number[] = new Array(maxChannels).fill(0)

  for (const channels of sceneChannels) {
    for (let i = 0; i < channels.length; i++) {
      merged[i] = Math.max(merged[i], channels[i])
    }
  }

  return merged
}

/**
 * Blend DMX values from multiple scenes with priorities
 * @param sceneChannels Array of {channels, priority} from different scenes
 * @returns Merged DMX channel array
 */
export function blendDMXChannels(
  sceneChannels: Array<{ channels: number[]; priority: number }>
): number[] {
  if (sceneChannels.length === 0) return []

  // Sort by priority (highest first)
  const sorted = [...sceneChannels].sort((a, b) => b.priority - a.priority)

  const maxChannels = Math.max(...sorted.map(sc => sc.channels.length))
  const blended: number[] = new Array(maxChannels).fill(0)

  // Apply lower priority first, higher priority overrides
  for (let i = sorted.length - 1; i >= 0; i--) {
    const { channels } = sorted[i]
    for (let j = 0; j < channels.length; j++) {
      if (channels[j] > 0) {
        blended[j] = channels[j]
      }
    }
  }

  return blended
}

/**
 * Get default scene groups (for organization)
 */
export function getDefaultSceneGroups(scenes: Scene[]): SceneGroup[] {
  const groups: Map<string, string[]> = new Map()

  for (const scene of scenes) {
    const groupName = (scene as any).group || 'Default'
    if (!groups.has(groupName)) {
      groups.set(groupName, [])
    }
    groups.get(groupName)!.push(scene.id)
  }

  return Array.from(groups.entries()).map(([name, sceneIds]) => ({
    name,
    sceneIds,
  }))
}

/**
 * Validate release mode and scene configuration
 */
export function validateReleaseMode(
  releaseMode: ReleaseMode,
  sceneGroups: SceneGroup[] = []
): boolean {
  if (!['off', 'group', 'all', 'except'].includes(releaseMode)) {
    return false
  }

  if ((releaseMode === 'group' || releaseMode === 'except') && sceneGroups.length === 0) {
    console.warn(`Release mode '${releaseMode}' requires scene groups`)
    return false
  }

  return true
}
