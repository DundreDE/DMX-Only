// ════════════════════════════════════════════════════════════════════════════
//  FadeTransitionPanel — Configure smooth DMX transitions
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import type { EasingType } from '../../utils/fadeTransitionEngine'

interface FadeTransitionPanelProps {
  duration?: number
  easing?: EasingType
  onDurationChange?: (duration: number) => void
  onEasingChange?: (easing: EasingType) => void
  onPreview?: () => void
}

const EASING_OPTIONS: Array<{ value: EasingType; label: string; description: string }> = [
  { value: 'linear', label: 'Linear', description: 'Constant speed' },
  { value: 'ease-in', label: 'Ease In', description: 'Starts slow, accelerates' },
  { value: 'ease-out', label: 'Ease Out', description: 'Starts fast, decelerates' },
  { value: 'ease-in-out', label: 'Ease In-Out', description: 'Smooth acceleration' },
]

export function FadeTransitionPanel({
  duration = 1000,
  easing = 'ease-in-out',
  onDurationChange,
  onEasingChange,
  onPreview,
}: FadeTransitionPanelProps): React.JSX.Element {
  const [localDuration, setLocalDuration] = useState(duration)
  const [localEasing, setLocalEasing] = useState(easing)

  return (
    <div className="flex flex-col gap-3 p-4 bg-slate-800 rounded border border-slate-700">
      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
        ⏱️ Fade Transition
      </h4>

      {/* Duration Slider */}
      <div>
        <label className="text-xs text-slate-400 font-semibold block mb-2">
          Duration: {localDuration}ms
        </label>
        <input
          type="range"
          min="100"
          max="5000"
          step="100"
          value={localDuration}
          onChange={e => {
            const val = parseInt(e.target.value)
            setLocalDuration(val)
            onDurationChange?.(val)
          }}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>100ms</span>
          <span>2500ms</span>
          <span>5000ms</span>
        </div>
      </div>

      {/* Easing Function Selector */}
      <div>
        <label className="text-xs text-slate-400 font-semibold block mb-2">
          Easing Function
        </label>
        <div className="grid grid-cols-2 gap-2">
          {EASING_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => {
                setLocalEasing(option.value)
                onEasingChange?.(option.value)
              }}
              className={`px-3 py-2 rounded text-xs font-semibold transition-colors border ${
                localEasing === option.value
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-500'
              }`}
              title={option.description}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Easing Description */}
      <div className="p-2 bg-slate-700 rounded text-xs text-slate-300">
        <strong>
          {EASING_OPTIONS.find(o => o.value === localEasing)?.label}:
        </strong>{' '}
        {EASING_OPTIONS.find(o => o.value === localEasing)?.description}
      </div>

      {/* Preview Button */}
      <button
        onClick={() => onPreview?.()}
        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition-colors"
      >
        ▶ Preview Fade
      </button>

      {/* Info */}
      <div className="text-xs text-slate-500 space-y-1">
        <div>💡 Smooth transitions between scenes</div>
        <div>⚙️ Applies to all DMX channels</div>
        <div>🎯 Auto-applies when switching scenes</div>
      </div>
    </div>
  )
}
