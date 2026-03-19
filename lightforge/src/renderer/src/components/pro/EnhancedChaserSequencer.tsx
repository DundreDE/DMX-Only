import React, { useState, useCallback } from 'react'
import { Panel, Button, Input, Slider, Select, Badge } from './UIComponents'
import type { Chaser, ChaserStep, Scene } from '../../../shared/types'

interface ChaserStepWithPreview extends ChaserStep {
  sceneName?: string
  preview?: string
}

/**
 * Enhanced Chaser Sequencer Component
 * Professional step-by-step editor with crossfade and loop controls
 */
export const EnhancedChaserSequencer: React.FC<{
  chaser: Chaser
  scenes: Scene[]
  onUpdate: (chaser: Chaser) => void
  onPlay: (chaser: Chaser) => void
  onStop: () => void
}> = ({ chaser, scenes, onUpdate, onPlay, onStop }) => {
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null)
  const [selectedStepIndex, setSelectedStepIndex] = useState(0)
  const [crossfadeType, setCrossfadeType] = useState<'linear' | 'smooth' | 'stepped'>('linear')
  const [globalHoldTime, setGlobalHoldTime] = useState(1000)

  // Add new step
  const addStep = useCallback((sceneId: string) => {
    const newStep: ChaserStep = {
      sceneId,
      holdTime: globalHoldTime,
      fadeTime: 500
    }
    const updated = { ...chaser, steps: [...chaser.steps, newStep] }
    onUpdate(updated)
  }, [chaser, globalHoldTime, onUpdate])

  // Remove step
  const removeStep = useCallback((index: number) => {
    const updated = {
      ...chaser,
      steps: chaser.steps.filter((_, i) => i !== index)
    }
    onUpdate(updated)
  }, [chaser, onUpdate])

  // Update step
  const updateStep = useCallback((index: number, updates: Partial<ChaserStep>) => {
    const updated = {
      ...chaser,
      steps: chaser.steps.map((step, i) =>
        i === index ? { ...step, ...updates } : step
      )
    }
    onUpdate(updated)
  }, [chaser, onUpdate])

  // Move step
  const moveStep = useCallback((fromIndex: number, toIndex: number) => {
    const steps = [...chaser.steps]
    const [removed] = steps.splice(fromIndex, 1)
    steps.splice(toIndex, 0, removed)
    onUpdate({ ...chaser, steps })
  }, [chaser, onUpdate])

  // Duplicate step
  const duplicateStep = useCallback((index: number) => {
    const step = chaser.steps[index]
    const steps = [...chaser.steps]
    steps.splice(index + 1, 0, { ...step })
    onUpdate({ ...chaser, steps })
  }, [chaser, onUpdate])

  // Calculate total duration
  const totalDuration = chaser.steps.reduce(
    (sum, step) => sum + step.holdTime + step.fadeTime,
    0
  )

  // Get scene name
  const getSceneName = (sceneId: string) => {
    return scenes.find(s => s.id === sceneId)?.name || 'Unknown Scene'
  }

  return (
    <Panel header={`Chaser Sequencer: ${chaser.name}`}>
      {/* Playback Controls */}
      <div className="flex gap-3 mb-4 p-3 bg-[var(--color-bg-input)] rounded">
        <Button
          variant="primary"
          onClick={() => onPlay(chaser)}
          disabled={chaser.steps.length === 0}
        >
          ▶ Play
        </Button>
        <Button variant="secondary" onClick={onStop}>
          ⏹ Stop
        </Button>

        <div className="flex-1 text-right text-sm text-[var(--color-text-secondary)]">
          {chaser.steps.length} steps · {(totalDuration / 1000).toFixed(1)}s total
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" checked={chaser.loop} onChange={(e) => 
            onUpdate({ ...chaser, loop: e.target.checked })
          } />
          <span className="text-sm">Loop</span>
        </label>
      </div>

      {/* Global Settings */}
      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-[var(--color-bg-input)] rounded">
        <div>
          <label className="label">Default Hold (ms)</label>
          <input
            type="number"
            min={100}
            max={10000}
            step={100}
            value={globalHoldTime}
            onChange={(e) => setGlobalHoldTime(Number(e.target.value))}
            className="input w-full"
          />
        </div>

        <div>
          <label className="label">Crossfade Type</label>
          <Select
            options={[
              { value: 'linear', label: 'Linear' },
              { value: 'smooth', label: 'Smooth (Ease)' },
              { value: 'stepped', label: 'Stepped' }
            ]}
            value={crossfadeType}
            onChange={(e) => setCrossfadeType(e.target.value as any)}
          />
        </div>

        <div>
          <label className="label">Apply to All Steps</label>
          <Button
            variant="secondary"
            onClick={() => {
              const updated = {
                ...chaser,
                steps: chaser.steps.map(step => ({ ...step, fadeTime: 500 }))
              }
              onUpdate(updated)
            }}
            className="w-full"
          >
            Reset Fades
          </Button>
        </div>
      </div>

      {/* Step List */}
      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
        {chaser.steps.map((step, idx) => (
          <div
            key={idx}
            onClick={() => {
              setSelectedStepIndex(idx)
              setEditingStepIndex(null)
            }}
            className={`p-3 rounded border-2 transition-all cursor-pointer ${
              selectedStepIndex === idx
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-dim)]'
                : 'border-[var(--color-border)] bg-[var(--color-bg-input)] hover:border-[var(--color-border-hover)]'
            }`}
          >
            {editingStepIndex === idx ? (
              // Edit Mode
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select
                    options={scenes.map(s => ({ value: s.id, label: s.name }))}
                    value={step.sceneId}
                    onChange={(e) => updateStep(idx, { sceneId: e.target.value })}
                  />
                  <Button variant="secondary" onClick={() => setEditingStepIndex(null)}>
                    Done
                  </Button>
                </div>

                <Slider
                  label="Hold Time (ms)"
                  min={100}
                  max={5000}
                  step={100}
                  value={step.holdTime}
                  onChange={(e) => updateStep(idx, { holdTime: Number(e.target.value) })}
                />

                <Slider
                  label="Fade In (ms)"
                  min={0}
                  max={2000}
                  step={50}
                  value={step.fadeTime}
                  onChange={(e) => updateStep(idx, { fadeTime: Number(e.target.value) })}
                />
              </div>
            ) : (
              // Display Mode
              <div className="flex items-center gap-3">
                <div className="font-bold text-lg w-8 h-8 bg-[var(--color-accent)] rounded flex items-center justify-center text-white">
                  {idx + 1}
                </div>

                <div className="flex-1">
                  <p className="font-semibold">{getSceneName(step.sceneId)}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Hold: {step.holdTime}ms · Fade: {step.fadeTime}ms
                  </p>
                </div>

                <div className="flex gap-1">
                  {idx > 0 && (
                    <Button
                      variant="secondary"
                      onClick={() => moveStep(idx, idx - 1)}
                      className="px-2 py-1 text-xs"
                    >
                      ↑
                    </Button>
                  )}

                  {idx < chaser.steps.length - 1 && (
                    <Button
                      variant="secondary"
                      onClick={() => moveStep(idx, idx + 1)}
                      className="px-2 py-1 text-xs"
                    >
                      ↓
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    onClick={() => setEditingStepIndex(idx)}
                    className="px-2 py-1 text-xs"
                  >
                    ✎
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => duplicateStep(idx)}
                    className="px-2 py-1 text-xs"
                  >
                    ⊕
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => removeStep(idx)}
                    className="px-2 py-1 text-xs"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Step */}
      {chaser.steps.length === 0 ? (
        <div className="p-4 bg-[var(--color-bg-input)] rounded text-center">
          <p className="text-[var(--color-text-secondary)] text-sm mb-3">No steps added</p>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            Select scenes below to create a sequence
          </p>
        </div>
      ) : null}

      {/* Scene Browser */}
      <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
        <h3 className="font-semibold text-sm mb-2">Add Scenes to Sequence</h3>
        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
          {scenes.map(scene => (
            <button
              key={scene.id}
              onClick={() => addStep(scene.id)}
              className="p-2 text-xs bg-[var(--color-bg-input)] hover:bg-[var(--color-bg-hover)] rounded border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all"
            >
              <p className="font-semibold">{scene.name}</p>
              <p className="text-[var(--color-text-secondary)]">+ Add to sequence</p>
            </button>
          ))}
        </div>
      </div>
    </Panel>
  )
}

/**
 * Chaser Step Timeline Visualizer
 */
export const ChaserStepTimeline: React.FC<{
  steps: ChaserStep[]
  scenes: Scene[]
  currentStepIndex: number
}> = ({ steps, scenes, currentStepIndex }) => {
  const getSceneName = (sceneId: string) => {
    return scenes.find(s => s.id === sceneId)?.name || '?'
  }

  const totalDuration = steps.reduce((sum, s) => sum + s.holdTime + s.fadeTime, 0)

  return (
    <div className="bg-[var(--color-bg-input)] p-3 rounded">
      <div className="flex items-end gap-1 h-16">
        {steps.map((step, idx) => {
          const segmentWidth = ((step.holdTime + step.fadeTime) / totalDuration) * 100
          const isCurrentStep = idx === currentStepIndex

          return (
            <div
              key={idx}
              style={{ width: `${segmentWidth}%` }}
              className={`flex flex-col justify-end h-full relative group cursor-pointer transition-all ${
                isCurrentStep ? 'bg-[var(--color-success)]' : 'bg-[var(--color-accent)]'
              } hover:opacity-80`}
            >
              <div className="h-full flex items-end justify-center text-xs font-bold text-white opacity-70">
                {idx + 1}
              </div>

              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--color-bg-elevated)] p-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                {getSceneName(step.sceneId)}
                <br />
                {step.holdTime}ms + {step.fadeTime}ms fade
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
