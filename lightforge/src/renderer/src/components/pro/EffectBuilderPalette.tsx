import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const EFFECT_TYPES = [
  { type: 'color', label: 'Color FX', icon: '🎨' },
  { type: 'chaser', label: 'Chaser', icon: '🏃' },
  { type: 'move', label: 'Move', icon: '↔️' },
  { type: 'value', label: 'Value', icon: '📊' },
  { type: 'curve', label: 'Curve', icon: '📈' },
]

const EFFECT_PRESETS = {
  color: [
    { name: 'Rainbow', config: { type: 'rainbow', speed: 1 } },
    { name: 'Strobe', config: { type: 'strobe', speed: 5 } },
    { name: 'Pulse', config: { type: 'pulse', speed: 2 } },
  ],
  chaser: [
    { name: 'Left to Right', config: { direction: 'right', speed: 1 } },
    { name: 'Right to Left', config: { direction: 'left', speed: 1 } },
    { name: 'Ping Pong', config: { direction: 'bounce', speed: 1 } },
  ],
  move: [
    { name: 'Pan Wave', config: { mode: 'pan', waveType: 'sine', speed: 1 } },
    { name: 'Tilt Wave', config: { mode: 'tilt', waveType: 'sine', speed: 1 } },
    { name: 'Circle', config: { mode: 'circle', speed: 1 } },
  ],
  value: [
    { name: 'Dimmer Pulse', config: { channel: 'dimmer', waveType: 'sine' } },
    { name: 'Strobe Effect', config: { channel: 'strobe', waveType: 'square' } },
  ],
  curve: [
    { name: 'Custom Ramp', config: { points: [0, 128, 255] } },
    { name: 'S-Curve', config: { points: [0, 64, 128, 192, 255] } },
  ],
}

interface EffectBuilderPaletteProps {
  effects: any[]
  onAddEffect: (effect: any) => void
  onRemoveEffect: (effectId: string) => void
  onUpdateEffect: (id: string, config: any) => void
}

export const EffectBuilderPalette: React.FC<EffectBuilderPaletteProps> = ({
  effects,
  onAddEffect,
  onRemoveEffect,
  onUpdateEffect,
}) => {
  const [selectedType, setSelectedType] = useState('color')
  const [searchQuery, setSearchQuery] = useState('')

  const handleAddPreset = (preset: any) => {
    const newEffect = {
      id: `effect-${Date.now()}`,
      type: selectedType,
      fixtures: [],
      config: preset.config,
    }
    onAddEffect(newEffect)
  }

  const filteredPresets = EFFECT_PRESETS[selectedType as keyof typeof EFFECT_PRESETS]?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      selectedType.includes(searchQuery.toLowerCase())
  )

  return (
    <div className="w-64 flex flex-col gap-2 bg-slate-900 p-2 rounded border border-slate-700">
      <h3 className="text-sm font-medium">Effect Library</h3>

      {/* Type Selector */}
      <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
        <TabsList className="grid grid-cols-5 w-full h-auto p-1 bg-slate-800">
          {EFFECT_TYPES.map((et) => (
            <TabsTrigger
              key={et.type}
              value={et.type}
              className="text-xs p-1"
              title={et.label}
            >
              {et.icon}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search */}
      <Input
        placeholder="Search effects..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="h-8 text-xs bg-slate-800 border-slate-700"
      />

      {/* Presets List */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {filteredPresets?.map((preset) => (
          <button
            key={preset.name}
            onClick={() => handleAddPreset(preset)}
            className="w-full text-left p-2 rounded bg-slate-800 hover:bg-slate-700 text-xs transition flex items-center justify-between group"
          >
            <span>{preset.name}</span>
            <span className="text-slate-500 group-hover:text-slate-300">+</span>
          </button>
        ))}
      </div>

      {/* Active Effects */}
      <div className="border-t border-slate-700 pt-2">
        <h4 className="text-xs font-medium text-slate-400 mb-2">Active Effects</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {effects.length === 0 ? (
            <p className="text-xs text-slate-500">No effects added</p>
          ) : (
            effects.map((effect) => (
              <div
                key={effect.id}
                className="flex items-center justify-between p-1 rounded bg-slate-800 text-xs"
              >
                <span className="text-slate-300">{effect.type}</span>
                <button
                  onClick={() => onRemoveEffect(effect.id)}
                  className="text-slate-500 hover:text-red-400 transition"
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-slate-700 pt-2 space-y-1">
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs border-slate-600 hover:bg-slate-800"
        >
          Import Preset
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs border-slate-600 hover:bg-slate-800"
        >
          Save as Preset
        </Button>
      </div>
    </div>
  )
}
