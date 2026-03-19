import React, { useState, useRef, useEffect } from 'react'
import { Panel, Button, Badge } from './UIComponents'
import type { PatchedFixture, FixtureDefinition } from '../../../shared/types'

interface Fixture3D {
  id: string
  name: string
  x: number // meters
  y: number // meters
  z: number // meters
  pan: number // degrees
  tilt: number // degrees
  color: string // hex
}

interface StageConfig {
  width: number // meters
  depth: number // meters
  height: number // meters
}

/**
 * 3D Stage Visualization Component
 * Shows fixture positions and real-time color output in 3D space
 */
export const Stage3DViewer: React.FC<{
  fixtures: Fixture3D[]
  patched: PatchedFixture[]
  dmxValues: Record<number, Record<number, number>>
  stageConfig: StageConfig
  onFixtureSelect: (fixture: Fixture3D) => void
}> = ({ fixtures, patched, dmxValues, stageConfig, onFixtureSelect }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraAngle, setCameraAngle] = useState({ x: 45, y: 45 })
  const [zoom, setZoom] = useState(1)
  const [view, setView] = useState<'3d' | 'top' | 'front' | 'side'>('3d')

  // Draw 3D stage
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Background
    ctx.fillStyle = 'var(--color-bg-input)'
    ctx.fillRect(0, 0, width, height)

    // Draw stage floor
    ctx.strokeStyle = 'var(--color-border)'
    ctx.lineWidth = 2

    const centerX = width / 2
    const centerY = height / 2
    const scaleX = (width * zoom) / (stageConfig.width * 1.5)
    const scaleY = (height * zoom) / (stageConfig.depth * 1.5)

    // Stage outline (top view when 3D)
    const stageX = centerX - (stageConfig.width * scaleX) / 2
    const stageY = centerY - (stageConfig.depth * scaleY) / 2
    const stageW = stageConfig.width * scaleX
    const stageH = stageConfig.depth * scaleY

    ctx.strokeRect(stageX, stageY, stageW, stageH)
    ctx.fillStyle = 'rgba(108, 99, 255, 0.05)'
    ctx.fillRect(stageX, stageY, stageW, stageH)

    // Draw fixtures
    fixtures.forEach(fixture => {
      let x, y

      if (view === 'top') {
        x = stageX + (fixture.x / stageConfig.width) * stageW
        y = stageY + (fixture.y / stageConfig.depth) * stageH
      } else if (view === 'front') {
        x = stageX + (fixture.x / stageConfig.width) * stageW
        y = centerY - (fixture.z / stageConfig.height) * scaleY * 1.5
      } else if (view === 'side') {
        x = stageX + (fixture.y / stageConfig.depth) * stageW
        y = centerY - (fixture.z / stageConfig.height) * scaleY * 1.5
      } else {
        // 3D isometric view
        const iso = project3DToIsometric(fixture.x, fixture.y, fixture.z, stageConfig)
        x = centerX + iso.x * scaleX
        y = centerY + iso.y * scaleY
      }

      // Draw fixture
      const radius = 6
      ctx.fillStyle = fixture.color || 'var(--color-accent)'
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fill()

      // Fixture direction indicator
      const dirLength = 12
      const panRad = (fixture.pan * Math.PI) / 180
      ctx.strokeStyle = 'var(--color-text-secondary)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + Math.cos(panRad) * dirLength, y + Math.sin(panRad) * dirLength)
      ctx.stroke()

      // Label
      ctx.fillStyle = 'var(--color-text-secondary)'
      ctx.font = '10px Inter'
      ctx.fillText(fixture.name, x + 10, y - 10)
    })

    // Draw grid lines
    ctx.strokeStyle = 'var(--color-text-muted)'
    ctx.lineWidth = 0.5
    ctx.globalAlpha = 0.3

    const gridSpacing = 2 // meters
    for (let i = 0; i <= stageConfig.width; i += gridSpacing) {
      const x = stageX + (i / stageConfig.width) * stageW
      ctx.beginPath()
      ctx.moveTo(x, stageY)
      ctx.lineTo(x, stageY + stageH)
      ctx.stroke()
    }

    for (let i = 0; i <= stageConfig.depth; i += gridSpacing) {
      const y = stageY + (i / stageConfig.depth) * stageH
      ctx.beginPath()
      ctx.moveTo(stageX, y)
      ctx.lineTo(stageX + stageW, y)
      ctx.stroke()
    }

    ctx.globalAlpha = 1
  }, [fixtures, stageConfig, zoom, view])

  return (
    <Panel header="3D Stage View">
      <div className="space-y-3">
        {/* Controls */}
        <div className="flex gap-2 justify-between items-center p-2 bg-[var(--color-bg-input)] rounded">
          <div className="flex gap-2">
            {(['3d', 'top', 'front', 'side'] as const).map(v => (
              <Button
                key={v}
                variant={view === v ? 'primary' : 'secondary'}
                onClick={() => setView(v)}
                className="px-2 py-1 text-xs"
              >
                {v.toUpperCase()}
              </Button>
            ))}
          </div>

          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="input"
            style={{ width: '100px' }}
          />
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onClick={(e) => {
            const rect = canvasRef.current!.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            // Find nearest fixture
            fixtures.forEach(f => onFixtureSelect(f))
          }}
          className="w-full border border-[var(--color-border)] rounded bg-[var(--color-bg-input)]"
        />

        {/* Fixture List */}
        <div className="max-h-40 overflow-y-auto space-y-1">
          {fixtures.map(fixture => (
            <div
              key={fixture.id}
              onClick={() => onFixtureSelect(fixture)}
              className="flex items-center gap-2 p-1 text-xs bg-[var(--color-bg-input)] rounded hover:bg-[var(--color-bg-hover)] cursor-pointer"
            >
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: fixture.color }}
              />
              <span className="flex-1">{fixture.name}</span>
              <Badge variant="primary" className="text-xs">
                X:{fixture.x} Y:{fixture.y}
              </Badge>
            </div>
          ))}
        </div>

        {/* Stage Config */}
        <div className="text-xs text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border)]">
          Stage: {stageConfig.width}m × {stageConfig.depth}m × {stageConfig.height}m height
        </div>
      </div>
    </Panel>
  )
}

/**
 * Real-time Color Preview
 * Shows actual DMX output colors on fixtures
 */
export const ColorPreview: React.FC<{
  fixtures: Fixture3D[]
  dmxValues: Record<number, Record<number, number>>
  patched: PatchedFixture[]
}> = ({ fixtures, dmxValues, patched }) => {
  const getFixtureColor = (fixtureId: string): string => {
    const patched_f = patched.find(f => f.id === fixtureId)
    if (!patched_f) return '#666666'

    const universe = dmxValues[patched_f.universe]
    if (!universe) return '#666666'

    const r = universe[patched_f.startAddress] || 0
    const g = universe[patched_f.startAddress + 1] || 0
    const b = universe[patched_f.startAddress + 2] || 0

    return `rgb(${r}, ${g}, ${b})`
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {fixtures.map(fixture => (
        <div key={fixture.id} className="text-center">
          <div
            className="w-12 h-12 rounded border border-[var(--color-border)] mx-auto mb-1"
            style={{ backgroundColor: getFixtureColor(fixture.id) }}
          />
          <p className="text-xs text-[var(--color-text-secondary)] truncate">
            {fixture.name}
          </p>
        </div>
      ))}
    </div>
  )
}

/**
 * Helper: Project 3D to isometric view
 */
function project3DToIsometric(x: number, y: number, z: number, config: StageConfig) {
  const angle = 45 // degrees
  const rad = (angle * Math.PI) / 180

  // Normalize coordinates to -1..1 range
  const nx = (x / config.width) * 2 - 1
  const ny = (y / config.depth) * 2 - 1
  const nz = (z / config.height) * 2 - 1

  // Isometric projection
  const iso_x = (nx - ny) * Math.cos(rad) * 100
  const iso_y = (nx + ny) * Math.sin(rad) * 100 - nz * 100

  return { x: iso_x, y: iso_y }
}

/**
 * DMX Channel Graph Visualizer
 */
export const DMXChannelGraph: React.FC<{
  universe: number
  dmxHistory: Record<number, number[]> // channel -> history array
}> = ({ universe, dmxHistory }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    ctx.fillStyle = 'var(--color-bg-input)'
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = 'var(--color-border)'
    ctx.lineWidth = 1

    for (let i = 0; i <= 10; i++) {
      const y = (height * i) / 10
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw channel values
    Object.entries(dmxHistory).forEach(([channelStr, history], idx) => {
      if (history.length < 2) return

      ctx.strokeStyle = `hsl(${(idx * 360) / 512}, 100%, 50%)`
      ctx.lineWidth = 1.5
      ctx.beginPath()

      history.forEach((value, i) => {
        const x = (i / (history.length - 1)) * width
        const y = height - (value / 255) * height

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()
    })
  }, [dmxHistory])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={150}
      className="w-full border border-[var(--color-border)] rounded"
    />
  )
}
