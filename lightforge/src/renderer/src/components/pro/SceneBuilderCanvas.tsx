import React, { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface CanvasProps {
  scene: any
  onSceneChange: (scene: any) => void
  onAddEffect: (effect: any) => void
}

export const SceneBuilderCanvas: React.FC<CanvasProps> = ({
  scene,
  onSceneChange,
  onAddEffect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [draggedFixture, setDraggedFixture] = useState<string | null>(null)

  // Draw canvas
  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    const width = canvasRef.current.width
    const height = canvasRef.current.height

    // Background
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, width, height)

    // Grid
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 1
    for (let i = 0; i <= width; i += 20) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, height)
      ctx.stroke()
    }
    for (let i = 0; i <= height; i += 20) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(width, i)
      ctx.stroke()
    }

    // Draw stage outline
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 2
    ctx.strokeRect(10, 10, width - 20, height - 20)

    // Draw fixtures
    scene.fixtures?.forEach((fixture: any, idx: number) => {
      const x = 50 + (idx % 4) * 100
      const y = 50 + Math.floor(idx / 4) * 100

      // Fixture circle
      ctx.fillStyle = fixture.active ? '#ef4444' : '#64748b'
      ctx.beginPath()
      ctx.arc(x, y, 20, 0, Math.PI * 2)
      ctx.fill()

      // Fixture label
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(idx + 1), x, y)
    })

    // Draw effects visualization
    if (scene.effects?.length > 0) {
      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      scene.effects.forEach((effect: any, idx: number) => {
        const y = height - 50 - idx * 30
        ctx.beginPath()
        ctx.moveTo(50, y)
        ctx.quadraticCurveTo(width / 2, y - 20, width - 50, y)
        ctx.stroke()
      })
    }
  }, [scene])

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Update cursor position
    const ctx = canvasRef.current.getContext('2d')
    if (ctx) {
      // Visual feedback
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
    setDraggedFixture(null)
  }

  return (
    <div className="flex-1 flex flex-col gap-2">
      <div className="flex items-center justify-between p-2 bg-slate-900 rounded">
        <div>
          <h3 className="text-sm font-medium">Scene Canvas</h3>
          <p className="text-xs text-slate-400">Duration: {scene.duration}ms</p>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="text-xs">
            Add Fixture
          </Button>
          <Button size="sm" variant="outline" className="text-xs">
            Add Effect
          </Button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        className="flex-1 border border-slate-700 bg-slate-900 rounded cursor-move"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      />

      {/* Parameter Sliders */}
      <div className="bg-slate-900 p-2 rounded space-y-2">
        <div>
          <label className="text-xs text-slate-400">
            Speed: {Math.round((scene.metadata?.speed || 1) * 100)}%
          </label>
          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            defaultValue="1"
            className="w-full h-2 bg-slate-700 rounded cursor-pointer"
            onChange={(e) => {
              onSceneChange({
                ...scene,
                metadata: { ...scene.metadata, speed: parseFloat(e.target.value) },
              })
            }}
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">
            Phase: {Math.round((scene.metadata?.phase || 0) * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            defaultValue="0"
            className="w-full h-2 bg-slate-700 rounded cursor-pointer"
            onChange={(e) => {
              onSceneChange({
                ...scene,
                metadata: { ...scene.metadata, phase: parseFloat(e.target.value) },
              })
            }}
          />
        </div>

        <div>
          <label className="text-xs text-slate-400">
            Amplitude: {Math.round((scene.metadata?.amplitude || 100))}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            defaultValue="100"
            className="w-full h-2 bg-slate-700 rounded cursor-pointer"
            onChange={(e) => {
              onSceneChange({
                ...scene,
                metadata: { ...scene.metadata, amplitude: parseFloat(e.target.value) },
              })
            }}
          />
        </div>
      </div>
    </div>
  )
}
