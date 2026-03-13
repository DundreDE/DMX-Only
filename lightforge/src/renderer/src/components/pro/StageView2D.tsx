// ════════════════════════════════════════════════════════════════════════════
//  Stage View 2D — Canvas-based fixture visualization (Daslight-style)
// ════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react'
import type { PatchedFixture, FixtureDefinition } from '../../../../shared/types'

interface StageView2DProps {
  fixtures: PatchedFixture[]
  library: FixtureDefinition[]
  selectedFixtureIds: Set<string>
  onSelectFixtures: (ids: Set<string>, multiSelect: boolean) => void
}

interface FixturePosition {
  id: string
  x: number
  y: number
  name: string
  type: string
}

export function StageView2D({
  fixtures,
  library,
  selectedFixtureIds,
  onSelectFixtures,
}: StageView2DProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [positions, setPositions] = useState<FixturePosition[]>([])
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [selectRect, setSelectRect] = useState<{
    x1: number
    y1: number
    x2: number
    y2: number
  } | null>(null)

  // Initialize positions (simple grid layout)
  useEffect(() => {
    const cols = Math.ceil(Math.sqrt(fixtures.length))
    const positions: FixturePosition[] = fixtures.map((fx, idx) => ({
      id: fx.id,
      x: (idx % cols) * 60 + 40,
      y: Math.floor(idx / cols) * 60 + 40,
      name: fx.label,
      type: library.find(d => d.id === fx.definitionId)?.type ?? 'Generic',
    }))
    setPositions(positions)
  }, [fixtures, library])

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Grid
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 1
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvas.width, i)
      ctx.stroke()
    }

    // Draw fixtures
    positions.forEach(pos => {
      const isSelected = selectedFixtureIds.has(pos.id)
      const x = pos.x
      const y = pos.y
      const radius = 15

      // Fixture circle
      ctx.fillStyle = isSelected ? '#3b82f6' : '#475569'
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()

      // Selected highlight
      if (isSelected) {
        ctx.strokeStyle = '#60a5fa'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Label
      ctx.fillStyle = '#e2e8f0'
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(pos.name.substring(0, 3), x, y)
    })

    // Draw selection rect
    if (selectRect) {
      ctx.strokeStyle = '#60a5fa'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.strokeRect(
        selectRect.x1,
        selectRect.y1,
        selectRect.x2 - selectRect.x1,
        selectRect.y2 - selectRect.y1,
      )
      ctx.setLineDash([])
    }
  }, [positions, selectedFixtureIds, selectRect])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicking on fixture
    let clickedId: string | null = null
    for (const pos of positions) {
      const dist = Math.hypot(pos.x - x, pos.y - y)
      if (dist < 20) {
        clickedId = pos.id
        break
      }
    }

    if (clickedId) {
      if (e.ctrlKey || e.metaKey) {
        // Multi-select toggle
        const newSet = new Set(selectedFixtureIds)
        if (newSet.has(clickedId)) newSet.delete(clickedId)
        else newSet.add(clickedId)
        onSelectFixtures(newSet, true)
      } else {
        // Single select
        onSelectFixtures(new Set([clickedId]), false)
      }
    } else {
      // Start drag-select
      setDragStart({ x, y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    if (!dragStart) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setSelectRect({ x1: dragStart.x, y1: dragStart.y, x2: x, y2: y })
  }

  const handleMouseUp = (): void => {
    if (selectRect) {
      const x1 = Math.min(selectRect.x1, selectRect.x2)
      const x2 = Math.max(selectRect.x1, selectRect.x2)
      const y1 = Math.min(selectRect.y1, selectRect.y2)
      const y2 = Math.max(selectRect.y1, selectRect.y2)

      const selected = new Set<string>()
      positions.forEach(pos => {
        if (pos.x >= x1 && pos.x <= x2 && pos.y >= y1 && pos.y <= y2) {
          selected.add(pos.id)
        }
      })

      onSelectFixtures(selected, false)
    }
    setDragStart(null)
    setSelectRect(null)
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
          Bühnen-Ansicht (2D)
        </h3>
        <div className="text-xs text-slate-500 mt-1">
          {selectedFixtureIds.size}
          {' '}
          Lampe(n) ausgewählt
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={300}
          height={400}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-full cursor-crosshair"
        />
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-400 space-y-1">
        <div>🖱 Klick = Auswählen</div>
        <div>⌘+Klick = Multi-Select</div>
        <div>Ziehen = Rechteck-Auswahl</div>
      </div>
    </div>
  )
}
