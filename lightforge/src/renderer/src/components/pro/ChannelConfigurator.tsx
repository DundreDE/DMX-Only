import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChannelGroupBuilder } from './ChannelGroupBuilder'
import { SmartDefaultsPanel } from './SmartDefaultsPanel'

interface ChannelConfig {
  id: string
  name: string
  channels: Array<{
    id: string
    name: string
    min: number
    max: number
    default: number
  }>
}

interface ChannelConfiguratorProps {
  onApplyConfig?: (config: ChannelConfig) => void
  onClose?: () => void
}

export const ChannelConfigurator: React.FC<ChannelConfiguratorProps> = ({
  onApplyConfig,
  onClose,
}) => {
  const [groups, setGroups] = useState<ChannelConfig[]>([
    {
      id: 'group-1',
      name: 'Dimmer',
      channels: [
        { id: 'ch-1', name: 'Master Dimmer', min: 0, max: 255, default: 0 },
      ],
    },
    {
      id: 'group-2',
      name: 'Color',
      channels: [
        { id: 'ch-2', name: 'Color Hue', min: 0, max: 255, default: 0 },
        { id: 'ch-3', name: 'Saturation', min: 0, max: 255, default: 255 },
      ],
    },
  ])

  const [selectedGroupId, setSelectedGroupId] = useState('group-1')
  const selectedGroup = groups.find((g) => g.id === selectedGroupId) || groups[0]

  const handleAddGroup = () => {
    const newGroup: ChannelConfig = {
      id: `group-${Date.now()}`,
      name: `Group ${groups.length + 1}`,
      channels: [],
    }
    setGroups([...groups, newGroup])
    setSelectedGroupId(newGroup.id)
  }

  const handleDeleteGroup = (id: string) => {
    if (groups.length === 1) return
    const filtered = groups.filter((g) => g.id !== id)
    setGroups(filtered)
    if (selectedGroupId === id) {
      setSelectedGroupId(filtered[0]?.id || '')
    }
  }

  const handleUpdateGroup = (id: string, updates: Partial<ChannelConfig>) => {
    setGroups(
      groups.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      )
    )
  }

  const handleApply = () => {
    if (onApplyConfig && selectedGroup) {
      onApplyConfig(selectedGroup)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="w-full max-w-2xl h-[80vh] bg-slate-950 rounded-lg border border-slate-700 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold">Channel Configurator</h2>
            <p className="text-xs text-slate-400">Configure DMX channel groups</p>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleApply} className="bg-blue-600 hover:bg-blue-700">
              Apply Config
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
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Groups List */}
          <div className="w-48 border-r border-slate-800 flex flex-col bg-slate-900 p-2 gap-2 overflow-y-auto">
            <h3 className="text-xs font-medium text-slate-400">Channel Groups</h3>
            <div className="flex-1 space-y-1 overflow-y-auto">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`w-full text-left p-2 rounded text-sm transition ${
                    selectedGroupId === group.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  {group.name}
                  <div className="text-xs opacity-70">{group.channels.length} ch</div>
                </button>
              ))}
            </div>

            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddGroup}
                className="flex-1 text-xs border-slate-700"
              >
                + Group
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => selectedGroupId && handleDeleteGroup(selectedGroupId)}
                className="flex-1 text-xs border-slate-700"
              >
                Delete
              </Button>
            </div>
          </div>

          {/* Right: Tabs */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Tabs defaultValue="builder" className="flex-1 flex flex-col">
              <TabsList className="flex gap-1 p-2 bg-slate-800 rounded-none">
                <TabsTrigger value="builder" className="text-xs">
                  Builder
                </TabsTrigger>
                <TabsTrigger value="smart" className="text-xs">
                  Smart Defaults
                </TabsTrigger>
              </TabsList>

              {/* Builder Tab */}
              <TabsContent value="builder" className="flex-1 overflow-y-auto">
                {selectedGroup && (
                  <ChannelGroupBuilder
                    group={selectedGroup}
                    onUpdate={(updates) => handleUpdateGroup(selectedGroup.id, updates)}
                  />
                )}
              </TabsContent>

              {/* Smart Defaults Tab */}
              <TabsContent value="smart" className="flex-1 overflow-y-auto">
                <SmartDefaultsPanel
                  onSelectPreset={(preset) => {
                    if (selectedGroup) {
                      handleUpdateGroup(selectedGroup.id, {
                        channels: preset,
                      })
                    }
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
