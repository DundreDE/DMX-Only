/**
 * Automatic Backup System - Periodic backup with version history
 * Robust project backup and recovery system
 */

export interface BackupFile {
  id: string
  projectId: string
  projectName: string
  timestamp: number
  size: number // bytes
  version: number
  tags: string[]
  notes: string
  compressed: boolean
  checksum: string // for integrity verification
}

export interface BackupConfig {
  enabled: boolean
  interval: number // ms
  maxBackups: number // max backups to keep
  autoCleanup: boolean
  compressionEnabled: boolean
  lastBackup: number
}

/**
 * Backup Manager
 */
export class BackupManager {
  private backups: Map<string, BackupFile[]> = new Map()
  private config: BackupConfig = {
    enabled: true,
    interval: 5 * 60 * 1000, // 5 minutes
    maxBackups: 50,
    autoCleanup: true,
    compressionEnabled: true,
    lastBackup: 0
  }

  private backupIntervals: Map<string, NodeJS.Timeout> = new Map()
  private subscribers: Set<(backup: BackupFile) => void> = new Set()

  constructor() {
    this.loadConfig()
    this.loadBackups()
  }

  /**
   * Create backup
   */
  async createBackup(projectId: string, projectData: any, projectName: string): Promise<BackupFile> {
    const dataStr = JSON.stringify(projectData)
    const size = new Blob([dataStr]).size
    const checksum = this.calculateChecksum(dataStr)

    // Get existing backups for project
    const projectBackups = this.backups.get(projectId) || []
    const version = projectBackups.length + 1

    const backup: BackupFile = {
      id: `backup_${Date.now()}`,
      projectId,
      projectName,
      timestamp: Date.now(),
      size,
      version,
      tags: [],
      notes: '',
      compressed: this.config.compressionEnabled,
      checksum
    }

    // Store backup data
    const backupKey = this.getBackupStorageKey(backup.id)
    localStorage.setItem(backupKey, dataStr)
    localStorage.setItem(`${backupKey}_meta`, JSON.stringify(backup))

    // Update backup list
    if (!this.backups.has(projectId)) {
      this.backups.set(projectId, [])
    }
    this.backups.get(projectId)!.push(backup)

    // Cleanup if needed
    if (this.config.autoCleanup) {
      this.cleanupOldBackups(projectId)
    }

    this.saveBackupIndex()
    this.config.lastBackup = Date.now()

    // Notify subscribers
    this.subscribers.forEach(cb => cb(backup))

    console.log(`Backup created: ${projectName} (${this.formatSize(size)})`)
    return backup
  }

  /**
   * Start automatic backups for project
   */
  startAutoBackup(projectId: string, projectGetter: () => any, projectName: string): void {
    if (this.backupIntervals.has(projectId)) {
      return // Already running
    }

    const interval = setInterval(() => {
      if (this.config.enabled) {
        const projectData = projectGetter()
        this.createBackup(projectId, projectData, projectName)
      }
    }, this.config.interval)

    this.backupIntervals.set(projectId, interval)
  }

  /**
   * Stop automatic backups for project
   */
  stopAutoBackup(projectId: string): void {
    const interval = this.backupIntervals.get(projectId)
    if (interval) {
      clearInterval(interval)
      this.backupIntervals.delete(projectId)
    }
  }

  /**
   * Get backup
   */
  getBackup(backupId: string): any | null {
    try {
      const backupKey = this.getBackupStorageKey(backupId)
      const data = localStorage.getItem(backupKey)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Failed to retrieve backup:', error)
      return null
    }
  }

  /**
   * Get backup metadata
   */
  getBackupMetadata(backupId: string): BackupFile | null {
    try {
      const backupKey = this.getBackupStorageKey(backupId)
      const data = localStorage.getItem(`${backupKey}_meta`)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Failed to retrieve backup metadata:', error)
      return null
    }
  }

  /**
   * List backups for project
   */
  getProjectBackups(projectId: string): BackupFile[] {
    return (this.backups.get(projectId) || []).sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Restore backup
   */
  restoreBackup(backupId: string): any | null {
    const backup = this.getBackupMetadata(backupId)
    if (!backup) return null

    const data = this.getBackup(backupId)
    if (!data) return null

    // Verify checksum
    const calculatedChecksum = this.calculateChecksum(JSON.stringify(data))
    if (calculatedChecksum !== backup.checksum) {
      console.error('Backup checksum mismatch - data may be corrupted')
      return null
    }

    console.log(`Restored backup: ${backup.projectName} (v${backup.version})`)
    return data
  }

  /**
   * Delete backup
   */
  deleteBackup(backupId: string): void {
    const backup = this.getBackupMetadata(backupId)
    if (!backup) return

    const backupKey = this.getBackupStorageKey(backupId)
    localStorage.removeItem(backupKey)
    localStorage.removeItem(`${backupKey}_meta`)

    const projectBackups = this.backups.get(backup.projectId)
    if (projectBackups) {
      const index = projectBackups.findIndex(b => b.id === backupId)
      if (index >= 0) {
        projectBackups.splice(index, 1)
      }
    }

    this.saveBackupIndex()
  }

  /**
   * Clean up old backups
   */
  private cleanupOldBackups(projectId: string): void {
    const backups = this.getProjectBackups(projectId)

    if (backups.length > this.config.maxBackups) {
      const toDelete = backups.slice(this.config.maxBackups)
      toDelete.forEach(b => this.deleteBackup(b.id))
    }
  }

  /**
   * Get backup statistics
   */
  getBackupStats(projectId: string) {
    const backups = this.getProjectBackups(projectId)

    const stats = {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, b) => sum + b.size, 0),
      oldestBackup: backups[backups.length - 1]?.timestamp,
      newestBackup: backups[0]?.timestamp,
      averageSize: backups.length > 0 ? backups.reduce((sum, b) => sum + b.size, 0) / backups.length : 0
    }

    return stats
  }

  /**
   * Calculate checksum (simple hash)
   */
  private calculateChecksum(data: string): string {
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Format file size
   */
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`
  }

  /**
   * Get backup storage key
   */
  private getBackupStorageKey(backupId: string): string {
    return `backup_${backupId}`
  }

  /**
   * Update backup configuration
   */
  updateConfig(updates: Partial<BackupConfig>): void {
    Object.assign(this.config, updates)
    this.saveConfig()
  }

  /**
   * Get backup configuration
   */
  getConfig(): BackupConfig {
    return { ...this.config }
  }

  /**
   * Subscribe to backup events
   */
  subscribe(callback: (backup: BackupFile) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Export backups (for external storage)
   */
  exportBackups(projectId: string): string {
    const backups = this.getProjectBackups(projectId)
    const exportData = {
      projectId,
      exported: new Date().toISOString(),
      backups: backups.map(b => ({
        metadata: b,
        data: this.getBackup(b.id)
      }))
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Import backups (from external storage)
   */
  importBackups(jsonData: string): void {
    try {
      const importData = JSON.parse(jsonData)
      importData.backups.forEach((item: any) => {
        const backupKey = this.getBackupStorageKey(item.metadata.id)
        localStorage.setItem(backupKey, JSON.stringify(item.data))
        localStorage.setItem(`${backupKey}_meta`, JSON.stringify(item.metadata))

        if (!this.backups.has(item.metadata.projectId)) {
          this.backups.set(item.metadata.projectId, [])
        }
        this.backups.get(item.metadata.projectId)!.push(item.metadata)
      })

      this.saveBackupIndex()
    } catch (error) {
      console.error('Failed to import backups:', error)
    }
  }

  /**
   * Save backup index to localStorage
   */
  private saveBackupIndex(): void {
    const index = Array.from(this.backups.entries()).map(([projectId, backups]) => ({
      projectId,
      backups: backups.map(b => ({
        id: b.id,
        timestamp: b.timestamp,
        version: b.version
      }))
    }))

    localStorage.setItem('backup_index', JSON.stringify(index))
  }

  /**
   * Load backup index from localStorage
   */
  private loadBackups(): void {
    try {
      const data = localStorage.getItem('backup_index')
      if (data) {
        const index = JSON.parse(data)
        index.forEach((item: any) => {
          const backups = item.backups.map((b: any) => {
            const metaData = localStorage.getItem(`backup_${b.id}_meta`)
            return metaData ? JSON.parse(metaData) : null
          }).filter(Boolean)

          this.backups.set(item.projectId, backups)
        })
      }
    } catch (error) {
      console.error('Failed to load backup index:', error)
    }
  }

  /**
   * Save configuration
   */
  private saveConfig(): void {
    localStorage.setItem('backup_config', JSON.stringify(this.config))
  }

  /**
   * Load configuration
   */
  private loadConfig(): void {
    try {
      const data = localStorage.getItem('backup_config')
      if (data) {
        Object.assign(this.config, JSON.parse(data))
      }
    } catch (error) {
      console.error('Failed to load backup config:', error)
    }
  }
}

export const backupManager = new BackupManager()
