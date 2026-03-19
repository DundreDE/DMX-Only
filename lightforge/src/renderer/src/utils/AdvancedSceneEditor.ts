/**
 * SceneEditorPersistence - Save/Load Scenes with Full State
 * 
 * Professional scene management with file persistence
 */

export interface SceneSaveData {
  id: string
  name: string
  description: string
  dmxValues: Map<number, Uint8Array>  // Universe -> DMX data
  effects: any[]
  metadata: {
    createdAt: Date
    modifiedAt: Date
    version: number
    tags: string[]
    notes: string
  }
  previewImage?: string
}

export interface SceneFile {
  version: '1.0'
  scene: SceneSaveData
  timestamp: number
}

export class SceneEditorPersistence {
  private scenes = new Map<string, SceneSaveData>()
  private saveHistory = new Map<string, SceneSaveData[]>()
  private subscribers: ((sceneId: string) => void)[] = []

  /**
   * Save scene
   */
  saveScene(sceneId: string, name: string, dmxValues: Map<number, Uint8Array>, effects: any[] = []): SceneSaveData {
    const existing = this.scenes.get(sceneId)
    
    const scene: SceneSaveData = {
      id: sceneId,
      name,
      description: existing?.description || '',
      dmxValues,
      effects,
      metadata: {
        createdAt: existing?.metadata.createdAt || new Date(),
        modifiedAt: new Date(),
        version: (existing?.metadata.version || 0) + 1,
        tags: existing?.metadata.tags || [],
        notes: existing?.metadata.notes || ''
      }
    }

    this.scenes.set(sceneId, scene)

    // Add to history
    if (!this.saveHistory.has(sceneId)) {
      this.saveHistory.set(sceneId, [])
    }
    const history = this.saveHistory.get(sceneId)!
    history.push({ ...scene })
    if (history.length > 20) history.shift()  // Keep last 20 versions

    this.publish(sceneId)
    return scene
  }

  /**
   * Load scene from storage
   */
  loadScene(sceneId: string): SceneSaveData | null {
    return this.scenes.get(sceneId) || null
  }

  /**
   * Export scene to JSON file
   */
  exportScene(sceneId: string): string {
    const scene = this.scenes.get(sceneId)
    if (!scene) throw new Error(`Scene ${sceneId} not found`)

    // Convert Uint8Array to regular arrays for JSON
    const exportData: SceneFile = {
      version: '1.0',
      scene: {
        ...scene,
        dmxValues: Array.from(scene.dmxValues.entries()).map(([k, v]) => [k, Array.from(v)])
      },
      timestamp: Date.now()
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Import scene from JSON
   */
  importScene(json: string): SceneSaveData {
    const data: SceneFile = JSON.parse(json)

    // Convert arrays back to Uint8Array
    const scene: SceneSaveData = {
      ...data.scene,
      dmxValues: new Map(
        (data.scene.dmxValues as any[]).map(([k, v]: [number, number[]]) => [k, new Uint8Array(v)])
      )
    }

    this.scenes.set(scene.id, scene)
    return scene
  }

  /**
   * Get scene history
   */
  getHistory(sceneId: string): SceneSaveData[] {
    return this.saveHistory.get(sceneId) || []
  }

  /**
   * Restore from history
   */
  restoreFromHistory(sceneId: string, version: number): SceneSaveData | null {
    const history = this.saveHistory.get(sceneId)
    if (!history || version < 0 || version >= history.length) return null

    const scene = history[version]
    this.scenes.set(sceneId, { ...scene })
    this.publish(sceneId)
    return scene
  }

  /**
   * Get all scenes
   */
  getAllScenes(): SceneSaveData[] {
    return Array.from(this.scenes.values())
  }

  /**
   * Delete scene
   */
  deleteScene(sceneId: string): void {
    this.scenes.delete(sceneId)
    this.saveHistory.delete(sceneId)
  }

  /**
   * Subscribe
   */
  subscribe(callback: (sceneId: string) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) this.subscribers.splice(index, 1)
    }
  }

  private publish(sceneId: string): void {
    this.subscribers.forEach(sub => sub(sceneId))
  }
}

export const sceneEditorPersistence = new SceneEditorPersistence()

/**
 * AdvancedSceneEditorEngine - Professional Scene Editing
 * 
 * Features: Undo/Redo, Templates, Layers, Blending, Versioning
 */

export interface SceneLayer {
  id: string
  name: string
  dmxValues: Map<number, Uint8Array>
  opacity: number  // 0-100
  blendMode: 'normal' | 'add' | 'multiply' | 'screen' | 'overlay'
  visible: boolean
}

export interface SceneTemplate {
  id: string
  name: string
  layers: SceneLayer[]
  baseSettings: {
    masterLevel: number
    defaultFade: number
  }
}

export interface UndoRedoState {
  sceneId: string
  dmxValues: Map<number, Uint8Array>
  layers: SceneLayer[]
  timestamp: number
  description: string
}

export class AdvancedSceneEditorEngine {
  private scenes = new Map<string, { layers: SceneLayer[] }>()
  private undoStack: UndoRedoState[] = []
  private redoStack: UndoRedoState[] = []
  private templates = new Map<string, SceneTemplate>()
  private subscribers: ((sceneId: string, update: any) => void)[] = []

  /**
   * Initialize scene with layers
   */
  initializeScene(sceneId: string, layerCount: number = 3): void {
    const layers: SceneLayer[] = []
    for (let i = 0; i < layerCount; i++) {
      layers.push({
        id: crypto.randomUUID(),
        name: `Layer ${i + 1}`,
        dmxValues: new Map(),
        opacity: 100,
        blendMode: 'normal',
        visible: true
      })
    }

    this.scenes.set(sceneId, { layers })
  }

  /**
   * Add layer to scene
   */
  addLayer(sceneId: string, name: string): SceneLayer {
    const scene = this.scenes.get(sceneId)
    if (!scene) throw new Error(`Scene ${sceneId} not found`)

    const layer: SceneLayer = {
      id: crypto.randomUUID(),
      name,
      dmxValues: new Map(),
      opacity: 100,
      blendMode: 'normal',
      visible: true
    }

    scene.layers.push(layer)
    this.saveState(sceneId, `Added layer: ${name}`)
    this.publish(sceneId, { type: 'layer-added', layer })

    return layer
  }

  /**
   * Delete layer
   */
  deleteLayer(sceneId: string, layerId: string): void {
    const scene = this.scenes.get(sceneId)
    if (!scene) return

    const index = scene.layers.findIndex(l => l.id === layerId)
    if (index > -1) {
      const layer = scene.layers[index]
      scene.layers.splice(index, 1)
      this.saveState(sceneId, `Deleted layer: ${layer.name}`)
      this.publish(sceneId, { type: 'layer-deleted', layerId })
    }
  }

  /**
   * Set layer DMX values
   */
  setLayerDmx(sceneId: string, layerId: string, universeIndex: number, dmx: Uint8Array): void {
    const scene = this.scenes.get(sceneId)
    if (!scene) return

    const layer = scene.layers.find(l => l.id === layerId)
    if (layer) {
      layer.dmxValues.set(universeIndex, dmx)
      this.saveState(sceneId, `Updated layer DMX: ${layer.name}`)
      this.publish(sceneId, { type: 'layer-updated', layerId })
    }
  }

  /**
   * Set layer opacity
   */
  setLayerOpacity(sceneId: string, layerId: string, opacity: number): void {
    const scene = this.scenes.get(sceneId)
    if (!scene) return

    const layer = scene.layers.find(l => l.id === layerId)
    if (layer) {
      layer.opacity = Math.max(0, Math.min(100, opacity))
      this.publish(sceneId, { type: 'layer-opacity-changed', layerId, opacity: layer.opacity })
    }
  }

  /**
   * Set layer blend mode
   */
  setLayerBlendMode(sceneId: string, layerId: string, blendMode: SceneLayer['blendMode']): void {
    const scene = this.scenes.get(sceneId)
    if (!scene) return

    const layer = scene.layers.find(l => l.id === layerId)
    if (layer) {
      layer.blendMode = blendMode
      this.publish(sceneId, { type: 'layer-blend-changed', layerId, blendMode })
    }
  }

  /**
   * Toggle layer visibility
   */
  toggleLayerVisibility(sceneId: string, layerId: string): void {
    const scene = this.scenes.get(sceneId)
    if (!scene) return

    const layer = scene.layers.find(l => l.id === layerId)
    if (layer) {
      layer.visible = !layer.visible
      this.publish(sceneId, { type: 'layer-visibility-changed', layerId, visible: layer.visible })
    }
  }

  /**
   * Blend layers and get final DMX
   */
  blendLayers(sceneId: string): Map<number, Uint8Array> {
    const scene = this.scenes.get(sceneId)
    if (!scene) return new Map()

    const result = new Map<number, Uint8Array>()

    for (const layer of scene.layers) {
      if (!layer.visible) continue

      for (const [universeIdx, layerDmx] of layer.dmxValues) {
        if (!result.has(universeIdx)) {
          result.set(universeIdx, new Uint8Array(512))
        }

        const resultDmx = result.get(universeIdx)!
        const opacity = layer.opacity / 100

        for (let i = 0; i < 512; i++) {
          const layerValue = layerDmx[i]

          if (layer.blendMode === 'add') {
            // Add blend
            resultDmx[i] = Math.min(255, resultDmx[i] + layerValue * opacity)
          } else if (layer.blendMode === 'multiply') {
            // Multiply blend
            resultDmx[i] = Math.round((resultDmx[i] / 255) * (layerValue * opacity))
          } else if (layer.blendMode === 'screen') {
            // Screen blend
            const a = resultDmx[i] / 255
            const b = (layerValue * opacity) / 255
            resultDmx[i] = Math.round(255 * (1 - (1 - a) * (1 - b)))
          } else if (layer.blendMode === 'overlay') {
            // Overlay blend
            const a = resultDmx[i] / 255
            const b = (layerValue * opacity) / 255
            resultDmx[i] = a < 0.5
              ? Math.round(2 * a * b * 255)
              : Math.round(255 * (1 - 2 * (1 - a) * (1 - b)))
          } else {
            // Normal blend (replace)
            resultDmx[i] = layerValue * opacity > resultDmx[i] ? layerValue * opacity : resultDmx[i]
          }
        }
      }
    }

    return result
  }

  /**
   * Save state for undo
   */
  private saveState(sceneId: string, description: string): void {
    const scene = this.scenes.get(sceneId)
    if (!scene) return

    // Clone current state
    const blended = this.blendLayers(sceneId)

    this.undoStack.push({
      sceneId,
      dmxValues: blended,
      layers: scene.layers.map(l => ({ ...l })),
      timestamp: Date.now(),
      description
    })

    this.redoStack = []  // Clear redo when new action
  }

  /**
   * Undo
   */
  undo(sceneId: string): void {
    if (this.undoStack.length === 0) return

    const state = this.undoStack.pop()!
    const scene = this.scenes.get(sceneId)
    if (!scene) return

    // Save current for redo
    this.redoStack.push({
      sceneId,
      dmxValues: this.blendLayers(sceneId),
      layers: scene.layers.map(l => ({ ...l })),
      timestamp: Date.now(),
      description: 'Redo'
    })

    // Restore state
    scene.layers = state.layers
    this.publish(sceneId, { type: 'undo', description: state.description })
  }

  /**
   * Redo
   */
  redo(sceneId: string): void {
    if (this.redoStack.length === 0) return

    const state = this.redoStack.pop()!
    const scene = this.scenes.get(sceneId)
    if (!scene) return

    this.undoStack.push({
      sceneId,
      dmxValues: this.blendLayers(sceneId),
      layers: scene.layers.map(l => ({ ...l })),
      timestamp: Date.now(),
      description: 'Undo'
    })

    scene.layers = state.layers
    this.publish(sceneId, { type: 'redo' })
  }

  /**
   * Save as template
   */
  saveAsTemplate(sceneId: string, name: string): SceneTemplate {
    const scene = this.scenes.get(sceneId)
    if (!scene) throw new Error(`Scene ${sceneId} not found`)

    const template: SceneTemplate = {
      id: crypto.randomUUID(),
      name,
      layers: scene.layers.map(l => ({ ...l })),
      baseSettings: {
        masterLevel: 255,
        defaultFade: 2
      }
    }

    this.templates.set(template.id, template)
    return template
  }

  /**
   * Load template
   */
  loadTemplate(sceneId: string, templateId: string): void {
    const template = this.templates.get(templateId)
    if (!template) return

    this.scenes.set(sceneId, {
      layers: template.layers.map(l => ({ ...l, id: crypto.randomUUID() }))
    })

    this.publish(sceneId, { type: 'template-loaded', templateId })
  }

  /**
   * Get scene layers
   */
  getLayersForScene(sceneId: string): SceneLayer[] {
    return this.scenes.get(sceneId)?.layers || []
  }

  /**
   * Subscribe
   */
  subscribe(callback: (sceneId: string, update: any) => void): () => void {
    this.subscribers.push(callback)
    return () => {
      const index = this.subscribers.indexOf(callback)
      if (index > -1) this.subscribers.splice(index, 1)
    }
  }

  private publish(sceneId: string, update: any): void {
    this.subscribers.forEach(sub => sub(sceneId, update))
  }
}

export const advancedSceneEditorEngine = new AdvancedSceneEditorEngine()
