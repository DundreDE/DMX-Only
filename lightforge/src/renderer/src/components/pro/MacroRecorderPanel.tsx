/**
 * MacroRecorderPanel - Professional Macro Recording & Playback
 */

import React, { useState, useCallback } from 'react'
import { enhancedMacroSystem } from '../utils/EnhancedMacroSystem'

interface MacroRecorderPanelProps {
  onClose?: () => void
}

export const MacroRecorderPanel: React.FC<MacroRecorderPanelProps> = ({ onClose }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingName, setRecordingName] = useState('New Macro')
  const [macros, setMacros] = useState(enhancedMacroSystem.getAllMacros())
  const [selectedMacroId, setSelectedMacroId] = useState<string | null>(null)
  const [playSpeed, setPlaySpeed] = useState(1.0)

  const handleStartRecording = useCallback(() => {
    enhancedMacroSystem.startRecording(recordingName)
    setIsRecording(true)
  }, [recordingName])

  const handleStopRecording = useCallback(() => {
    const macro = enhancedMacroSystem.stopRecording()
    setIsRecording(false)
    if (macro) {
      setMacros(enhancedMacroSystem.getAllMacros())
      setRecordingName('New Macro')
    }
  }, [])

  const handlePlayMacro = useCallback((macroId: string) => {
    enhancedMacroSystem.playMacro(macroId, playSpeed)
  }, [playSpeed])

  const handleDeleteMacro = useCallback((macroId: string) => {
    enhancedMacroSystem.deleteMacro(macroId)
    setMacros(enhancedMacroSystem.getAllMacros())
    if (selectedMacroId === macroId) {
      setSelectedMacroId(null)
    }
  }, [selectedMacroId])

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
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>🎬 MACRO RECORDER</h3>
        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e0e0e0', cursor: 'pointer', fontSize: '18px' }}>✕</button>}
      </div>

      {/* Recording Section */}
      {!isRecording ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: '#0f1117', borderRadius: '6px' }}>
          <label style={{ fontSize: '12px', color: '#8b8b8b' }}>MACRO NAME</label>
          <input
            type="text"
            value={recordingName}
            onChange={e => setRecordingName(e.target.value)}
            style={{
              padding: '8px',
              backgroundColor: '#2d3748',
              border: 'none',
              borderRadius: '4px',
              color: '#e0e0e0',
              fontSize: '12px'
            }}
          />

          <button
            onClick={handleStartRecording}
            style={{
              padding: '12px',
              backgroundColor: '#ef4444',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}
          >
            ● START RECORDING
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: '#ef4444', borderRadius: '6px' }}>
          <div style={{ fontSize: '12px', color: '#fff', fontWeight: 600 }}>⏹ RECORDING: {recordingName}</div>
          
          <button
            onClick={handleStopRecording}
            style={{
              padding: '12px',
              backgroundColor: '#fff',
              border: 'none',
              borderRadius: '6px',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}
          >
            ⏹ STOP RECORDING
          </button>
        </div>
      )}

      {/* Macros List */}
      {macros.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#8b8b8b' }}>SAVED MACROS ({macros.length})</label>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: '250px',
            overflowY: 'auto'
          }}>
            {macros.map(macro => (
              <div
                key={macro.id}
                style={{
                  padding: '10px',
                  backgroundColor: selectedMacroId === macro.id ? '#6c63ff' : '#0f1117',
                  borderRadius: '6px',
                  border: '1px solid ' + (selectedMacroId === macro.id ? '#6c63ff' : '#333'),
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSelectedMacroId(macro.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#e0e0e0' }}>
                      {macro.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                      {macro.steps.length} steps • {macro.duration.toFixed(1)}s • Played {macro.playCount}x
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteMacro(macro.id)
                    }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#2d3748',
                      border: 'none',
                      borderRadius: '3px',
                      color: '#ef4444',
                      cursor: 'pointer',
                      fontSize: '10px'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Playback Controls */}
      {selectedMacroId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: '#0f1117', borderRadius: '6px' }}>
          <div style={{ fontSize: '11px', color: '#8b8b8b' }}>PLAYBACK SPEED</div>

          <input
            type="range"
            min="0.1"
            max="5"
            step="0.1"
            value={playSpeed}
            onChange={e => setPlaySpeed(Number(e.target.value))}
            style={{ width: '100%' }}
          />

          <div style={{ fontSize: '12px', color: '#6c63ff', textAlign: 'center', fontWeight: 600 }}>
            {playSpeed.toFixed(1)}x
          </div>

          <button
            onClick={() => handlePlayMacro(selectedMacroId)}
            style={{
              padding: '12px',
              backgroundColor: '#10b981',
              border: 'none',
              borderRadius: '6px',
              color: '#000',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              textTransform: 'uppercase'
            }}
          >
            ▶ PLAY MACRO
          </button>
        </div>
      )}

      {/* Empty State */}
      {macros.length === 0 && !isRecording && (
        <div style={{
          padding: '20px',
          backgroundColor: '#0f1117',
          borderRadius: '6px',
          textAlign: 'center',
          color: '#666',
          fontSize: '12px'
        }}>
          No macros yet. Start recording to create one!
        </div>
      )}
    </div>
  )
}
