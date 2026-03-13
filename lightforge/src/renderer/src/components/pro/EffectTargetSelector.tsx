import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

const CHANNEL_TYPES = [
  { id: 'dimmer', name: 'Dimmer', icon: '☀️' },
  { id: 'color', name: 'Color', icon: '🎨' },
  { id: 'pan', name: 'Pan', icon: '↔️' },
  { id: 'tilt', name: 'Tilt', icon: '↕️' },
  { id: 'strobe', name: 'Strobe', icon: '⚡' },
  { id: 'focus', name: 'Focus', icon: '🔍' },
  { id: 'prism', name: 'Prism', icon: '💎' },
  { id: 'iris', name: 'Iris', icon: '◉' },
]

interface TargetSelectorProps {
  selectedChannels: string[]
  selectedFixtures: string[]
  onChannelsChange: (channels: string[]) => void
  onFixturesChange: (fixtures: string[]) => void
}

export const EffectTargetSelector: React.FC<TargetSelectorProps> = ({
  selectedChannels,
  selectedFixtures,
  onChannelsChange,
  onFixturesChange,
}) => {
  const [fixtureGroups] = useState([
    { id: 'all', name: 'All Fixtures' },
    { id: 'group-1', name: 'Group 1 (Front)' },
    { id: 'group-2', name: 'Group 2 (Back)' },
    { id: 'group-3', name: 'Group 3 (Sides)' },
  ])

  const handleChannelToggle = (channel: string) => {
    const updated = selectedChannels.includes(channel)
      ? selectedChannels.filter((c) => c !== channel)
      : [...selectedChannels, channel]
    onChannelsChange(updated)
  }

  const handleFixtureToggle = (fixture: string) => {
    const updated = selectedFixtures.includes(fixture)
      ? selectedFixtures.filter((f) => f !== fixture)
      : [...selectedFixtures, fixture]
    onFixturesChange(updated)
  }

  const handleSelectAllChannels = () => {
    if (selectedChannels.length === CHANNEL_TYPES.length) {
      onChannelsChange([])
    } else {
      onChannelsChange(CHANNEL_TYPES.map((c) => c.id))
    }
  }

  const handleSelectAllFixtures = () => {
    if (selectedFixtures.length === fixtureGroups.length) {
      onFixturesChange([])
    } else {
      onFixturesChange(fixtureGroups.map((g) => g.id))
    }
  }

  return (
    <div className="space-y-4">
      {/* Target Channels */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Target Channels</Label>
          <button
            onClick={handleSelectAllChannels}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {selectedChannels.length === CHANNEL_TYPES.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {CHANNEL_TYPES.map((channel) => (
            <div
              key={channel.id}
              className="flex items-center gap-2 p-2 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              onClick={() => handleChannelToggle(channel.id)}
            >
              <Checkbox
                checked={selectedChannels.includes(channel.id)}
                onCheckedChange={() => handleChannelToggle(channel.id)}
                className="cursor-pointer"
              />
              <span className="text-lg">{channel.icon}</span>
              <span className="text-xs flex-1">{channel.name}</span>
            </div>
          ))}
        </div>

        {selectedChannels.length === 0 && (
          <div className="text-xs text-slate-500 mt-2 p-2 bg-slate-800 rounded">
            No channels selected • Select at least one channel
          </div>
        )}
      </div>

      {/* Target Fixtures/Groups */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-sm font-medium">Target Fixtures</Label>
          <button
            onClick={handleSelectAllFixtures}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {selectedFixtures.length === fixtureGroups.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div className="space-y-1">
          {fixtureGroups.map((group) => (
            <div
              key={group.id}
              className="flex items-center gap-2 p-2 rounded bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              onClick={() => handleFixtureToggle(group.id)}
            >
              <Checkbox
                checked={selectedFixtures.includes(group.id)}
                onCheckedChange={() => handleFixtureToggle(group.id)}
                className="cursor-pointer"
              />
              <span className="text-xs flex-1">{group.name}</span>
            </div>
          ))}
        </div>

        {selectedFixtures.length === 0 && (
          <div className="text-xs text-slate-500 mt-2 p-2 bg-slate-800 rounded">
            No fixtures selected • Select at least one fixture group
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="border-t border-slate-700 pt-2">
        <div className="text-xs text-slate-400 space-y-1">
          <div>
            Channels: <strong>{selectedChannels.length}</strong> selected
          </div>
          <div>
            Fixtures: <strong>{selectedFixtures.length}</strong> group(s) selected
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="space-y-1">
        <Label className="text-xs text-slate-400">Quick Presets</Label>
        <button
          onClick={() => {
            onChannelsChange(['dimmer'])
            onFixturesChange(['all'])
          }}
          className="w-full px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition text-left"
        >
          Dimmer (All)
        </button>
        <button
          onClick={() => {
            onChannelsChange(['color'])
            onFixturesChange(['all'])
          }}
          className="w-full px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition text-left"
        >
          Color (All)
        </button>
        <button
          onClick={() => {
            onChannelsChange(['pan', 'tilt'])
            onFixturesChange(['all'])
          }}
          className="w-full px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition text-left"
        >
          Movement (All)
        </button>
      </div>
    </div>
  )
}
