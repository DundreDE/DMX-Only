import React, { useState } from 'react'
import { Panel, Button, Select, Slider, Input } from './UIComponents'
import type { ProjectSettings } from '../utils/ProjectManager'

interface AdvancedSettingsPanelProps {
  settings: ProjectSettings
  onUpdate: (settings: ProjectSettings) => void
  onClose: () => void
}

/**
 * Advanced Settings Panel
 * DMX Config, Effect Defaults, Project Settings, UI Preferences
 */
export const AdvancedSettingsPanel: React.FC<AdvancedSettingsPanelProps> = ({ settings, onUpdate, onClose }) => {
  const [tab, setTab] = useState<'dmx' | 'effects' | 'project' | 'ui' | 'export'>('dmx')

  return (
    <Panel header="Advanced Settings" footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b border-[var(--color-border)] -mx-6 px-6 pb-4">
        {(['dmx', 'effects', 'project', 'ui', 'export'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-semibold uppercase transition-colors ${
              tab === t
                ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                : 'text-[var(--color-text-secondary)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4">
        {/* DMX Tab */}
        {tab === 'dmx' && (
          <>
            <h3 className="font-semibold text-lg">DMX Output Configuration</h3>

            <div className="bg-[var(--color-bg-input)] p-4 rounded space-y-4">
              <Select
                label="Default Universe"
                options={Array.from({ length: 100 }, (_, i) => ({
                  value: String(i),
                  label: `Universe ${i}`
                }))}
                value={String(settings.universe)}
                onChange={(e) => onUpdate({ ...settings, universe: Number(e.target.value) })}
              />

              <Slider
                label="Master Level"
                min={0}
                max={255}
                value={settings.masterLevel}
                onChange={(e) => onUpdate({ ...settings, masterLevel: Number(e.target.value) })}
              />

              <div className="pt-4 border-t border-[var(--color-border)]">
                <h4 className="font-semibold text-sm mb-3">Serial Port Options</h4>
                <Select
                  label="Baud Rate"
                  options={[
                    { value: '9600', label: '9600' },
                    { value: '19200', label: '19200' },
                    { value: '38400', label: '38400' },
                    { value: '115200', label: '115200' }
                  ]}
                  value="115200"
                />
              </div>

              <div className="pt-4 border-t border-[var(--color-border)]">
                <h4 className="font-semibold text-sm mb-3">ArtNet Settings</h4>
                <Input label="ArtNet Broadcast Address" placeholder="192.168.1.255" />
                <Input label="ArtNet Port" placeholder="6454" type="number" />
              </div>
            </div>
          </>
        )}

        {/* Effects Tab */}
        {tab === 'effects' && (
          <>
            <h3 className="font-semibold text-lg">Effect Default Values</h3>

            <div className="bg-[var(--color-bg-input)] p-4 rounded space-y-4">
              <Select
                label="Default Wave Type"
                options={[
                  { value: 'sine', label: 'Sine' },
                  { value: 'triangle', label: 'Triangle' },
                  { value: 'square', label: 'Square' },
                  { value: 'sawtooth', label: 'Sawtooth' },
                  { value: 'random', label: 'Random' }
                ]}
              />

              <Slider label="Default BPM" min={20} max={240} defaultValue={120} />

              <Slider label="Default Size (0-255)" min={0} max={255} defaultValue={127} />

              <Slider label="Default Base (0-255)" min={0} max={255} defaultValue={127} />

              <div className="pt-4 border-t border-[var(--color-border)]">
                <h4 className="font-semibold text-sm mb-3">ADSR Defaults (ms)</h4>
                <Input label="Attack" type="number" defaultValue={10} />
                <Input label="Decay" type="number" defaultValue={50} />
                <Input label="Sustain Level" type="number" defaultValue={200} />
                <Input label="Release" type="number" defaultValue={100} />
              </div>

              <div className="pt-4 border-t border-[var(--color-border)]">
                <h4 className="font-semibold text-sm mb-3">LFO Defaults</h4>
                <Slider label="LFO Frequency (Hz)" min={0.1} max={10} step={0.1} defaultValue={1} />
                <Slider label="LFO Depth (%)" min={0} max={100} defaultValue={20} />
              </div>
            </div>
          </>
        )}

        {/* Project Tab */}
        {tab === 'project' && (
          <>
            <h3 className="font-semibold text-lg">Project Management</h3>

            <div className="bg-[var(--color-bg-input)] p-4 rounded space-y-4">
              <div className="space-y-2">
                <label className="label">Auto-Save Interval (ms)</label>
                <input
                  type="number"
                  className="input w-full"
                  min={5000}
                  max={300000}
                  step={5000}
                  value={settings.autoSaveInterval}
                  onChange={(e) =>
                    onUpdate({ ...settings, autoSaveInterval: Number(e.target.value) })
                  }
                />
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Current: {(settings.autoSaveInterval / 1000).toFixed(0)} seconds
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--color-border)]">
                <h4 className="font-semibold text-sm mb-3">Recovery Settings</h4>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm">Enable crash recovery</span>
                </label>
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm">Auto-load last session on startup</span>
                </label>
              </div>

              <div className="pt-4 border-t border-[var(--color-border)]">
                <h4 className="font-semibold text-sm mb-3">Backup & Cleanup</h4>
                <Button variant="secondary" className="w-full mb-2">
                  Create Backup
                </Button>
                <Button variant="secondary" className="w-full">
                  Clear Draft Files
                </Button>
              </div>
            </div>
          </>
        )}

        {/* UI Tab */}
        {tab === 'ui' && (
          <>
            <h3 className="font-semibold text-lg">User Interface</h3>

            <div className="bg-[var(--color-bg-input)] p-4 rounded space-y-4">
              <Select
                label="Language"
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'de', label: 'Deutsch' }
                ]}
                value={settings.language}
                onChange={(e) => onUpdate({ ...settings, language: e.target.value as any })}
              />

              <Select
                label="Theme"
                options={[
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                  { value: 'auto', label: 'Auto (System)' }
                ]}
                value={settings.theme}
                onChange={(e) => onUpdate({ ...settings, theme: e.target.value as any })}
              />

              <div className="space-y-2">
                <label className="label">UI Scale (%)</label>
                <Slider min={80} max={150} defaultValue={100} />
                <p className="text-xs text-[var(--color-text-secondary)]">Affects all UI elements</p>
              </div>

              <div className="space-y-2">
                <label className="label">Font Size</label>
                <Select
                  options={[
                    { value: 'sm', label: 'Small' },
                    { value: 'md', label: 'Medium' },
                    { value: 'lg', label: 'Large' }
                  ]}
                />
              </div>

              <div className="pt-4 border-t border-[var(--color-border)]">
                <h4 className="font-semibold text-sm mb-3">Behavior</h4>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm">Confirm before closing</span>
                </label>
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" defaultChecked className="w-4 h-4" />
                  <span className="text-sm">Show tooltips</span>
                </label>
                <label className="flex items-center gap-2 mt-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-sm">Compact mode</span>
                </label>
              </div>
            </div>
          </>
        )}

        {/* Export Tab */}
        {tab === 'export' && (
          <>
            <h3 className="font-semibold text-lg">Import / Export</h3>

            <div className="bg-[var(--color-bg-input)] p-4 rounded space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Export Project</h4>
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                  Save project as JSON file for backup or sharing
                </p>
                <Button variant="primary" className="w-full">
                  📥 Export as JSON
                </Button>
              </div>

              <div className="pt-4 border-t border-[var(--color-border)]">
                <h4 className="font-semibold text-sm">Import Project</h4>
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                  Load project from JSON file
                </p>
                <Button variant="secondary" className="w-full">
                  📤 Import from JSON
                </Button>
              </div>

              <div className="pt-4 border-t border-[var(--color-border)]">
                <h4 className="font-semibold text-sm">Fixture Definitions</h4>
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                  Import/export QXF fixture definitions
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1">
                    Export QXF
                  </Button>
                  <Button variant="secondary" className="flex-1">
                    Import QXF
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--color-border)]">
                <h4 className="font-semibold text-sm">Scene Templates</h4>
                <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                  Save and load effect presets
                </p>
                <Button variant="secondary" className="w-full mb-2">
                  Save Scene as Template
                </Button>
                <Button variant="secondary" className="w-full">
                  Load Template
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Panel>
  )
}
