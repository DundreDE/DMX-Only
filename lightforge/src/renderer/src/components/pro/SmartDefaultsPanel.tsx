import React from 'react'
import { Button } from '@/components/ui/button'

const FIXTURE_TYPES = [
  {
    name: 'PAR LED',
    icon: '💡',
    preset: [
      { id: 'dimmer', name: 'Dimmer', min: 0, max: 255, default: 0 },
      { id: 'red', name: 'Red', min: 0, max: 255, default: 0 },
      { id: 'green', name: 'Green', min: 0, max: 255, default: 0 },
      { id: 'blue', name: 'Blue', min: 0, max: 255, default: 0 },
    ],
  },
  {
    name: 'Moving Head',
    icon: '🎬',
    preset: [
      { id: 'dimmer', name: 'Dimmer', min: 0, max: 255, default: 0 },
      { id: 'pan', name: 'Pan', min: 0, max: 255, default: 128 },
      { id: 'tilt', name: 'Tilt', min: 0, max: 255, default: 128 },
      { id: 'color', name: 'Color Wheel', min: 0, max: 255, default: 0 },
      { id: 'gobo', name: 'Gobo', min: 0, max: 255, default: 0 },
      { id: 'focus', name: 'Focus', min: 0, max: 255, default: 128 },
      { id: 'strobe', name: 'Strobe', min: 0, max: 255, default: 0 },
    ],
  },
  {
    name: 'RGB Flood',
    icon: '🌈',
    preset: [
      { id: 'red', name: 'Red', min: 0, max: 255, default: 0 },
      { id: 'green', name: 'Green', min: 0, max: 255, default: 0 },
      { id: 'blue', name: 'Blue', min: 0, max: 255, default: 0 },
      { id: 'white', name: 'White', min: 0, max: 255, default: 0 },
    ],
  },
  {
    name: 'Strobe',
    icon: '⚡',
    preset: [
      { id: 'strobe', name: 'Strobe Rate', min: 0, max: 255, default: 0 },
      { id: 'intensity', name: 'Intensity', min: 0, max: 255, default: 255 },
    ],
  },
  {
    name: 'Hazer',
    icon: '💨',
    preset: [
      { id: 'intensity', name: 'Haze Level', min: 0, max: 255, default: 0 },
      { id: 'timer', name: 'Timer', min: 0, max: 255, default: 255 },
    ],
  },
]

interface SmartDefaultsPanelProps {
  onSelectPreset: (preset: any[]) => void
}

export const SmartDefaultsPanel: React.FC<SmartDefaultsPanelProps> = ({ onSelectPreset }) => {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-3">Fixture Type Presets</h3>
        <p className="text-xs text-slate-400 mb-4">
          Click a fixture type to auto-populate common channels
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {FIXTURE_TYPES.map((fixture) => (
          <button
            key={fixture.name}
            onClick={() => onSelectPreset(fixture.preset)}
            className="p-3 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{fixture.icon}</span>
              <div>
                <div className="font-medium text-sm">{fixture.name}</div>
                <div className="text-xs text-slate-400">{fixture.preset.length} channels</div>
              </div>
            </div>

            {/* Channel preview */}
            <div className="text-xs text-slate-500 space-y-1">
              {fixture.preset.map((ch) => (
                <div key={ch.id} className="flex justify-between">
                  <span>{ch.name}</span>
                  <span className="text-slate-600">{ch.default}</span>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Custom Presets Section */}
      <div className="border-t border-slate-700 pt-4">
        <h3 className="text-sm font-medium mb-3">Custom Presets</h3>
        <p className="text-xs text-slate-400 mb-3">
          Save channel configurations as custom presets
        </p>

        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full text-xs border-slate-600 hover:bg-slate-800"
          >
            Save Current as Preset
          </Button>
          <Button
            variant="outline"
            className="w-full text-xs border-slate-600 hover:bg-slate-800"
          >
            Load Custom Preset
          </Button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-slate-800 p-3 rounded text-xs text-slate-400 border border-slate-700">
        <p className="font-medium mb-1">💡 Tip</p>
        <p>
          You can mix and match channels from different fixture types. Use the Builder tab to
          customize individual channels.
        </p>
      </div>
    </div>
  )
}
