/**
 * CueStackPanel - Professional Cue Stack Control UI
 * 
 * DasLight's main control interface
 */

import React, { useState, useCallback } from 'react'
import { cueStackEngine } from '../utils/CueStackEngine'
import { grandMasterSystem } from '../utils/GrandMasterSystem'

interface CueStackPanelProps {
  onClose?: () => void
}

export const CueStackPanel: React.FC<CueStackPanelProps> = ({ onClose }) => {
  const [stackId, setStackId] = useState<string | null>(null)
  const [stackName, setStackName] = useState('New Show')
  const [currentCueNum, setCurrentCueNum] = useState(1)
  const [grandMasterLevel, setGrandMasterLevel] = useState(255)
  const [upTime, setUpTime] = useState(3)
  const [dwell, setDwell] = useState(2)
  const [downTime, setDownTime] = useState(0)
  const [crossfadeType, setCrossfadeType] = useState<'linear' | 'ease-in' | 'ease-out' | 'sine'>('linear')
  const [autoMode, setAutoMode] = useState(true)

  const handleCreateStack = useCallback(() => {
    const stack = cueStackEngine.createStack(stackName)
    setStackId(stack.id)
  }, [stackName])

  const handleGoButton = useCallback(() => {
    if (!stackId) return
    cueStackEngine.goToCue(stackId, currentCueNum)
  }, [stackId, currentCueNum])

  const handleStartPlayback = useCallback(() => {
    if (!stackId) return
    cueStackEngine.startPlayback(stackId)
  }, [stackId])

  const handlePausePlayback = useCallback(() => {
    if (!stackId) return
    cueStackEngine.pausePlayback(stackId)
  }, [stackId])

  const handleStopPlayback = useCallback(() => {
    if (!stackId) return
    cueStackEngine.stopPlayback(stackId)
  }, [stackId])

  const handleGrandMasterChange = useCallback((level: number) => {
    setGrandMasterLevel(level)
    if (stackId) {
      cueStackEngine.getStack(stackId)?.grandMasterLevel
    }
    grandMasterSystem.setLevel(level)
  }, [stackId])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
      backgroundColor: '#1e2130',
      borderRadius: '8px',
      color: '#e0e0e0',
      maxHeight: '700px',
      overflowY: 'auto',
      fontFamily: "'Courier New', monospace"
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>⏹ CUE STACK CONTROL</h3>
        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e0e0e0', cursor: 'pointer', fontSize: '18px' }}>✕</button>}
      </div>

      {!stackId ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: '#0f1117', borderRadius: '6px' }}>
          <label style={{ fontSize: '12px', color: '#8b8b8b' }}>SHOW NAME</label>
          <input
            type="text"
            value={stackName}
            onChange={e => setStackName(e.target.value)}
            style={{
              padding: '10px',
              backgroundColor: '#2d3748',
              border: '2px solid #6c63ff',
              borderRadius: '4px',
              color: '#10b981',
              fontSize: '13px',
              fontFamily: 'monospace',
              fontWeight: 600
            }}
          />

          <button
            onClick={handleCreateStack}
            style={{
              padding: '12px',
              backgroundColor: '#10b981',
              border: 'none',
              borderRadius: '6px',
              color: '#000',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}
          >
            CREATE STACK
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Grand Master */}
          <div style={{ padding: '12px', backgroundColor: '#0f1117', borderRadius: '6px', border: '2px solid #ef4444' }}>
            <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600, marginBottom: '8px' }}>GRAND MASTER</div>
            <input
              type="range"
              min="0"
              max="255"
              value={grandMasterLevel}
              onChange={e => handleGrandMasterChange(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px' }}>
              <span>{grandMasterLevel}</span>
              <span style={{ color: '#6c63ff' }}>{Math.round((grandMasterLevel / 255) * 100)}%</span>
            </div>

            <button
              onClick={() => handleGrandMasterChange(0)}
              style={{
                marginTop: '8px',
                width: '100%',
                padding: '8px',
                backgroundColor: '#222',
                border: '2px solid #ef4444',
                borderRadius: '4px',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              ⚫ BLACKOUT
            </button>
          </div>

          {/* Cue Number */}
          <div style={{ padding: '12px', backgroundColor: '#0f1117', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: '#8b8b8b', marginBottom: '8px' }}>CUE NUMBER</div>
            <input
              type="number"
              min="1"
              max="999"
              value={currentCueNum}
              onChange={e => setCurrentCueNum(Math.max(1, Number(e.target.value)))}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: '#2d3748',
                border: '2px solid #6c63ff',
                borderRadius: '4px',
                color: '#10b981',
                fontSize: '16px',
                fontWeight: 700,
                textAlign: 'center',
                fontFamily: 'monospace'
              }}
            />
          </div>

          {/* GO Button - Main Control */}
          <button
            onClick={handleGoButton}
            style={{
              padding: '20px',
              backgroundColor: '#10b981',
              border: 'none',
              borderRadius: '6px',
              color: '#000',
              cursor: 'pointer',
              fontSize: '20px',
              fontWeight: 700,
              textTransform: 'uppercase',
              boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)'
            }}
          >
            GO
          </button>

          {/* Timing Controls */}
          <div style={{ padding: '12px', backgroundColor: '#0f1117', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: '#8b8b8b', marginBottom: '8px' }}>CUE TIMING</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#666' }}>UP (sec)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="0.5"
                  value={upTime}
                  onChange={e => setUpTime(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px',
                    backgroundColor: '#2d3748',
                    border: 'none',
                    borderRadius: '3px',
                    color: '#10b981',
                    fontSize: '11px',
                    textAlign: 'center'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#666' }}>DWELL (sec)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="0.5"
                  value={dwell}
                  onChange={e => setDwell(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px',
                    backgroundColor: '#2d3748',
                    border: 'none',
                    borderRadius: '3px',
                    color: '#10b981',
                    fontSize: '11px',
                    textAlign: 'center'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '10px', color: '#666' }}>DOWN (sec)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="0.5"
                  value={downTime}
                  onChange={e => setDownTime(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px',
                    backgroundColor: '#2d3748',
                    border: 'none',
                    borderRadius: '3px',
                    color: '#10b981',
                    fontSize: '11px',
                    textAlign: 'center'
                  }}
                />
              </div>
            </div>

            <div style={{ fontSize: '11px', color: '#6c63ff' }}>
              Transition: {upTime}s ► Hold: {dwell}s ► Fade out: {downTime}s
            </div>
          </div>

          {/* Crossfade */}
          <div style={{ padding: '12px', backgroundColor: '#0f1117', borderRadius: '6px' }}>
            <div style={{ fontSize: '11px', color: '#8b8b8b', marginBottom: '8px' }}>CROSSFADE TYPE</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {(['linear', 'ease-in', 'ease-out', 'sine'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setCrossfadeType(type)}
                  style={{
                    padding: '8px',
                    backgroundColor: crossfadeType === type ? '#6c63ff' : '#2d3748',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#e0e0e0',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontWeight: crossfadeType === type ? 600 : 400
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Playback Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
            <button
              onClick={handleStartPlayback}
              style={{
                padding: '10px',
                backgroundColor: '#10b981',
                border: 'none',
                borderRadius: '4px',
                color: '#000',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              ▶ START
            </button>

            <button
              onClick={handlePausePlayback}
              style={{
                padding: '10px',
                backgroundColor: '#f59e0b',
                border: 'none',
                borderRadius: '4px',
                color: '#000',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              ⏸ PAUSE
            </button>

            <button
              onClick={handleStopPlayback}
              style={{
                padding: '10px',
                backgroundColor: '#ef4444',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 600
              }}
            >
              ⏹ STOP
            </button>
          </div>

          {/* Auto Mode Toggle */}
          <button
            onClick={() => setAutoMode(!autoMode)}
            style={{
              padding: '10px',
              backgroundColor: autoMode ? '#6c63ff' : '#2d3748',
              border: 'none',
              borderRadius: '4px',
              color: '#e0e0e0',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            {autoMode ? '🔄 AUTO (advance on dwell)' : '👆 MANUAL (go button only)'}
          </button>

          <button
            onClick={() => setStackId(null)}
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
            New Stack
          </button>
        </div>
      )}
    </div>
  )
}
