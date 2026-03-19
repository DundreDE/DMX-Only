/**
 * Professional Pro-Features: Cue Sheet, Macro Builder, Fixture Optimizer
 * Advanced features that exceed DasLight capabilities
 */

import { Scene, Chaser, SceneEffect } from '../../../shared/types'

/**
 * Cue Sheet - Professional performance sequencing
 */
export interface Cue {
  id: string
  number: number // 1, 2, 3... or 1.5, 1.6 for subcues
  description: string
  target: Scene | Chaser
  preWait: number // ms before executing
  fadeTime: number // ms to fade in
  holdTime: number // ms to hold
  postWait: number // ms after executing
  notes: string
  tags: string[]
  enabled: boolean
  color?: string // hex for display
}

export interface CueSheet {
  id: string
  name: string
  description: string
  cues: Cue[]
  autoAdvance: boolean
  loopMode: 'none' | 'loop' | 'loop-section'
  currentCue?: number
  createdAt: Date
  modifiedAt: Date
}

/**
 * Cue Sheet Manager
 */
export class CueSheetManager {
  private sheets: Map<string, CueSheet> = new Map()
  private activeCue: number = 0

  /**
   * Create new cue sheet
   */
  createSheet(name: string): CueSheet {
    const sheet: CueSheet = {
      id: `cuesheet_${Date.now()}`,
      name,
      description: '',
      cues: [],
      autoAdvance: false,
      loopMode: 'none',
      createdAt: new Date(),
      modifiedAt: new Date()
    }
    this.sheets.set(sheet.id, sheet)
    return sheet
  }

  /**
   * Add cue to sheet
   */
  addCue(sheetId: string, cue: Cue): void {
    const sheet = this.sheets.get(sheetId)
    if (sheet) {
      sheet.cues.push(cue)
      sheet.modifiedAt = new Date()
    }
  }

  /**
   * Get cue execution info
   */
  getCueExecution(sheet: CueSheet, cueNumber: number) {
    const cue = sheet.cues.find(c => c.number === cueNumber)
    if (!cue) return null

    return {
      totalWait: cue.preWait + cue.fadeTime + cue.holdTime + cue.postWait,
      phases: {
        preWait: { duration: cue.preWait, label: 'Pre-Wait' },
        fade: { duration: cue.fadeTime, label: 'Fade In' },
        hold: { duration: cue.holdTime, label: 'Hold' },
        postWait: { duration: cue.postWait, label: 'Post-Wait' }
      }
    }
  }

  /**
   * Save cue sheets to localStorage
   */
  saveSheets(): void {
    const data = Array.from(this.sheets.values())
    localStorage.setItem('cue_sheets', JSON.stringify(data))
  }

  /**
   * Load cue sheets from localStorage
   */
  loadSheets(): void {
    try {
      const data = localStorage.getItem('cue_sheets')
      if (data) {
        const sheets = JSON.parse(data) as CueSheet[]
        sheets.forEach(s => this.sheets.set(s.id, s))
      }
    } catch (error) {
      console.error('Failed to load cue sheets:', error)
    }
  }

  /**
   * Get all sheets
   */
  getAllSheets(): CueSheet[] {
    return Array.from(this.sheets.values())
  }
}

/**
 * Macro - Custom effect combination
 */
export interface EffectMacro {
  id: string
  name: string
  description: string
  effects: SceneEffect[]
  fixtures: string[] // fixture IDs
  duration: number // ms
  loopable: boolean
  icon?: string
}

/**
 * Macro Builder & Manager
 */
export class MacroBuilder {
  private macros: Map<string, EffectMacro> = new Map()

  /**
   * Create new macro
   */
  createMacro(name: string, effects: SceneEffect[], fixtureIds: string[]): EffectMacro {
    const macro: EffectMacro = {
      id: `macro_${Date.now()}`,
      name,
      description: '',
      effects,
      fixtures: fixtureIds,
      duration: 5000,
      loopable: true
    }
    this.macros.set(macro.id, macro)
    return macro
  }

  /**
   * Apply macro to a scene
   */
  applyMacro(macro: EffectMacro): SceneEffect[] {
    // Return applied effects (composable with existing scene effects)
    return macro.effects
  }

  /**
   * Combine multiple macros
   */
  combineMacros(macroIds: string[]): EffectMacro | null {
    const macros = macroIds
      .map(id => this.macros.get(id))
      .filter((m): m is EffectMacro => m !== undefined)

    if (macros.length === 0) return null

    const combined: EffectMacro = {
      id: `combined_macro_${Date.now()}`,
      name: `Combined: ${macros.map(m => m.name).join(', ')}`,
      description: `Combination of ${macros.length} macros`,
      effects: macros.flatMap(m => m.effects),
      fixtures: Array.from(new Set(macros.flatMap(m => m.fixtures))),
      duration: Math.max(...macros.map(m => m.duration)),
      loopable: macros.every(m => m.loopable)
    }

    return combined
  }

  /**
   * Save macros to localStorage
   */
  saveMacros(): void {
    const data = Array.from(this.macros.values())
    localStorage.setItem('effect_macros', JSON.stringify(data))
  }

  /**
   * Load macros from localStorage
   */
  loadMacros(): void {
    try {
      const data = localStorage.getItem('effect_macros')
      if (data) {
        const macros = JSON.parse(data) as EffectMacro[]
        macros.forEach(m => this.macros.set(m.id, m))
      }
    } catch (error) {
      console.error('Failed to load macros:', error)
    }
  }

  /**
   * Get all macros
   */
  getAllMacros(): EffectMacro[] {
    return Array.from(this.macros.values())
  }

  /**
   * Delete macro
   */
  deleteMacro(id: string): void {
    this.macros.delete(id)
    this.saveMacros()
  }
}

/**
 * Fixture Optimizer - Intelligent patching suggestions
 */
export interface PatchingSuggestion {
  fixtureId: string
  suggestedAddress: number
  reason: string
  confidence: number // 0-1
}

export interface OptimizationResult {
  suggestions: PatchingSuggestion[]
  efficiency: number // 0-1 (how well channels are utilized)
  warnings: string[]
}

export class FixtureOptimizer {
  /**
   * Suggest optimal patching based on fixture types and channel count
   */
  optimizePatch(
    fixtures: Array<{ id: string; type: string; channels: number }>,
    existingPatch: Map<string, number>
  ): OptimizationResult {
    const suggestions: PatchingSuggestion[] = []
    const usedChannels = new Set(existingPatch.values())
    const warnings: string[] = []

    // Group fixtures by type
    const fixturesByType = new Map<string, typeof fixtures>()
    fixtures.forEach(f => {
      if (!fixturesByType.has(f.type)) {
        fixturesByType.set(f.type, [])
      }
      fixturesByType.get(f.type)!.push(f)
    })

    // Suggest addresses for unpatched fixtures
    let nextAddress = 1
    fixtures.forEach(fixture => {
      if (!existingPatch.has(fixture.id)) {
        // Skip used channels
        while (usedChannels.has(nextAddress) && nextAddress < 512) {
          nextAddress++
        }

        if (nextAddress + fixture.channels - 1 <= 512) {
          suggestions.push({
            fixtureId: fixture.id,
            suggestedAddress: nextAddress,
            reason: `Sequential patch for ${fixture.type}`,
            confidence: 0.8
          })
          nextAddress += fixture.channels
        } else {
          warnings.push(`Not enough channels for ${fixture.id} (needs ${fixture.channels})`)
        }
      }
    })

    // Calculate efficiency
    const totalChannelsNeeded = fixtures.reduce((sum, f) => sum + f.channels, 0)
    const efficiency = totalChannelsNeeded / 512

    return {
      suggestions,
      efficiency,
      warnings
    }
  }

  /**
   * Check for channel conflicts
   */
  detectConflicts(
    patch: Map<string, number>,
    fixtures: Map<string, { channels: number }>
  ): string[] {
    const conflicts: string[] = []
    const channelMap = new Map<number, string[]>()

    // Build channel occupancy map
    patch.forEach((address, fixtureId) => {
      const fixture = fixtures.get(fixtureId)
      if (fixture) {
        for (let i = 0; i < fixture.channels; i++) {
          const ch = address + i
          if (!channelMap.has(ch)) {
            channelMap.set(ch, [])
          }
          channelMap.get(ch)!.push(fixtureId)
        }
      }
    })

    // Find conflicts
    channelMap.forEach((fixtureIds, ch) => {
      if (fixtureIds.length > 1) {
        conflicts.push(`Channel ${ch} occupied by: ${fixtureIds.join(', ')}`)
      }
    })

    return conflicts
  }
}

export const cueSheetManager = new CueSheetManager()
export const macroBuilder = new MacroBuilder()
export const fixtureOptimizer = new FixtureOptimizer()
