/**
 * Advanced Import/Export System
 * Handles JSON, QXF, CSV, and Template exports
 */

import type { ProjectData, ProjectSettings } from './ProjectManager'
import type { FixtureDefinition, Scene, Chaser } from '../../../shared/types'
import { ProjectManager } from './ProjectManager'

export interface ExportOptions {
  format: 'json' | 'qxf' | 'csv' | 'xml'
  includeMetadata: boolean
  includeSettings: boolean
  compress: boolean
}

export class ImportExportManager {
  /**
   * Export project as multiple formats
   */
  static async exportProject(project: ProjectData, options: ExportOptions): Promise<string> {
    switch (options.format) {
      case 'json':
        return this.exportAsJSON(project, options)
      case 'csv':
        return this.exportAsCSV(project)
      case 'xml':
        return this.exportAsXML(project)
      default:
        return JSON.stringify(project)
    }
  }

  /**
   * Export as JSON
   */
  private static exportAsJSON(project: ProjectData, options: ExportOptions): string {
    const data: any = {}

    if (options.includeMetadata) {
      data.metadata = project.metadata
    }

    if (options.includeSettings) {
      data.settings = project.settings
    }

    data.fixtures = project.fixtures
    data.patched = project.patched
    data.banks = project.banks
    data.scenes = project.scenes
    data.chasers = project.chasers

    return JSON.stringify(data, null, 2)
  }

  /**
   * Export Fixture Definitions as QXF-compatible format
   */
  private static exportAsXML(project: ProjectData): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<FixtureDefinitions>\n'

    project.fixtures.forEach(fixture => {
      xml += `  <Fixture>\n`
      xml += `    <Manufacturer>${this.escapeXML(fixture.manufacturer)}</Manufacturer>\n`
      xml += `    <Model>${this.escapeXML(fixture.model)}</Model>\n`
      xml += `    <Type>${this.escapeXML(fixture.type)}</Type>\n`
      xml += `    <Modes>\n`

      fixture.modes.forEach(mode => {
        xml += `      <Mode>\n`
        xml += `        <Name>${this.escapeXML(mode.name)}</Name>\n`
        xml += `        <Channels>\n`

        mode.channels.forEach(channel => {
          xml += `          <Channel>\n`
          xml += `            <Number>${channel.number}</Number>\n`
          xml += `            <Name>${this.escapeXML(channel.name)}</Name>\n`
          xml += `            <Type>${channel.primaryType}</Type>\n`
          xml += `          </Channel>\n`
        })

        xml += `        </Channels>\n`
        xml += `      </Mode>\n`
      })

      xml += `    </Modes>\n`
      xml += `  </Fixture>\n`
    })

    xml += '</FixtureDefinitions>\n'
    return xml
  }

  /**
   * Export Patched Fixtures as CSV
   */
  private static exportAsCSV(project: ProjectData): string {
    let csv = 'Universe,Address,Channel Count,Fixture Name,Definition,Mode\n'

    project.patched.forEach(fixture => {
      const def = project.fixtures.find(f => f.id === fixture.definitionId)
      csv += `${fixture.universe},${fixture.startAddress},${fixture.channelCount},`
      csv += `"${fixture.name}","${def?.manufacturer} ${def?.model}",${fixture.modeIndex}\n`
    })

    return csv
  }

  /**
   * Import project from various formats
   */
  static async importProject(fileContent: string, format: 'json' | 'csv'): Promise<ProjectData | null> {
    try {
      switch (format) {
        case 'json':
          return JSON.parse(fileContent) as ProjectData
        case 'csv':
          return this.importFromCSV(fileContent)
        default:
          return null
      }
    } catch (error) {
      console.error('Import failed:', error)
      return null
    }
  }

  /**
   * Import Patched Fixtures from CSV
   */
  private static importFromCSV(csv: string): ProjectData | null {
    const lines = csv.split('\n').filter(line => line.trim())
    const header = lines[0].split(',')

    const project = ProjectManager.createNewProject('Imported Project')

    lines.slice(1).forEach(line => {
      const values = this.parseCSVLine(line)
      if (values.length < 3) return

      const patched = {
        id: `patched_${Date.now()}_${Math.random()}`,
        definitionId: '',
        name: values[3]?.replace(/"/g, '') || 'Unknown',
        universe: Number(values[0]),
        startAddress: Number(values[1]),
        modeIndex: 0,
        channelCount: Number(values[2])
      }

      project.patched.push(patched)
    })

    return project
  }

  /**
   * Save project to file
   */
  static async saveToFile(content: string, filename: string, mimeType = 'application/json'): Promise<void> {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  /**
   * Load from file
   */
  static async loadFromFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  /**
   * Export templates
   */
  static exportSceneTemplates(scenes: Scene[]): string {
    const templates = {
      version: 1,
      exportDate: new Date().toISOString(),
      scenes: scenes.map(s => ({
        name: s.name,
        fadeTime: s.fadeTime,
        values: s.values,
        effects: s.effects
      }))
    }
    return JSON.stringify(templates, null, 2)
  }

  /**
   * Import scene templates
   */
  static importSceneTemplates(json: string): Scene[] | null {
    try {
      const templates = JSON.parse(json)
      if (!templates.scenes || !Array.isArray(templates.scenes)) return null

      return templates.scenes.map((t: any) => ({
        id: `scene_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: t.name,
        fadeTime: t.fadeTime || 0,
        values: t.values || {},
        effects: t.effects || []
      }))
    } catch {
      return null
    }
  }

  /**
   * Export chaser templates
   */
  static exportChaserTemplates(chasers: Chaser[]): string {
    const templates = {
      version: 1,
      exportDate: new Date().toISOString(),
      chasers: chasers.map(c => ({
        name: c.name,
        steps: c.steps,
        loop: c.loop
      }))
    }
    return JSON.stringify(templates, null, 2)
  }

  /**
   * Batch export all templates
   */
  static exportAllTemplates(project: ProjectData): Map<string, string> {
    const exports = new Map<string, string>()

    exports.set('scenes.json', this.exportSceneTemplates(project.scenes))
    exports.set('chasers.json', this.exportChaserTemplates(project.chasers))
    exports.set('fixtures.csv', this.exportAsCSV(project))
    exports.set('project.json', ProjectManager.exportProjectAsJSON(project))

    return exports
  }

  // Utility: Escape XML special characters
  private static escapeXML(str: string): string {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  // Utility: Parse CSV line handling quoted fields
  private static parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }

    result.push(current)
    return result
  }
}

/**
 * Template Manager
 * Manages scene and effect presets
 */
export class TemplateManager {
  private static readonly TEMPLATE_KEY = 'lightforge_templates'

  /**
   * Save template
   */
  static saveTemplate(name: string, type: 'scene' | 'effect' | 'chaser', data: any): void {
    try {
      const templates = this.loadAllTemplates()
      const key = `${type}:${name}`
      templates[key] = {
        name,
        type,
        data,
        created: Date.now(),
        modified: Date.now()
      }
      localStorage.setItem(this.TEMPLATE_KEY, JSON.stringify(templates))
    } catch (error) {
      console.error('Failed to save template:', error)
    }
  }

  /**
   * Load template
   */
  static loadTemplate(name: string, type: 'scene' | 'effect' | 'chaser'): any | null {
    try {
      const templates = this.loadAllTemplates()
      const key = `${type}:${name}`
      return templates[key]?.data || null
    } catch {
      return null
    }
  }

  /**
   * List templates
   */
  static listTemplates(type?: 'scene' | 'effect' | 'chaser') {
    try {
      const templates = this.loadAllTemplates()
      return Object.values(templates).filter(t => !type || t.type === type)
    } catch {
      return []
    }
  }

  /**
   * Delete template
   */
  static deleteTemplate(name: string, type: 'scene' | 'effect' | 'chaser'): void {
    try {
      const templates = this.loadAllTemplates()
      const key = `${type}:${name}`
      delete templates[key]
      localStorage.setItem(this.TEMPLATE_KEY, JSON.stringify(templates))
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  /**
   * Load all templates
   */
  private static loadAllTemplates(): Record<string, any> {
    try {
      const data = localStorage.getItem(this.TEMPLATE_KEY)
      return data ? JSON.parse(data) : {}
    } catch {
      return {}
    }
  }
}
