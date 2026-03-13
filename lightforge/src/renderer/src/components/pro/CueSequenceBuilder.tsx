import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CueTimeline } from './CueTimeline'
import { CuePropertyPanel } from './CuePropertyPanel'
import { CuePreview } from './CuePreview'

interface Cue {
  id: string
  name: string
  duration: number
  fadeIn: number
  fadeOut: number
  dmxValues: Record<string, number>
  metadata: {
    triggerMode: 'manual' | 'auto' | 'midi' | 'osc'
    bpmSync: boolean
    jumpToScene?: string
  }
}

interface CueSequenceBuilderProps {
  onApplySequence?: (cues: Cue[]) => void
  onClose?: () => void
}

export const CueSequenceBuilder: React.FC<CueSequenceBuilderProps> = ({
  onApplySequence,
  onClose,
}) => {
  const [cues, setCues] = useState<Cue[]>([
    {
      id: 'cue-1',
      name: 'Cue 1',
      duration: 2000,
      fadeIn: 500,
      fadeOut: 500,
      dmxValues: {},
      metadata: {
        triggerMode: 'manual',
        bpmSync: false,
      },
    },
  ])

  const [selectedCueId, setSelectedCueId] = useState('cue-1')
  const [sequenceName, setSequenceName] = useState('New Sequence')

  const selectedCue = cues.find((c) => c.id === selectedCueId) || cues[0]

  const handleAddCue = useCallback(() => {
    const newCue: Cue = {
      id: `cue-${Date.now()}`,
      name: `Cue ${cues.length + 1}`,
      duration: 2000,
      fadeIn: 500,
      fadeOut: 500,
      dmxValues: selectedCue?.dmxValues || {},
      metadata: {
        triggerMode: 'manual',
        bpmSync: false,
      },
    }
    setCues([...cues, newCue])
    setSelectedCueId(newCue.id)
  }, [cues, selectedCue])

  const handleDeleteCue = useCallback((cueId: string) => {
    if (cues.length === 1) {
      alert('Cannot delete the last cue')
      return
    }
    const filtered = cues.filter((c) => c.id !== cueId)
    setCues(filtered)
    if (selectedCueId === cueId) {
      setSelectedCueId(filtered[0]?.id || '')
    }
  }, [cues, selectedCueId])

  const handleDuplicateCue = useCallback((cueId: string) => {
    const cueToClone = cues.find((c) => c.id === cueId)
    if (!cueToClone) return

    const newCue: Cue = {
      ...cueToClone,
      id: `cue-${Date.now()}`,
      name: `${cueToClone.name} (Copy)`,
    }
    const idx = cues.findIndex((c) => c.id === cueId)
    const updated = [...cues.slice(0, idx + 1), newCue, ...cues.slice(idx + 1)]
    setCues(updated)
  }, [cues])

  const handleReorderCues = useCallback((oldIndex: number, newIndex: number) => {
    const updated = [...cues]
    const [removed] = updated.splice(oldIndex, 1)
    updated.splice(newIndex, 0, removed)
    setCues(updated)
  }, [cues])

  const handleUpdateCue = useCallback(
    (cueId: string, updates: Partial<Cue>) => {
      setCues(
        cues.map((c) =>
          c.id === cueId ? { ...c, ...updates } : c
        )
      )
    },
    [cues]
  )

  const handleApply = useCallback(() => {
    if (onApplySequence) {
      onApplySequence(cues)
    }
  }, [cues, onApplySequence])

  const totalDuration = cues.reduce((sum, cue) => sum + cue.duration, 0)

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 border border-slate-700 rounded">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex-1">
          <Label className="text-xs text-slate-400">Sequence Name</Label>
          <Input
            value={sequenceName}
            onChange={(e) => setSequenceName(e.target.value)}
            className="w-64 h-8 text-sm bg-slate-900 border-slate-700"
            placeholder="Enter sequence name..."
          />
        </div>

        <div className="text-xs text-slate-400 mr-4">
          <div>Cues: <strong>{cues.length}</strong></div>
          <div>Duration: <strong>{(totalDuration / 1000).toFixed(1)}s</strong></div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={handleAddCue} className="bg-green-600 hover:bg-green-700">
            + Cue
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Apply
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
        {/* Left: Timeline */}
        <div className="flex-1 flex flex-col bg-slate-900 rounded border border-slate-800 overflow-hidden">
          <h3 className="text-sm font-medium p-2 border-b border-slate-800">Timeline</h3>
          <CueTimeline
            cues={cues}
            selectedCueId={selectedCueId}
            onSelectCue={setSelectedCueId}
            onReorderCues={handleReorderCues}
            onDeleteCue={handleDeleteCue}
            onDuplicateCue={handleDuplicateCue}
          />
        </div>

        {/* Right: Properties & Preview */}
        <div className="w-72 flex flex-col gap-2 overflow-hidden">
          {/* Properties */}
          <div className="flex-1 bg-slate-900 rounded border border-slate-800 overflow-y-auto">
            <h3 className="text-xs font-medium p-2 border-b border-slate-800 sticky top-0 bg-slate-800">
              Cue Properties
            </h3>
            {selectedCue && (
              <CuePropertyPanel
                cue={selectedCue}
                onUpdate={(updates) => handleUpdateCue(selectedCue.id, updates)}
              />
            )}
          </div>

          {/* Preview */}
          <div className="h-32 bg-slate-900 rounded border border-slate-800 overflow-hidden">
            <h3 className="text-xs font-medium p-2 border-b border-slate-800">Preview</h3>
            <CuePreview cue={selectedCue} />
          </div>
        </div>
      </div>
    </div>
  )
}
