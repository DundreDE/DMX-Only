import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Channel {
  id: string
  name: string
  min: number
  max: number
  default: number
}

interface ChannelConfig {
  id: string
  name: string
  channels: Channel[]
}

interface BuilderProps {
  group: ChannelConfig
  onUpdate: (updates: Partial<ChannelConfig>) => void
}

export const ChannelGroupBuilder: React.FC<BuilderProps> = ({ group, onUpdate }) => {
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null)

  const handleAddChannel = () => {
    const newChannel: Channel = {
      id: `ch-${Date.now()}`,
      name: `Channel ${group.channels.length + 1}`,
      min: 0,
      max: 255,
      default: 0,
    }
    onUpdate({
      channels: [...group.channels, newChannel],
    })
  }

  const handleDeleteChannel = (id: string) => {
    onUpdate({
      channels: group.channels.filter((c) => c.id !== id),
    })
  }

  const handleUpdateChannel = (id: string, updates: Partial<Channel>) => {
    onUpdate({
      channels: group.channels.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })
  }

  const handleUpdateGroupName = (name: string) => {
    onUpdate({ name })
  }

  return (
    <div className="flex flex-col p-4 gap-4">
      {/* Group Name */}
      <div>
        <Label className="text-xs">Group Name</Label>
        <Input
          value={group.name}
          onChange={(e) => handleUpdateGroupName(e.target.value)}
          className="h-8 text-sm mt-1 bg-slate-800 border-slate-700"
        />
      </div>

      {/* Channels List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="text-xs font-medium">Channels ({group.channels.length})</Label>
          <Button
            size="sm"
            onClick={handleAddChannel}
            className="text-xs bg-green-600 hover:bg-green-700"
          >
            + Channel
          </Button>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {group.channels.map((channel) => (
            <div
              key={channel.id}
              className="p-3 rounded bg-slate-800 border border-slate-700"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <Label className="text-xs">Channel Name</Label>
                  <Input
                    value={channel.name}
                    onChange={(e) => handleUpdateChannel(channel.id, { name: e.target.value })}
                    className="h-7 text-xs mt-1 bg-slate-700 border-slate-600"
                  />
                </div>
                <button
                  onClick={() => handleDeleteChannel(channel.id)}
                  className="px-2 py-1 text-xs bg-red-900 hover:bg-red-800 rounded mt-6"
                >
                  Delete
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {/* Min */}
                <div>
                  <Label className="text-xs text-slate-400">Min</Label>
                  <Input
                    type="number"
                    value={channel.min}
                    onChange={(e) => handleUpdateChannel(channel.id, { min: Number(e.target.value) })}
                    className="h-7 text-xs mt-1 bg-slate-700 border-slate-600"
                    min="0"
                    max="255"
                  />
                </div>

                {/* Max */}
                <div>
                  <Label className="text-xs text-slate-400">Max</Label>
                  <Input
                    type="number"
                    value={channel.max}
                    onChange={(e) => handleUpdateChannel(channel.id, { max: Number(e.target.value) })}
                    className="h-7 text-xs mt-1 bg-slate-700 border-slate-600"
                    min="0"
                    max="255"
                  />
                </div>

                {/* Default */}
                <div>
                  <Label className="text-xs text-slate-400">Default</Label>
                  <Input
                    type="number"
                    value={channel.default}
                    onChange={(e) => handleUpdateChannel(channel.id, { default: Number(e.target.value) })}
                    className="h-7 text-xs mt-1 bg-slate-700 border-slate-600"
                    min={channel.min}
                    max={channel.max}
                  />
                </div>
              </div>

              {/* Visual Range */}
              <div className="mt-2 p-2 bg-slate-700 rounded text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-8 text-slate-400">{channel.min}</span>
                  <div className="flex-1 h-2 bg-slate-600 rounded relative">
                    <div
                      className="absolute top-0 bottom-0 bg-blue-500 rounded"
                      style={{
                        left: 0,
                        width: '100%',
                        opacity: 0.5,
                      }}
                    />
                    <div
                      className="absolute top-1/2 w-1 h-3 bg-yellow-400 transform -translate-y-1/2"
                      style={{
                        left: `${((channel.default - channel.min) / (channel.max - channel.min)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 text-slate-400">{channel.max}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {group.channels.length === 0 && (
        <div className="text-center p-4 text-slate-400 text-sm">
          No channels yet. Click "+ Channel" to add one.
        </div>
      )}
    </div>
  )
}
