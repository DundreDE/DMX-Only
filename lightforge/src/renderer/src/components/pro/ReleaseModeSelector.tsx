// ════════════════════════════════════════════════════════════════════════════
//  ReleaseModeSelector — Multi-scene playback release mode control
// ════════════════════════════════════════════════════════════════════════════

type ReleaseMode = 'off' | 'group' | 'all' | 'except'

interface ReleaseModeOption {
  mode: ReleaseMode
  label: string
  description: string
  icon: string
}

interface ReleaseModeSelecterProps {
  releaseMode: ReleaseMode
  selectedGroupName?: string
  onReleaseModeChange: (mode: ReleaseMode) => void
}

const RELEASE_MODES: ReleaseModeOption[] = [
  {
    mode: 'off',
    label: 'Aus',
    description: 'Szene bleibt aktiv. Neue Szenen starten daneben.',
    icon: '⊘',
  },
  {
    mode: 'group',
    label: 'Gruppe',
    description: 'Stoppt andere Szenen in der gleichen Gruppe.',
    icon: '📁',
  },
  {
    mode: 'all',
    label: 'Alle',
    description: 'Stoppt alle anderen Szenen. Nur diese spielt.',
    icon: '🛑',
  },
  {
    mode: 'except',
    label: 'Außer Gruppe',
    description: 'Stoppt alle Gruppen außer dieser.',
    icon: '🔄',
  },
]

export function ReleaseModeSelector({
  releaseMode,
  selectedGroupName,
  onReleaseModeChange,
}: ReleaseModeSelecterProps): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-800 rounded border border-slate-700">
      <div>
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide mb-2">
          Release-Modus
        </h4>
        <p className="text-xs text-slate-400 mb-3">
          Bestimmt, was mit anderen Szenen passiert, wenn diese startet.
        </p>
      </div>

      {/* Mode buttons */}
      <div className="space-y-2">
        {RELEASE_MODES.map(option => (
          <button
            key={option.mode}
            onClick={() => onReleaseModeChange(option.mode)}
            className={`w-full text-left px-3 py-2 rounded border-2 transition-colors ${
              releaseMode === option.mode
                ? 'border-blue-500 bg-blue-600 bg-opacity-20 text-blue-300'
                : 'border-slate-600 bg-slate-700 bg-opacity-50 text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg mt-0.5">{option.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold">{option.label}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {option.description}
                </div>
              </div>
              {releaseMode === option.mode && (
                <div className="text-lg">✓</div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Current mode explanation */}
      <div className="mt-2 p-2 bg-blue-900 bg-opacity-30 border border-blue-600 rounded">
        <div className="text-xs font-semibold text-blue-300 mb-1">
          Aktueller Modus: {RELEASE_MODES.find(m => m.mode === releaseMode)?.label}
        </div>
        <div className="text-xs text-blue-200">
          {releaseMode === 'off' && '➜ Mehrere Szenen können gleichzeitig laufen.'}
          {releaseMode === 'group' &&
            `➜ Stoppt andere Szenen in der gleichen Gruppe${selectedGroupName ? ` (${selectedGroupName})` : ''}.`}
          {releaseMode === 'all' && '➜ Diese Szene wird allein ausgespielt.'}
          {releaseMode === 'except' &&
            `➜ Stoppt alle Gruppen außer der aktuellen${selectedGroupName ? ` (${selectedGroupName})` : ''}.`}
        </div>
      </div>

      {/* Info box */}
      <div className="text-xs text-slate-400 bg-slate-900 rounded p-2 space-y-1">
        <div className="font-semibold text-slate-300">💡 Tipps:</div>
        <div>
          • <strong>Aus</strong>: Für Layer-basierte Effekte
        </div>
        <div>
          • <strong>Gruppe</strong>: Für Effekte in Kategorien
        </div>
        <div>
          • <strong>Alle</strong>: Für Solo-Szenen (z.B. Blackout)
        </div>
        <div>
          • <strong>Außer</strong>: Für komplexe Multi-Scene Shows
        </div>
      </div>
    </div>
  )
}
