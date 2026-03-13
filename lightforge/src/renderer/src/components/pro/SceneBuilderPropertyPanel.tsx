import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'

interface PropertyPanelProps {
  scene: any
  onSceneChange: (scene: any) => void
  onDurationChange: (duration: number) => void
}

export const SceneBuilderPropertyPanel: React.FC<PropertyPanelProps> = ({
  scene,
  onSceneChange,
  onDurationChange,
}) => {
  return (
    <div className="w-80 flex flex-col gap-4 bg-slate-900 p-4 rounded border border-slate-700 overflow-y-auto">
      <div>
        <h3 className="text-sm font-medium mb-4">Scene Properties</h3>
      </div>

      {/* Duration */}
      <div className="space-y-2">
        <Label className="text-xs">Duration (ms)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={scene.duration}
            onChange={(e) => onDurationChange(Number(e.target.value))}
            className="h-8 text-sm bg-slate-800 border-slate-700"
            min="100"
            step="100"
          />
          <span className="text-xs text-slate-400">
            {(scene.duration / 1000).toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Fade In */}
      <div className="space-y-2">
        <Label className="text-xs">Fade In (ms)</Label>
        <Input
          type="number"
          value={scene.fadeIn}
          onChange={(e) =>
            onSceneChange({ ...scene, fadeIn: Number(e.target.value) })
          }
          className="h-8 text-sm bg-slate-800 border-slate-700"
          min="0"
          step="50"
        />
      </div>

      {/* Fade Out */}
      <div className="space-y-2">
        <Label className="text-xs">Fade Out (ms)</Label>
        <Input
          type="number"
          value={scene.fadeOut}
          onChange={(e) =>
            onSceneChange({ ...scene, fadeOut: Number(e.target.value) })
          }
          className="h-8 text-sm bg-slate-800 border-slate-700"
          min="0"
          step="50"
        />
      </div>

      {/* Release Mode */}
      <div className="space-y-2">
        <Label className="text-xs">Release Mode</Label>
        <Select
          value={scene.releaseMode}
          onValueChange={(value) =>
            onSceneChange({ ...scene, releaseMode: value })
          }
        >
          <SelectTrigger className="h-8 text-xs bg-slate-800 border-slate-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="Off">Off (Additive)</SelectItem>
            <SelectItem value="Group">Group (Solo)</SelectItem>
            <SelectItem value="All">All (Global Solo)</SelectItem>
            <SelectItem value="Except">Except (Other Groups)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Auto Fade */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="autoFade"
          checked={scene.metadata?.autoFade ?? true}
          onCheckedChange={(checked) =>
            onSceneChange({
              ...scene,
              metadata: { ...scene.metadata, autoFade: checked },
            })
          }
        />
        <Label htmlFor="autoFade" className="text-xs cursor-pointer">
          Auto Fade on Switch
        </Label>
      </div>

      {/* BPM Sync */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="bpmSync"
          checked={scene.metadata?.bpmSync ?? false}
          onCheckedChange={(checked) =>
            onSceneChange({
              ...scene,
              metadata: { ...scene.metadata, bpmSync: checked },
            })
          }
        />
        <Label htmlFor="bpmSync" className="text-xs cursor-pointer">
          BPM Sync
        </Label>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <Label className="text-xs">Priority</Label>
        <Input
          type="number"
          value={scene.metadata?.priority ?? 0}
          onChange={(e) =>
            onSceneChange({
              ...scene,
              metadata: { ...scene.metadata, priority: Number(e.target.value) },
            })
          }
          className="h-8 text-sm bg-slate-800 border-slate-700"
          min="-10"
          max="10"
        />
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700" />

      {/* Advanced Section */}
      <div>
        <h4 className="text-xs font-medium text-slate-400 mb-2">Advanced</h4>

        {/* Loop */}
        <div className="flex items-center gap-2 mb-2">
          <Checkbox id="loop" />
          <Label htmlFor="loop" className="text-xs cursor-pointer">
            Loop Scene
          </Label>
        </div>

        {/* Jump to Scene */}
        <div className="space-y-2">
          <Label className="text-xs">Jump to Scene (ID)</Label>
          <Input
            type="text"
            placeholder="None"
            className="h-8 text-xs bg-slate-800 border-slate-700"
          />
        </div>

        {/* Performance Mode */}
        <div className="flex items-center gap-2 mt-2">
          <Checkbox id="performance" />
          <Label htmlFor="performance" className="text-xs cursor-pointer">
            Performance Mode
          </Label>
        </div>
      </div>

      {/* Statistics */}
      <div className="border-t border-slate-700 pt-2">
        <h4 className="text-xs font-medium text-slate-400 mb-2">Statistics</h4>
        <div className="text-xs text-slate-500 space-y-1">
          <div className="flex justify-between">
            <span>Fixtures:</span>
            <span>{scene.fixtures?.length ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Effects:</span>
            <span>{scene.effects?.length ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Cues:</span>
            <span>{scene.cues?.length ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span>DMX Channels:</span>
            <span>{Object.keys(scene.metadata?.channels ?? {}).length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
