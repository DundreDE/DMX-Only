// ════════════════════════════════════════════════════════════════════════════
//  Feature Fader Panel — DMX channels organized by type (Daslight-style)
// ════════════════════════════════════════════════════════════════════════════

import { useMemo } from 'react'
import type {
  Scene,
  PatchedFixture,
  FixtureDefinition,
  FixtureCapabilityType,
} from '../../../../shared/types'
import { capColor, CHANNEL_TYPE_GROUPS, getCategoryForCapType } from '../../utils/sceneEditorHelpers'

interface FeatureFaderPanelProps {
  scene: Scene | null
  fixtures: PatchedFixture[]
  library: FixtureDefinition[]
  selectedFixtureIds: Set<string>
  onChannelChange: (universe: number, channel: number, value: number) => void
  getChannelValue: (universe: number, channel: number) => number
}

interface ChannelControl {
  universe: number
  channel: number
  type: FixtureCapabilityType
  label: string
  value: number
  fixtureLabel: string
}

export function FeatureFaderPanel({
  scene,
  fixtures,
  library,
  selectedFixtureIds,
  onChannelChange,
  getChannelValue,
}: FeatureFaderPanelProps): React.JSX.Element {
  // Build list of channels for selected fixtures
  const channelsByCategory = useMemo(() => {
    if (!scene || selectedFixtureIds.size === 0) return {}

    const channels: ChannelControl[] = []

    selectedFixtureIds.forEach(fxId => {
      const fx = fixtures.find(f => f.id === fxId)
      if (!fx) return
      const def = library.find(d => d.id === fx.definitionId)
      if (!def) return
      const mode = def.modes[fx.modeIndex]
      if (!mode) return

      mode.channels.forEach(ch => {
        const value = getChannelValue(fx.universe, fx.startAddress + ch.number - 1)
        channels.push({
          universe: fx.universe,
          channel: fx.startAddress + ch.number - 1,
          type: ch.primaryType,
          label: ch.name || ch.primaryType,
          value,
          fixtureLabel: fx.label,
        })
      })
    })

    // Group by category
    const grouped: Record<string, ChannelControl[]> = {}
    channels.forEach(ch => {
      const cat = getCategoryForCapType(ch.type)
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(ch)
    })

    return grouped
  }, [scene, fixtures, library, selectedFixtureIds, getChannelValue])

  if (!scene) {
    return (
      <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700">
        <div className="px-4 py-3 border-b border-slate-700">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            Feature / Fader Panel
          </h3>
        </div>
        <div className="flex items-center justify-center h-full text-slate-500">
          Wähle eine Szene und Lampen aus
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
          Feature / Fader Panel
        </h3>
        <div className="text-xs text-slate-500 mt-1">
          {selectedFixtureIds.size}
          {' '}
          Lampe(n)
        </div>
      </div>

      {/* Faders - scrollable */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(channelsByCategory).length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm p-4">
            Keine Kanäle. Wähle Lampen mit aktiver Szene aus.
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {Object.entries(channelsByCategory).map(([category, channels]) => (
              <div key={category} className="space-y-2">
                {/* Category header */}
                <div className="px-3 py-2 bg-slate-800 rounded">
                  <h4 className="text-xs font-bold text-slate-300 uppercase">
                    {category}
                  </h4>
                </div>

                {/* Channels in category */}
                <div className="space-y-3 pl-2">
                  {channels.map((ch, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-medium text-slate-300">
                          <span
                            style={{ color: capColor(ch.type) }}
                            className="font-bold"
                          >
                            {ch.label}
                          </span>
                          {' '}
                          <span className="text-slate-500">
                            (
                            {ch.fixtureLabel}
                            )
                          </span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="255"
                          value={ch.value}
                          onChange={e => {
                            const val = Math.max(
                              0,
                              Math.min(255, Number(e.target.value)),
                            )
                            onChannelChange(ch.universe, ch.channel, val)
                          }}
                          className="w-12 px-2 py-1 text-xs bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Slider */}
                      <input
                        type="range"
                        min="0"
                        max="255"
                        value={ch.value}
                        onChange={e => {
                          const val = Number(e.target.value)
                          onChannelChange(ch.universe, ch.channel, val)
                        }}
                        className="w-full h-2 bg-slate-700 rounded appearance-none cursor-pointer accent-blue-500"
                      />

                      {/* Preset buttons */}
                      <div className="flex gap-1">
                        <button
                          onClick={() =>
                            onChannelChange(ch.universe, ch.channel, 0)
                          }
                          className="flex-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                        >
                          0
                        </button>
                        <button
                          onClick={() =>
                            onChannelChange(ch.universe, ch.channel, 128)
                          }
                          className="flex-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                        >
                          128
                        </button>
                        <button
                          onClick={() =>
                            onChannelChange(ch.universe, ch.channel, 255)
                          }
                          className="flex-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
                        >
                          255
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
