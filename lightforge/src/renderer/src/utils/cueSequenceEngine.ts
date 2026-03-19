/**
 * cueSequenceEngine.ts
 * Cue sequence management engine for Phase 4 Scene Builder
 * Handles cue creation, sequencing, timing, and playback
 */

export interface Cue {
  id: string
  name: string
  duration: number
  fadeIn: number
  fadeOut: number
  dmxValues: Record<string, number>
  metadata: {
    triggerMode: 'manual' | 'auto' | 'midi' | 'osc'
    bpmSync: boolean
    jumpToScene?: string
  }
}

export interface CueSequence {
  id: string
  name: string
  cues: Cue[]
  metadata: {
    totalDuration: number
    bpm: number
    loopMode: boolean
  }
}

/**
 * Create a new cue sequence
 */
export function createCueSequence(
  name: string,
  bpm: number = 120
): CueSequence {
  return {
    id: `sequence-${Date.now()}`,
    name,
    cues: [],
    metadata: {
      totalDuration: 0,
      bpm,
      loopMode: false,
    },
  }
}

/**
 * Add a cue to sequence
 */
export function addCue(sequence: CueSequence, cue: Cue, index?: number): CueSequence {
  const newCues = [...sequence.cues]

  if (index !== undefined && index >= 0 && index <= newCues.length) {
    newCues.splice(index, 0, cue)
  } else {
    newCues.push(cue)
  }

  return {
    ...sequence,
    cues: newCues,
    metadata: {
      ...sequence.metadata,
      totalDuration: calculateSequenceDuration(newCues),
    },
  }
}

/**
 * Remove a cue from sequence
 */
export function removeCue(sequence: CueSequence, cueId: string): CueSequence {
  const newCues = sequence.cues.filter((c) => c.id !== cueId)

  return {
    ...sequence,
    cues: newCues,
    metadata: {
      ...sequence.metadata,
      totalDuration: calculateSequenceDuration(newCues),
    },
  }
}

/**
 * Reorder cues in sequence
 */
export function reorderCues(
  sequence: CueSequence,
  oldIndex: number,
  newIndex: number
): CueSequence {
  if (
    oldIndex < 0 ||
    oldIndex >= sequence.cues.length ||
    newIndex < 0 ||
    newIndex >= sequence.cues.length
  ) {
    return sequence
  }

  const newCues = [...sequence.cues]
  const [removed] = newCues.splice(oldIndex, 1)
  newCues.splice(newIndex, 0, removed)

  return {
    ...sequence,
    cues: newCues,
  }
}

/**
 * Update cue properties
 */
export function updateCue(
  sequence: CueSequence,
  cueId: string,
  updates: Partial<Cue>
): CueSequence {
  return {
    ...sequence,
    cues: sequence.cues.map((c) =>
      c.id === cueId ? { ...c, ...updates } : c
    ),
    metadata: {
      ...sequence.metadata,
      totalDuration: calculateSequenceDuration(
        sequence.cues.map((c) =>
          c.id === cueId ? { ...c, ...updates } : c
        )
      ),
    },
  }
}

/**
 * Calculate total duration of sequence
 */
export function calculateSequenceDuration(cues: Cue[]): number {
  return cues.reduce((total, cue) => total + cue.duration, 0)
}

/**
 * Calculate timing for BPM sync
 */
export function calculateBPMTiming(bpm: number, beatCount: number): number {
  const beatDuration = (60 / bpm) * 1000 // ms per beat
  return beatDuration * beatCount
}

/**
 * Get current cue at time
 */
export function getCurrentCue(
  sequence: CueSequence,
  timeMs: number
): { cue: Cue; index: number; elapsed: number; progress: number } | null {
  let accumulated = 0

  for (let i = 0; i < sequence.cues.length; i++) {
    const cue = sequence.cues[i]
    const nextAccumulated = accumulated + cue.duration

    if (timeMs >= accumulated && timeMs < nextAccumulated) {
      const elapsed = timeMs - accumulated
      const progress = elapsed / cue.duration

      return {
        cue,
        index: i,
        elapsed,
        progress,
      }
    }

    accumulated = nextAccumulated
  }

  return null
}

/**
 * Get next cue
 */
export function getNextCue(
  sequence: CueSequence,
  currentIndex: number
): Cue | null {
  if (currentIndex < sequence.cues.length - 1) {
    return sequence.cues[currentIndex + 1]
  }

  if (sequence.metadata.loopMode && sequence.cues.length > 0) {
    return sequence.cues[0]
  }

  return null
}

/**
 * Calculate crossfade at cue boundary
 */
export function calculateCrossfade(
  fromCue: Cue,
  toCue: Cue,
  progress: number
): Record<string, number> {
  const result: Record<string, number> = {}

  // Get all channels from both cues
  const allChannels = new Set([
    ...Object.keys(fromCue.dmxValues),
    ...Object.keys(toCue.dmxValues),
  ])

  // Calculate fade duration (max of fadeOut and fadeIn)
  const fadeDuration = Math.max(fromCue.fadeOut, toCue.fadeIn)

  if (fadeDuration === 0) {
    // Instant switch
    return toCue.dmxValues
  }

  const fadeProgress = Math.min(1, progress / fadeDuration)

  for (const channel of allChannels) {
    const fromValue = fromCue.dmxValues[channel] || 0
    const toValue = toCue.dmxValues[channel] || 0

    result[channel] =
      Math.floor(fromValue * (1 - fadeProgress) + toValue * fadeProgress)
  }

  return result
}

/**
 * Merge sequences
 */
export function mergeSequences(
  seq1: CueSequence,
  seq2: CueSequence,
  mode: 'concat' | 'interleave' | 'overlay' = 'concat'
): CueSequence {
  let merged: Cue[] = []

  switch (mode) {
    case 'concat':
      merged = [...seq1.cues, ...seq2.cues]
      break

    case 'interleave':
      for (let i = 0; i < Math.max(seq1.cues.length, seq2.cues.length); i++) {
        if (i < seq1.cues.length) merged.push(seq1.cues[i])
        if (i < seq2.cues.length) merged.push(seq2.cues[i])
      }
      break

    case 'overlay':
      // Overlay seq2 on top of seq1
      merged = seq1.cues.map((cue, idx) => {
        if (idx < seq2.cues.length) {
          return {
            ...cue,
            dmxValues: {
              ...cue.dmxValues,
              ...seq2.cues[idx].dmxValues,
            },
          }
        }
        return cue
      })

      if (seq2.cues.length > seq1.cues.length) {
        merged.push(...seq2.cues.slice(seq1.cues.length))
      }
      break
  }

  return {
    id: `sequence-merged-${Date.now()}`,
    name: `${seq1.name} + ${seq2.name}`,
    cues: merged,
    metadata: {
      totalDuration: calculateSequenceDuration(merged),
      bpm: seq1.metadata.bpm,
      loopMode: seq1.metadata.loopMode,
    },
  }
}

/**
 * Validate cue sequence
 */
export function validateSequence(sequence: CueSequence): string[] {
  const errors: string[] = []

  if (sequence.cues.length === 0) {
    errors.push('Sequence must have at least one cue')
  }

  for (let i = 0; i < sequence.cues.length; i++) {
    const cue = sequence.cues[i]

    if (cue.duration < 100) {
      errors.push(`Cue ${i}: Duration too short (< 100ms)`)
    }

    if (cue.fadeIn + cue.fadeOut > cue.duration) {
      errors.push(`Cue ${i}: Crossfade duration exceeds cue duration`)
    }
  }

  return errors
}

/**
 * Export sequence to JSON
 */
export function exportSequence(sequence: CueSequence): string {
  return JSON.stringify(sequence, null, 2)
}

/**
 * Import sequence from JSON
 */
export function importSequence(json: string): CueSequence | null {
  try {
    const parsed = JSON.parse(json)
    return parsed as CueSequence
  } catch {
    return null
  }
}
