/**
 * DMX Analyzer - Real-time DMX signal analysis and diagnostics
 * Monitor, analyze, and debug DMX output
 */

export interface ChannelStatistics {
  channel: number
  min: number
  max: number
  average: number
  current: number
  changes: number
  lastChange: number
}

export interface UniverseStatistics {
  universeId: number
  channels: ChannelStatistics[]
  totalPackets: number
  packetsPerSecond: number
  lastUpdate: number
  signalQuality: number // 0-100
}

export interface DMXPacketLog {
  timestamp: number
  universeId: number
  channelRanges: Array<{
    start: number
    end: number
    values: number[]
  }>
}

/**
 * DMX Analyzer
 */
export class DMXAnalyzer {
  private statistics: Map<number, UniverseStatistics> = new Map()
  private packetLog: DMXPacketLog[] = []
  private maxLogSize: number = 1000
  private subscribers: Set<(stats: UniverseStatistics) => void> = new Set()
  private analysisInterval: NodeJS.Timeout | null = null

  /**
   * Initialize analyzer for universe
   */
  initializeUniverse(universeId: number, channels: number = 512): void {
    const channelStats: ChannelStatistics[] = []

    for (let i = 1; i <= channels; i++) {
      channelStats.push({
        channel: i,
        min: 255,
        max: 0,
        average: 0,
        current: 0,
        changes: 0,
        lastChange: 0
      })
    }

    this.statistics.set(universeId, {
      universeId,
      channels: channelStats,
      totalPackets: 0,
      packetsPerSecond: 0,
      lastUpdate: Date.now(),
      signalQuality: 100
    })
  }

  /**
   * Update channel value and track statistics
   */
  updateChannel(universeId: number, channel: number, value: number): void {
    const stats = this.statistics.get(universeId)
    if (!stats || channel < 1 || channel > stats.channels.length) return

    const channelStat = stats.channels[channel - 1]!
    const oldValue = channelStat.current

    // Update statistics
    channelStat.current = value
    channelStat.min = Math.min(channelStat.min, value)
    channelStat.max = Math.max(channelStat.max, value)

    if (oldValue !== value) {
      channelStat.changes++
      channelStat.lastChange = Date.now()
    }

    // Update average (moving average)
    const totalValue = channelStat.average * (stats.totalPackets - 1) + value
    channelStat.average = Math.round(totalValue / stats.totalPackets)

    stats.lastUpdate = Date.now()
    stats.totalPackets++

    this.updateSignalQuality(stats)
  }

  /**
   * Update entire universe (batch)
   */
  updateUniverse(universeId: number, values: Uint8Array): void {
    const stats = this.statistics.get(universeId)
    if (!stats) return

    const range = Math.min(values.length, stats.channels.length)

    for (let i = 0; i < range; i++) {
      this.updateChannel(universeId, i + 1, values[i]!)
    }

    // Log packet
    this.logPacket(universeId, values)
  }

  /**
   * Calculate signal quality (0-100)
   */
  private updateSignalQuality(stats: UniverseStatistics): void {
    // Quality based on packet rate, stability, and signal variance
    const now = Date.now()
    const timeSinceUpdate = now - stats.lastUpdate

    let quality = 100

    // Check packet rate (should be ~40 packets/sec for DMX)
    if (stats.totalPackets < 30) {
      quality -= 20
    }

    // Check for stale channels
    let staleChannels = 0
    stats.channels.forEach(ch => {
      if (now - ch.lastChange > 5000) {
        // Not changed in 5 seconds
        staleChannels++
      }
    })

    quality -= (staleChannels / stats.channels.length) * 20

    // Check signal variance
    const variance = stats.channels.reduce((sum, ch) => {
      return sum + Math.abs(ch.current - ch.average)
    }, 0) / stats.channels.length

    if (variance < 5) {
      quality -= 5 // Completely static signal might be an issue
    }

    stats.signalQuality = Math.max(0, Math.min(100, quality))
  }

  /**
   * Log packet for history
   */
  private logPacket(universeId: number, values: Uint8Array): void {
    const channelRanges: DMXPacketLog['channelRanges'] = []

    // Group consecutive non-zero channels
    let startCh = -1
    for (let i = 0; i < values.length; i++) {
      if (values[i] !== 0) {
        if (startCh === -1) {
          startCh = i + 1
        }
      } else {
        if (startCh !== -1) {
          const endCh = i
          const range: DMXPacketLog['channelRanges'][0] = {
            start: startCh,
            end: endCh,
            values: Array.from(values.slice(startCh - 1, endCh))
          }
          channelRanges.push(range)
          startCh = -1
        }
      }
    }

    if (startCh !== -1) {
      const range: DMXPacketLog['channelRanges'][0] = {
        start: startCh,
        end: values.length,
        values: Array.from(values.slice(startCh - 1))
      }
      channelRanges.push(range)
    }

    this.packetLog.push({
      timestamp: Date.now(),
      universeId,
      channelRanges
    })

    // Trim log if too large
    if (this.packetLog.length > this.maxLogSize) {
      this.packetLog = this.packetLog.slice(-this.maxLogSize)
    }
  }

  /**
   * Get universe statistics
   */
  getUniverseStats(universeId: number): UniverseStatistics | undefined {
    return this.statistics.get(universeId)
  }

  /**
   * Get channel statistics
   */
  getChannelStats(universeId: number, channel: number): ChannelStatistics | undefined {
    const stats = this.statistics.get(universeId)
    if (!stats || channel < 1 || channel > stats.channels.length) return undefined

    return stats.channels[channel - 1]
  }

  /**
   * Find active channels in universe
   */
  getActiveChannels(universeId: number): ChannelStatistics[] {
    const stats = this.statistics.get(universeId)
    if (!stats) return []

    return stats.channels.filter(ch => ch.current > 0)
  }

  /**
   * Find changed channels in time window
   */
  getRecentlyChangedChannels(universeId: number, windowMs: number = 1000): ChannelStatistics[] {
    const stats = this.statistics.get(universeId)
    if (!stats) return []

    const now = Date.now()
    return stats.channels.filter(ch => now - ch.lastChange < windowMs)
  }

  /**
   * Get packet history
   */
  getPacketHistory(universeId: number, limit: number = 100): DMXPacketLog[] {
    return this.packetLog
      .filter(p => p.universeId === universeId)
      .slice(-limit)
  }

  /**
   * Detect DMX issues
   */
  detectIssues(universeId: number): string[] {
    const issues: string[] = []
    const stats = this.statistics.get(universeId)

    if (!stats) {
      issues.push('Universe not initialized')
      return issues
    }

    // Check signal quality
    if (stats.signalQuality < 50) {
      issues.push('Low signal quality')
    }

    // Check for stuck channels
    stats.channels.forEach(ch => {
      if (ch.min === ch.max && ch.current > 0) {
        issues.push(`Channel ${ch.channel} appears stuck at ${ch.current}`)
      }
    })

    // Check for rapid changes (possible noise)
    const rapidChannels = stats.channels.filter(ch => ch.changes > 100)
    if (rapidChannels.length > 0) {
      issues.push(
        `${rapidChannels.length} channels showing rapid changes (possible noise)`
      )
    }

    // Check packet rate
    if (stats.totalPackets < 20) {
      issues.push('Low packet rate detected')
    }

    return issues
  }

  /**
   * Reset statistics for universe
   */
  resetUniverse(universeId: number): void {
    this.statistics.delete(universeId)
    this.packetLog = this.packetLog.filter(p => p.universeId !== universeId)
    this.initializeUniverse(universeId)
  }

  /**
   * Subscribe to statistics updates
   */
  subscribe(callback: (stats: UniverseStatistics) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Publish statistics to subscribers
   */
  private publishStats(stats: UniverseStatistics): void {
    this.subscribers.forEach(cb => cb(stats))
  }

  /**
   * Export analysis report
   */
  generateReport(universeId: number): string {
    const stats = this.statistics.get(universeId)
    if (!stats) return 'Universe not found'

    const activeChannels = stats.channels.filter(ch => ch.current > 0)
    const issues = this.detectIssues(universeId)

    const report = `
DMX Universe ${universeId} Analysis Report
Generated: ${new Date().toISOString()}

Signal Quality: ${stats.signalQuality}%
Total Packets: ${stats.totalPackets}
Last Update: ${new Date(stats.lastUpdate).toLocaleString()}

Active Channels: ${activeChannels.length}
Total Channels: ${stats.channels.length}

Top 10 Most Changed Channels:
${stats.channels
  .sort((a, b) => b.changes - a.changes)
  .slice(0, 10)
  .map(ch => `  Channel ${ch.channel}: ${ch.changes} changes (${ch.min}-${ch.max})`)
  .join('\n')}

Issues Detected: ${issues.length}
${issues.map(issue => `  - ${issue}`).join('\n')}
    `.trim()

    return report
  }

  /**
   * Export JSON analysis
   */
  exportJSON(universeId: number): string {
    const stats = this.statistics.get(universeId)
    if (!stats) return '{}'

    return JSON.stringify(
      {
        universeId,
        timestamp: new Date().toISOString(),
        signalQuality: stats.signalQuality,
        totalPackets: stats.totalPackets,
        activeChannels: stats.channels.filter(ch => ch.current > 0).length,
        issues: this.detectIssues(universeId),
        channels: stats.channels
      },
      null,
      2
    )
  }
}

export const dmxAnalyzer = new DMXAnalyzer()
