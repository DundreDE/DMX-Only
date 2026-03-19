/**
 * MovementChaserPanel - Professional Movement Chase Control
 * 
 * UI for creating and controlling automatic Pan/Tilt movements
 * Similar to DasLight's chase functionality for moving heads
 */

import React, { useState, useCallback } from 'react'
import { movementChaseEngine, MovementPath, FixtureMovement } from '../utils/MovementChaseEngine'
import { useFixtureStore } from '../store/useFixtureStore'

interface MovementChaserPanelProps {
  onClose?: () => void
}

export const MovementChaserPanel: React.FC<MovementChaserPanelProps> = ({ onClose }) => {
  const [chaseId, setChaseId] = useState<string | null>(null)
  const [chaseName, setChaseName] = useState('New Chase')
  const [selectedPattern, setSelectedPattern] = useState<'circle' | 'zigzag' | 'figure8' | 'spiral' | 'pendulum'>('circle')
  const [centerPan, setCenterPan] = useState(128)
  const [centerTilt, setCenterTilt] = useState(128)
  const [radius, setRadius] = useState(45)
  const [amplitude, setAmplitude] = useState(30)
  const [speed, setSpeed] = useState(45)
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0)
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const fixtures = useFixtureStore(s => s.patchedFixtures)

  const handleCreateChase = useCallback(() => {
    if (selectedFixtures.length === 0) {
      alert('Bitte wähle mindestens einen Fixture aus')
      return
    }

    // Create fixture movements
    const fixtureMovements: FixtureMovement[] = selectedFixtures
      .map(fixtureId => {
        const fixture = fixtures.find(f => f.id === fixtureId)
        if (!fixture) return null

        // Try to find pan/tilt channels
        const panCh = fixture.channels.find(c => c.label?.toLowerCase().includes('pan'))?.channel
        const tiltCh = fixture.channels.find(c => c.label?.toLowerCase().includes('tilt'))?.channel

        if (!panCh || !tiltCh) return null

        return {
          fixtureId,
          universeIndex: fixture.universeIndex,
          panChannel: panCh,
          tiltChannel: tiltCh,
          panRange: 255,
          tiltRange: 255,
          speed
        }
      })
      .filter(Boolean) as FixtureMovement[]

    if (fixtureMovements.length === 0) {
      alert('Kein Fixture mit Pan/Tilt gefunden')
      return
    }

    // Create chase
    const chase = movementChaseEngine.createChase(chaseName, fixtureMovements)
    setChaseId(chase.id)

    // Add pattern
    let path: MovementPath
    switch (selectedPattern) {
      case 'circle':
        path = movementChaseEngine.generateCirclePattern({ pan: centerPan, tilt: centerTilt }, radius, speed)
        break
      case 'zigzag':
        path = movementChaseEngine.generateZigzagPattern({ pan: centerPan, tilt: centerTilt }, amplitude, 3, speed)
        break
      case 'figure8':
        path = movementChaseEngine.generateFigure8Pattern({ pan: centerPan, tilt: centerTilt }, radius, radius * 0.7, speed)
        break
      case 'spiral':
        path = movementChaseEngine.generateSpiralPattern({ pan: centerPan, tilt: centerTilt }, radius * 0.3, radius, speed)
        break
      case 'pendulum':
        path = movementChaseEngine.generatePendulumPattern({ pan: centerPan, tilt: centerTilt }, amplitude, 'pan', speed)
        break
    }

    movementChaseEngine.addPath(chase.id, path)
    alert(`Chase "${chaseName}" mit ${selectedPattern} Pattern erstellt!`)
  }, [selectedFixtures, fixtures, chaseName, selectedPattern, centerPan, centerTilt, radius, amplitude, speed])

  const handleStartChase = useCallback(() => {
    if (!chaseId) return
    movementChaseEngine.startChase(chaseId)
    setIsRunning(true)
  }, [chaseId])

  const handlePauseChase = useCallback(() => {
    if (!chaseId) return
    movementChaseEngine.pauseChase(chaseId)
    setIsRunning(false)
  }, [chaseId])

  const handleStopChase = useCallback(() => {
    if (!chaseId) return
    movementChaseEngine.stopChase(chaseId)
    setIsRunning(false)
  }, [chaseId])

  const handleSpeedChange = useCallback((newSpeed: number) => {
    if (!chaseId) return
    movementChaseEngine.setSpeed(chaseId, newSpeed)
    setSpeedMultiplier(newSpeed)
  }, [chaseId])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
      backgroundColor: '#1e2130',
      borderRadius: '8px',
      color: '#e0e0e0',
      maxHeight: '600px',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>🎬 Movement Chaser</h3>
        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e0e0e0', cursor: 'pointer', fontSize: '18px' }}>✕</button>}
      </div>

      {/* Chase Creation Section */}
      {!chaseId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: '#0f1117', borderRadius: '6px' }}>
          <label style={{ fontSize: '12px', color: '#8b8b8b' }}>Chase Name</label>
          <input
            type="text"
            value={chaseName}
            onChange={e => setChaseName(e.target.value)}
            style={{
              padding: '8px',
              backgroundColor: '#2d3748',
              border: 'none',
              borderRadius: '4px',
              color: '#e0e0e0',
              fontSize: '12px'
            }}
          />

          <label style={{ fontSize: '12px', color: '#8b8b8b', marginTop: '8px' }}>Movement Pattern</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {(['circle', 'zigzag', 'figure8', 'spiral', 'pendulum'] as const).map(pattern => (
              <button
                key={pattern}
                onClick={() => setSelectedPattern(pattern)}
                style={{
                  padding: '8px',
                  backgroundColor: selectedPattern === pattern ? '#6c63ff' : '#2d3748',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#e0e0e0',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: selectedPattern === pattern ? 600 : 400
                }}
              >
                {pattern === 'circle' ? '⭕ Kreis' : ''}
                {pattern === 'zigzag' ? '⚡ Zickzack' : ''}
                {pattern === 'figure8' ? '8️⃣ Acht' : ''}
                {pattern === 'spiral' ? '🌀 Spirale' : ''}
                {pattern === 'pendulum' ? '📍 Pendel' : ''}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#8b8b8b' }}>Center Pan (0-255)</label>
              <input
                type="range"
                min="0"
                max="255"
                value={centerPan}
                onChange={e => setCenterPan(Number(e.target.value))}
                style={{ width: '100%', marginTop: '4px' }}
              />
              <span style={{ fontSize: '11px', color: '#6c63ff' }}>{centerPan}</span>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#8b8b8b' }}>Center Tilt (0-255)</label>
              <input
                type="range"
                min="0"
                max="255"
                value={centerTilt}
                onChange={e => setCenterTilt(Number(e.target.value))}
                style={{ width: '100%', marginTop: '4px' }}
              />
              <span style={{ fontSize: '11px', color: '#6c63ff' }}>{centerTilt}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#8b8b8b' }}>Radius (°)</label>
              <input
                type="range"
                min="5"
                max="90"
                value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                style={{ width: '100%', marginTop: '4px' }}
              />
              <span style={{ fontSize: '11px', color: '#6c63ff' }}>{radius}°</span>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#8b8b8b' }}>Speed (°/sec)</label>
              <input
                type="range"
                min="10"
                max="180"
                value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                style={{ width: '100%', marginTop: '4px' }}
              />
              <span style={{ fontSize: '11px', color: '#6c63ff' }}>{speed}°/s</span>
            </div>
          </div>

          <label style={{ fontSize: '12px', color: '#8b8b8b', marginTop: '8px' }}>Wähle Moving Head Fixtures</label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px',
            maxHeight: '150px',
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
            onClick={handleCreateChase}
            style={{
              padding: '10px',
              backgroundColor: '#6c63ff',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              marginTop: '8px'
            }}
          >
            Chase erstellen
          </button>
        </div>
      )}

      {/* Chase Playback Section */}
      {chaseId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: '#0f1117', borderRadius: '6px' }}>
          <h4 style={{ margin: 0, fontSize: '13px', color: '#6c63ff' }}>Chase: {chaseName}</h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
            <button
              onClick={handleStartChase}
              disabled={isRunning}
              style={{
                padding: '8px',
                backgroundColor: isRunning ? '#555' : '#10b981',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              ▶ Start
            </button>

            <button
              onClick={handlePauseChase}
              disabled={!isRunning}
              style={{
                padding: '8px',
                backgroundColor: !isRunning ? '#555' : '#f59e0b',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: !isRunning ? 'not-allowed' : 'pointer',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              ⏸ Pause
            </button>

            <button
              onClick={handleStopChase}
              style={{
                padding: '8px',
                backgroundColor: '#ef4444',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              ⏹ Stop
            </button>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#8b8b8b' }}>Speed Multiplier ({speedMultiplier.toFixed(1)}x)</label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={speedMultiplier}
              onChange={e => handleSpeedChange(Number(e.target.value))}
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>

          <div style={{
            padding: '8px',
            backgroundColor: '#2d3748',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#b0b0b0'
          }}>
            <div>Status: <span style={{ color: isRunning ? '#10b981' : '#ef4444' }}>{isRunning ? '▶ Running' : '⏹ Stopped'}</span></div>
            <div>Speed: {speedMultiplier.toFixed(1)}x</div>
            <div>Fixtures: {selectedFixtures.length}</div>
          </div>

          <button
            onClick={() => setChaseId(null)}
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
            Neuer Chase
          </button>
        </div>
      )}
    </div>
  )
}
