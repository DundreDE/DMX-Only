/**
 * Fixture Library Cache - Optimize QXF fixture loading
 * In-memory and persistent caching system for fast fixture access
 */

import type { FixtureDefinition } from '../../../shared/types'

export interface FixtureCacheEntry {
  id: string
  fixtureId: string
  manufacturer: string
  model: string
  modes: number
  channels: number
  lastAccessed: number
  loadCount: number
  fileSize: number
}

export interface CacheStatistics {
  totalItems: number
  memoryUsed: number // bytes
  hitRate: number // 0-1
  missRate: number // 0-1
  totalRequests: number
  totalHits: number
  totalMisses: number
}

/**
 * Fixture Library Cache
 */
export class FixtureLibraryCache {
  private memoryCache: Map<string, FixtureDefinition> = new Map()
  private cacheIndex: Map<string, FixtureCacheEntry> = new Map()
  private maxMemorySize: number = 50 * 1024 * 1024 // 50MB
  private maxCacheItems: number = 10000

  private statistics = {
    totalRequests: 0,
    totalHits: 0,
    totalMisses: 0
  }

  constructor() {
    this.loadCacheIndex()
  }

  /**
   * Get fixture from cache
   */
  getFixture(fixtureId: string): FixtureDefinition | null {
    this.statistics.totalRequests++

    // Check memory cache first
    const cached = this.memoryCache.get(fixtureId)
    if (cached) {
      this.statistics.totalHits++
      this.updateAccessTime(fixtureId)
      return cached
    }

    this.statistics.totalMisses++
    return null
  }

  /**
   * Add fixture to cache
   */
  addFixture(fixture: FixtureDefinition): void {
    if (this.memoryCache.size >= this.maxCacheItems) {
      this.evictLRU()
    }

    this.memoryCache.set(fixture.id, fixture)

    const entry: FixtureCacheEntry = {
      id: `cache_${fixture.id}`,
      fixtureId: fixture.id,
      manufacturer: fixture.manufacturer,
      model: fixture.model,
      modes: fixture.modes.length,
      channels: fixture.modes[0]?.channels.length || 0,
      lastAccessed: Date.now(),
      loadCount: 1,
      fileSize: this.estimateSize(fixture)
    }

    this.cacheIndex.set(fixture.id, entry)
    this.saveCacheIndex()
  }

  /**
   * Update multiple fixtures (batch add)
   */
  addFixtures(fixtures: FixtureDefinition[]): void {
    fixtures.forEach(f => this.addFixture(f))
  }

  /**
   * Search fixtures in cache
   */
  searchFixtures(query: string): FixtureDefinition[] {
    const lowerQuery = query.toLowerCase()
    const results: FixtureDefinition[] = []

    this.memoryCache.forEach(fixture => {
      if (
        fixture.manufacturer.toLowerCase().includes(lowerQuery) ||
        fixture.model.toLowerCase().includes(lowerQuery)
      ) {
        results.push(fixture)
      }
    })

    return results
  }

  /**
   * Filter fixtures by manufacturer
   */
  getFixturesByManufacturer(manufacturer: string): FixtureDefinition[] {
    const results: FixtureDefinition[] = []

    this.memoryCache.forEach(fixture => {
      if (fixture.manufacturer === manufacturer) {
        results.push(fixture)
      }
    })

    return results
  }

  /**
   * Get all fixtures by category
   */
  getFixturesByMode(channelCount: number): FixtureDefinition[] {
    const results: FixtureDefinition[] = []

    this.memoryCache.forEach(fixture => {
      fixture.modes.forEach(mode => {
        if (mode.channels.length === channelCount) {
          if (!results.find(f => f.id === fixture.id)) {
            results.push(fixture)
          }
        }
      })
    })

    return results
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    let lruKey: string | null = null
    let oldestTime = Date.now()

    this.cacheIndex.forEach((entry, key) => {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        lruKey = key
      }
    })

    if (lruKey) {
      this.memoryCache.delete(lruKey)
      this.cacheIndex.delete(lruKey)
    }
  }

  /**
   * Update access time for LRU tracking
   */
  private updateAccessTime(fixtureId: string): void {
    const entry = this.cacheIndex.get(fixtureId)
    if (entry) {
      entry.lastAccessed = Date.now()
      entry.loadCount++
    }
  }

  /**
   * Get cache statistics
   */
  getStatistics(): CacheStatistics {
    let memoryUsed = 0
    this.memoryCache.forEach(fixture => {
      memoryUsed += this.estimateSize(fixture)
    })

    const hitRate =
      this.statistics.totalRequests > 0 ? this.statistics.totalHits / this.statistics.totalRequests : 0

    return {
      totalItems: this.memoryCache.size,
      memoryUsed,
      hitRate,
      missRate: 1 - hitRate,
      totalRequests: this.statistics.totalRequests,
      totalHits: this.statistics.totalHits,
      totalMisses: this.statistics.totalMisses
    }
  }

  /**
   * Estimate object size in bytes
   */
  private estimateSize(fixture: FixtureDefinition): number {
    // Rough estimate: manufacturer + model + (modes * channels * 50)
    const baseSize = fixture.manufacturer.length + fixture.model.length
    const modesSize = fixture.modes.reduce((sum, mode) => {
      return sum + mode.channels.length * 50
    }, 0)

    return baseSize + modesSize
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.memoryCache.clear()
    this.cacheIndex.clear()
    localStorage.removeItem('fixture_cache_index')
  }

  /**
   * Pre-load fixtures from library
   */
  preloadLibrary(fixtures: FixtureDefinition[]): void {
    console.log(`Pre-loading ${fixtures.length} fixtures into cache...`)
    const startTime = Date.now()

    this.addFixtures(fixtures)

    const duration = Date.now() - startTime
    console.log(`Pre-load complete: ${fixtures.length} fixtures in ${duration}ms`)
  }

  /**
   * Get cache info
   */
  getCacheInfo() {
    const stats = this.getStatistics()

    return {
      cachedCount: this.memoryCache.size,
      maxCapacity: this.maxCacheItems,
      memoryUsed: `${(stats.memoryUsed / 1024 / 1024).toFixed(2)} MB`,
      memoryLimit: `${(this.maxMemorySize / 1024 / 1024).toFixed(2)} MB`,
      hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
      totalRequests: stats.totalRequests,
      manufacturers: this.getUniqueManufacturers().length
    }
  }

  /**
   * Get unique manufacturers in cache
   */
  getUniqueManufacturers(): string[] {
    const manufacturers = new Set<string>()

    this.memoryCache.forEach(fixture => {
      manufacturers.add(fixture.manufacturer)
    })

    return Array.from(manufacturers).sort()
  }

  /**
   * Export cache index
   */
  exportCacheIndex(): string {
    const index = Array.from(this.cacheIndex.values())
    return JSON.stringify(
      {
        exported: new Date().toISOString(),
        itemCount: index.length,
        index
      },
      null,
      2
    )
  }

  /**
   * Get most used fixtures
   */
  getMostUsedFixtures(limit: number = 10): FixtureCacheEntry[] {
    return Array.from(this.cacheIndex.values())
      .sort((a, b) => b.loadCount - a.loadCount)
      .slice(0, limit)
  }

  /**
   * Get recently added fixtures
   */
  getRecentlyAddedFixtures(limit: number = 10): FixtureCacheEntry[] {
    return Array.from(this.cacheIndex.values())
      .sort((a, b) => b.lastAccessed - a.lastAccessed)
      .slice(0, limit)
  }

  /**
   * Optimize cache (remove unused items)
   */
  optimizeCache(): {
    itemsRemoved: number
    memoryFreed: number
  } {
    const now = Date.now()
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000
    let itemsRemoved = 0
    let memoryFreed = 0

    const entriesToDelete: string[] = []

    this.cacheIndex.forEach((entry, fixtureId) => {
      if (now - entry.lastAccessed > oneWeekMs && entry.loadCount < 5) {
        entriesToDelete.push(fixtureId)
        memoryFreed += entry.fileSize
        itemsRemoved++
      }
    })

    entriesToDelete.forEach(fixtureId => {
      this.memoryCache.delete(fixtureId)
      this.cacheIndex.delete(fixtureId)
    })

    if (itemsRemoved > 0) {
      this.saveCacheIndex()
    }

    return { itemsRemoved, memoryFreed }
  }

  /**
   * Save cache index to localStorage
   */
  private saveCacheIndex(): void {
    const index = Array.from(this.cacheIndex.values())
    localStorage.setItem('fixture_cache_index', JSON.stringify(index))
  }

  /**
   * Load cache index from localStorage
   */
  private loadCacheIndex(): void {
    try {
      const data = localStorage.getItem('fixture_cache_index')
      if (data) {
        const index = JSON.parse(data) as FixtureCacheEntry[]
        index.forEach(entry => {
          this.cacheIndex.set(entry.fixtureId, entry)
        })
      }
    } catch (error) {
      console.error('Failed to load cache index:', error)
    }
  }
}

export const fixtureLibraryCache = new FixtureLibraryCache()
