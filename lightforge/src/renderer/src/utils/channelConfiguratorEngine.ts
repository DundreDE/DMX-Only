/**
 * channelConfiguratorEngine.ts
 * Channel configuration and mapping engine for Phase 4 Scene Builder
 * Handles channel group management, DMX mapping, and presets
 */

export interface Channel {
  id: string
  name: string
  min: number
  max: number
  default: number
}

export interface ChannelGroup {
  id: string
  name: string
  channels: Channel[]
  metadata?: {
    fixtureType?: string
    address?: number
    notes?: string
  }
}

export interface ChannelConfig {
  id: string
  name: string
  groups: ChannelGroup[]
  metadata: {
    version: string
    lastModified: number
    exportFormat: 'json' | 'csv'
  }
}

/**
 * Create new channel group
 */
export function createChannelGroup(name: string): ChannelGroup {
  return {
    id: `group-${Date.now()}`,
    name,
    channels: [],
    metadata: {
      fixtureType: undefined,
      address: 1,
      notes: '',
    },
  }
}

/**
 * Add channel to group
 */
export function addChannel(
  group: ChannelGroup,
  name: string,
  min: number = 0,
  max: number = 255,
  defaultValue: number = 0
): ChannelGroup {
  const channel: Channel = {
    id: `ch-${Date.now()}`,
    name,
    min,
    max,
    default: Math.max(min, Math.min(max, defaultValue)),
  }

  return {
    ...group,
    channels: [...group.channels, channel],
  }
}

/**
 * Remove channel from group
 */
export function removeChannel(
  group: ChannelGroup,
  channelId: string
): ChannelGroup {
  return {
    ...group,
    channels: group.channels.filter((c) => c.id !== channelId),
  }
}

/**
 * Update channel properties
 */
export function updateChannel(
  group: ChannelGroup,
  channelId: string,
  updates: Partial<Channel>
): ChannelGroup {
  return {
    ...group,
    channels: group.channels.map((c) =>
      c.id === channelId
        ? {
          ...c,
          ...updates,
          default: updates.default
            ? Math.max(
              updates.min || c.min,
              Math.min(updates.max || c.max, updates.default)
            )
            : c.default,
        }
        : c
    ),
  }
}

/**
 * Map channels for fixtures
 */
export function mapChannels(
  group: ChannelGroup,
  fixtureAddress: number,
  channelCount: number
): Record<number, string> {
  const mapping: Record<number, string> = {}

  for (let i = 0; i < Math.min(group.channels.length, channelCount); i++) {
    const dmxAddress = fixtureAddress + i
    const channel = group.channels[i]
    mapping[dmxAddress] = channel.id
  }

  return mapping
}

/**
 * Get default DMX values for group
 */
export function getDefaultValues(group: ChannelGroup): Record<string, number> {
  const defaults: Record<string, number> = {}

  group.channels.forEach((channel) => {
    defaults[channel.id] = channel.default
  })

  return defaults
}

/**
 * Validate channel configuration
 */
export function validateChannelConfig(config: ChannelConfig): string[] {
  const errors: string[] = []

  if (config.groups.length === 0) {
    errors.push('Configuration must have at least one channel group')
  }

  for (const group of config.groups) {
    if (group.channels.length === 0) {
      errors.push(`Group "${group.name}": Must have at least one channel`)
    }

    for (const channel of group.channels) {
      if (channel.min > channel.max) {
        errors.push(`Channel "${channel.name}": Min > Max`)
      }

      if (
        channel.default < channel.min ||
        channel.default > channel.max
      ) {
        errors.push(`Channel "${channel.name}": Default value out of range`)
      }
    }
  }

  return errors
}

/**
 * Export channel configuration
 */
export function exportChannelConfig(
  config: ChannelConfig,
  format: 'json' | 'csv' = 'json'
): string {
  if (format === 'json') {
    return JSON.stringify(config, null, 2)
  }

  // CSV format
  const lines: string[] = []
  lines.push('Group,Channel,Min,Max,Default')

  for (const group of config.groups) {
    for (const channel of group.channels) {
      lines.push(
        `"${group.name}","${channel.name}",${channel.min},${channel.max},${channel.default}`
      )
    }
  }

  return lines.join('\n')
}

/**
 * Import channel configuration
 */
export function importChannelConfig(json: string): ChannelConfig | null {
  try {
    const parsed = JSON.parse(json)

    // Validate structure
    if (!parsed.groups || !Array.isArray(parsed.groups)) {
      return null
    }

    return {
      id: parsed.id || `config-${Date.now()}`,
      name: parsed.name || 'Imported Config',
      groups: parsed.groups,
      metadata: {
        version: '1.0',
        lastModified: Date.now(),
        exportFormat: 'json',
      },
    }
  } catch {
    return null
  }
}

/**
 * Create preset from fixture type
 */
export function createFixturePreset(fixtureType: string): ChannelGroup {
  const presets: Record<string, Channel[]> = {
    'par-led': [
      { id: 'ch-1', name: 'Dimmer', min: 0, max: 255, default: 0 },
      { id: 'ch-2', name: 'Red', min: 0, max: 255, default: 0 },
      { id: 'ch-3', name: 'Green', min: 0, max: 255, default: 0 },
      { id: 'ch-4', name: 'Blue', min: 0, max: 255, default: 0 },
    ],
    'moving-head': [
      { id: 'ch-1', name: 'Dimmer', min: 0, max: 255, default: 0 },
      { id: 'ch-2', name: 'Pan', min: 0, max: 255, default: 128 },
      { id: 'ch-3', name: 'Tilt', min: 0, max: 255, default: 128 },
      { id: 'ch-4', name: 'Color Wheel', min: 0, max: 255, default: 0 },
      { id: 'ch-5', name: 'Gobo', min: 0, max: 255, default: 0 },
      { id: 'ch-6', name: 'Focus', min: 0, max: 255, default: 128 },
      { id: 'ch-7', name: 'Strobe', min: 0, max: 255, default: 0 },
    ],
    'rgb-flood': [
      { id: 'ch-1', name: 'Red', min: 0, max: 255, default: 0 },
      { id: 'ch-2', name: 'Green', min: 0, max: 255, default: 0 },
      { id: 'ch-3', name: 'Blue', min: 0, max: 255, default: 0 },
      { id: 'ch-4', name: 'White', min: 0, max: 255, default: 0 },
    ],
    'strobe': [
      { id: 'ch-1', name: 'Strobe Rate', min: 0, max: 255, default: 0 },
      { id: 'ch-2', name: 'Intensity', min: 0, max: 255, default: 255 },
    ],
    'hazer': [
      { id: 'ch-1', name: 'Haze Level', min: 0, max: 255, default: 0 },
      { id: 'ch-2', name: 'Timer', min: 0, max: 255, default: 255 },
    ],
  }

  const channels = presets[fixtureType.toLowerCase()] || []

  return {
    id: `preset-${Date.now()}`,
    name: `${fixtureType} - Preset`,
    channels,
    metadata: {
      fixtureType,
      address: 1,
      notes: `Auto-generated preset for ${fixtureType}`,
    },
  }
}

/**
 * Calculate total DMX channels used
 */
export function calculateDMXUsage(config: ChannelConfig): number {
  return config.groups.reduce(
    (total, group) => total + group.channels.length,
    0
  )
}

/**
 * Merge multiple channel configurations
 */
export function mergeConfigurations(
  configs: ChannelConfig[]
): ChannelConfig {
  const allGroups: ChannelGroup[] = []

  for (const config of configs) {
    allGroups.push(...config.groups)
  }

  return {
    id: `config-merged-${Date.now()}`,
    name: 'Merged Configuration',
    groups: allGroups,
    metadata: {
      version: '1.0',
      lastModified: Date.now(),
      exportFormat: 'json',
    },
  }
}
