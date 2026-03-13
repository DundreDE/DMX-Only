// ════════════════════════════════════════════════════════════════════════════
//  AdvancedEffectsPanel — Multiple effects, chaining, blending
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'

type EffectType = 'color' | 'chaser' | 'move' | 'value' | 'curve'
type BlendMode = 'add' | 'multiply' | 'override' | 'lerp'

interface Effect {
  id: string
  name: string
  type: EffectType
  speed: number
  phase: number
  spread: number
  enabled: boolean
  blendMode: BlendMode
  intensity: number
}

interface AdvancedEffectsPanelProps {
  effects: Effect[]
  onAddEffect?: (effect: Omit<Effect, 'id'>) => void
  onRemoveEffect?: (effectId: string) => void
  onUpdateEffect?: (effectId: string, changes: Partial<Effect>) => void
}

const EFFECT_TYPES: { type: EffectType; label: string; description: string }[] = [
  { type: 'color', label: 'Color FX', description: 'Farbwechsel-Effekt' },
  { type: 'chaser', label: 'Chaser', description: 'Lauflicht' },
  { type: 'move', label: 'Move FX', description: 'Bewegungseffekt' },
  { type: 'value', label: 'Value FX', description: 'Dimmer/Wert Puls' },
  { type: 'curve', label: 'Curve', description: 'Custom Kurve' },
]

const BLEND_MODES: { mode: BlendMode; label: string; description: string }[] = [
  { mode: 'add', label: 'Add', description: 'Werte addieren (Helligkeit)' },
  { mode: 'multiply', label: 'Multiply', description: 'Werte multiplizieren' },
  { mode: 'override', label: 'Override', description: 'Effekt überschreibt' },
  { mode: 'lerp', label: 'Lerp', description: 'Interpolation (smooth)' },
]

export function AdvancedEffectsPanel({
  effects,
  onAddEffect,
  onRemoveEffect,
  onUpdateEffect,
}: AdvancedEffectsPanelProps): React.JSX.Element {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newEffectType, setNewEffectType] = useState<EffectType>('color')

  const createNewEffect = () => {
    const newEffect: Omit<Effect, 'id'> = {
      name: `Effect ${effects.length + 1}`,
      type: newEffectType,
      speed: 1.0,
      phase: 0,
      spread: 1.0,
      enabled: true,
      blendMode: 'add',
      intensity: 1.0,
    }
    onAddEffect?.(newEffect)
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
          🎆 Advanced Effects
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Mehrere Effekte kombinieren und blenden
        </p>
      </div>

      {/* Effects List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {effects.length === 0 ? (
          <div className="text-slate-500 text-sm italic">
            Keine Effekte. Füge einen neuen Effekt hinzu.
          </div>
        ) : (
          effects.map(effect => (
            <div key={effect.id} className="border border-slate-700 rounded overflow-hidden">
              {/* Effect Header (always visible) */}
              <button
                onClick={() =>
                  setExpandedId(expandedId === effect.id ? null : effect.id)
                }
                className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 text-left">
                  <input
                    type="checkbox"
                    checked={effect.enabled}
                    onChange={e => {
                      e.stopPropagation()
                      onUpdateEffect?.(effect.id, { enabled: e.target.checked })
                    }}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="text-sm font-semibold text-slate-200">
                      {effect.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {EFFECT_TYPES.find(t => t.type === effect.type)?.label}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      onRemoveEffect?.(effect.id)
                    }}
                    className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    🗑
                  </button>
                  <span className="text-slate-400">
                    {expandedId === effect.id ? '▼' : '▶'}
                  </span>
                </div>
              </button>

              {/* Effect Details (expandable) */}
              {expandedId === effect.id && (
                <div className="px-3 py-2 bg-slate-700 bg-opacity-50 space-y-3 border-t border-slate-700">
                  {/* Name */}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={effect.name}
                      onChange={e => onUpdateEffect?.(effect.id, { name: e.target.value })}
                      className="w-full px-2 py-1 text-xs bg-slate-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">
                      Type
                    </label>
                    <select
                      value={effect.type}
                      onChange={e =>
                        onUpdateEffect?.(effect.id, { type: e.target.value as EffectType })
                      }
                      className="w-full px-2 py-1 text-xs bg-slate-600 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {EFFECT_TYPES.map(t => (
                        <option key={t.type} value={t.type}>
                          {t.label} — {t.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Speed Slider */}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">
                      Speed: {effect.speed.toFixed(2)}x
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="4"
                      step="0.1"
                      value={effect.speed}
                      onChange={e =>
                        onUpdateEffect?.(effect.id, { speed: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Phase Slider */}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">
                      Phase: {(effect.phase * 360).toFixed(0)}°
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={effect.phase}
                      onChange={e =>
                        onUpdateEffect?.(effect.id, { phase: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Spread Slider */}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">
                      Spread: {effect.spread.toFixed(2)}x
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={effect.spread}
                      onChange={e =>
                        onUpdateEffect?.(effect.id, { spread: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Intensity */}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">
                      Intensity: {(effect.intensity * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={effect.intensity}
                      onChange={e =>
                        onUpdateEffect?.(effect.id, { intensity: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>

                  {/* Blend Mode */}
                  <div>
                    <label className="text-xs text-slate-400 font-semibold block mb-1">
                      Blend Mode
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      {BLEND_MODES.map(bm => (
                        <button
                          key={bm.mode}
                          onClick={() =>
                            onUpdateEffect?.(effect.id, { blendMode: bm.mode })
                          }
                          className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                            effect.blendMode === bm.mode
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-600 hover:bg-slate-500 text-slate-200'
                          }`}
                          title={bm.description}
                        >
                          {bm.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Effect Form */}
      <div className="px-4 py-3 border-t border-slate-700 bg-slate-800 space-y-2 shrink-0">
        <label className="text-xs text-slate-400 font-semibold">Neuer Effekt:</label>

        <div className="flex gap-2">
          <select
            value={newEffectType}
            onChange={e => setNewEffectType(e.target.value as EffectType)}
            className="flex-1 px-2 py-1 text-xs bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {EFFECT_TYPES.map(t => (
              <option key={t.type} value={t.type}>
                {t.label}
              </option>
            ))}
          </select>

          <button
            onClick={createNewEffect}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-colors"
          >
            ➕ Add
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="px-4 py-2 bg-slate-800 text-xs text-slate-400 space-y-1 shrink-0">
        <div>💡 Effekte können kombiniert werden</div>
        <div>🎬 Nutze verschiedene Blend Modes für Komplexität</div>
        <div>⚙️ Expandiere jeden Effekt für Details</div>
      </div>
    </div>
  )
}
