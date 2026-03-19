import React, { useState } from 'react'
import { Panel, Button, Slider, Select, Input } from './UIComponents'
import type { AdvancedSceneEffect, ADSREnvelope, LFO, Keyframe } from '../engines/EnhancedEffectSystem'
import { createDefaultADSR, createDefaultLFO } from '../engines/EnhancedEffectSystem'

/**
 * Advanced Effect Editor Component
 * Supports: ADSR Envelope, LFO Modulation, Keyframes, Blend Modes
 */
export const AdvancedEffectEditor: React.FC<{
  effect: AdvancedSceneEffect
  onUpdate: (effect: AdvancedSceneEffect) => void
}> = ({ effect, onUpdate }) => {
  const [tab, setTab] = useState<'wave' | 'envelope' | 'lfo' | 'keyframes' | 'blend'>('wave')

  return (
    <Panel header={`Effect: ${effect.label}`}>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-4 border-b border-[var(--color-border)]">
        {(['wave', 'envelope', 'lfo', 'keyframes', 'blend'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-xs font-semibold uppercase transition-colors ${
              tab === t
                ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                : 'text-[var(--color-text-secondary)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Wave Tab */}
      {tab === 'wave' && (
        <div className="space-y-4">
          <Select
            label="Wave Type"
            options={[
              { value: 'sine', label: 'Sine' },
              { value: 'triangle', label: 'Triangle' },
              { value: 'square', label: 'Square' },
              { value: 'sawtooth', label: 'Sawtooth' },
              { value: 'random', label: 'Random' },
              { value: 'damping', label: 'Damping' },
              { value: 'echo', label: 'Echo' },
              { value: 'pulse', label: 'Pulse' }
            ]}
            value={effect.wave}
            onChange={(e) => onUpdate({ ...effect, wave: e.target.value as any })}
          />

          <Slider
            label="Speed (BPM)"
            min={20}
            max={240}
            value={effect.speed}
            onChange={(e) => onUpdate({ ...effect, speed: Number(e.target.value) })}
          />

          <Slider
            label="Size (Amplitude)"
            min={0}
            max={255}
            value={effect.size}
            onChange={(e) => onUpdate({ ...effect, size: Number(e.target.value) })}
          />

          <Slider
            label="Base (Center)"
            min={0}
            max={255}
            value={effect.base}
            onChange={(e) => onUpdate({ ...effect, base: Number(e.target.value) })}
          />

          <Slider
            label="Phase Offset"
            min={0}
            max={360}
            value={effect.offset}
            onChange={(e) => onUpdate({ ...effect, offset: Number(e.target.value) })}
          />
        </div>
      )}

      {/* ADSR Envelope Tab */}
      {tab === 'envelope' && (
        <EnvelopeEditor
          envelope={effect.envelope || createDefaultADSR()}
          onUpdate={(env) => onUpdate({ ...effect, envelope: env })}
        />
      )}

      {/* LFO Tab */}
      {tab === 'lfo' && (
        <LFOEditor
          lfo={effect.lfo || createDefaultLFO()}
          onUpdate={(lfo) => onUpdate({ ...effect, lfo })}
        />
      )}

      {/* Keyframes Tab */}
      {tab === 'keyframes' && (
        <KeyframeEditor
          keyframes={effect.keyframes || []}
          onUpdate={(kf) => onUpdate({ ...effect, keyframes: kf })}
        />
      )}

      {/* Blend Mode Tab */}
      {tab === 'blend' && (
        <div className="space-y-4">
          <Select
            label="Blend Mode"
            options={[
              { value: 'add', label: 'Add' },
              { value: 'multiply', label: 'Multiply' },
              { value: 'screen', label: 'Screen' },
              { value: 'overlay', label: 'Overlay' }
            ]}
            value={effect.blendMode || 'add'}
            onChange={(e) => onUpdate({ ...effect, blendMode: e.target.value as any })}
          />

          <Slider
            label="Opacity"
            min={0}
            max={1}
            step={0.01}
            value={effect.opacity || 1}
            onChange={(e) => onUpdate({ ...effect, opacity: Number(e.target.value) })}
          />
        </div>
      )}
    </Panel>
  )
}

/**
 * ADSR Envelope Editor
 */
const EnvelopeEditor: React.FC<{
  envelope: ADSREnvelope
  onUpdate: (env: ADSREnvelope) => void
}> = ({ envelope, onUpdate }) => {
  return (
    <div className="space-y-4">
      <div className="bg-[var(--color-bg-input)] p-4 rounded h-32 flex items-end gap-1">
        {/* Visual envelope display */}
        <div className="flex-1 h-full flex items-end gap-0.5">
          <div
            style={{
              height: `${(envelope.sustain / 255) * 100}%`,
              width: '20%',
              background: 'linear-gradient(to top, var(--color-accent), var(--color-accent-light))'
            }}
          />
          <div
            style={{
              height: `${(envelope.sustain / 255) * 80}%`,
              width: '20%',
              background: 'var(--color-accent-dim)'
            }}
          />
          <div
            style={{
              height: `${(envelope.sustain / 255) * 100}%`,
              width: '20%',
              background: 'var(--color-accent-dim)'
            }}
          />
          <div
            style={{
              height: `${(envelope.sustain / 255) * 50}%`,
              width: '20%',
              background: 'linear-gradient(to bottom, var(--color-accent), transparent)'
            }}
          />
        </div>
      </div>

      <Slider
        label="Attack (ms)"
        min={0}
        max={1000}
        value={envelope.attack}
        onChange={(e) => onUpdate({ ...envelope, attack: Number(e.target.value) })}
      />

      <Slider
        label="Decay (ms)"
        min={0}
        max={1000}
        value={envelope.decay}
        onChange={(e) => onUpdate({ ...envelope, decay: Number(e.target.value) })}
      />

      <Slider
        label="Sustain Level"
        min={0}
        max={255}
        value={envelope.sustain}
        onChange={(e) => onUpdate({ ...envelope, sustain: Number(e.target.value) })}
      />

      <Slider
        label="Release (ms)"
        min={0}
        max={1000}
        value={envelope.release}
        onChange={(e) => onUpdate({ ...envelope, release: Number(e.target.value) })}
      />
    </div>
  )
}

/**
 * LFO Editor
 */
const LFOEditor: React.FC<{
  lfo: LFO
  onUpdate: (lfo: LFO) => void
}> = ({ lfo, onUpdate }) => {
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={lfo.enabled}
          onChange={(e) => onUpdate({ ...lfo, enabled: e.target.checked })}
          className="w-4 h-4"
        />
        <span className="text-sm font-semibold">Enable LFO Modulation</span>
      </label>

      {lfo.enabled && (
        <>
          <Select
            label="Target Parameter"
            options={[
              { value: 'speed', label: 'Speed (BPM)' },
              { value: 'size', label: 'Size (Amplitude)' },
              { value: 'base', label: 'Base (Center)' }
            ]}
            value={lfo.target}
            onChange={(e) => onUpdate({ ...lfo, target: e.target.value as any })}
          />

          <Select
            label="Modulation Wave"
            options={[
              { value: 'sine', label: 'Sine' },
              { value: 'triangle', label: 'Triangle' },
              { value: 'square', label: 'Square' },
              { value: 'random', label: 'Random' }
            ]}
            value={lfo.wave}
            onChange={(e) => onUpdate({ ...lfo, wave: e.target.value as any })}
          />

          <Slider
            label="Frequency (Hz)"
            min={0.1}
            max={10}
            step={0.1}
            value={lfo.frequency}
            onChange={(e) => onUpdate({ ...lfo, frequency: Number(e.target.value) })}
          />

          <Slider
            label="Depth (%)"
            min={0}
            max={100}
            value={lfo.depth}
            onChange={(e) => onUpdate({ ...lfo, depth: Number(e.target.value) })}
          />
        </>
      )}
    </div>
  )
}

/**
 * Keyframe Editor
 */
const KeyframeEditor: React.FC<{
  keyframes: Keyframe[]
  onUpdate: (keyframes: Keyframe[]) => void
}> = ({ keyframes, onUpdate }) => {
  const addKeyframe = () => {
    const time = keyframes.length > 0 ? keyframes[keyframes.length - 1].time + 1 : 0
    onUpdate([...keyframes, { time, value: 127, easing: 'linear' }])
  }

  const removeKeyframe = (index: number) => {
    onUpdate(keyframes.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <Button variant="primary" onClick={addKeyframe}>
        + Add Keyframe
      </Button>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {keyframes.map((kf, idx) => (
          <div key={idx} className="flex gap-2 items-center bg-[var(--color-bg-input)] p-2 rounded">
            <Input
              type="number"
              min={0}
              max={100}
              value={kf.time}
              onChange={(e) => {
                const updated = [...keyframes]
                updated[idx].time = Number(e.target.value)
                onUpdate(updated)
              }}
              placeholder="Time (s)"
              style={{ width: '80px' }}
            />
            <Slider
              min={0}
              max={255}
              value={kf.value}
              onChange={(e) => {
                const updated = [...keyframes]
                updated[idx].value = Number(e.target.value)
                onUpdate(updated)
              }}
            />
            <Select
              options={[
                { value: 'linear', label: 'Linear' },
                { value: 'easeIn', label: 'Ease In' },
                { value: 'easeOut', label: 'Ease Out' },
                { value: 'easeInOut', label: 'Ease In/Out' }
              ]}
              value={kf.easing || 'linear'}
              onChange={(e) => {
                const updated = [...keyframes]
                updated[idx].easing = e.target.value as any
                onUpdate(updated)
              }}
              style={{ width: '120px' }}
            />
            <Button variant="danger" onClick={() => removeKeyframe(idx)}>
              ✕
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
