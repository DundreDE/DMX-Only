/**
 * BankManager.ts
 * Bank Manager for Daslight 5
 * Organizes up to 1000 scenes per bank, search, favorites, grouping
 */

import { Scene } from './PlaybackEngine'

export interface SceneBank {
  id: string
  name: string
  description?: string
  scenes: Map<string, Scene>
  groups: Map<string, string[]> // group name -> scene IDs
  favorites: Set<string>
  tags: Map<string, string[]> // tag -> scene IDs
  createdAt: number
  updatedAt: number
}

export interface BankStats {
  bankCount: number
  totalScenes: number
  groupCount: number
  tagCount: number
  favoriteCount: number
}

/**
 * Bank Manager - manages multiple scene banks
 */
export class BankManager {
  private banks: Map<string, SceneBank> = new Map()
  private currentBankId: string | null = null
  private maxScenesPerBank: number = 1000
  private searchCache: Map<string, string[]> = new Map()

  constructor() {}

  /**
   * Create new bank
   */
  public createBank(name: string, description?: string): SceneBank {
    const id = `bank-${Date.now()}-${Math.random()}`
    const bank: SceneBank = {
      id,
      name,
      description,
      scenes: new Map(),
      groups: new Map(),
      favorites: new Set(),
      tags: new Map(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    this.banks.set(id, bank)
    if (!this.currentBankId) {
      this.currentBankId = id
    }
    return bank
  }

  /**
   * Get bank
   */
  public getBank(bankId: string): SceneBank | null {
    return this.banks.get(bankId) || null
  }

  /**
   * Get current bank
   */
  public getCurrentBank(): SceneBank | null {
    return this.currentBankId ? this.getBank(this.currentBankId) : null
  }

  /**
   * Set current bank
   */
  public setCurrentBank(bankId: string): boolean {
    if (this.banks.has(bankId)) {
      this.currentBankId = bankId
      this.searchCache.clear()
      return true
    }
    return false
  }

  /**
   * Add scene to bank
   */
  public addScene(bankId: string, scene: Scene): boolean {
    const bank = this.getBank(bankId)
    if (!bank || bank.scenes.size >= this.maxScenesPerBank) {
      return false
    }
    bank.scenes.set(scene.id, scene)
    bank.updatedAt = Date.now()
    return true
  }

  /**
   * Remove scene from bank
   */
  public removeScene(bankId: string, sceneId: string): boolean {
    const bank = this.getBank(bankId)
    if (!bank) return false

    const deleted = bank.scenes.delete(sceneId)
    if (deleted) {
      bank.favorites.delete(sceneId)
      for (const group of bank.groups.values()) {
        const idx = group.indexOf(sceneId)
        if (idx > -1) group.splice(idx, 1)
      }
      for (const tags of bank.tags.values()) {
        const idx = tags.indexOf(sceneId)
        if (idx > -1) tags.splice(idx, 1)
      }
      bank.updatedAt = Date.now()
    }
    return deleted
  }

  /**
   * Get scene
   */
  public getScene(bankId: string, sceneId: string): Scene | null {
    const bank = this.getBank(bankId)
    return bank?.scenes.get(sceneId) || null
  }

  /**
   * Get all scenes in bank
   */
  public getAllScenes(bankId: string): Scene[] {
    const bank = this.getBank(bankId)
    return bank ? Array.from(bank.scenes.values()) : []
  }

  /**
   * Search scenes by name
   */
  public searchScenes(bankId: string, query: string): Scene[] {
    const bank = this.getBank(bankId)
    if (!bank) return []

    const q = query.toLowerCase()
    const cacheKey = `${bankId}-${q}`
    const cached = this.searchCache.get(cacheKey)

    if (cached) {
      return cached.map((id) => bank.scenes.get(id)!).filter(Boolean)
    }

    const results: Scene[] = []
    for (const scene of bank.scenes.values()) {
      if (scene.name.toLowerCase().includes(q)) {
        results.push(scene)
      }
    }

    this.searchCache.set(
      cacheKey,
      results.map((s) => s.id)
    )
    return results
  }

  /**
   * Create group
   */
  public createGroup(bankId: string, groupName: string): boolean {
    const bank = this.getBank(bankId)
    if (!bank || bank.groups.has(groupName)) return false
    bank.groups.set(groupName, [])
    bank.updatedAt = Date.now()
    return true
  }

  /**
   * Add scene to group
   */
  public addSceneToGroup(
    bankId: string,
    groupName: string,
    sceneId: string
  ): boolean {
    const bank = this.getBank(bankId)
    if (!bank || !bank.groups.has(groupName)) return false

    const group = bank.groups.get(groupName)!
    if (!group.includes(sceneId)) {
      group.push(sceneId)
      bank.updatedAt = Date.now()
    }
    return true
  }

  /**
   * Remove scene from group
   */
  public removeSceneFromGroup(
    bankId: string,
    groupName: string,
    sceneId: string
  ): boolean {
    const bank = this.getBank(bankId)
    if (!bank || !bank.groups.has(groupName)) return false

    const group = bank.groups.get(groupName)!
    const idx = group.indexOf(sceneId)
    if (idx > -1) {
      group.splice(idx, 1)
      bank.updatedAt = Date.now()
      return true
    }
    return false
  }

  /**
   * Get scenes by group
   */
  public getScenesByGroup(bankId: string, groupName: string): Scene[] {
    const bank = this.getBank(bankId)
    if (!bank || !bank.groups.has(groupName)) return []

    const group = bank.groups.get(groupName)!
    return group.map((id) => bank.scenes.get(id)!).filter(Boolean)
  }

  /**
   * Add/remove favorite
   */
  public toggleFavorite(bankId: string, sceneId: string): boolean {
    const bank = this.getBank(bankId)
    if (!bank) return false

    if (bank.favorites.has(sceneId)) {
      bank.favorites.delete(sceneId)
    } else {
      bank.favorites.add(sceneId)
    }
    bank.updatedAt = Date.now()
    return true
  }

  /**
   * Get favorite scenes
   */
  public getFavorites(bankId: string): Scene[] {
    const bank = this.getBank(bankId)
    if (!bank) return []

    return Array.from(bank.favorites)
      .map((id) => bank.scenes.get(id)!)
      .filter(Boolean)
  }

  /**
   * Add tag to scene
   */
  public addTag(bankId: string, tag: string, sceneId: string): boolean {
    const bank = this.getBank(bankId)
    if (!bank) return false

    if (!bank.tags.has(tag)) {
      bank.tags.set(tag, [])
    }

    const tagScenes = bank.tags.get(tag)!
    if (!tagScenes.includes(sceneId)) {
      tagScenes.push(sceneId)
      bank.updatedAt = Date.now()
    }
    return true
  }

  /**
   * Get scenes by tag
   */
  public getScenesByTag(bankId: string, tag: string): Scene[] {
    const bank = this.getBank(bankId)
    if (!bank || !bank.tags.has(tag)) return []

    const sceneIds = bank.tags.get(tag)!
    return sceneIds.map((id) => bank.scenes.get(id)!).filter(Boolean)
  }

  /**
   * Export bank
   */
  public exportBank(bankId: string): string {
    const bank = this.getBank(bankId)
    if (!bank) return ''

    const exported = {
      id: bank.id,
      name: bank.name,
      description: bank.description,
      scenes: Array.from(bank.scenes.values()),
      groups: Object.fromEntries(bank.groups),
      favorites: Array.from(bank.favorites),
      tags: Object.fromEntries(bank.tags),
      createdAt: bank.createdAt,
      updatedAt: bank.updatedAt,
    }

    return JSON.stringify(exported, null, 2)
  }

  /**
   * Import bank
   */
  public importBank(json: string): SceneBank | null {
    try {
      const data = JSON.parse(json)
      const bank: SceneBank = {
        id: data.id || `bank-${Date.now()}`,
        name: data.name,
        description: data.description,
        scenes: new Map(data.scenes.map((s: Scene) => [s.id, s])),
        groups: new Map(Object.entries(data.groups || {})),
        favorites: new Set(data.favorites || []),
        tags: new Map(Object.entries(data.tags || {})),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }
      this.banks.set(bank.id, bank)
      return bank
    } catch {
      return null
    }
  }

  /**
   * Get statistics
   */
  public getStats(): BankStats {
    let totalScenes = 0
    let groupCount = 0
    let tagCount = 0
    let favoriteCount = 0

    for (const bank of this.banks.values()) {
      totalScenes += bank.scenes.size
      groupCount += bank.groups.size
      tagCount += bank.tags.size
      favoriteCount += bank.favorites.size
    }

    return {
      bankCount: this.banks.size,
      totalScenes,
      groupCount,
      tagCount,
      favoriteCount,
    }
  }

  /**
   * Get all banks
   */
  public getAllBanks(): SceneBank[] {
    return Array.from(this.banks.values())
  }

  /**
   * Delete bank
   */
  public deleteBank(bankId: string): boolean {
    if (this.currentBankId === bankId) {
      this.currentBankId = null
    }
    return this.banks.delete(bankId)
  }
}

export const globalBankManager = new BankManager()
