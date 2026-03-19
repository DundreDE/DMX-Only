/**
 * Project Persistence & Storage System
 * Handles saving/loading projects with auto-save and recovery
 */

import type { Project, PatchedFixture, Scene, Chaser, Bank, FixtureDefinition } from '../../../shared/types'

export interface ProjectMetadata {
  id: string
  name: string
  description?: string
  version: number
  created: number // timestamp
  modified: number // timestamp
  tags?: string[]
  isDraft?: boolean
}

export interface ProjectData {
  metadata: ProjectMetadata
  settings: ProjectSettings
  fixtures: FixtureDefinition[]
  patched: PatchedFixture[]
  banks: Bank[]
  scenes: Scene[]
  chasers: Chaser[]
}

export interface ProjectSettings {
  universe: number
  masterLevel: number
  blackout: boolean
  autoSaveInterval: number // ms
  language: 'en' | 'de'
  theme: 'dark' | 'light' | 'auto'
}

export class ProjectManager {
  private static readonly STORAGE_KEY = 'lightforge_projects'
  private static readonly DRAFT_KEY = 'lightforge_draft'
  private static readonly STORAGE_PATH = `${process.env.HOME}/.lightforge/projects`

  /**
   * Save project to storage
   */
  static async saveProject(project: ProjectData): Promise<void> {
    try {
      project.metadata.modified = Date.now()
      project.metadata.isDraft = false

      const key = `${this.STORAGE_KEY}:${project.metadata.id}`
      localStorage.setItem(key, JSON.stringify(project))

      // Clear draft
      localStorage.removeItem(this.DRAFT_KEY)

      console.log(`✓ Project saved: ${project.metadata.name}`)
    } catch (error) {
      console.error('Failed to save project:', error)
      throw error
    }
  }

  /**
   * Load project from storage
   */
  static async loadProject(projectId: string): Promise<ProjectData | null> {
    try {
      const key = `${this.STORAGE_KEY}:${projectId}`
      const data = localStorage.getItem(key)

      if (!data) return null

      return JSON.parse(data) as ProjectData
    } catch (error) {
      console.error('Failed to load project:', error)
      return null
    }
  }

  /**
   * List all projects
   */
  static listProjects(): ProjectMetadata[] {
    const projects: ProjectMetadata[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)

      if (key?.startsWith(this.STORAGE_KEY)) {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            const project = JSON.parse(data) as ProjectData
            projects.push(project.metadata)
          }
        } catch (error) {
          console.error(`Failed to parse project from ${key}:`, error)
        }
      }
    }

    return projects.sort((a, b) => b.modified - a.modified)
  }

  /**
   * Delete project
   */
  static deleteProject(projectId: string): boolean {
    try {
      const key = `${this.STORAGE_KEY}:${projectId}`
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Failed to delete project:', error)
      return false
    }
  }

  /**
   * Create new project
   */
  static createNewProject(name: string): ProjectData {
    return {
      metadata: {
        id: this.generateId(),
        name,
        version: 1,
        created: Date.now(),
        modified: Date.now(),
        tags: ['new'],
        isDraft: false
      },
      settings: {
        universe: 0,
        masterLevel: 255,
        blackout: false,
        autoSaveInterval: 30000, // 30 seconds
        language: 'en',
        theme: 'dark'
      },
      fixtures: [],
      patched: [],
      banks: [],
      scenes: [],
      chasers: []
    }
  }

  /**
   * Save draft (temporary auto-save)
   */
  static saveDraft(project: ProjectData): void {
    try {
      const draft = {
        ...project,
        metadata: {
          ...project.metadata,
          isDraft: true,
          modified: Date.now()
        }
      }
      localStorage.setItem(this.DRAFT_KEY, JSON.stringify(draft))
    } catch (error) {
      console.error('Failed to save draft:', error)
    }
  }

  /**
   * Load draft if available
   */
  static loadDraft(): ProjectData | null {
    try {
      const data = localStorage.getItem(this.DRAFT_KEY)
      if (!data) return null

      const draft = JSON.parse(data) as ProjectData
      return draft
    } catch (error) {
      console.error('Failed to load draft:', error)
      return null
    }
  }

  /**
   * Clear draft
   */
  static clearDraft(): void {
    localStorage.removeItem(this.DRAFT_KEY)
  }

  /**
   * Export project as JSON file
   */
  static exportProjectAsJSON(project: ProjectData): string {
    const json = JSON.stringify(project, null, 2)
    return json
  }

  /**
   * Import project from JSON
   */
  static importProjectFromJSON(json: string): ProjectData | null {
    try {
      const project = JSON.parse(json) as ProjectData
      // Validate structure
      if (!project.metadata || !project.settings) {
        throw new Error('Invalid project structure')
      }
      // Generate new ID to avoid conflicts
      project.metadata.id = this.generateId()
      project.metadata.created = Date.now()
      project.metadata.modified = Date.now()

      return project
    } catch (error) {
      console.error('Failed to import project:', error)
      return null
    }
  }

  /**
   * Generate unique project ID
   */
  private static generateId(): string {
    return `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Check if project has unsaved changes
   */
  static hasChanges(project: ProjectData, lastSaved: number): boolean {
    return project.metadata.modified > lastSaved
  }

  /**
   * Get project statistics
   */
  static getProjectStats(project: ProjectData) {
    return {
      fixtures: project.patched.length,
      scenes: project.scenes.length,
      chasers: project.chasers.length,
      banks: project.banks.length,
      totalChannels: project.patched.reduce((sum, f) => sum + f.channelCount, 0)
    }
  }
}

/**
 * Session Recovery Manager
 * Handles recovery from crashes and unexpected shutdowns
 */
export class SessionRecoveryManager {
  private static readonly RECOVERY_KEY = 'lightforge_recovery'
  private static readonly LAST_SESSION_KEY = 'lightforge_last_session'

  /**
   * Save recovery point
   */
  static saveRecoveryPoint(project: ProjectData): void {
    try {
      const recovery = {
        timestamp: Date.now(),
        project,
        // Store last 3 recovery points
        history: []
      }
      localStorage.setItem(this.RECOVERY_KEY, JSON.stringify(recovery))
      localStorage.setItem(this.LAST_SESSION_KEY, JSON.stringify({
        projectId: project.metadata.id,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Failed to save recovery point:', error)
    }
  }

  /**
   * Get recovery point if available
   */
  static getRecoveryPoint(): ProjectData | null {
    try {
      const data = localStorage.getItem(this.RECOVERY_KEY)
      if (!data) return null

      const recovery = JSON.parse(data)
      return recovery.project as ProjectData
    } catch (error) {
      console.error('Failed to load recovery point:', error)
      return null
    }
  }

  /**
   * Clear recovery point (after successful recovery)
   */
  static clearRecoveryPoint(): void {
    localStorage.removeItem(this.RECOVERY_KEY)
  }

  /**
   * Get last session info
   */
  static getLastSession() {
    try {
      const data = localStorage.getItem(this.LAST_SESSION_KEY)
      if (!data) return null
      return JSON.parse(data)
    } catch (error) {
      return null
    }
  }
}

/**
 * Auto-save Manager
 * Handles periodic auto-saving of projects
 */
export class AutoSaveManager {
  private autoSaveTimer: number | null = null

  startAutoSave(project: ProjectData, interval: number, onSave: (project: ProjectData) => void): void {
    this.stopAutoSave()

    this.autoSaveTimer = window.setInterval(() => {
      ProjectManager.saveDraft(project)
      onSave(project)
    }, interval)
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer)
      this.autoSaveTimer = null
    }
  }
}
