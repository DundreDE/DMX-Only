import React from 'react'
import { Label } from '@/components/ui/label'

interface ParameterGridProps {
  speed: number
  phase: number
  amplitude: number
  offset: number
  onSpeedChange: (speed: number) => void
  onPhaseChange: (phase: number) => void
  onAmplitudeChange: (amplitude: number) => void
  onOffsetChange: (offset: number) => void
}

export const EffectParameterGrid: React.FC<ParameterGridProps> = ({
  speed,
  phase,
  amplitude,
  offset,
  onSpeedChange,
  onPhaseChange,
  onAmplitudeChange,
  onOffsetChange,
}) => {
  return (
    <div className="space-y-3">
      {/* Speed */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs text-slate-300">Speed</Label>
          <span className="text-xs text-slate-500">{(speed * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0.1"
          max="10"
          step="0.1"
          value={speed}
          onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>0.1×</span>
          <span>10×</span>
        </div>
      </div>

      {/* Phase */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs text-slate-300">Phase Offset</Label>
          <span className="text-xs text-slate-500">{(phase * 360).toFixed(1)}°</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={phase}
          onChange={(e) => onPhaseChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>0°</span>
          <span>360°</span>
        </div>
      </div>

      {/* Amplitude */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs text-slate-300">Amplitude</Label>
          <span className="text-xs text-slate-500">{amplitude.toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="255"
          step="1"
          value={amplitude}
          onChange={(e) => onAmplitudeChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>Min</span>
          <span>Max</span>
        </div>
      </div>

      {/* Offset */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs text-slate-300">Offset</Label>
          <span className="text-xs text-slate-500">{offset.toFixed(0)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="255"
          step="1"
          value={offset}
          onChange={(e) => onOffsetChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded cursor-pointer accent-blue-500"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>0</span>
          <span>255</span>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="border-t border-slate-700 pt-2">
        <Label className="text-xs text-slate-400 mb-2 block">Quick Presets</Label>
        <div className="grid grid-cols-2 gap-1">
          <button className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition">
            Fast
          </button>
          <button className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition">
            Slow
          </button>
          <button className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition">
            Full
          </button>
          <button className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition">
            Half
          </button>
        </div>
      </div>
    </div>
  )
}
