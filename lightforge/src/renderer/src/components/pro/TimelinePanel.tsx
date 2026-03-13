// ════════════════════════════════════════════════════════════════════════════
//  TimelinePanel — Super Scene timeline editor (Drag-drop scene sequencing)
// ════════════════════════════════════════════════════════════════════════════

import { useState, useRef } from 'react'
import type { Scene } from '../../../../shared/types'

interface TimelineEvent {
  id: string
  sceneId: string
  sceneName: string
  startTime: number // ms
  duration: number // ms
}

interface TimelinePanelProps {
  scene: Scene | null
  allScenes: Scene[]
  onAddTimingEvent?: (event: TimelineEvent) => void
  onRemoveTimingEvent?: (eventId: string) => void
  onUpdateTimingEvent?: (eventId: string, changes: Partial<TimelineEvent>) => void
}

export function TimelinePanel({
  scene,
  allScenes,
  onAddTimingEvent,
  onRemoveTimingEvent,
  onUpdateTimingEvent,
}: TimelinePanelProps): React.JSX.Element {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null)
  const [resizingEventId, setResizingEventId] = useState<string | null>(null)
  const [totalDuration, setTotalDuration] = useState(10000) // 10s default
  const timelineRef = useRef<HTMLDivElement>(null)

  if (!scene) {
    return (
      <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            Timeline (Super Scene)
          </h3>
        </div>
        <div className="flex items-center justify-center h-full text-slate-500">
          Wähle eine Szene aus
        </div>
      </div>
    )
  }

  const handleDragStart = (e: React.MouseEvent, eventId: string) => {
    e.preventDefault()
    setDraggingEventId(eventId)
  }

  const handleResizeStart = (e: React.MouseEvent, eventId: string) => {
    e.preventDefault()
    setResizingEventId(eventId)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!timelineRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const timePerPixel = totalDuration / rect.width
    const newTime = Math.max(0, x * timePerPixel)

    if (draggingEventId) {
      const event = events.find(ev => ev.id === draggingEventId)
      if (event && onUpdateTimingEvent) {
        onUpdateTimingEvent(draggingEventId, { startTime: newTime })
      }
    }

    if (resizingEventId) {
      const event = events.find(ev => ev.id === resizingEventId)
      if (event && onUpdateTimingEvent) {
        const duration = Math.max(100, newTime - event.startTime)
        onUpdateTimingEvent(resizingEventId, { duration })
      }
    }
  }

  const handleMouseUp = () => {
    setDraggingEventId(null)
    setResizingEventId(null)
  }

  const pixelsPerSecond = timelineRef.current?.clientWidth ? (timelineRef.current.clientWidth / (totalDuration / 1000)) : 100

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
          Timeline (Super Scene)
        </h3>
        <div className="text-xs text-slate-500 mt-1">
          Ziehe Szenen auf die Timeline
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-2 border-b border-slate-700 flex items-center gap-2 shrink-0">
        <label className="text-xs text-slate-400">Dauer:</label>
        <input
          type="number"
          min="1000"
          max="60000"
          step="1000"
          value={totalDuration}
          onChange={e => setTotalDuration(Number(e.target.value))}
          className="w-20 px-2 py-1 text-xs bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-xs text-slate-500">ms</span>
      </div>

      {/* Timeline Canvas */}
      <div className="flex-1 overflow-auto flex flex-col">
        <div
          ref={timelineRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative flex-1 bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700"
          style={{ minHeight: '300px' }}
        >
          {/* Time ruler */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-slate-800 border-b border-slate-700 flex">
            {Array.from({ length: 11 }).map((_, i) => {
              const time = (i / 10) * totalDuration
              const percent = (i / 10) * 100
              return (
                <div
                  key={i}
                  className="flex-1 border-r border-slate-700 text-xs text-slate-500 flex items-center justify-center"
                >
                  {(time / 1000).toFixed(1)}s
                </div>
              )
            })}
          </div>

          {/* Timeline events */}
          <div className="absolute top-8 left-0 right-0 bottom-0 p-2">
            {events.length === 0 ? (
              <div className="text-slate-600 text-xs italic">
                Keine Events. Erstelle neue oder ziehe Szenen hier hin.
              </div>
            ) : (
              events.map((event, idx) => {
                const leftPercent = (event.startTime / totalDuration) * 100
                const widthPercent = (event.duration / totalDuration) * 100
                return (
                  <div
                    key={event.id}
                    className="absolute top-0 bg-blue-600 hover:bg-blue-500 rounded border border-blue-400 group transition-colors cursor-move"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      height: '40px',
                      top: `${idx * 50}px`,
                    }}
                    onMouseDown={e => handleDragStart(e, event.id)}
                  >
                    <div className="px-2 py-1 text-xs font-semibold text-white truncate">
                      {event.sceneName}
                    </div>

                    {/* Resize handle */}
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1 bg-yellow-400 hover:bg-yellow-300 cursor-col-resize opacity-0 group-hover:opacity-100 transition-opacity"
                      onMouseDown={e => handleResizeStart(e, event.id)}
                    />

                    {/* Delete button */}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        if (onRemoveTimingEvent) {
                          onRemoveTimingEvent(event.id)
                          setEvents(events.filter(ev => ev.id !== event.id))
                        }
                      }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Scene selector */}
      <div className="px-4 py-3 border-t border-slate-700 shrink-0">
        <label className="text-xs text-slate-400 mb-2 block">
          + Szene hinzufügen
        </label>
        <select
          onChange={e => {
            const sceneId = e.target.value
            if (sceneId) {
              const selectedScene = allScenes.find(s => s.id === sceneId)
              if (selectedScene) {
                const newEvent: TimelineEvent = {
                  id: `event-${Date.now()}`,
                  sceneId,
                  sceneName: selectedScene.name,
                  startTime: (events[events.length - 1]?.startTime ?? 0) + (events[events.length - 1]?.duration ?? 0),
                  duration: 2000,
                }
                setEvents([...events, newEvent])
                if (onAddTimingEvent) onAddTimingEvent(newEvent)
                e.target.value = ''
              }
            }
          }}
          defaultValue=""
          className="w-full px-3 py-2 text-sm bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Wähle eine Szene --</option>
          {allScenes.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
