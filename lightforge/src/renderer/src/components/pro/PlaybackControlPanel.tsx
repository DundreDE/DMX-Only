// ════════════════════════════════════════════════════════════════════════════
//  PlaybackControlPanel — Scene playback mode controls
// ════════════════════════════════════════════════════════════════════════════

import type { Scene } from '../../../../shared/types'

type PlaybackMode = 'forward' | 'reverse' | 'bounce' | 'pause'

interface PlaybackControlPanelProps {
  scene: Scene | null
  playbackMode: PlaybackMode
  isPlaying: boolean
  onPlaybackModeChange: (mode: PlaybackMode) => void
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSkipForward?: () => void
  onSkipBackward?: () => void
}

export function PlaybackControlPanel({
  scene,
  playbackMode,
  isPlaying,
  onPlaybackModeChange,
  onPlay,
  onPause,
  onStop,
  onSkipForward,
  onSkipBackward,
}: PlaybackControlPanelProps): React.JSX.Element {
  if (!scene) {
    return (
      <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            Playback Control
          </h3>
        </div>
        <div className="flex items-center justify-center h-full text-slate-500">
          Wähle eine Szene aus
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
          ▶ Playback Control
        </h3>
        <div className="text-xs text-slate-500 mt-1">
          {isPlaying ? '▶️ Wird abgespielt' : '⏸️ Pausiert'}
        </div>
      </div>

      {/* Playback Buttons */}
      <div className="px-4 py-4 border-b border-slate-700 space-y-3 shrink-0">
        {/* Play/Pause */}
        <div className="flex gap-2">
          <button
            onClick={onPlay}
            className={`flex-1 px-4 py-3 rounded font-bold text-white transition-colors ${
              isPlaying
                ? 'bg-green-700 hover:bg-green-600'
                : 'bg-green-600 hover:bg-green-500'
            }`}
          >
            ▶ Abspielen
          </button>
          <button
            onClick={onPause}
            className="flex-1 px-4 py-3 bg-yellow-600 hover:bg-yellow-500 rounded font-bold text-white transition-colors"
          >
            ⏸ Pause
          </button>
          <button
            onClick={onStop}
            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 rounded font-bold text-white transition-colors"
          >
            ⏹ Stop
          </button>
        </div>

        {/* Skip buttons */}
        <div className="flex gap-2">
          <button
            onClick={onSkipBackward}
            className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded font-semibold text-slate-200 transition-colors"
          >
            ⏮ Zurück
          </button>
          <button
            onClick={onSkipForward}
            className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded font-semibold text-slate-200 transition-colors"
          >
            Weiter ⏭
          </button>
        </div>
      </div>

      {/* Playback Mode */}
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <label className="block text-xs font-semibold text-slate-300 mb-2">
          Abspiel-Modus
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { mode: 'forward', label: '▶ Vorwärts', icon: '⏯️' },
            { mode: 'reverse', label: '◀ Rückwärts', icon: '⏮️' },
            { mode: 'bounce', label: '↔ Bounce', icon: '🔄' },
            { mode: 'pause', label: '⏸ Pause', icon: '⏸️' },
          ].map(item => (
            <button
              key={item.mode}
              onClick={() => onPlaybackModeChange(item.mode as PlaybackMode)}
              className={`px-3 py-2 rounded font-semibold text-sm transition-colors ${
                playbackMode === item.mode
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <div className="bg-slate-800 rounded p-3 space-y-2">
          <div className="text-xs font-semibold text-slate-300">Modus Info:</div>
          {playbackMode === 'forward' && (
            <div className="text-xs text-slate-400">
              ▶️ Szene läuft <strong>vorwärts</strong> und wiederholt sich.
            </div>
          )}
          {playbackMode === 'reverse' && (
            <div className="text-xs text-slate-400">
              ◀️ Szene läuft <strong>rückwärts</strong> und wiederholt sich.
            </div>
          )}
          {playbackMode === 'bounce' && (
            <div className="text-xs text-slate-400">
              ↔️ Szene läuft <strong>hin und zurück</strong> (Ping-Pong).
            </div>
          )}
          {playbackMode === 'pause' && (
            <div className="text-xs text-slate-400">
              ⏸️ Szene ist <strong>pausiert</strong>. Nutze Abspielen zum Starten.
            </div>
          )}
        </div>

        <div className="bg-slate-800 rounded p-3 space-y-2">
          <div className="text-xs font-semibold text-slate-300">Szenen-Info:</div>
          <div className="text-xs text-slate-400">
            <div>
              <span className="text-slate-500">Name:</span> {scene.name}
            </div>
            <div>
              <span className="text-slate-500">Fade Time:</span>{' '}
              {scene.fadeTime}ms
            </div>
            <div>
              <span className="text-slate-500">Effekte:</span>{' '}
              {scene.effects?.length ?? 0}
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded p-3 space-y-2">
          <div className="text-xs font-semibold text-slate-300">Tastenkombos:</div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>
              <span className="bg-slate-700 px-1 rounded">Space</span>{' '}
              Play/Pause
            </div>
            <div>
              <span className="bg-slate-700 px-1 rounded">→</span> Weiter
            </div>
            <div>
              <span className="bg-slate-700 px-1 rounded">←</span> Zurück
            </div>
            <div>
              <span className="bg-slate-700 px-1 rounded">Esc</span> Stop
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
