/**
 * Show Sequencer - Automated light shows with scene sequencing
 * Professional show programming like DasLight
 */

export interface ShowStep {
  id: string
  sceneId: string
  duration: number // ms
  fadeTime: number // ms fade in
  effects: string[] // effect IDs to apply
  order: number
}

export interface AutomatedShow {
  id: string
  name: string
  description: string
  steps: ShowStep[]
  totalDuration: number
  loopable: boolean
  bpm: number
  isPlaying: boolean
  currentStep: number
}

/**
 * Show Sequencer Manager
 */
export class ShowSequencer {
  private shows: Map<string, AutomatedShow> = new Map()
  private playingShows: Map<string, NodeJS.Timeout> = new Map()
  private subscribers: Set<(show: AutomatedShow) => void> = new Set()

  /**
   * Create new show
   */
  createShow(name: string, steps: Omit<ShowStep, 'id' | 'order'>[] = []): AutomatedShow {
    const stepsWithMeta = steps.map((s, idx) => ({
      ...s,
      id: `step_${Date.now()}_${idx}`,
      order: idx
    }))

    const totalDuration = stepsWithMeta.reduce((sum, s) => sum + s.duration, 0)

    const show: AutomatedShow = {
      id: `show_${Date.now()}`,
      name,
      description: '',
      steps: stepsWithMeta,
      totalDuration,
      loopable: true,
      bpm: 120,
      isPlaying: false,
      currentStep: 0
    }

    this.shows.set(show.id, show)
    this.saveShows()
    return show
  }

  /**
   * Add step to show
   */
  addStepToShow(showId: string, step: Omit<ShowStep, 'id' | 'order'>): void {
    const show = this.shows.get(showId)
    if (!show) return

    const newStep: ShowStep = {
      ...step,
      id: `step_${Date.now()}`,
      order: show.steps.length
    }

    show.steps.push(newStep)
    this.updateShowDuration(showId)
    this.saveShows()
  }

  /**
   * Play show
   */
  playShow(showId: string): void {
    const show = this.shows.get(showId)
    if (!show) return

    show.isPlaying = true
    show.currentStep = 0

    this.executeShowStep(show)
  }

  /**
   * Execute show step
   */
  private executeShowStep(show: AutomatedShow): void {
    if (!show.isPlaying || show.currentStep >= show.steps.length) {
      if (show.loopable && show.isPlaying) {
        show.currentStep = 0
        this.executeShowStep(show)
      } else {
        show.isPlaying = false
      }
      return
    }

    const step = show.steps[show.currentStep]!
    const timeout = setTimeout(() => {
      console.log(`Show "${show.name}" - Step ${show.currentStep + 1}/${show.steps.length}`)

      // Notify subscribers
      this.subscribers.forEach(cb => cb(show))

      show.currentStep++
      this.executeShowStep(show)
    }, step.duration)

    this.playingShows.set(show.id, timeout)
  }

  /**
   * Pause show
   */
  pauseShow(showId: string): void {
    const show = this.shows.get(showId)
    if (show) {
      show.isPlaying = false
      const timeout = this.playingShows.get(showId)
      if (timeout) clearTimeout(timeout)
    }
  }

  /**
   * Stop show
   */
  stopShow(showId: string): void {
    const show = this.shows.get(showId)
    if (show) {
      show.isPlaying = false
      show.currentStep = 0
      const timeout = this.playingShows.get(showId)
      if (timeout) clearTimeout(timeout)
    }
  }

  /**
   * Update show duration
   */
  private updateShowDuration(showId: string): void {
    const show = this.shows.get(showId)
    if (show) {
      show.totalDuration = show.steps.reduce((sum, s) => sum + s.duration, 0)
    }
  }

  /**
   * Get show
   */
  getShow(showId: string): AutomatedShow | undefined {
    return this.shows.get(showId)
  }

  /**
   * Get all shows
   */
  getAllShows(): AutomatedShow[] {
    return Array.from(this.shows.values())
  }

  /**
   * Delete show
   */
  deleteShow(showId: string): void {
    this.stopShow(showId)
    this.shows.delete(showId)
    this.saveShows()
  }

  /**
   * Duplicate show
   */
  duplicateShow(showId: string, newName: string): AutomatedShow | null {
    const original = this.shows.get(showId)
    if (!original) return null

    const newShow = this.createShow(newName, original.steps)
    newShow.bpm = original.bpm
    newShow.loopable = original.loopable
    return newShow
  }

  /**
   * Subscribe to show updates
   */
  subscribe(callback: (show: AutomatedShow) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * Export show
   */
  exportShow(showId: string): string | null {
    const show = this.shows.get(showId)
    if (!show) return null
    return JSON.stringify(show, null, 2)
  }

  /**
   * Import show
   */
  importShow(jsonData: string): AutomatedShow | null {
    try {
      const show = JSON.parse(jsonData) as AutomatedShow
      show.id = `show_${Date.now()}`
      show.isPlaying = false
      this.shows.set(show.id, show)
      this.saveShows()
      return show
    } catch (error) {
      console.error('Failed to import show:', error)
      return null
    }
  }

  /**
   * Save shows
   */
  private saveShows(): void {
    const data = Array.from(this.shows.values()).map(s => ({
      ...s,
      isPlaying: false
    }))
    localStorage.setItem('light_shows', JSON.stringify(data))
  }

  /**
   * Load shows
   */
  loadShows(): void {
    try {
      const data = localStorage.getItem('light_shows')
      if (data) {
        const shows = JSON.parse(data) as AutomatedShow[]
        shows.forEach(s => this.shows.set(s.id, s))
      }
    } catch (error) {
      console.error('Failed to load shows:', error)
    }
  }
}

export const showSequencer = new ShowSequencer()
