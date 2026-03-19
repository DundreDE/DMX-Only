import React, { useState, useRef, useCallback, useMemo } from 'react'
import { Panel, Button, Slider, Badge } from './UIComponents'
import type { Scene, SceneEffect } from '../../../shared/types'
import { calcExtendedWave } from '../engines/EnhancedEffectSystem'

interface TimelineData {
  bars: number // 4 bars = 4 beats per bar
  beatDivision: 4 | 8 | 16 // Subdivisions per beat
  zoom: number // 0.5 - 4.0
}

interface TimelineMarker {
  time: number // seconds
  label: string
  type: 'cue' | 'beat' | 'bar'
}

/**
 * Professional Scene Editor Timeline Component (DasLight-style)
 * Beat-based timeline with effect visualization and draggable handles
 */
export const SceneEditorTimeline: React.FC<{
  scene: Scene
  effects: SceneEffect[]
  onEffectSelect: (effect: SceneEffect) => void
  onTimelineChange: (data: Partial<TimelineData>) => void
}> = ({ scene, effects, onEffectSelect, onTimelineChange }) => {
  const [timelineData, setTimelineData] = useState<TimelineData>({
    bars: 4,
    beatDivision: 4,
    zoom: 1
  })
  const [playbackTime, setPlaybackTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate timeline dimensions
  const beatWidth = 60 * timelineData.zoom // pixels per beat
  const barWidth = beatWidth * 4
  const totalWidth = barWidth * timelineData.bars
  const barDuration = 4 // seconds (assuming 120 BPM, standard 4/4 time)
  const totalDuration = barDuration * timelineData.bars

  // Generate timeline markers
  const markers = useMemo<TimelineMarker[]>(() => {
    const result: TimelineMarker[] = []
    const beatDur = barDuration / 4

    for (let bar = 0; bar < timelineData.bars; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        const time = (bar * 4 + beat) * beatDur
        
        if (beat === 0) {
          result.push({ time, label: `${bar + 1}`, type: 'bar' })
        } else {
          result.push({ time, label: '', type: 'beat' })
        }

        // Sub-beat divisions
        const subDur = beatDur / (timelineData.beatDivision - 1)
        for (let sub = 1; sub < timelineData.beatDivision; sub++) {
          result.push({ time: time + sub * subDur, label: '', type: 'cue' })
        }
      }
    }

    return result
  }, [timelineData.bars, timelineData.beatDivision, barDuration])

  // Draw timeline canvas
  const drawTimeline = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = totalWidth + 40
    const height = 120

    ctx.fillStyle = 'var(--color-bg-input)'
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = 'var(--color-border)'
    ctx.lineWidth = 1

    markers.forEach(marker => {
      const x = 20 + (marker.time / totalDuration) * totalWidth

      if (marker.type === 'bar') {
        ctx.strokeStyle = 'var(--color-text-primary)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()

        ctx.fillStyle = 'var(--color-text-primary)'
        ctx.font = 'bold 12px Inter'
        ctx.fillText(marker.label, x + 5, 15)
      } else if (marker.type === 'beat') {
        ctx.strokeStyle = 'var(--color-border-hover)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, height - 20)
        ctx.lineTo(x, height)
        ctx.stroke()
      } else {
        ctx.strokeStyle = 'var(--color-text-muted)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, height - 10)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
    })

    // Draw effect waveforms
    ctx.fillStyle = 'var(--color-accent-dim)'
    effects.forEach((effect, idx) => {
      const yOffset = 40 + idx * 15
      const sampleRate = totalWidth / totalDuration / 10 // Samples per pixel

      for (let px = 0; px < totalWidth; px++) {
        const t = (px / totalWidth) * totalDuration
        const value = calcExtendedWave(
          effect.wave,
          t,
          effect.speed,
          effect.size,
          effect.base,
          effect.offset
        )

        const normalizedValue = (value - 127) / 127
        const waveHeight = normalizedValue * 6

        ctx.fillRect(20 + px, yOffset + 7 - waveHeight, 1, Math.abs(waveHeight) * 2)
      }
    })

    // Draw playback line
    if (isPlaying || playbackTime > 0) {
      const lineX = 20 + (playbackTime / totalDuration) * totalWidth
      ctx.strokeStyle = 'var(--color-success)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(lineX, 0)
      ctx.lineTo(lineX, height)
      ctx.stroke()
    }
  }, [markers, effects, totalWidth, totalDuration, isPlaying, playbackTime])

  React.useEffect(() => {
    drawTimeline()
  }, [drawTimeline])

  // Playback loop
  React.useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setPlaybackTime(prev => {
        const next = prev + 0.016 // ~60fps
        return next >= totalDuration ? 0 : next
      })
    }, 16)

    return () => clearInterval(interval)
  }, [isPlaying, totalDuration])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - 20
    const time = (x / totalWidth) * totalDuration
    setPlaybackTime(Math.max(0, Math.min(time, totalDuration)))
  }

  return (
    <Panel header="Scene Timeline Editor">
      {/* Controls */}
      <div className="flex gap-3 mb-4 items-center bg-[var(--color-bg-input)] p-3 rounded">
        <Button
          variant={isPlaying ? 'danger' : 'primary'}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? '⏸ Stop' : '▶ Play'}
        </Button>

        <div className="text-sm text-[var(--color-text-secondary)]">
          {playbackTime.toFixed(2)}s / {totalDuration.toFixed(2)}s
        </div>

        <Slider
          min={0}
          max={totalDuration}
          step={0.01}
          value={playbackTime}
          onChange={(e) => setPlaybackTime(Number(e.target.value))}
          style={{ flex: 1 }}
        />
      </div>

      {/* Timeline Grid */}
      <div ref={containerRef} className="border border-[var(--color-border)] rounded mb-4 overflow-x-auto">
        <canvas
          ref={canvasRef}
          width={totalWidth + 40}
          height={120 + effects.length * 15}
          onClick={handleCanvasClick}
          className="cursor-pointer"
        />
      </div>

      {/* Effects List */}
      <div className="space-y-2 mb-4">
        <h3 className="font-semibold text-sm">Effects ({effects.length})</h3>
        {effects.map((effect) => (
          <div
            key={effect.id}
            onClick={() => onEffectSelect(effect)}
            className="flex items-center gap-3 p-2 bg-[var(--color-bg-input)] rounded cursor-pointer hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <Badge variant="primary">{effect.target}</Badge>
            <span className="font-semibold text-sm">{effect.label}</span>
            <span className="text-xs text-[var(--color-text-secondary)] ml-auto">
              {effect.speed} BPM · {effect.wave}
            </span>
          </div>
        ))}
      </div>

      {/* Timeline Settings */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--color-border)]">
        <div>
          <label className="label">Bars</label>
          <input
            type="number"
            min={1}
            max={16}
            value={timelineData.bars}
            onChange={(e) => {
              const newData = { ...timelineData, bars: Number(e.target.value) }
              setTimelineData(newData)
              onTimelineChange(newData)
            }}
            className="input w-full"
          />
        </div>

        <div>
          <label className="label">Beat Division</label>
          <select
            value={timelineData.beatDivision}
            onChange={(e) => {
              const newData = { ...timelineData, beatDivision: Number(e.target.value) as any }
              setTimelineData(newData)
              onTimelineChange(newData)
            }}
            className="input w-full"
          >
            <option value={4}>Quarters</option>
            <option value={8}>Eighths</option>
            <option value={16}>Sixteenths</option>
          </select>
        </div>

        <div>
          <label className="label">Zoom</label>
          <Slider
            min={0.5}
            max={4}
            step={0.1}
            value={timelineData.zoom}
            onChange={(e) => {
              const newData = { ...timelineData, zoom: Number(e.target.value) }
              setTimelineData(newData)
              onTimelineChange(newData)
            }}
          />
        </div>
      </div>
    </Panel>
  )
}

/**
 * Effect Layer Visualizer
 * Shows stacked effects with visibility toggle
 */
export const EffectLayerVisualizer: React.FC<{
  effects: SceneEffect[]
  onToggleVisibility: (effectId: string) => void
  onDelete: (effectId: string) => void
}> = ({ effects, onToggleVisibility, onDelete }) => {
  const [visibleEffects, setVisibleEffects] = useState<Set<string>>(
    new Set(effects.map(e => e.id))
  )

  const toggle = (id: string) => {
    const updated = new Set(visibleEffects)
    if (updated.has(id)) updated.delete(id)
    else updated.add(id)
    setVisibleEffects(updated)
    onToggleVisibility(id)
  }

  return (
    <div className="space-y-2">
      {effects.map((effect, idx) => (
        <div
          key={effect.id}
          className="flex items-center gap-2 p-2 bg-[var(--color-bg-input)] rounded"
        >
          <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold bg-[var(--color-accent)]">
            {idx + 1}
          </div>

          <button
            onClick={() => toggle(effect.id)}
            className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs transition-colors ${
              visibleEffects.has(effect.id)
                ? 'border-[var(--color-success)] bg-[var(--color-success)]'
                : 'border-[var(--color-border)] bg-transparent'
            }`}
          >
            {visibleEffects.has(effect.id) ? '✓' : ''}
          </button>

          <div className="flex-1">
            <p className="font-semibold text-sm">{effect.label}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {effect.wave} • {effect.speed} BPM
            </p>
          </div>

          <Button variant="danger" onClick={() => onDelete(effect.id)}>
            ✕
          </Button>
        </div>
      ))}
    </div>
  )
}
