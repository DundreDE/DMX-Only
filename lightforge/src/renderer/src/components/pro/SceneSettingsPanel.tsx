// ════════════════════════════════════════════════════════════════════════════
//  Scene Settings Panel — Properties / Contents / Advanced tabs
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import type { Scene, SceneEffect, EfxWave } from '../../../../shared/types'
import { WAVE_TYPES, WAVE_LABELS } from '../../utils/sceneEditorHelpers'

type SettingsTab = 'properties' | 'contents' | 'advanced'

interface SceneSettingsPanelProps {
  scene: Scene | null
  onUpdateScene: (id: string, changes: Partial<Scene>) => void
  onDeleteEffect: (sceneId: string, effectId: string) => void
}

export function SceneSettingsPanel({
  scene,
  onUpdateScene,
  onDeleteEffect,
}: SceneSettingsPanelProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<SettingsTab>('properties')
  const [playbackMode, setPlaybackMode] = useState<
    'forward' | 'reverse' | 'bounce' | 'pause'
  >('forward')
  const [releaseMode, setReleaseMode] = useState<
    'off' | 'group' | 'all' | 'except'
  >('off')

  if (!scene) {
    return (
      <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            Szenen-Einstellungen
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
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
          {scene.name}
        </h3>
        <div className="text-xs text-slate-500 mt-1">Szenen-Einstellungen</div>
      </div>

      {/* Tab buttons */}
      <div className="flex border-b border-slate-700 bg-slate-800 shrink-0">
        {(['properties', 'contents', 'advanced'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-xs font-semibold uppercase transition-colors ${
              activeTab === tab
                ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {tab === 'properties'
              ? 'Eigenschaften'
              : tab === 'contents'
                ? 'Inhalt'
                : 'Erweitert'}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'properties' && (
          <div className="p-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Szenen-Name
              </label>
              <input
                type="text"
                value={scene.name}
                onChange={e =>
                  onUpdateScene(scene.id, { name: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Fade Time */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Überblendungszeit (ms)
              </label>
              <input
                type="number"
                min="0"
                max="10000"
                value={scene.fadeTime ?? 0}
                onChange={e =>
                  onUpdateScene(scene.id, {
                    fadeTime: Math.max(0, Number(e.target.value)),
                  })
                }
                className="w-full px-3 py-2 text-sm bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Playback Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Abspiel-Modus
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { mode: 'forward', label: '▶ Vorwärts' },
                  { mode: 'reverse', label: '◀ Rückwärts' },
                  { mode: 'bounce', label: '↔ Bounce' },
                  { mode: 'pause', label: '⏸ Pause' },
                ].map(item => (
                  <button
                    key={item.mode}
                    onClick={() =>
                      setPlaybackMode(
                        item.mode as 'forward' | 'reverse' | 'bounce' | 'pause',
                      )
                    }
                    className={`px-3 py-2 text-xs rounded font-medium transition-colors ${
                      playbackMode === item.mode
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Release Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Release-Modus
              </label>
              <select
                value={releaseMode}
                onChange={e =>
                  setReleaseMode(
                    e.target.value as 'off' | 'group' | 'all' | 'except',
                  )
                }
                className="w-full px-3 py-2 text-sm bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="off">Aus - Szene aktiv lassen</option>
                <option value="group">Gruppe - Stoppe Gruppe</option>
                <option value="all">Alle - Stoppe alle</option>
                <option value="except">Außer Gruppe - Alles außer dieser</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'contents' && (
          <div className="p-4 space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-2">
                Szenen-Typ
              </h4>
              <select className="w-full px-3 py-2 text-sm bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Static (Statisch)</option>
                <option>Steps (Schritte)</option>
                <option>FX (Effekte)</option>
                <option>Super Scene (Timeline)</option>
              </select>
            </div>

            {/* Effects */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-2">
                Effekte ({scene.effects?.length ?? 0})
              </h4>
              {!scene.effects || scene.effects.length === 0 ? (
                <div className="text-xs text-slate-500 bg-slate-800 rounded p-2">
                  Keine Effekte. Nutze den FX-Generator um Effekte hinzuzufügen.
                </div>
              ) : (
                <div className="space-y-2">
                  {scene.effects.map(fx => (
                    <div
                      key={fx.id}
                      className="p-2 bg-slate-800 rounded border border-slate-600 space-y-1"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-semibold text-slate-200">
                            {fx.label}
                          </div>
                          <div className="text-xs text-slate-500">
                            {WAVE_LABELS[fx.wave]}
                            {' '}
                            @ {fx.speed}
                            {' '}
                            BPM | Size: {fx.size}
                          </div>
                          <div className="text-xs text-slate-600">
                            Target: {fx.target}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            onDeleteEffect(scene.id, fx.id)
                          }
                          className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                        >
                          🗑
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="p-4 space-y-4">
            <div>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  defaultChecked={false}
                  className="rounded w-4 h-4"
                />
                Loop (Wiederholen)
              </label>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  defaultChecked={false}
                  className="rounded w-4 h-4"
                />
                Auto-Jump zu nächster Szene
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                BPM Sync
              </label>
              <select className="w-full px-3 py-2 text-sm bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Global BPM</option>
                <option>Custom (Manual)</option>
                <option>MIDI Sync</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Notes (Notizen)
              </label>
              <textarea
                className="w-full px-3 py-2 text-sm bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Notizen zu dieser Szene..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
