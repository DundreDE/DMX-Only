/**
 * AdvancedShowControlPanel - Blind Mode, Tracking Sheet, MIDI Control
 */

import React, { useState, useCallback } from 'react'
import { blindModeSystem, trackingSheetSystem, midiShowControlSystem } from '../utils/ShowControlSystems'

interface AdvancedShowControlPanelProps {
  onClose?: () => void
}

export const AdvancedShowControlPanel: React.FC<AdvancedShowControlPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'blind' | 'tracking' | 'midi'>('blind')
  const [blindEnabled, setBlindEnabled] = useState(false)
  const [selectedUniverse, setSelectedUniverse] = useState(0)
  const [goButtonCC, setGoButtonCC] = useState(64)
  const [masterCC, setMasterCC] = useState(7)
  const [blackoutCC, setBlackoutCC] = useState(120)

  const handleEnableBlindMode = useCallback(() => {
    if (!blindEnabled) {
      blindModeSystem.enableBlindMode()
      setBlindEnabled(true)
    } else {
      blindModeSystem.disableBlindMode()
      setBlindEnabled(false)
    }
  }, [blindEnabled])

  const handleSwapToBlind = useCallback(() => {
    blindModeSystem.swapToBlind()
  }, [])

  const handleSwapToLive = useCallback(() => {
    blindModeSystem.swapToLive()
  }, [])

  const handleMidiMappingUpdate = useCallback(() => {
    midiShowControlSystem.setMapping({
      goButtonCC,
      masterCC,
      blackoutCC
    })
  }, [goButtonCC, masterCC, blackoutCC])

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
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>⚙ ADVANCED SHOW CONTROL</h3>
        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e0e0e0', cursor: 'pointer', fontSize: '18px' }}>✕</button>}
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
        <button
          onClick={() => setActiveTab('blind')}
          style={{
            padding: '8px',
            backgroundColor: activeTab === 'blind' ? '#6c63ff' : '#2d3748',
            border: 'none',
            borderRadius: '4px',
            color: '#e0e0e0',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: activeTab === 'blind' ? 600 : 400
          }}
        >
          👁 Blind Mode
        </button>

        <button
          onClick={() => setActiveTab('tracking')}
          style={{
            padding: '8px',
            backgroundColor: activeTab === 'tracking' ? '#6c63ff' : '#2d3748',
            border: 'none',
            borderRadius: '4px',
            color: '#e0e0e0',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: activeTab === 'tracking' ? 600 : 400
          }}
        >
          📊 Tracking Sheet
        </button>

        <button
          onClick={() => setActiveTab('midi')}
          style={{
            padding: '8px',
            backgroundColor: activeTab === 'midi' ? '#6c63ff' : '#2d3748',
            border: 'none',
            borderRadius: '4px',
            color: '#e0e0e0',
            cursor: 'pointer',
            fontSize: '11px',
            fontWeight: activeTab === 'midi' ? 600 : 400
          }}
        >
          🎹 MIDI MSC
        </button>
      </div>

      {/* Blind Mode Tab */}
      {activeTab === 'blind' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: '#0f1117', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: '#8b8b8b', lineHeight: 1.5 }}>
            Blind Mode allows you to program/edit cues while other cues play live.
            <br />Perfect for live shows and complex sequences.
          </div>

          <button
            onClick={handleEnableBlindMode}
            style={{
              padding: '10px',
              backgroundColor: blindEnabled ? '#6c63ff' : '#2d3748',
              border: '2px solid ' + (blindEnabled ? '#6c63ff' : '#555'),
              borderRadius: '6px',
              color: '#e0e0e0',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            {blindEnabled ? '✓ BLIND MODE ENABLED' : '○ Enable Blind Mode'}
          </button>

          {blindEnabled && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                onClick={handleSwapToBlind}
                style={{
                  padding: '12px',
                  backgroundColor: '#10b981',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#000',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                GO BLIND
              </button>

              <button
                onClick={handleSwapToLive}
                style={{
                  padding: '12px',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  borderRadius: '4px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                GO LIVE
              </button>
            </div>
          )}

          <div style={{
            padding: '8px',
            backgroundColor: '#2d3748',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#b0b0b0',
            border: '1px solid #555'
          }}>
            Status: <span style={{ color: blindEnabled ? '#10b981' : '#ef4444' }}>
              {blindEnabled ? '● Blind Mode Active' : '○ Disabled'}
            </span>
          </div>
        </div>
      )}

      {/* Tracking Sheet Tab */}
      {activeTab === 'tracking' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: '#0f1117', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: '#8b8b8b' }}>
            Live DMX value display with peak hold and history tracking.
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#8b8b8b' }}>UNIVERSE</label>
            <input
              type="number"
              min="0"
              max="99"
              value={selectedUniverse}
              onChange={e => setSelectedUniverse(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#2d3748',
                border: 'none',
                borderRadius: '4px',
                color: '#10b981',
                fontSize: '12px',
                marginTop: '4px'
              }}
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '4px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {Array.from({ length: 512 }, (_, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#2d3748',
                  borderRadius: '3px',
                  padding: '4px',
                  fontSize: '9px',
                  color: '#6c63ff',
                  border: '1px solid #444',
                  minHeight: '32px'
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '7px', color: '#888' }}>Ch{i + 1}</div>
                  <div style={{ fontSize: '10px', fontWeight: 600 }}>0</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => trackingSheetSystem.clearAll()}
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
            Clear History
          </button>
        </div>
      )}

      {/* MIDI Show Control Tab */}
      {activeTab === 'midi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: '#0f1117', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: '#8b8b8b' }}>
            Map MIDI CC commands for remote show control.
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#8b8b8b' }}>GO BUTTON CC</label>
            <input
              type="number"
              min="0"
              max="127"
              value={goButtonCC}
              onChange={e => setGoButtonCC(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#2d3748',
                border: 'none',
                borderRadius: '4px',
                color: '#10b981',
                fontSize: '12px',
                marginTop: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#8b8b8b' }}>MASTER DIMMER CC</label>
            <input
              type="number"
              min="0"
              max="127"
              value={masterCC}
              onChange={e => setMasterCC(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#2d3748',
                border: 'none',
                borderRadius: '4px',
                color: '#10b981',
                fontSize: '12px',
                marginTop: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#8b8b8b' }}>BLACKOUT CC</label>
            <input
              type="number"
              min="0"
              max="127"
              value={blackoutCC}
              onChange={e => setBlackoutCC(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: '#2d3748',
                border: 'none',
                borderRadius: '4px',
                color: '#10b981',
                fontSize: '12px',
                marginTop: '4px'
              }}
            />
          </div>

          <button
            onClick={handleMidiMappingUpdate}
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
            Apply MIDI Mapping
          </button>

          <div style={{
            padding: '8px',
            backgroundColor: '#2d3748',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#b0b0b0',
            border: '1px solid #555'
          }}>
            <div>✓ MIDI Show Control Active</div>
            <div>Go: CC{goButtonCC} | Master: CC{masterCC} | Blackout: CC{blackoutCC}</div>
          </div>
        </div>
      )}
    </div>
  )
}
