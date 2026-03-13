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

interface Cue {
  id: string
  name: string
  duration: number
  fadeIn: number
  fadeOut: number
  metadata?: {
    triggerMode?: string
    bpmSync?: boolean
    jumpToScene?: string
  }
}

interface PropertyPanelProps {
  cue: Cue
  onUpdate: (updates: Partial<Cue>) => void
}

export const CuePropertyPanel: React.FC<PropertyPanelProps> = ({ cue, onUpdate }) => {
  return (
    <div className="p-3 space-y-3 text-sm">
      {/* Cue Name */}
      <div>
        <Label className="text-xs">Cue Name</Label>
        <Input
          value={cue.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="h-8 text-xs mt-1 bg-slate-800 border-slate-700"
          placeholder="Cue name..."
        />
      </div>

      {/* Duration */}
      <div>
        <Label className="text-xs">
          Duration: <strong>{(cue.duration / 1000).toFixed(2)}s</strong>
        </Label>
        <input
          type="range"
          min="100"
          max="10000"
          step="100"
          value={cue.duration}
          onChange={(e) => onUpdate({ duration: Number(e.target.value) })}
          className="w-full h-2 bg-slate-700 rounded cursor-pointer mt-1"
        />
      </div>

      {/* Fade In */}
      <div>
        <Label className="text-xs">
          Fade In: <strong>{cue.fadeIn}ms</strong>
        </Label>
        <input
          type="range"
          min="0"
          max={cue.duration}
          step="50"
          value={cue.fadeIn}
          onChange={(e) => onUpdate({ fadeIn: Number(e.target.value) })}
          className="w-full h-2 bg-slate-700 rounded cursor-pointer mt-1"
        />
      </div>

      {/* Fade Out */}
      <div>
        <Label className="text-xs">
          Fade Out: <strong>{cue.fadeOut}ms</strong>
        </Label>
        <input
          type="range"
          min="0"
          max={cue.duration}
          step="50"
          value={cue.fadeOut}
          onChange={(e) => onUpdate({ fadeOut: Number(e.target.value) })}
          className="w-full h-2 bg-slate-700 rounded cursor-pointer mt-1"
        />
      </div>

      {/* Trigger Mode */}
      <div>
        <Label className="text-xs">Trigger Mode</Label>
        <Select
          value={cue.metadata?.triggerMode || 'manual'}
          onValueChange={(mode) =>
            onUpdate({
              metadata: { ...cue.metadata, triggerMode: mode },
            })
          }
        >
          <SelectTrigger className="h-8 text-xs mt-1 bg-slate-800 border-slate-700">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="manual">Manual (GO button)</SelectItem>
            <SelectItem value="auto">Auto (timeline)</SelectItem>
            <SelectItem value="midi">MIDI Trigger</SelectItem>
            <SelectItem value="osc">OSC Trigger</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* BPM Sync */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="bpmSync"
          checked={cue.metadata?.bpmSync ?? false}
          onCheckedChange={(checked) =>
            onUpdate({
              metadata: { ...cue.metadata, bpmSync: checked },
            })
          }
        />
        <Label htmlFor="bpmSync" className="text-xs cursor-pointer">
          BPM Sync
        </Label>
      </div>

      {/* Jump to Scene */}
      <div>
        <Label className="text-xs">Jump to Scene (after cue)</Label>
        <Input
          value={cue.metadata?.jumpToScene || ''}
          onChange={(e) =>
            onUpdate({
              metadata: { ...cue.metadata, jumpToScene: e.target.value },
            })
          }
          className="h-8 text-xs mt-1 bg-slate-800 border-slate-700"
          placeholder="Scene ID (optional)"
        />
      </div>

      {/* Statistics */}
      <div className="border-t border-slate-700 pt-2">
        <div className="text-xs text-slate-400 space-y-1">
          <div>
            Total Time: <strong>{((cue.duration + cue.fadeIn + cue.fadeOut) / 1000).toFixed(2)}s</strong>
          </div>
          <div>
            Crossfade: <strong>{cue.fadeIn + cue.fadeOut}ms</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
