import React, { useState, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SceneBuilderCanvas } from './SceneBuilderCanvas'
import { EffectBuilderPalette } from './EffectBuilderPalette'
import { SceneBuilderPropertyPanel } from './SceneBuilderPropertyPanel'
import { useUndoRedo } from '@/hooks/useUndoRedo'

interface Scene {
  id: string
  name: string
  duration: number
  fadeIn: number
  fadeOut: number
  releaseMode: 'Off' | 'Group' | 'All' | 'Except'
  fixtures: FixtureState[]
  effects: EffectState[]
  cues: CueState[]
  metadata: {
    bpmSync: boolean
    autoFade: boolean
    priority: number
  }
}

interface FixtureState {
  id: string
  channels: Record<string, number>
  effects: string[]
}

interface EffectState {
  id: string
  type: 'color' | 'chaser' | 'move' | 'value' | 'curve'
  fixtures: string[]
  config: Record<string, any>
}

interface CueState {
  id: string
  duration: number
  fadeIn: number
  fadeOut: number
  fixtures: FixtureState[]
}

interface SceneBuilderProProps {
  initialSceneId?: string
  onSave?: (scene: Scene) => void
  onClose?: () => void
}

export const SceneBuilderPro: React.FC<SceneBuilderProProps> = ({
  initialSceneId,
  onSave,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState('builder')
  const [scene, setScene] = useState<Scene>({
    id: initialSceneId || `scene-${Date.now()}`,
    name: 'New Scene',
    duration: 8000,
    fadeIn: 500,
    fadeOut: 500,
    releaseMode: 'Off',
    fixtures: [],
    effects: [],
    cues: [],
    metadata: {
      bpmSync: false,
      autoFade: true,
      priority: 0,
    },
  })

  const { recordAction } = useUndoRedo()

  const handleSceneNameChange = useCallback((newName: string) => {
    recordAction(
      {
        ...scene,
        name: newName,
      },
      {
        ...scene,
      },
      `Renamed scene to "${newName}"`
    )
    setScene((s) => ({ ...s, name: newName }))
  }, [scene, recordAction])

  const handleDurationChange = useCallback((duration: number) => {
    recordAction(
      {
        ...scene,
        duration,
      },
      {
        ...scene,
      },
      `Changed duration to ${duration}ms`
    )
    setScene((s) => ({ ...s, duration }))
  }, [scene, recordAction])

  const handleAddEffect = useCallback(
    (effect: EffectState) => {
      const newScene = {
        ...scene,
        effects: [...scene.effects, effect],
      }
      recordAction(newScene, scene, `Added effect: ${effect.type}`)
      setScene(newScene)
    },
    [scene, recordAction]
  )

  const handleRemoveEffect = useCallback(
    (effectId: string) => {
      const newScene = {
        ...scene,
        effects: scene.effects.filter((e) => e.id !== effectId),
      }
      recordAction(newScene, scene, `Removed effect`)
      setScene(newScene)
    },
    [scene, recordAction]
  )

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(scene)
    }
  }, [scene, onSave])

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex-1">
          <Label className="text-xs text-slate-400">Scene Name</Label>
          <Input
            value={scene.name}
            onChange={(e) => handleSceneNameChange(e.target.value)}
            className="w-64 h-8 text-sm bg-slate-900 border-slate-700"
            placeholder="Enter scene name..."
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            className="border-slate-700 hover:bg-slate-800"
          >
            Save Scene
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-slate-800"
          >
            Close
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="flex gap-1 p-2 bg-slate-900 border-b border-slate-800 rounded-none">
          <TabsTrigger value="builder" className="text-xs">
            Builder
          </TabsTrigger>
          <TabsTrigger value="effects" className="text-xs">
            Effects
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="properties" className="text-xs">
            Properties
          </TabsTrigger>
        </TabsList>

        {/* Builder Tab */}
        <TabsContent value="builder" className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex gap-2 p-2">
            <SceneBuilderCanvas
              scene={scene}
              onSceneChange={setScene}
              onAddEffect={handleAddEffect}
            />
          </div>
        </TabsContent>

        {/* Effects Tab */}
        <TabsContent value="effects" className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex gap-2 p-2">
            <EffectBuilderPalette
              effects={scene.effects}
              onAddEffect={handleAddEffect}
              onRemoveEffect={handleRemoveEffect}
              onUpdateEffect={(id, config) => {
                setScene((s) => ({
                  ...s,
                  effects: s.effects.map((e) =>
                    e.id === id ? { ...e, config } : e
                  ),
                }))
              }}
            />
          </div>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-400">Timeline view coming soon</p>
          </div>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="flex-1 flex overflow-hidden">
          <SceneBuilderPropertyPanel
            scene={scene}
            onSceneChange={setScene}
            onDurationChange={handleDurationChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
