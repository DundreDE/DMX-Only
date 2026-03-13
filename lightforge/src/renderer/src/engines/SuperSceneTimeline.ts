/**
 * SuperScene.ts
 * Super Scene Timeline for Daslight 5
 * Complex shows combining multiple scenes with audio sync
 */

import { Scene } from './PlaybackEngine'

export interface TimelineTrack {
  id: string
  name: string
  type: 'scene' | 'audio' | 'control'
  clips: TimelineClip[]
}

export interface TimelineClip {
  id: string
  trackId: string
  startTime: number // in ms
  duration: number  // in ms
  content: Scene | AudioContent | ControlEvent
}

export interface AudioContent {
  url: string
  duration: number
  bpm?: number
}

export interface ControlEvent {
  type: 'cue' | 'marker' | 'transition'
  label: string
  metadata?: Record<string, any>
}

export interface SuperSceneTimeline {
  id: string
  name: string
  duration: number
  bpm?: number
  tracks: TimelineTrack[]
  markers: TimelineMarker[]
  automation: AutomationTrack[]
}

export interface TimelineMarker {
  id: string
  time: number
  label: string
  color?: string
}

export interface AutomationTrack {
  id: string
  parameter: string // e.g., 'master-dimmer', 'speed'
  keyframes: AutomationKeyframe[]
}

export interface AutomationKeyframe {
  time: number
  value: number
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
}

/**
 * Super Scene Timeline - complex show composition
 */
export class SuperSceneTimeline {
  private timeline: SuperSceneTimeline
  private currentTime: number = 0
  private isPlaying: boolean = false
  private updateHandlers: ((time: number, clips: TimelineClip[]) => void)[] = []

  constructor(name: string) {
    this.timeline = {
      id: `superscene-${Date.now()}`,
      name,
      duration: 0,
      tracks: [],
      markers: [],
      automation: [],
    }
  }

  /**
   * Create new track
   */
  public addTrack(name: string, type: 'scene' | 'audio' | 'control'): TimelineTrack {
    const track: TimelineTrack = {
      id: `track-${Date.now()}`,
      name,
      type,
      clips: [],
    }
    this.timeline.tracks.push(track)
    return track
  }

  /**
   * Add clip to track
   */
  public addClip(
    trackId: string,
    startTime: number,
    duration: number,
    content: Scene | AudioContent | ControlEvent
  ): TimelineClip | null {
    const track = this.timeline.tracks.find((t) => t.id === trackId)
    if (!track) return null

    const clip: TimelineClip = {
      id: `clip-${Date.now()}`,
      trackId,
      startTime,
      duration,
      content,
    }

    track.clips.push(clip)
    track.clips.sort((a, b) => a.startTime - b.startTime)

    this.updateDuration()
    return clip
  }

  /**
   * Remove clip
   */
  public removeClip(trackId: string, clipId: string): boolean {
    const track = this.timeline.tracks.find((t) => t.id === trackId)
    if (!track) return false

    const idx = track.clips.findIndex((c) => c.id === clipId)
    if (idx > -1) {
      track.clips.splice(idx, 1)
      this.updateDuration()
      return true
    }
    return false
  }

  /**
   * Move clip
   */
  public moveClip(
    trackId: string,
    clipId: string,
    newStartTime: number,
    newDuration?: number
  ): boolean {
    const track = this.timeline.tracks.find((t) => t.id === trackId)
    if (!track) return false

    const clip = track.clips.find((c) => c.id === clipId)
    if (!clip) return false

    clip.startTime = newStartTime
    if (newDuration !== undefined) {
      clip.duration = newDuration
    }

    track.clips.sort((a, b) => a.startTime - b.startTime)
    this.updateDuration()
    return true
  }

  /**
   * Get clips at time
   */
  public getClipsAtTime(time: number): TimelineClip[] {
    const clips: TimelineClip[] = []

    for (const track of this.timeline.tracks) {
      for (const clip of track.clips) {
        if (time >= clip.startTime && time < clip.startTime + clip.duration) {
          clips.push(clip)
        }
      }
    }

    return clips
  }

  /**
   * Add marker
   */
  public addMarker(time: number, label: string, color?: string): TimelineMarker {
    const marker: TimelineMarker = {
      id: `marker-${Date.now()}`,
      time,
      label,
      color,
    }
    this.timeline.markers.push(marker)
    this.timeline.markers.sort((a, b) => a.time - b.time)
    return marker
  }

  /**
   * Remove marker
   */
  public removeMarker(markerId: string): boolean {
    const idx = this.timeline.markers.findIndex((m) => m.id === markerId)
    if (idx > -1) {
      this.timeline.markers.splice(idx, 1)
      return true
    }
    return false
  }

  /**
   * Add automation keyframe
   */
  public addAutomationKeyframe(
    parameter: string,
    time: number,
    value: number,
    easing?: string
  ): void {
    let track = this.timeline.automation.find((t) => t.parameter === parameter)
    if (!track) {
      track = {
        id: `auto-${Date.now()}`,
        parameter,
        keyframes: [],
      }
      this.timeline.automation.push(track)
    }

    track.keyframes.push({ time, value, easing: easing as any })
    track.keyframes.sort((a, b) => a.time - b.time)
  }

  /**
   * Get automation value at time
   */
  public getAutomationValue(parameter: string, time: number): number | null {
    const track = this.timeline.automation.find((t) => t.parameter === parameter)
    if (!track || track.keyframes.length === 0) return null

    if (time <= track.keyframes[0].time) {
      return track.keyframes[0].value
    }

    if (time >= track.keyframes[track.keyframes.length - 1].time) {
      return track.keyframes[track.keyframes.length - 1].value
    }

    for (let i = 0; i < track.keyframes.length - 1; i++) {
      const k1 = track.keyframes[i]
      const k2 = track.keyframes[i + 1]

      if (time >= k1.time && time <= k2.time) {
        const range = k2.time - k1.time
        const progress = (time - k1.time) / range
        const eased = this.easeProgress(progress, k2.easing || 'linear')
        return Math.floor(k1.value + (k2.value - k1.value) * eased)
      }
    }

    return null
  }

  private easeProgress(progress: number, easing: string): number {
    switch (easing) {
      case 'easeIn':
        return progress * progress
      case 'easeOut':
        return 1 - (1 - progress) * (1 - progress)
      case 'easeInOut':
        return progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2
      case 'linear':
      default:
        return progress
    }
  }

  /**
   * Play timeline
   */
  public play(): void {
    this.isPlaying = true
  }

  /**
   * Pause timeline
   */
  public pause(): void {
    this.isPlaying = false
  }

  /**
   * Seek to time
   */
  public seek(time: number): void {
    this.currentTime = Math.max(0, Math.min(time, this.timeline.duration))
    this.notifyUpdate()
  }

  /**
   * Update timeline
   */
  public update(deltaTime: number): void {
    if (!this.isPlaying) return

    this.currentTime += deltaTime

    if (this.currentTime >= this.timeline.duration) {
      this.currentTime = this.timeline.duration
      this.isPlaying = false
    }

    this.notifyUpdate()
  }

  private notifyUpdate(): void {
    const clips = this.getClipsAtTime(this.currentTime)
    for (const handler of this.updateHandlers) {
      handler(this.currentTime, clips)
    }
  }

  /**
   * Subscribe to updates
   */
  public onUpdate(handler: (time: number, clips: TimelineClip[]) => void): () => void {
    this.updateHandlers.push(handler)
    return () => {
      const idx = this.updateHandlers.indexOf(handler)
      if (idx > -1) this.updateHandlers.splice(idx, 1)
    }
  }

  private updateDuration(): void {
    let maxTime = 0
    for (const track of this.timeline.tracks) {
      for (const clip of track.clips) {
        maxTime = Math.max(maxTime, clip.startTime + clip.duration)
      }
    }
    this.timeline.duration = maxTime
  }

  /**
   * Get timeline data
   */
  public getTimeline(): SuperSceneTimeline {
    return this.timeline
  }

  /**
   * Set BPM
   */
  public setBPM(bpm: number): void {
    this.timeline.bpm = bpm
  }

  /**
   * Export to JSON
   */
  public export(): string {
    return JSON.stringify(this.timeline, null, 2)
  }

  /**
   * Import from JSON
   */
  public import(json: string): boolean {
    try {
      const data = JSON.parse(json)
      this.timeline = data
      return true
    } catch {
      return false
    }
  }

  /**
   * Get current state
   */
  public getState(): {
    currentTime: number
    duration: number
    isPlaying: boolean
    trackCount: number
    clipCount: number
  } {
    let clipCount = 0
    for (const track of this.timeline.tracks) {
      clipCount += track.clips.length
    }

    return {
      currentTime: this.currentTime,
      duration: this.timeline.duration,
      isPlaying: this.isPlaying,
      trackCount: this.timeline.tracks.length,
      clipCount,
    }
  }
}
