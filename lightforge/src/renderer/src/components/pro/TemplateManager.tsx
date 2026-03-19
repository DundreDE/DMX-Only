import React, { useState, useCallback } from 'react'
import { Panel, Button, Input, Badge } from './UIComponents'
import { TemplateManager } from '../utils/ImportExportManager'
import type { Scene, SceneEffect } from '../../../shared/types'

/**
 * Scene Template Editor & Browser
 * Save, load, and manage scene presets
 */
export const SceneTemplateEditor: React.FC<{
  currentScene: Scene
  onApplyTemplate: (scene: Scene) => void
  onSaveTemplate: (name: string) => void
}> = ({ currentScene, onApplyTemplate, onSaveTemplate }) => {
  const [templateName, setTemplateName] = useState('')
  const [templates, setTemplates] = useState<any[]>([])
  const [showSave, setShowSave] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Load templates on mount
  React.useEffect(() => {
    const loaded = TemplateManager.listTemplates('scene')
    setTemplates(loaded)
  }, [])

  const handleSaveTemplate = useCallback(() => {
    if (!templateName.trim()) return
    TemplateManager.saveTemplate(templateName, 'scene', currentScene)
    onSaveTemplate(templateName)
    const updated = TemplateManager.listTemplates('scene')
    setTemplates(updated)
    setTemplateName('')
    setShowSave(false)
  }, [templateName, currentScene, onSaveTemplate])

  const handleLoadTemplate = useCallback((name: string) => {
    const template = TemplateManager.loadTemplate(name, 'scene')
    if (template) {
      onApplyTemplate(template)
    }
  }, [onApplyTemplate])

  const handleDeleteTemplate = useCallback((name: string) => {
    TemplateManager.deleteTemplate(name, 'scene')
    const updated = TemplateManager.listTemplates('scene')
    setTemplates(updated)
  }, [])

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Panel header="Scene Templates">
      <div className="space-y-4">
        {/* Current Scene Info */}
        <div className="p-3 bg-[var(--color-bg-input)] rounded">
          <p className="text-xs text-[var(--color-text-secondary)] mb-1">Current Scene</p>
          <p className="font-bold text-lg">{currentScene.name}</p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Fade: {currentScene.fadeTime}ms · Effects: {currentScene.effects?.length || 0}
          </p>
        </div>

        {/* Save Template */}
        {!showSave ? (
          <Button
            variant="primary"
            onClick={() => setShowSave(true)}
            className="w-full"
          >
            💾 Save as Template
          </Button>
        ) : (
          <div className="space-y-2 p-3 bg-[var(--color-bg-input)] rounded">
            <Input
              placeholder="Template name..."
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={handleSaveTemplate}
                className="flex-1"
                disabled={!templateName.trim()}
              >
                Save
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowSave(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Template Browser */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Templates ({templates.length})</h3>
            <Badge variant="primary">{filteredTemplates.length}</Badge>
          </div>

          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-4 text-xs text-[var(--color-text-secondary)]">
                {searchQuery ? 'No templates found' : 'No templates saved yet'}
              </div>
            ) : (
              filteredTemplates.map((template, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2 bg-[var(--color-bg-input)] rounded hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{template.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Created: {new Date(template.created).toLocaleDateString()}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    onClick={() => handleLoadTemplate(template.name)}
                    className="px-2 py-1 text-xs"
                  >
                    Load
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => handleDeleteTemplate(template.name)}
                    className="px-2 py-1 text-xs"
                  >
                    ✕
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Panel>
  )
}

/**
 * Effect Template Manager
 * Save and load effect presets
 */
export const EffectTemplateManager: React.FC<{
  currentEffect: SceneEffect | null
  onApplyEffectTemplate: (effect: SceneEffect) => void
}> = ({ currentEffect, onApplyEffectTemplate }) => {
  const [effectTemplates, setEffectTemplates] = useState<any[]>([])
  const [saveMode, setSaveMode] = useState(false)
  const [effectName, setEffectName] = useState('')

  React.useEffect(() => {
    const loaded = TemplateManager.listTemplates('effect')
    setEffectTemplates(loaded)
  }, [])

  const handleSaveEffectTemplate = () => {
    if (!effectName.trim() || !currentEffect) return

    TemplateManager.saveTemplate(effectName, 'effect', currentEffect)
    const updated = TemplateManager.listTemplates('effect')
    setEffectTemplates(updated)
    setEffectName('')
    setSaveMode(false)
  }

  const handleLoadEffectTemplate = (name: string) => {
    const template = TemplateManager.loadTemplate(name, 'effect')
    if (template) {
      onApplyEffectTemplate(template)
    }
  }

  return (
    <div className="space-y-3 p-3 bg-[var(--color-bg-input)] rounded">
      <h3 className="font-semibold text-sm">Effect Presets</h3>

      {!saveMode ? (
        <Button
          variant="secondary"
          onClick={() => setSaveMode(true)}
          disabled={!currentEffect}
          className="w-full"
        >
          Save Effect Preset
        </Button>
      ) : (
        <div className="space-y-2">
          <Input
            placeholder="Preset name..."
            value={effectName}
            onChange={(e) => setEffectName(e.target.value)}
          />
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={handleSaveEffectTemplate}
              className="flex-1"
            >
              Save
            </Button>
            <Button
              variant="secondary"
              onClick={() => setSaveMode(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Template List */}
      <div className="space-y-1">
        {effectTemplates.map((template, idx) => (
          <button
            key={idx}
            onClick={() => handleLoadEffectTemplate(template.name)}
            className="w-full text-left p-2 text-xs bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
          >
            <div className="font-semibold">{template.name}</div>
            <div className="text-[var(--color-text-secondary)]">
              {template.data.wave} · {template.data.speed} BPM
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Preset Browser
 * Browse all saved templates and effects
 */
export const PresetBrowser: React.FC<{
  onSelectScene: (scene: Scene) => void
  onSelectEffect: (effect: SceneEffect) => void
}> = ({ onSelectScene, onSelectEffect }) => {
  const [sceneTemplates, setSceneTemplates] = useState<any[]>([])
  const [effectTemplates, setEffectTemplates] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'scenes' | 'effects'>('scenes')

  React.useEffect(() => {
    const scenes = TemplateManager.listTemplates('scene')
    const effects = TemplateManager.listTemplates('effect')
    setSceneTemplates(scenes)
    setEffectTemplates(effects)
  }, [])

  return (
    <Panel header="Preset Browser">
      <div className="space-y-3">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-[var(--color-border)]">
          {(['scenes', 'effects'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 font-semibold text-sm transition-colors ${
                activeTab === tab
                  ? 'text-[var(--color-accent)] border-b-2 border-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Scene Templates */}
        {activeTab === 'scenes' && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {sceneTemplates.map((template, idx) => (
              <button
                key={idx}
                onClick={() => onSelectScene(template.data)}
                className="w-full text-left p-3 bg-[var(--color-bg-input)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
              >
                <p className="font-semibold text-sm">{template.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {template.data.effects?.length || 0} effects
                </p>
              </button>
            ))}
            {sceneTemplates.length === 0 && (
              <p className="text-center text-sm text-[var(--color-text-secondary)]">
                No scene templates
              </p>
            )}
          </div>
        )}

        {/* Effect Templates */}
        {activeTab === 'effects' && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {effectTemplates.map((template, idx) => (
              <button
                key={idx}
                onClick={() => onSelectEffect(template.data)}
                className="w-full text-left p-3 bg-[var(--color-bg-input)] hover:bg-[var(--color-bg-hover)] rounded transition-colors"
              >
                <p className="font-semibold text-sm">{template.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {template.data.wave} · {template.data.speed} BPM
                </p>
              </button>
            ))}
            {effectTemplates.length === 0 && (
              <p className="text-center text-sm text-[var(--color-text-secondary)]">
                No effect templates
              </p>
            )}
          </div>
        )}
      </div>
    </Panel>
  )
}
