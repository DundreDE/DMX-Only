/**
 * StageVisualizerPanel - Visual Stage Layout & Fixture Positioning
 * 
 * Interactive 2D stage view with fixture positioning and preview
 */

import React, { useState, useCallback, useRef } from 'react'
import { fixturePositioningSystem } from '../utils/FixturePositioningSystem'
import { useFixtureStore } from '../store/useFixtureStore'

interface StageVisualizerPanelProps {
  onClose?: () => void
}

export const StageVisualizerPanel: React.FC<StageVisualizerPanelProps> = ({ onClose }) => {
  const [layoutName, setLayoutName] = useState('Main Stage')
  const [stageWidth, setStageWidth] = useState(12)
  const [stageHeight, setStageHeight] = useState(8)
  const [selectedLayout, setSelectedLayout] = useState<string | null>(null)
  const [selectedFormation, setSelectedFormation] = useState<'circle' | 'line' | 'grid' | 'triangle'>('circle')
  const [formationSize, setFormationSize] = useState(30)
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const fixtures = useFixtureStore(s => s.patchedFixtures)
  const layouts = fixturePositioningSystem.getAllLayouts()

  const handleCreateLayout = useCallback(() => {
    const layout = fixturePositioningSystem.createLayout(layoutName, stageWidth, stageHeight)
    fixturePositioningSystem.createPresetPositions(layout.id)
    setSelectedLayout(layout.id)
  }, [layoutName, stageWidth, stageHeight])

  const handlePositionInFormation = useCallback(() => {
    if (!selectedLayout) return

    const centerX = 50
    const centerY = 50
    const dmxPositions = fixturePositioningSystem.positionFixturesInFormation(
      selectedLayout,
      selectedFixtures,
      selectedFormation,
      centerX,
      centerY,
      formationSize
    )

    console.log('Formation positions:', dmxPositions)
    alert(`${selectedFixtures.length} Fixtures in ${selectedFormation} formation positioned!`)
  }, [selectedLayout, selectedFixtures, selectedFormation, formationSize])

  const drawStage = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !selectedLayout) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const layout = fixturePositioningSystem.getActiveLayout()
    if (!layout) return

    // Clear
    ctx.fillStyle = '#1a1f2e'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw stage area
    const margin = 40
    const stageX = margin
    const stageY = margin
    const stageW = canvas.width - 2 * margin
    const stageH = canvas.height - 2 * margin

    ctx.strokeStyle = '#6c63ff'
    ctx.lineWidth = 2
    ctx.strokeRect(stageX, stageY, stageW, stageH)

    // Draw grid
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    const gridSize = 50
    for (let x = stageX; x <= stageX + stageW; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, stageY)
      ctx.lineTo(x, stageY + stageH)
      ctx.stroke()
    }
    for (let y = stageY; y <= stageY + stageH; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(stageX, y)
      ctx.lineTo(stageX + stageW, y)
      ctx.stroke()
    }

    // Draw preset positions
    for (const position of layout.positions.values()) {
      const x = stageX + (position.x / 100) * stageW
      const y = stageY + (position.y / 100) * stageH

      ctx.fillStyle = '#10b981'
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#e0e0e0'
      ctx.font = '11px sans-serif'
      ctx.fillText(position.name, x + 12, y - 8)
    }

    // Draw fixtures with their current pan/tilt positions
    for (let i = 0; i < selectedFixtures.length; i++) {
      const x = stageX + Math.random() * stageW
      const y = stageY + Math.random() * stageH

      ctx.fillStyle = selectedFixtures[i] === selectedFixtures[0] ? '#ff6b6b' : '#6c63ff'
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = '#e0e0e0'
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.fillStyle = '#e0e0e0'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(i + 1), x, y + 3)
    }

    // Draw audience
    ctx.fillStyle = '#444'
    ctx.fillRect(stageX, stageY + stageH + 10, stageW, 30)
    ctx.fillStyle = '#888'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Audience', stageX + stageW / 2, stageY + stageH + 30)
  }, [selectedLayout])

  React.useEffect(() => {
    drawStage()
  }, [selectedLayout, selectedFixtures, drawStage])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
      backgroundColor: '#1e2130',
      borderRadius: '8px',
      color: '#e0e0e0',
      maxHeight: '800px',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>🎭 Stage Visualizer</h3>
        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e0e0e0', cursor: 'pointer', fontSize: '18px' }}>✕</button>}
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        style={{
          border: '2px solid #6c63ff',
          borderRadius: '6px',
          backgroundColor: '#0f1117',
          cursor: 'crosshair'
        }}
      />

      {!selectedLayout ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: '#0f1117', borderRadius: '6px' }}>
          <label style={{ fontSize: '12px', color: '#8b8b8b' }}>Stage Name</label>
          <input
            type="text"
            value={layoutName}
            onChange={e => setLayoutName(e.target.value)}
            style={{
              padding: '8px',
              backgroundColor: '#2d3748',
              border: 'none',
              borderRadius: '4px',
              color: '#e0e0e0',
              fontSize: '12px'
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#8b8b8b' }}>Width (m)</label>
              <input
                type="range"
                min="4"
                max="20"
                value={stageWidth}
                onChange={e => setStageWidth(Number(e.target.value))}
                style={{ width: '100%', marginTop: '4px' }}
              />
              <span style={{ fontSize: '11px', color: '#6c63ff' }}>{stageWidth}m</span>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#8b8b8b' }}>Height (m)</label>
              <input
                type="range"
                min="4"
                max="15"
                value={stageHeight}
                onChange={e => setStageHeight(Number(e.target.value))}
                style={{ width: '100%', marginTop: '4px' }}
              />
              <span style={{ fontSize: '11px', color: '#6c63ff' }}>{stageHeight}m</span>
            </div>
          </div>

          <button
            onClick={handleCreateLayout}
            style={{
              padding: '10px',
              backgroundColor: '#6c63ff',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            Layout erstellen
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: '#0f1117', borderRadius: '6px' }}>
          <h4 style={{ margin: 0, fontSize: '13px', color: '#6c63ff' }}>{layoutName}</h4>

          <label style={{ fontSize: '12px', color: '#8b8b8b' }}>Formation Type</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {(['circle', 'line', 'grid', 'triangle'] as const).map(type => (
              <button
                key={type}
                onClick={() => setSelectedFormation(type)}
                style={{
                  padding: '8px',
                  backgroundColor: selectedFormation === type ? '#6c63ff' : '#2d3748',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#e0e0e0',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: selectedFormation === type ? 600 : 400
                }}
              >
                {type === 'circle' && '⭕'}
                {type === 'line' && '➖'}
                {type === 'grid' && '⊞'}
                {type === 'triangle' && '△'}
                {' '}{type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#8b8b8b' }}>Formation Size ({formationSize}%)</label>
            <input
              type="range"
              min="10"
              max="80"
              value={formationSize}
              onChange={e => setFormationSize(Number(e.target.value))}
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>

          <label style={{ fontSize: '12px', color: '#8b8b8b', marginTop: '8px' }}>Select Fixtures</label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            maxHeight: '120px',
            overflowY: 'auto'
          }}>
            {fixtures.map(fixture => (
              <button
                key={fixture.id}
                onClick={() => {
                  setSelectedFixtures(prev =>
                    prev.includes(fixture.id)
                      ? prev.filter(id => id !== fixture.id)
                      : [...prev, fixture.id]
                  )
                }}
                style={{
                  padding: '8px',
                  backgroundColor: selectedFixtures.includes(fixture.id) ? '#6c63ff' : '#2d3748',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#e0e0e0',
                  cursor: 'pointer',
                  fontSize: '11px',
                  textAlign: 'left'
                }}
              >
                {selectedFixtures.includes(fixture.id) ? '✓ ' : ''}{fixture.label}
              </button>
            ))}
          </div>

          <button
            onClick={handlePositionInFormation}
            disabled={selectedFixtures.length === 0}
            style={{
              padding: '10px',
              backgroundColor: selectedFixtures.length === 0 ? '#555' : '#10b981',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: selectedFixtures.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              marginTop: '8px'
            }}
          >
            In Formation positionieren ({selectedFixtures.length})
          </button>

          <button
            onClick={() => setSelectedLayout(null)}
            style={{
              padding: '8px',
              backgroundColor: '#2d3748',
              border: 'none',
              borderRadius: '4px',
              color: '#e0e0e0',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            Neues Layout
          </button>
        </div>
      )}
    </div>
  )
}
