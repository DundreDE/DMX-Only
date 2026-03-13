import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

interface Cue {
  id: string
  name: string
  duration: number
  fadeIn: number
  fadeOut: number
}

interface TimelineProps {
  cues: Cue[]
  selectedCueId: string
  onSelectCue: (cueId: string) => void
  onReorderCues: (oldIndex: number, newIndex: number) => void
  onDeleteCue: (cueId: string) => void
  onDuplicateCue: (cueId: string) => void
}

export const CueTimeline: React.FC<TimelineProps> = ({
  cues,
  selectedCueId,
  onSelectCue,
  onReorderCues,
  onDeleteCue,
  onDuplicateCue,
}) => {
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalDuration = cues.reduce((sum, cue) => sum + cue.duration, 0)
  const pixelsPerMs = containerRef.current ? (containerRef.current.offsetWidth - 20) / totalDuration : 1

  const handleDragStart = (idx: number) => {
    setDraggingIdx(idx)
  }

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    if (draggingIdx === null || draggingIdx === idx) return

    // Visual feedback
    const el = e.currentTarget as HTMLElement
    if (idx > draggingIdx) {
      el.style.borderRight = '3px solid #3b82f6'
    } else {
      el.style.borderLeft = '3px solid #3b82f6'
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement
    el.style.borderLeft = ''
    el.style.borderRight = ''
  }

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault()
    const el = e.currentTarget as HTMLElement
    el.style.borderLeft = ''
    el.style.borderRight = ''

    if (draggingIdx === null || draggingIdx === idx) {
      setDraggingIdx(null)
      return
    }

    onReorderCues(draggingIdx, idx)
    setDraggingIdx(null)
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col overflow-y-auto p-2 gap-1">
      {cues.map((cue, idx) => {
        const isSelected = cue.id === selectedCueId
        const width = cue.duration * pixelsPerMs
        const fadeInPercent = (cue.fadeIn / cue.duration) * 100
        const fadeOutPercent = (cue.fadeOut / cue.duration) * 100

        return (
          <div
            key={cue.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, idx)}
            className={`flex items-stretch gap-2 p-2 rounded transition cursor-move ${
              isSelected ? 'bg-blue-900 border-2 border-blue-500' : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            {/* Cue Info */}
            <div
              onClick={() => onSelectCue(cue.id)}
              className="w-24 flex flex-col justify-center flex-shrink-0 cursor-pointer"
            >
              <div className="text-xs font-medium">{cue.name}</div>
              <div className="text-xs text-slate-400">{(cue.duration / 1000).toFixed(1)}s</div>
            </div>

            {/* Timeline Bar */}
            <div className="flex-1 flex items-center h-10 bg-slate-700 rounded relative overflow-hidden">
              {/* Fade In Indicator */}
              {cue.fadeIn > 0 && (
                <div
                  className="absolute left-0 top-0 bottom-0 bg-blue-500/30 border-r border-blue-400"
                  style={{ width: `${fadeInPercent}%` }}
                  title={`Fade In: ${cue.fadeIn}ms`}
                />
              )}

              {/* Fade Out Indicator */}
              {cue.fadeOut > 0 && (
                <div
                  className="absolute right-0 top-0 bottom-0 bg-orange-500/30 border-l border-orange-400"
                  style={{ width: `${fadeOutPercent}%` }}
                  title={`Fade Out: ${cue.fadeOut}ms`}
                />
              )}

              {/* Center Duration */}
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-300 pointer-events-none">
                <span className="bg-slate-900 px-2 py-1 rounded">{(cue.duration / 1000).toFixed(2)}s</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicateCue(cue.id)
                }}
                className="px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 rounded transition"
                title="Duplicate Cue"
              >
                ⬛
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteCue(cue.id)
                }}
                className="px-2 py-1 text-xs bg-red-900 hover:bg-red-800 rounded transition"
                title="Delete Cue"
              >
                ✕
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
