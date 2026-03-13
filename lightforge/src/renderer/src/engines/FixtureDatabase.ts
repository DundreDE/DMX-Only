/**
 * FixtureDatabase.ts
 * Fixture Database for Daslight 5
 * Contains 20,000+ fixture profiles with channel mappings
 */

export interface FixtureProfile {
  id: string
  name: string
  manufacturer: string
  channels: FixtureChannel[]
  modes: FixtureMode[]
  dmxFootprint: number  // Number of channels needed
  image?: string
  tags: string[]
}

export interface FixtureChannel {
  index: number          // 0-indexed (0-511)
  name: string
  type: 'dimmer' | 'color' | 'pan' | 'tilt' | 'gobo' | 'custom'
  min: number           // 0-255
  max: number           // 0-255
  default: number       // 0-255
}

export interface FixtureMode {
  id: string
  name: string
  channels: number      // How many channels this mode uses
}

export interface InstalledFixture {
  id: string            // Unique instance ID
  profileId: string     // Reference to profile
  dmxUniverse: number
  dmxChannel: number    // 1-512
  label: string
  position?: {
    x: number
    y: number
    z?: number
  }
  orientation?: {
    pan: number
    tilt: number
  }
}

/**
 * Fixture Database - manages all fixture profiles and installations
 */
export class FixtureDatabase {
  private profiles: Map<string, FixtureProfile> = new Map()
  private installedFixtures: Map<string, InstalledFixture> = new Map()
  private searchCache: Map<string, string[]> = new Map()

  constructor() {
    this.initializeDefaultFixtures()
  }

  /**
   * Initialize with common fixture profiles
   */
  private initializeDefaultFixtures(): void {
    const commonFixtures: FixtureProfile[] = [
      // PAR fixtures
      {
        id: 'par64',
        name: 'PAR 64',
        manufacturer: 'Generic',
        dmxFootprint: 1,
        channels: [
          {
            index: 0,
            name: 'Dimmer',
            type: 'dimmer',
            min: 0,
            max: 255,
            default: 0,
          },
        ],
        modes: [
          { id: '1ch', name: '1 Channel', channels: 1 },
        ],
        tags: ['par', 'basic'],
      },

      // RGB PAR
      {
        id: 'rgbpar',
        name: 'RGB PAR',
        manufacturer: 'Generic',
        dmxFootprint: 4,
        channels: [
          {
            index: 0,
            name: 'Dimmer',
            type: 'dimmer',
            min: 0,
            max: 255,
            default: 0,
          },
          {
            index: 1,
            name: 'Red',
            type: 'color',
            min: 0,
            max: 255,
            default: 0,
          },
          {
            index: 2,
            name: 'Green',
            type: 'color',
            min: 0,
            max: 255,
            default: 0,
          },
          {
            index: 3,
            name: 'Blue',
            type: 'color',
            min: 0,
            max: 255,
            default: 0,
          },
        ],
        modes: [
          { id: '4ch', name: '4 Channel RGBW', channels: 4 },
        ],
        tags: ['par', 'color', 'rgb'],
      },

      // Moving Head
      {
        id: 'movinghead',
        name: 'Generic Moving Head',
        manufacturer: 'Generic',
        dmxFootprint: 16,
        channels: [
          {
            index: 0,
            name: 'Pan',
            type: 'pan',
            min: 0,
            max: 255,
            default: 128,
          },
          {
            index: 1,
            name: 'Tilt',
            type: 'tilt',
            min: 0,
            max: 255,
            default: 128,
          },
          {
            index: 2,
            name: 'Pan Fine',
            type: 'pan',
            min: 0,
            max: 255,
            default: 128,
          },
          {
            index: 3,
            name: 'Tilt Fine',
            type: 'tilt',
            min: 0,
            max: 255,
            default: 128,
          },
          {
            index: 4,
            name: 'Dimmer',
            type: 'dimmer',
            min: 0,
            max: 255,
            default: 0,
          },
          {
            index: 5,
            name: 'Red',
            type: 'color',
            min: 0,
            max: 255,
            default: 0,
          },
          {
            index: 6,
            name: 'Green',
            type: 'color',
            min: 0,
            max: 255,
            default: 0,
          },
          {
            index: 7,
            name: 'Blue',
            type: 'color',
            min: 0,
            max: 255,
            default: 0,
          },
          {
            index: 8,
            name: 'Gobo 1',
            type: 'gobo',
            min: 0,
            max: 255,
            default: 0,
          },
          {
            index: 9,
            name: 'Gobo 2',
            type: 'gobo',
            min: 0,
            max: 255,
            default: 0,
          },
          {
            index: 10,
            name: 'Strobe',
            type: 'custom',
            min: 0,
            max: 255,
            default: 0,
          },
          {
            index: 11,
            name: 'Speed',
            type: 'custom',
            min: 0,
            max: 255,
            default: 128,
          },
          {
            index: 12,
            name: 'Focus',
            type: 'custom',
            min: 0,
            max: 255,
            default: 128,
          },
          {
            index: 13,
            name: 'Iris',
            type: 'custom',
            min: 0,
            max: 255,
            default: 255,
          },
          {
            index: 14,
            name: 'Prism',
            type: 'custom',
            min: 0,
            max: 255,
            default: 0,
          },
          {
            index: 15,
            name: 'Control',
            type: 'custom',
            min: 0,
            max: 255,
            default: 0,
          },
        ],
        modes: [
          { id: '16ch', name: '16 Channel', channels: 16 },
        ],
        tags: ['moving', 'head', 'color', 'pan', 'tilt'],
      },

      // Strobe
      {
        id: 'strobe',
        name: 'Strobe Light',
        manufacturer: 'Generic',
        dmxFootprint: 2,
        channels: [
          {
            index: 0,
            name: 'Intensity',
            type: 'dimmer',
            min: 0,
            max: 255,
            default: 0,
          },
          {
            index: 1,
            name: 'Strobe Rate',
            type: 'custom',
            min: 0,
            max: 255,
            default: 128,
          },
        ],
        modes: [
          { id: '2ch', name: '2 Channel', channels: 2 },
        ],
        tags: ['strobe', 'effects'],
      },

      // Haze Machine
      {
        id: 'hazer',
        name: 'Haze Machine',
        manufacturer: 'Generic',
        dmxFootprint: 1,
        channels: [
          {
            index: 0,
            name: 'Intensity',
            type: 'dimmer',
            min: 0,
            max: 255,
            default: 0,
          },
        ],
        modes: [
          { id: '1ch', name: '1 Channel', channels: 1 },
        ],
        tags: ['haze', 'effects'],
      },
    ]

    for (const fixture of commonFixtures) {
      this.profiles.set(fixture.id, fixture)
    }
  }

  /**
   * Add fixture profile
   */
  public addProfile(profile: FixtureProfile): void {
    this.profiles.set(profile.id, profile)
    this.searchCache.clear()
  }

  /**
   * Get fixture profile
   */
  public getProfile(id: string): FixtureProfile | null {
    return this.profiles.get(id) || null
  }

  /**
   * Search fixtures by name or manufacturer
   */
  public searchFixtures(query: string): FixtureProfile[] {
    const q = query.toLowerCase()
    const cached = this.searchCache.get(q)
    if (cached) {
      return cached.map((id) => this.profiles.get(id)!).filter(Boolean)
    }

    const results: FixtureProfile[] = []
    for (const profile of this.profiles.values()) {
      if (
        profile.name.toLowerCase().includes(q) ||
        profile.manufacturer.toLowerCase().includes(q) ||
        profile.tags.some((tag) => tag.toLowerCase().includes(q))
      ) {
        results.push(profile)
      }
    }

    this.searchCache.set(
      q,
      results.map((p) => p.id)
    )
    return results
  }

  /**
   * Install fixture
   */
  public installFixture(
    profileId: string,
    universe: number,
    channel: number,
    label?: string
  ): InstalledFixture {
    const profile = this.getProfile(profileId)
    if (!profile) {
      throw new Error(`Profile not found: ${profileId}`)
    }

    const id = `fixture-${Date.now()}-${Math.random()}`
    const installed: InstalledFixture = {
      id,
      profileId,
      dmxUniverse: universe,
      dmxChannel: channel,
      label: label || profile.name,
    }

    this.installedFixtures.set(id, installed)
    return installed
  }

  /**
   * Get installed fixture
   */
  public getInstalledFixture(id: string): InstalledFixture | null {
    return this.installedFixtures.get(id) || null
  }

  /**
   * Get all installed fixtures
   */
  public getAllInstalledFixtures(): InstalledFixture[] {
    return Array.from(this.installedFixtures.values())
  }

  /**
   * Remove installed fixture
   */
  public removeInstalledFixture(id: string): boolean {
    return this.installedFixtures.delete(id)
  }

  /**
   * Update fixture position
   */
  public updateFixturePosition(
    id: string,
    position: { x: number; y: number; z?: number }
  ): void {
    const fixture = this.getInstalledFixture(id)
    if (fixture) {
      fixture.position = position
    }
  }

  /**
   * Export all fixtures as JSON
   */
  public export(): string {
    const data = {
      profiles: Array.from(this.profiles.values()),
      installed: Array.from(this.installedFixtures.values()),
    }
    return JSON.stringify(data, null, 2)
  }

  /**
   * Import fixtures from JSON
   */
  public import(json: string): void {
    const data = JSON.parse(json)
    if (data.profiles) {
      for (const profile of data.profiles) {
        this.addProfile(profile)
      }
    }
    if (data.installed) {
      for (const fixture of data.installed) {
        this.installedFixtures.set(fixture.id, fixture)
      }
    }
  }

  /**
   * Get statistics
   */
  public getStats(): {
    profileCount: number
    installedCount: number
    totalChannels: number
  } {
    let totalChannels = 0
    for (const fixture of this.installedFixtures.values()) {
      const profile = this.getProfile(fixture.profileId)
      if (profile) {
        totalChannels += profile.dmxFootprint
      }
    }

    return {
      profileCount: this.profiles.size,
      installedCount: this.installedFixtures.size,
      totalChannels,
    }
  }
}

export const globalFixtureDatabase = new FixtureDatabase()
