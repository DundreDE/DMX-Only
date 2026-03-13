/**
 * LiveMixer.ts
 * Live Mixer for Daslight 5
 * Real-time group control with visual feedback
 */

export interface MixerGroup {
  id: string
  name: string
  color: string
  channels: number[]
  faders: MixerFader[]
  effects: MixerEffect[]
  muted: boolean
  solo: boolean
  level: number // 0-255
}

export interface MixerFader {
  id: string
  name: string
  channel: number
  value: number // 0-255
  min: number
  max: number
  type: 'slider' | 'rotary' | 'button'
}

export interface MixerEffect {
  id: string
  name: string
  type: 'strobe' | 'blackout' | 'color' | 'intensity'
  enabled: boolean
  parameters: Record<string, number>
}

export interface MixerBus {
  id: string
  name: string
  level: number // 0-255
  type: 'master' | 'output'
  groups: string[]
}

/**
 * Live Mixer - real-time group and channel control
 */
export class LiveMixer {
  private groups: Map<string, MixerGroup> = new Map()
  private buses: Map<string, MixerBus> = new Map()
  private masterLevel: number = 255
  private masterMuted: boolean = false
  private updateHandlers: ((group: MixerGroup) => void)[] = []

  constructor() {
    this.initializeMasterBus()
  }

  private initializeMasterBus(): void {
    const masterBus: MixerBus = {
      id: 'master',
      name: 'Master',
      level: 255,
      type: 'master',
      groups: [],
    }
    this.buses.set('master', masterBus)
  }

  /**
   * Create mixer group
   */
  public createGroup(
    name: string,
    channels: number[],
    color: string = '#ffffff'
  ): MixerGroup {
    const id = `group-${Date.now()}-${Math.random()}`
    const group: MixerGroup = {
      id,
      name,
      color,
      channels,
      faders: [],
      effects: [],
      muted: false,
      solo: false,
      level: 255,
    }

    // Create faders for each channel
    for (const ch of channels) {
      group.faders.push({
        id: `fader-${ch}`,
        name: `Channel ${ch}`,
        channel: ch,
        value: 0,
        min: 0,
        max: 255,
        type: 'slider',
      })
    }

    this.groups.set(id, group)
    const masterBus = this.buses.get('master')!
    masterBus.groups.push(id)

    return group
  }

  /**
   * Get group
   */
  public getGroup(groupId: string): MixerGroup | null {
    return this.groups.get(groupId) || null
  }

  /**
   * Get all groups
   */
  public getAllGroups(): MixerGroup[] {
    return Array.from(this.groups.values())
  }

  /**
   * Set group level (master fader for group)
   */
  public setGroupLevel(groupId: string, level: number): void {
    const group = this.getGroup(groupId)
    if (group) {
      group.level = Math.max(0, Math.min(255, level))
      this.notifyUpdate(group)
    }
  }

  /**
   * Set channel value in group
   */
  public setChannelValue(groupId: string, channel: number, value: number): void {
    const group = this.getGroup(groupId)
    if (!group) return

    const fader = group.faders.find((f) => f.channel === channel)
    if (fader) {
      fader.value = Math.max(fader.min, Math.min(fader.max, value))
      this.notifyUpdate(group)
    }
  }

  /**
   * Get channel value
   */
  public getChannelValue(groupId: string, channel: number): number {
    const group = this.getGroup(groupId)
    if (!group) return 0

    const fader = group.faders.find((f) => f.channel === channel)
    return fader ? fader.value : 0
  }

  /**
   * Mute group
   */
  public muteGroup(groupId: string, muted: boolean): void {
    const group = this.getGroup(groupId)
    if (group) {
      group.muted = muted
      this.notifyUpdate(group)
    }
  }

  /**
   * Solo group
   */
  public soloGroup(groupId: string, solo: boolean): void {
    const group = this.getGroup(groupId)
    if (!group) return

    if (solo) {
      for (const other of this.groups.values()) {
        if (other.id !== groupId) {
          other.solo = false
        }
      }
    }

    group.solo = solo
    this.notifyUpdate(group)
  }

  /**
   * Add effect to group
   */
  public addEffect(
    groupId: string,
    name: string,
    type: 'strobe' | 'blackout' | 'color' | 'intensity'
  ): MixerEffect | null {
    const group = this.getGroup(groupId)
    if (!group) return null

    const effect: MixerEffect = {
      id: `effect-${Date.now()}`,
      name,
      type,
      enabled: true,
      parameters: {},
    }

    group.effects.push(effect)
    this.notifyUpdate(group)
    return effect
  }

  /**
   * Update effect parameter
   */
  public setEffectParameter(
    groupId: string,
    effectId: string,
    parameter: string,
    value: number
  ): void {
    const group = this.getGroup(groupId)
    if (!group) return

    const effect = group.effects.find((e) => e.id === effectId)
    if (effect) {
      effect.parameters[parameter] = value
      this.notifyUpdate(group)
    }
  }

  /**
   * Remove effect
   */
  public removeEffect(groupId: string, effectId: string): boolean {
    const group = this.getGroup(groupId)
    if (!group) return false

    const idx = group.effects.findIndex((e) => e.id === effectId)
    if (idx > -1) {
      group.effects.splice(idx, 1)
      this.notifyUpdate(group)
      return true
    }
    return false
  }

  /**
   * Get all effects in group
   */
  public getGroupEffects(groupId: string): MixerEffect[] {
    const group = this.getGroup(groupId)
    return group ? group.effects : []
  }

  /**
   * Set master level
   */
  public setMasterLevel(level: number): void {
    this.masterLevel = Math.max(0, Math.min(255, level))
  }

  /**
   * Get master level
   */
  public getMasterLevel(): number {
    return this.masterLevel
  }

  /**
   * Mute master
   */
  public muteMaster(muted: boolean): void {
    this.masterMuted = muted
  }

  /**
   * Get master muted state
   */
  public isMasterMuted(): boolean {
    return this.masterMuted
  }

  /**
   * Get output for DMX engine
   */
  public getOutput(): Record<number, number> {
    const output: Record<number, number> = {}

    if (this.masterMuted) {
      return output
    }

    const masterFactor = this.masterLevel / 255

    for (const group of this.groups.values()) {
      if (group.muted) continue

      const groupFactor = (group.level / 255) * masterFactor

      for (const fader of group.faders) {
        const value = Math.floor(fader.value * groupFactor)
        output[fader.channel] = value
      }

      for (const effect of group.effects) {
        if (!effect.enabled) continue

        switch (effect.type) {
          case 'blackout':
            for (const ch of group.channels) {
              output[ch] = 0
            }
            break

          case 'strobe':
            const strobeRate = effect.parameters['rate'] || 10
            const strobeIntensity = effect.parameters['intensity'] || 255
            const now = Date.now()
            const strobeOn = (now % (1000 / strobeRate)) < (1000 / strobeRate) * 0.5
            if (strobeOn) {
              for (const ch of group.channels) {
                output[ch] = strobeIntensity
              }
            }
            break

          case 'intensity':
            const intensity = effect.parameters['level'] || 128
            for (const ch of group.channels) {
              if (output[ch] !== undefined) {
                output[ch] = Math.floor(output[ch] * (intensity / 255))
              }
            }
            break

          case 'color':
            const r = effect.parameters['r'] || 0
            const g = effect.parameters['g'] || 0
            const b = effect.parameters['b'] || 0
            if (group.channels.length >= 3) {
              output[group.channels[0]] = r
              output[group.channels[1]] = g
              output[group.channels[2]] = b
            }
            break
        }
      }
    }

    return output
  }

  /**
   * Subscribe to updates
   */
  public onUpdate(handler: (group: MixerGroup) => void): () => void {
    this.updateHandlers.push(handler)
    return () => {
      const idx = this.updateHandlers.indexOf(handler)
      if (idx > -1) this.updateHandlers.splice(idx, 1)
    }
  }

  private notifyUpdate(group: MixerGroup): void {
    for (const handler of this.updateHandlers) {
      handler(group)
    }
  }

  /**
   * Get statistics
   */
  public getStats(): {
    groupCount: number
    totalChannels: number
    mutedGroups: number
    effectCount: number
  } {
    let totalChannels = 0
    let mutedGroups = 0
    let effectCount = 0

    for (const group of this.groups.values()) {
      totalChannels += group.channels.length
      if (group.muted) mutedGroups++
      effectCount += group.effects.length
    }

    return {
      groupCount: this.groups.size,
      totalChannels,
      mutedGroups,
      effectCount,
    }
  }

  /**
   * Reset all
   */
  public reset(): void {
    for (const group of this.groups.values()) {
      for (const fader of group.faders) {
        fader.value = 0
      }
      group.muted = false
      group.solo = false
      group.level = 255
    }
    this.masterLevel = 255
    this.masterMuted = false
  }
}

export const globalLiveMixer = new LiveMixer()
