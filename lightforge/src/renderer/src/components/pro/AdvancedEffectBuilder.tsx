import React, { useState, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EffectParameterGrid } from './EffectParameterGrid'
import { WaveformPreview } from './WaveformPreview'
import { EffectTargetSelector } from './EffectTargetSelector'

const WAVE_TYPES = [
  { id: 'sine', name: 'Sine', icon: '∿' },
  { id: 'triangle', name: 'Triangle', icon: '▲' },
  { id: 'square', name: 'Square', icon: '⬜' },
  { id: 'sawtooth', name: 'Sawtooth', icon: '📈' },
  { id: 'custom', name: 'Custom', icon: '✏️' },
]

const EFFECT_TYPES = [
  { id: 'color', name: 'Color FX', icon: '🎨' },
  { id: 'chaser', name: 'Chaser', icon: '🏃' },
  { id: 'move', name: 'Move FX', icon: '↔️' },
  { id: 'value', name: 'Value FX', icon: '📊' },
  { id: 'curve', name: 'Curve FX', icon: '📈' },
]

interface EffectConfig {
  type: string
  speed: number
  phase: number
  amplitude: number
  offset: number
  waveType: string
  fixtures: string[]
  targetChannels: string[]
  blendMode: 'add' | 'multiply' | 'override' | 'lerp'
}

interface AdvancedEffectBuilderProps {
  onApplyEffect?: (config: EffectConfig) => void
  onClose?: () => void
}

export const AdvancedEffectBuilder: React.FC<AdvancedEffectBuilderProps> = ({
  onApplyEffect,
  onClose,
}) => {
  const [effectType, setEffectType] = useState('sine')
  const [waveType, setWaveType] = useState('sine')
  const [config, setConfig] = useState<EffectConfig>({
    type: 'color',
    speed: 1,
    phase: 0,
    amplitude: 100,
    offset: 0,
    waveType: 'sine',
    fixtures: [],
    targetChannels: ['dimmer'],
    blendMode: 'add',
  })

  const handleSpeedChange = useCallback((speed: number) => {
    setConfig((c) => ({ ...c, speed }))
  }, [])

  const handlePhaseChange = useCallback((phase: number) => {
    setConfig((c) => ({ ...c, phase }))
  }, [])

  const handleAmplitudeChange = useCallback((amplitude: number) => {
    setConfig((c) => ({ ...c, amplitude }))
  }, [])

  const handleOffsetChange = useCallback((offset: number) => {
    setConfig((c) => ({ ...c, offset }))
  }, [])

  const handleWaveTypeChange = useCallback((waveType: string) => {
    setConfig((c) => ({ ...c, waveType }))
    setWaveType(waveType)
  }, [])

  const handleApply = useCallback(() => {
    if (onApplyEffect) {
      onApplyEffect(config)
    }
  }, [config, onApplyEffect])

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="w-full max-w-4xl h-[90vh] bg-slate-950 rounded-lg border border-slate-700 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold">Advanced Effect Builder</h2>
            <p className="text-xs text-slate-400">Create and customize complex effects</p>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleApply} className="bg-blue-600 hover:bg-blue-700">
              Apply Effect
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="border-slate-700"
            >
              Close
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Left: Tabs */}
          <div className="flex-1 flex flex-col bg-slate-900 rounded border border-slate-800 overflow-hidden">
            <Tabs defaultValue="config" className="flex-1 flex flex-col">
              <TabsList className="flex gap-1 p-2 bg-slate-800 rounded-none">
                <TabsTrigger value="config" className="text-xs">
                  Configuration
                </TabsTrigger>
                <TabsTrigger value="targets" className="text-xs">
                  Targets
                </TabsTrigger>
                <TabsTrigger value="advanced" className="text-xs">
                  Advanced
                </TabsTrigger>
              </TabsList>

              {/* Config Tab */}
              <TabsContent value="config" className="flex-1 flex flex-col p-3 overflow-y-auto">
                <div className="space-y-3">
                  {/* Effect Type */}
                  <div>
                    <Label className="text-xs">Effect Type</Label>
                    <div className="grid grid-cols-5 gap-1 mt-1">
                      {EFFECT_TYPES.map((et) => (
                        <button
                          key={et.id}
                          onClick={() => {
                            setEffectType(et.id)
                            setConfig((c) => ({ ...c, type: et.id }))
                          }}
                          className={`p-2 rounded text-center transition ${
                            effectType === et.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          <div className="text-lg">{et.icon}</div>
                          <div className="text-xs mt-1">{et.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wave Type */}
                  <div>
                    <Label className="text-xs">Wave Type</Label>
                    <div className="grid grid-cols-5 gap-1 mt-1">
                      {WAVE_TYPES.map((wt) => (
                        <button
                          key={wt.id}
                          onClick={() => handleWaveTypeChange(wt.id)}
                          className={`p-2 rounded text-center transition ${
                            waveType === wt.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          <div className="text-lg">{wt.icon}</div>
                          <div className="text-xs mt-1">{wt.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Targets Tab */}
              <TabsContent value="targets" className="flex-1 overflow-y-auto p-3">
                <EffectTargetSelector
                  selectedChannels={config.targetChannels}
                  selectedFixtures={config.fixtures}
                  onChannelsChange={(channels) =>
                    setConfig((c) => ({ ...c, targetChannels: channels }))
                  }
                  onFixturesChange={(fixtures) =>
                    setConfig((c) => ({ ...c, fixtures }))
                  }
                />
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="flex-1 overflow-y-auto p-3 space-y-3">
                <div>
                  <Label className="text-xs">Blend Mode</Label>
                  <Select
                    value={config.blendMode}
                    onValueChange={(mode: any) =>
                      setConfig((c) => ({ ...c, blendMode: mode }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs mt-1 bg-slate-800 border-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="add">Add</SelectItem>
                      <SelectItem value="multiply">Multiply</SelectItem>
                      <SelectItem value="override">Override</SelectItem>
                      <SelectItem value="lerp">Lerp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-xs text-slate-400 p-2 bg-slate-800 rounded">
                  <p className="font-medium mb-1">Blend Mode Info:</p>
                  <p>
                    • <strong>Add:</strong> Values combine additively
                  </p>
                  <p>
                    • <strong>Multiply:</strong> Values multiply together
                  </p>
                  <p>
                    • <strong>Override:</strong> Highest value wins
                  </p>
                  <p>
                    • <strong>Lerp:</strong> Linear interpolation
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Parameters & Preview */}
          <div className="w-80 flex flex-col gap-2 overflow-hidden">
            {/* Parameters */}
            <div className="bg-slate-900 rounded border border-slate-800 p-3 flex-shrink-0">
              <h3 className="text-xs font-medium mb-2">Parameters</h3>
              <EffectParameterGrid
                speed={config.speed}
                phase={config.phase}
                amplitude={config.amplitude}
                offset={config.offset}
                onSpeedChange={handleSpeedChange}
                onPhaseChange={handlePhaseChange}
                onAmplitudeChange={handleAmplitudeChange}
                onOffsetChange={handleOffsetChange}
              />
            </div>

            {/* Waveform Preview */}
            <div className="flex-1 bg-slate-900 rounded border border-slate-800 overflow-hidden flex flex-col">
              <h3 className="text-xs font-medium p-2 border-b border-slate-800">
                Preview
              </h3>
              <WaveformPreview
                waveType={waveType}
                speed={config.speed}
                phase={config.phase}
                amplitude={config.amplitude}
                offset={config.offset}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
