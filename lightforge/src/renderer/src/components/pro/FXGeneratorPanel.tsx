// ════════════════════════════════════════════════════════════════════════════
//  FX Generator Panel — Create and manage effects
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import type { Scene, SceneEffect, FixtureCapabilityType, EfxWave } from '../../../../shared/types'
import { WAVE_TYPES, WAVE_LABELS } from '../../utils/sceneEditorHelpers'

interface FXGeneratorPanelProps {
  scene: Scene | null
  selectedFixtureIds: Set<string>
  onAddEffect: (sceneId: string, effect: Omit<SceneEffect, 'id'>) => void
  onDeleteEffect?: (sceneId: string, effectId: string) => void
}

type EffectTarget =
  | 'Dimmer'
  | 'Red'
  | 'Green'
  | 'Blue'
  | 'Pan'
  | 'Tilt'
  | 'Gobo'

const TARGET_OPTIONS: { value: EffectTarget; label: string }[] = [
  { value: 'Dimmer', label: '💡 Helligkeit' },
  { value: 'Red', label: '🔴 Rot' },
  { value: 'Green', label: '🟢 Grün' },
  { value: 'Blue', label: '🔵 Blau' },
  { value: 'Pan', label: '↔ Pan (Links/Rechts)' },
  { value: 'Tilt', label: '↕ Tilt (Oben/Unten)' },
  { value: 'Gobo', label: '⊙ Gobo (Muster)' },
]

export function FXGeneratorPanel({
  scene,
  selectedFixtureIds,
  onAddEffect,
  onDeleteEffect,
}: FXGeneratorPanelProps): React.JSX.Element {
  const [waveType, setWaveType] = useState<EfxWave>('sine')
  const [speed, setSpeed] = useState(120)
  const [size, setSize] = useState(128)
  const [base, setBase] = useState(128)
  const [offset, setOffset] = useState(0)
  const [targetType, setTargetType] = useState<EffectTarget>('Dimmer')
  const [fxLabel, setFxLabel] = useState('Effekt')

  const handleCreateEffect = (): void => {
    if (!scene || selectedFixtureIds.size === 0) return

    const effect: Omit<SceneEffect, 'id'> = {
      label: fxLabel,
      target: targetType,
      wave: waveType,
      speed,
      size,
      base,
      offset,
      fixtureIds: Array.from(selectedFixtureIds),
    }

    onAddEffect(scene.id, effect)

    // Reset form
    setFxLabel('Effekt')
    setSpeed(120)
    setSize(128)
    setBase(128)
    setOffset(0)
  }

  if (!scene) {
    return (
      <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            FX Generator
          </h3>
        </div>
        <div className="flex items-center justify-center h-full text-slate-500">
          Wähle eine Szene aus
        </div>
      </div>
    )
  }

  const canCreateEffect = selectedFixtureIds.size > 0

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
          FX Generator
        </h3>
        <div className="text-xs text-slate-500 mt-1">
          {selectedFixtureIds.size}
          {' '}
          Lampe(n) ausgewählt
        </div>
      </div>

      {/* Generator content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Label */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Effekt-Name
          </label>
          <input
            type="text"
            value={fxLabel}
            onChange={e => setFxLabel(e.target.value)}
            placeholder="z.B. Farbfade, Bewegung, Pulse..."
            className="w-full px-3 py-2 text-sm bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Target */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Ziel-Kanal
          </label>
          <select
            value={targetType}
            onChange={e => setTargetType(e.target.value as EffectTarget)}
            className="w-full px-3 py-2 text-sm bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TARGET_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Wave Type */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Wellenform
          </label>
          <div className="grid grid-cols-2 gap-2">
            {WAVE_TYPES.map(wave => (
              <button
                key={wave}
                onClick={() => setWaveType(wave)}
                className={`px-3 py-2 text-xs rounded font-medium transition-colors ${
                  waveType === wave
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {WAVE_LABELS[wave]}
              </button>
            ))}
          </div>
        </div>

        {/* Speed */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Geschwindigkeit: {speed}
            {' '}
            BPM
          </label>
          <input
            type="range"
            min="20"
            max="300"
            value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Size */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Größe: {size}
            {' '}
            / 255
          </label>
          <input
            type="range"
            min="0"
            max="255"
            value={size}
            onChange={e => setSize(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Base */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Basis-Level: {base}
            {' '}
            / 255
          </label>
          <input
            type="range"
            min="0"
            max="255"
            value={base}
            onChange={e => setBase(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Offset */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Phase-Offset: {offset}
            °
          </label>
          <input
            type="range"
            min="0"
            max="360"
            value={offset}
            onChange={e => setOffset(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Create button */}
        <button
          onClick={handleCreateEffect}
          disabled={!canCreateEffect}
          className={`w-full px-4 py-3 rounded font-semibold text-white transition-colors ${
            canCreateEffect
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-slate-600 cursor-not-allowed opacity-50'
          }`}
        >
          ✨ Effekt erstellen
        </button>

        {!canCreateEffect && (
          <div className="text-xs text-slate-400 bg-slate-800 rounded p-2">
            Wähle mindestens eine Lampe aus, um einen Effekt zu erstellen.
          </div>
        )}

        {/* Existing effects */}
        {scene.effects && scene.effects.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">
              Effekte in dieser Szene
            </h4>
            <div className="space-y-2">
              {scene.effects.map(fx => (
                <div
                  key={fx.id}
                  className="p-2 bg-slate-800 rounded border border-slate-600 flex justify-between items-start"
                >
                  <div className="text-xs">
                    <div className="font-semibold text-slate-200">{fx.label}</div>
                    <div className="text-slate-500">
                      {WAVE_LABELS[fx.wave]}
                      {' '}
                      @ {fx.speed}
                      BPM
                    </div>
                  </div>
                  {onDeleteEffect && (
                    <button
                      onClick={() => onDeleteEffect(scene.id, fx.id)}
                      className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded"
                    >
                      🗑
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
