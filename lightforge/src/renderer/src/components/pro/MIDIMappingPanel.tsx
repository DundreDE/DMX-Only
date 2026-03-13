// ════════════════════════════════════════════════════════════════════════════
//  MIDIMappingPanel — MIDI controller mapping interface
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'

interface MIDIMapping {
  id: string
  midiNumber: number
  midiChannel: number
  actionType: 'scene' | 'parameter' | 'button'
  actionTarget: string
  actionValue?: number
  label: string
}

interface MIDIMappingPanelProps {
  mappings: MIDIMapping[]
  onAddMapping?: (mapping: Omit<MIDIMapping, 'id'>) => void
  onRemoveMapping?: (mappingId: string) => void
  onLearnMode?: (enabled: boolean) => void
  isLearning?: boolean
}

export function MIDIMappingPanel({
  mappings,
  onAddMapping,
  onRemoveMapping,
  onLearnMode,
  isLearning,
}: MIDIMappingPanelProps): React.JSX.Element {
  const [learnMode, setLearnMode] = useState(false)
  const [newMapping, setNewMapping] = useState<Partial<Omit<MIDIMapping, 'id'>>>({
    actionType: 'scene',
    midiChannel: 1,
  })

  const handleToggleLearn = () => {
    const newState = !learnMode
    setLearnMode(newState)
    if (onLearnMode) onLearnMode(newState)
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
          🎹 MIDI Mapping
        </h3>
        <div className="text-xs text-slate-500 mt-1">
          Zuordne MIDI-Controller zu Aktionen
        </div>
      </div>

      {/* Learn Mode Toggle */}
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <button
          onClick={handleToggleLearn}
          className={`w-full px-4 py-2 rounded font-bold transition-colors ${
            learnMode
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {learnMode ? '⏺ Learn Mode (Drücke MIDI-Regler...)' : '🎹 Learn Mode starten'}
        </button>
      </div>

      {/* Mappings List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {mappings.length === 0 ? (
          <div className="text-slate-500 text-sm italic">
            Keine Zuordnungen. Aktiviere Learn Mode und drücke einen MIDI-Regler.
          </div>
        ) : (
          mappings.map(mapping => (
            <div
              key={mapping.id}
              className="p-3 bg-slate-800 rounded border border-slate-700 flex justify-between items-start"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-200">
                  {mapping.label || 'Unbenannt'}
                </div>
                <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                  <div>
                    <span className="text-slate-400">MIDI:</span> CC{mapping.midiNumber} on Channel{' '}
                    {mapping.midiChannel}
                  </div>
                  <div>
                    <span className="text-slate-400">Action:</span>{' '}
                    {mapping.actionType === 'scene' && `Scene: ${mapping.actionTarget}`}
                    {mapping.actionType === 'parameter' && `Parameter: ${mapping.actionTarget}`}
                    {mapping.actionType === 'button' && `Button: ${mapping.actionTarget}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => onRemoveMapping?.(mapping.id)}
                className="ml-2 px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors shrink-0"
              >
                🗑
              </button>
            </div>
          ))
        )}
      </div>

      {/* New Mapping Form */}
      {learnMode && (
        <div className="px-4 py-3 border-t border-slate-700 bg-slate-800 space-y-2 shrink-0">
          <div>
            <label className="text-xs text-slate-400">Label:</label>
            <input
              type="text"
              placeholder="z.B. 'Dimmer Fader'"
              value={newMapping.label ?? ''}
              onChange={e => setNewMapping({ ...newMapping, label: e.target.value })}
              className="w-full mt-1 px-2 py-1 text-xs bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">Action Type:</label>
            <select
              value={newMapping.actionType ?? 'scene'}
              onChange={e =>
                setNewMapping({ ...newMapping, actionType: e.target.value as any })
              }
              className="w-full mt-1 px-2 py-1 text-xs bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="scene">Scene (Szene starten)</option>
              <option value="parameter">Parameter (Fader/Wert)</option>
              <option value="button">Button (Aktion)</option>
            </select>
          </div>

          <button
            onClick={() => {
              if (newMapping.label && onAddMapping) {
                onAddMapping({
                  label: newMapping.label,
                  actionType: newMapping.actionType ?? 'scene',
                  actionTarget: newMapping.actionTarget ?? '',
                  midiNumber: newMapping.midiNumber ?? 0,
                  midiChannel: newMapping.midiChannel ?? 1,
                })
                setNewMapping({ actionType: 'scene', midiChannel: 1 })
              }
            }}
            className="w-full px-3 py-2 text-xs bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors"
          >
            ✓ Speichern
          </button>
        </div>
      )}

      {/* Info */}
      <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-400 space-y-1 shrink-0">
        <div>💡 <strong>Learn Mode:</strong> Drücke einen MIDI-Regler</div>
        <div>🎛️ MIDI wird automatisch erkannt</div>
        <div>📝 Gib einen Namen ein und speichern</div>
      </div>
    </div>
  )
}
