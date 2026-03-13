// ════════════════════════════════════════════════════════════════════════════
//  KeyboardShortcutsPanel — Keyboard shortcut mapping interface
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'

interface KeyboardShortcut {
  id: string
  keys: string[] // e.g., ['Ctrl', 'Enter']
  actionType: 'scene' | 'playback' | 'parameter'
  actionTarget: string
  label: string
}

interface KeyboardShortcutsPanelProps {
  shortcuts: KeyboardShortcut[]
  onAddShortcut?: (shortcut: Omit<KeyboardShortcut, 'id'>) => void
  onRemoveShortcut?: (shortcutId: string) => void
  onEditShortcut?: (shortcutId: string, changes: Partial<KeyboardShortcut>) => void
}

const PRESET_SHORTCUTS = [
  { keys: ['Space'], label: 'Play/Pause', action: 'playback', target: 'play' },
  { keys: ['Escape'], label: 'Stop', action: 'playback', target: 'stop' },
  { keys: ['ArrowRight'], label: 'Nächste Szene', action: 'playback', target: 'next' },
  { keys: ['ArrowLeft'], label: 'Vorherige Szene', action: 'playback', target: 'prev' },
  { keys: ['1-9'], label: 'Szene 1-9', action: 'scene', target: '1-9' },
  { keys: ['Ctrl', 'Z'], label: 'Undo', action: 'playback', target: 'undo' },
  { keys: ['Ctrl', 'Y'], label: 'Redo', action: 'playback', target: 'redo' },
  { keys: ['Ctrl', 'S'], label: 'Save', action: 'playback', target: 'save' },
]

export function KeyboardShortcutsPanel({
  shortcuts,
  onAddShortcut,
  onRemoveShortcut,
  onEditShortcut,
}: KeyboardShortcutsPanelProps): React.JSX.Element {
  const [showPresets, setShowPresets] = useState(false)
  const [recordingId, setRecordingId] = useState<string | null>(null)
  const [recordedKeys, setRecordedKeys] = useState<string[]>([])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recordingId) return
    e.preventDefault()

    const keys: string[] = []
    if (e.ctrlKey) keys.push('Ctrl')
    if (e.shiftKey) keys.push('Shift')
    if (e.altKey) keys.push('Alt')
    if (e.metaKey) keys.push('Meta')

    const keyName = e.key === ' ' ? 'Space' : e.key
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      keys.push(keyName)
    }

    if (keys.length > 0) {
      setRecordedKeys(keys)
    }
  }

  const applyPreset = (preset: any) => {
    if (onAddShortcut) {
      onAddShortcut({
        keys: preset.keys,
        label: preset.label,
        actionType: preset.action,
        actionTarget: preset.target,
      })
    }
    setShowPresets(false)
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
          ⌨️ Keyboard Shortcuts
        </h3>
        <div className="text-xs text-slate-500 mt-1">
          Tastenkombinationen für schnelle Steuerung
        </div>
      </div>

      {/* Presets Button */}
      <div className="px-4 py-2 border-b border-slate-700 shrink-0">
        <button
          onClick={() => setShowPresets(!showPresets)}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded transition-colors"
        >
          {showPresets ? '▼ Presets ausblenden' : '▶ Presets anzeigen'}
        </button>

        {showPresets && (
          <div className="mt-2 space-y-1">
            {PRESET_SHORTCUTS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => applyPreset(preset)}
                className="w-full text-left px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
              >
                <span className="inline-block bg-slate-600 px-1.5 py-0.5 rounded mr-2 font-mono text-xs">
                  {preset.keys.join(' + ')}
                </span>
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Shortcuts List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {shortcuts.length === 0 ? (
          <div className="text-slate-500 text-sm italic">
            Keine Shortcuts. Nutze Presets oder erstelle neue.
          </div>
        ) : (
          shortcuts.map(shortcut => (
            <div
              key={shortcut.id}
              className="p-3 bg-slate-800 rounded border border-slate-700 flex justify-between items-start"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-200">
                  {shortcut.label}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  <span className="inline-block bg-slate-700 px-2 py-0.5 rounded font-mono">
                    {shortcut.keys.join(' + ')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onRemoveShortcut?.(shortcut.id)}
                className="ml-2 px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors shrink-0"
              >
                🗑
              </button>
            </div>
          ))
        )}
      </div>

      {/* Recording Interface */}
      <div className="px-4 py-3 border-t border-slate-700 bg-slate-800 space-y-2 shrink-0">
        <button
          onClick={() => setRecordingId(recordingId ? null : `shortcut-${Date.now()}`)}
          onKeyDown={handleKeyDown}
          className={`w-full px-4 py-2 rounded font-bold transition-colors ${
            recordingId
              ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {recordingId ? '⏺ Tastenkombination eingeben...' : '➕ Neue Shortcut'}
        </button>

        {recordingId && recordedKeys.length > 0 && (
          <div className="p-2 bg-slate-700 rounded">
            <div className="text-xs text-slate-400 mb-1">Erkannt:</div>
            <div className="inline-block bg-slate-600 px-3 py-1 rounded font-mono text-sm text-slate-200">
              {recordedKeys.join(' + ')}
            </div>
          </div>
        )}
      </div>

      {/* Help */}
      <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-400 space-y-1 shrink-0">
        <div>💡 <strong>Tipps:</strong></div>
        <div>• Einfache Tasten: Space, Enter, 1-9</div>
        <div>• Mit Modifiern: Ctrl+, Shift+, Alt+</div>
        <div>• Pfeiltasten: Arrow Up/Down/Left/Right</div>
      </div>
    </div>
  )
}
