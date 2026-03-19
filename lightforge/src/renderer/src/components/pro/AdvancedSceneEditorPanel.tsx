/**
 * AdvancedSceneEditorPanel - Professional Scene Editing with Layers, Undo, Templates
 */

import React, { useState, useCallback } from 'react'
import { advancedSceneEditorEngine, sceneEditorPersistence } from '../utils/AdvancedSceneEditor'

interface AdvancedSceneEditorPanelProps {
  sceneId?: string
  onClose?: () => void
}

export const AdvancedSceneEditorPanel: React.FC<AdvancedSceneEditorPanelProps> = ({ sceneId = 'default', onClose }) => {
  const [layers, setLayers] = useState(() => advancedSceneEditorEngine.getLayersForScene(sceneId))
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(layers[0]?.id || null)
  const [sceneName, setSceneName] = useState('My Scene')
  const [newLayerName, setNewLayerName] = useState('New Layer')
  const [blendMode, setBlendMode] = useState<'normal' | 'add' | 'multiply' | 'screen' | 'overlay'>('normal')
  const [layerOpacity, setLayerOpacity] = useState(100)
  const [templateName, setTemplateName] = useState('Template')
  const [isSaving, setIsSaving] = useState(false)

  const selectedLayer = layers.find(l => l.id === selectedLayerId)

  const handleInitScene = useCallback(() => {
    advancedSceneEditorEngine.initializeScene(sceneId, 3)
    setLayers(advancedSceneEditorEngine.getLayersForScene(sceneId))
    setSelectedLayerId(advancedSceneEditorEngine.getLayersForScene(sceneId)[0]?.id || null)
  }, [sceneId])

  const handleAddLayer = useCallback(() => {
    const layer = advancedSceneEditorEngine.addLayer(sceneId, newLayerName)
    setLayers(advancedSceneEditorEngine.getLayersForScene(sceneId))
    setSelectedLayerId(layer.id)
    setNewLayerName('New Layer')
  }, [sceneId, newLayerName])

  const handleDeleteLayer = useCallback(() => {
    if (!selectedLayerId) return
    advancedSceneEditorEngine.deleteLayer(sceneId, selectedLayerId)
    setLayers(advancedSceneEditorEngine.getLayersForScene(sceneId))
    setSelectedLayerId(layers[0]?.id || null)
  }, [sceneId, selectedLayerId, layers])

  const handleSetBlendMode = useCallback((mode: any) => {
    if (!selectedLayerId) return
    advancedSceneEditorEngine.setLayerBlendMode(sceneId, selectedLayerId, mode)
    setBlendMode(mode)
    setLayers([...advancedSceneEditorEngine.getLayersForScene(sceneId)])
  }, [sceneId, selectedLayerId])

  const handleSetOpacity = useCallback((opacity: number) => {
    if (!selectedLayerId) return
    advancedSceneEditorEngine.setLayerOpacity(sceneId, selectedLayerId, opacity)
    setLayerOpacity(opacity)
  }, [sceneId, selectedLayerId])

  const handleToggleVisibility = useCallback(() => {
    if (!selectedLayerId) return
    advancedSceneEditorEngine.toggleLayerVisibility(sceneId, selectedLayerId)
    setLayers([...advancedSceneEditorEngine.getLayersForScene(sceneId)])
  }, [sceneId, selectedLayerId])

  const handleUndo = useCallback(() => {
    advancedSceneEditorEngine.undo(sceneId)
    setLayers(advancedSceneEditorEngine.getLayersForScene(sceneId))
  }, [sceneId])

  const handleRedo = useCallback(() => {
    advancedSceneEditorEngine.redo(sceneId)
    setLayers(advancedSceneEditorEngine.getLayersForScene(sceneId))
  }, [sceneId])

  const handleSaveTemplate = useCallback(() => {
    const template = advancedSceneEditorEngine.saveAsTemplate(sceneId, templateName)
    alert(`Template "${template.name}" gespeichert!`)
    setTemplateName('Template')
  }, [sceneId, templateName])

  const handleSaveScene = useCallback(() => {
    setIsSaving(true)
    const blended = advancedSceneEditorEngine.blendLayers(sceneId)
    sceneEditorPersistence.saveScene(sceneId, sceneName, blended, [])
    setTimeout(() => {
      setIsSaving(false)
      alert(`Scene "${sceneName}" gespeichert!`)
    }, 500)
  }, [sceneId, sceneName])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      padding: '16px',
      backgroundColor: '#1e2130',
      borderRadius: '8px',
      color: '#e0e0e0',
      maxHeight: '700px',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>🎨 SCENE EDITOR PRO</h3>
        {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#e0e0e0', cursor: 'pointer', fontSize: '18px' }}>✕</button>}
      </div>

      {/* Scene Name */}
      <div>
        <label style={{ fontSize: '11px', color: '#8b8b8b' }}>SCENE NAME</label>
        <input
          type="text"
          value={sceneName}
          onChange={e => setSceneName(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#2d3748',
            border: 'none',
            borderRadius: '4px',
            color: '#10b981',
            fontSize: '12px',
            marginTop: '4px'
          }}
        />
      </div>

      {/* Undo/Redo Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <button
          onClick={handleUndo}
          style={{
            padding: '8px',
            backgroundColor: '#2d3748',
            border: 'none',
            borderRadius: '4px',
            color: '#e0e0e0',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          ↶ UNDO
        </button>

        <button
          onClick={handleRedo}
          style={{
            padding: '8px',
            backgroundColor: '#2d3748',
            border: 'none',
            borderRadius: '4px',
            color: '#e0e0e0',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          ↷ REDO
        </button>
      </div>

      {/* Layers Section */}
      <div style={{ padding: '12px', backgroundColor: '#0f1117', borderRadius: '6px' }}>
        <label style={{ fontSize: '12px', color: '#8b8b8b', marginBottom: '8px', display: 'block' }}>LAYERS ({layers.length})</label>

        {layers.length === 0 ? (
          <button
            onClick={handleInitScene}
            style={{
              width: '100%',
              padding: '10px',
              backgroundColor: '#6c63ff',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '11px',
              fontWeight: 600
            }}
          >
            INITIALIZE LAYERS
          </button>
        ) : (
          <>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              maxHeight: '150px',
              overflowY: 'auto',
              marginBottom: '8px'
            }}>
              {layers.map(layer => (
                <button
                  key={layer.id}
                  onClick={() => {
                    setSelectedLayerId(layer.id)
                    setBlendMode(layer.blendMode)
                    setLayerOpacity(layer.opacity)
                  }}
                  style={{
                    padding: '8px',
                    backgroundColor: selectedLayerId === layer.id ? '#6c63ff' : '#2d3748',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#e0e0e0',
                    cursor: 'pointer',
                    fontSize: '11px',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>{layer.visible ? '👁 ' : '👁‍🗨 '}{layer.name}</span>
                  <span style={{ fontSize: '9px', color: '#888' }}>{layer.opacity}%</span>
                </button>
              ))}
            </div>

            {/* Add Layer Input */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <input
                type="text"
                value={newLayerName}
                onChange={e => setNewLayerName(e.target.value)}
                placeholder="Layer name"
                style={{
                  padding: '6px',
                  backgroundColor: '#2d3748',
                  border: 'none',
                  borderRadius: '3px',
                  color: '#e0e0e0',
                  fontSize: '10px'
                }}
              />
              <button
                onClick={handleAddLayer}
                style={{
                  padding: '6px',
                  backgroundColor: '#10b981',
                  border: 'none',
                  borderRadius: '3px',
                  color: '#000',
                  cursor: 'pointer',
                  fontSize: '10px',
                  fontWeight: 600
                }}
              >
                + ADD
              </button>
            </div>
          </>
        )}
      </div>

      {/* Layer Properties */}
      {selectedLayer && (
        <div style={{ padding: '12px', backgroundColor: '#0f1117', borderRadius: '6px' }}>
          <label style={{ fontSize: '12px', color: '#8b8b8b', marginBottom: '8px', display: 'block' }}>LAYER: {selectedLayer.name}</label>

          {/* Opacity */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '10px', color: '#888' }}>OPACITY ({layerOpacity}%)</label>
            <input
              type="range"
              min="0"
              max="100"
              value={layerOpacity}
              onChange={e => handleSetOpacity(Number(e.target.value))}
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>

          {/* Blend Mode */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '10px', color: '#888', marginBottom: '4px', display: 'block' }}>BLEND MODE</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {(['normal', 'add', 'multiply', 'screen', 'overlay'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => handleSetBlendMode(mode)}
                  style={{
                    padding: '6px',
                    backgroundColor: blendMode === mode ? '#6c63ff' : '#2d3748',
                    border: 'none',
                    borderRadius: '3px',
                    color: '#e0e0e0',
                    cursor: 'pointer',
                    fontSize: '9px',
                    fontWeight: blendMode === mode ? 600 : 400
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <button
            onClick={handleToggleVisibility}
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: selectedLayer.visible ? '#10b981' : '#555',
              border: 'none',
              borderRadius: '3px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 600,
              marginBottom: '8px'
            }}
          >
            {selectedLayer.visible ? '👁 VISIBLE' : '👁‍🗨 HIDDEN'}
          </button>

          {/* Delete Layer */}
          <button
            onClick={handleDeleteLayer}
            style={{
              width: '100%',
              padding: '6px',
              backgroundColor: '#ef4444',
              border: 'none',
              borderRadius: '3px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '10px',
              fontWeight: 600
            }}
          >
            ✕ DELETE LAYER
          </button>
        </div>
      )}

      {/* Template & Save */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        <input
          type="text"
          value={templateName}
          onChange={e => setTemplateName(e.target.value)}
          placeholder="Template name"
          style={{
            padding: '8px',
            backgroundColor: '#2d3748',
            border: 'none',
            borderRadius: '4px',
            color: '#e0e0e0',
            fontSize: '10px'
          }}
        />
        <button
          onClick={handleSaveTemplate}
          style={{
            padding: '8px',
            backgroundColor: '#6c63ff',
            border: 'none',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '10px',
            fontWeight: 600
          }}
        >
          💾 TEMPLATE
        </button>
      </div>

      {/* Save Scene */}
      <button
        onClick={handleSaveScene}
        disabled={isSaving}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: isSaving ? '#555' : '#10b981',
          border: 'none',
          borderRadius: '6px',
          color: '#000',
          cursor: isSaving ? 'not-allowed' : 'pointer',
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'uppercase'
        }}
      >
        {isSaving ? 'SAVING...' : '💾 SAVE SCENE'}
      </button>
    </div>
  )
}
