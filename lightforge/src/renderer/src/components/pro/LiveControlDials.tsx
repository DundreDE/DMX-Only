// ════════════════════════════════════════════════════════════════════════════
//  Live Control Dials — Speed / Size / Phase / Offset real-time controls
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import type { Scene, SceneEffect } from '../../../../shared/types'

interface LiveControlDialsProps {
  scene: Scene | null
  onEffectChange?: (sceneId: string, effectId: string, changes: Partial<SceneEffect>) => void
}

interface DialConfig {
  id: string
  label: string
  min: number
  max: number
  step: number
  unit: string
  getIcon: () => string
}

const DIALS: DialConfig[] = [
  {
    id: 'speed',
    label: 'Geschwindigkeit',
    min: 20,
    max: 300,
    step: 1,
    unit: 'BPM',
    getIcon: () => '⏱',
  },
  {
    id: 'size',
    label: 'Größe',
    min: 0,
    max: 255,
    step: 1,
    unit: 'Amp.',
    getIcon: () => '📏',
  },
  {
    id: 'phase',
    label: 'Phase',
    min: 0,
    max: 360,
    step: 1,
    unit: '°',
    getIcon: () => '◆',
  },
  {
    id: 'offset',
    label: 'Offset',
    min: 0,
    max: 360,
    step: 1,
    unit: '°',
    getIcon: () => '↗',
  },
]

interface DialValue {
  speed: number
  size: number
  phase: number
  offset: number
}

export function LiveControlDials({
  scene,
  onEffectChange,
}: LiveControlDialsProps): React.JSX.Element {
  const [values, setValues] = useState<DialValue>({
    speed: 120,
    size: 128,
    phase: 0,
    offset: 0,
  })

  // Get dial values from first effect if available
  const firstEffect = scene?.effects?.[0]
  const displayValues = firstEffect
    ? {
        speed: firstEffect.speed,
        size: firstEffect.size,
        phase: 0, // Could add to effect model
        offset: firstEffect.offset,
      }
    : values

  const handleDialChange = (
    dialId: string,
    newValue: number,
  ): void => {
    setValues(prev => ({ ...prev, [dialId]: newValue }))

    // Update first effect if scene has one
    if (scene && firstEffect && onEffectChange) {
      const changes: Partial<SceneEffect> = {}
      if (dialId === 'speed') changes.speed = newValue
      if (dialId === 'size') changes.size = newValue
      if (dialId === 'offset') changes.offset = newValue
      if (Object.keys(changes).length > 0) {
        onEffectChange(scene.id, firstEffect.id, changes)
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
          Live Control Dials
        </h3>
        <div className="text-xs text-slate-500 mt-1">
          {scene ? 'Echtzeit Szenen-Kontrolle' : 'Keine Szene ausgewählt'}
        </div>
      </div>

      {/* Dials grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {!scene ? (
          <div className="flex items-center justify-center h-full text-slate-500">
            Wähle eine Szene aus
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {DIALS.map(dial => {
              const value =
                displayValues[dial.id as keyof DialValue]
              const normalized = (value - dial.min) / (dial.max - dial.min)

              return (
                <div
                  key={dial.id}
                  className="flex flex-col items-center space-y-3"
                >
                  {/* Dial visualization (circular) */}
                  <div
                    className="relative w-24 h-24 rounded-full border-4 border-slate-700 flex items-center justify-center"
                    style={{
                      background: `conic-gradient(from 0deg, #3b82f6 0deg, #3b82f6 ${normalized * 360}deg, #1e293b ${normalized * 360}deg, #1e293b 360deg)`,
                    }}
                  >
                    <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center">
                      <span className="text-2xl">{dial.getIcon()}</span>
                    </div>
                  </div>

                  {/* Label */}
                  <div className="text-center">
                    <div className="text-xs font-semibold text-slate-300">
                      {dial.label}
                    </div>
                    <div className="text-lg font-bold text-blue-400 mt-1">
                      {Math.round(value)}
                      {' '}
                      {dial.unit}
                    </div>
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min={dial.min}
                    max={dial.max}
                    step={dial.step}
                    value={value}
                    onChange={e => handleDialChange(dial.id, Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded appearance-none cursor-pointer accent-blue-500"
                  />

                  {/* Quick buttons */}
                  <div className="flex gap-1 w-full">
                    <button
                      onClick={() =>
                        handleDialChange(dial.id, dial.min)
                      }
                      className="flex-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                    >
                      Min
                    </button>
                    <button
                      onClick={() =>
                        handleDialChange(
                          dial.id,
                          (dial.min + dial.max) / 2,
                        )
                      }
                      className="flex-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                    >
                      Mid
                    </button>
                    <button
                      onClick={() =>
                        handleDialChange(dial.id, dial.max)
                      }
                      className="flex-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                    >
                      Max
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-500 space-y-1 shrink-0">
        <div>💡 Passe die Dials an, um Szenen live zu kontrollieren</div>
        <div>📡 Änderungen werden in Echtzeit übernommen</div>
      </div>
    </div>
  )
}
