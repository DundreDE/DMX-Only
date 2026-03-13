# ⚡ Quick Start: Professional Scene Editor

## 📦 What You Got

6 professional React components + utility helpers to build a Daslight 5-style scene editor.

```
Files Created:
✓ src/renderer/src/utils/sceneEditorHelpers.ts
✓ src/renderer/src/components/pro/SceneGridPanel.tsx
✓ src/renderer/src/components/pro/StageView2D.tsx
✓ src/renderer/src/components/pro/FeatureFaderPanel.tsx
✓ src/renderer/src/components/pro/SceneSettingsPanel.tsx
✓ src/renderer/src/components/pro/LiveControlDials.tsx
✓ src/renderer/src/components/pro/FXGeneratorPanel.tsx
```

---

## 🚀 Integration in 5 Minutes

### Step 1: Create Container Component

Create file: `src/renderer/src/components/pro/SceneEditorPro.tsx`

```tsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useFixtureStore } from '../../store/useFixtureStore'
import { useDmxStore } from '../../store/useDmxStore'
import type { Scene, SceneEffect } from '../../../../shared/types'
import { v4 as uuidv4 } from 'uuid'

import { SceneGridPanel } from './SceneGridPanel'
import { StageView2D } from './StageView2D'
import { FeatureFaderPanel } from './FeatureFaderPanel'
import { SceneSettingsPanel } from './SceneSettingsPanel'
import { LiveControlDials } from './LiveControlDials'
import { FXGeneratorPanel } from './FXGeneratorPanel'

import { calcWave } from '../../utils/sceneEditorHelpers'

export function SceneEditorPro(): React.JSX.Element {
  const { scenes, patch, library, updateScene, deleteScene, addScene } = useFixtureStore()
  const { setChannel } = useDmxStore()

  // State
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [selectedFixtureIds, setSelectedFixtureIds] = useState<Set<string>>(new Set())
  const [bpm, setBpm] = useState(120)
  const [efxActive, setEfxActive] = useState(false)
  const [rightTab, setRightTab] = useState<'settings' | 'faders' | 'dials' | 'fx'>('settings')

  const selectedScene = scenes.find(s => s.id === selectedSceneId) ?? null

  // Scene management
  const newScene = useCallback(() => {
    const id = addScene({
      name: `Szene ${scenes.length + 1}`,
      fadeTime: 0,
      values: {},
      effects: [],
    })
    setSelectedSceneId(id)
  }, [scenes.length, addScene])

  const copyScene = useCallback((scene: Scene) => {
    const copy: Omit<Scene, 'id'> = {
      name: `${scene.name} (Kopie)`,
      fadeTime: scene.fadeTime,
      values: JSON.parse(JSON.stringify(scene.values)),
      effects: JSON.parse(JSON.stringify(scene.effects ?? [])),
    }
    const id = addScene(copy)
    setSelectedSceneId(id)
  }, [addScene])

  // DMX management
  const getChannelValue = useCallback((universe: number, channel: number): number => {
    return (selectedScene?.values[universe] ?? [])[channel - 1] ?? 0
  }, [selectedScene])

  const setChannelValue = useCallback((universe: number, channel: number, value: number) => {
    if (!selectedScene) return
    const existing = selectedScene.values[universe] ?? new Array(512).fill(0)
    const updated = [...existing]
    updated[channel - 1] = value
    updateScene(selectedScene.id, { values: { ...selectedScene.values, [universe]: updated } })
    setChannel(universe, channel, value)
  }, [selectedScene, updateScene, setChannel])

  // Effect management
  const addEffect = useCallback((sceneId: string, effect: Omit<SceneEffect, 'id'>) => {
    const scene = scenes.find(s => s.id === sceneId)
    if (!scene) return
    const newEffect: SceneEffect = { ...effect, id: uuidv4() }
    const effects = [...(scene.effects ?? []), newEffect]
    updateScene(sceneId, { effects })
  }, [scenes, updateScene])

  const deleteEffect = useCallback((sceneId: string, effectId: string) => {
    const scene = scenes.find(s => s.id === sceneId)
    if (!scene) return
    const effects = (scene.effects ?? []).filter(e => e.id !== effectId)
    updateScene(sceneId, { effects })
  }, [scenes, updateScene])

  const updateEffect = useCallback((sceneId: string, effectId: string, changes: Partial<SceneEffect>) => {
    const scene = scenes.find(s => s.id === sceneId)
    if (!scene) return
    const effects = (scene.effects ?? []).map(e => e.id === effectId ? { ...e, ...changes } : e)
    updateScene(sceneId, { effects })
  }, [scenes, updateScene])

  // Effect RAF loop
  const storeRef = useRef({ scenes, patch, library, setChannel, selectedSceneId, bpm })
  storeRef.current = { scenes, patch, library, setChannel, selectedSceneId, bpm }

  useEffect(() => {
    if (!efxActive) return
    let rafId: number
    const t0 = performance.now()

    const tick = (now: number) => {
      const t = (now - t0) / 1000
      const { scenes: sc, patch: p, library: lib, setChannel: sch, selectedSceneId: sid, bpm: globalBpm } = storeRef.current
      const scene = sc.find(s => s.id === sid)
      if (!scene) { rafId = requestAnimationFrame(tick); return }

      const effects = scene.effects ?? []
      if (effects.length === 0) { rafId = requestAnimationFrame(tick); return }

      for (const efx of effects) {
        efx.fixtureIds.forEach((fxId, idx) => {
          const fx = p.find(f => f.id === fxId)
          if (!fx) return
          const mode = lib.find(d => d.id === fx.definitionId)?.modes[fx.modeIndex]
          if (!mode) return
          const ch = mode.channels.find(c => c.primaryType === efx.target)
          if (!ch) return
          const spread = efx.fixtureIds.length > 1 ? (360 / efx.fixtureIds.length) * idx : 0
          const val = calcWave(efx.wave, t, efx.speed > 0 ? efx.speed : globalBpm, efx.size, efx.base, efx.offset + spread)
          sch(fx.universe, fx.startAddress + ch.number - 1, val)
        })
      }
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [efxActive])

  // Render
  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold">🎛️ Szenen-Editor Pro</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">BPM:</span>
            <input
              type="number"
              min="20"
              max="300"
              value={bpm}
              onChange={e => setBpm(Math.max(20, Math.min(300, Number(e.target.value))))}
              className="w-16 px-2 py-1 bg-slate-800 text-white rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={newScene}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
          >
            + Neue Szene
          </button>
          <button
            onClick={() => setEfxActive(v => !v)}
            className={`px-3 py-1 text-sm rounded font-semibold ${
              efxActive ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-700 hover:bg-slate-600'
            } text-white`}
          >
            ⚡ Effekte {efxActive ? 'AN' : 'AUS'}
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 gap-0 overflow-hidden">
        {/* Left: Grids */}
        <div className="flex flex-col w-80 border-r border-slate-800 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden border-b border-slate-800">
            <SceneGridPanel
              scenes={scenes}
              banks={[]}
              selectedSceneId={selectedSceneId}
              selectedBankId={null}
              onSelect={setSelectedSceneId}
              onActivate={() => {}}
              onDelete={deleteScene}
              onRename={(id, name) => updateScene(id, { name })}
              onCopy={copyScene}
            />
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            <StageView2D
              fixtures={patch}
              library={library}
              selectedFixtureIds={selectedFixtureIds}
              onSelectFixtures={setSelectedFixtureIds}
            />
          </div>
        </div>

        {/* Middle: Faders */}
        <div className="flex-1 min-h-0 overflow-hidden border-r border-slate-800">
          <FeatureFaderPanel
            scene={selectedScene}
            fixtures={patch}
            library={library}
            selectedFixtureIds={selectedFixtureIds}
            onChannelChange={setChannelValue}
            getChannelValue={getChannelValue}
          />
        </div>

        {/* Right: Settings/Dials/FX */}
        <div className="flex flex-col w-96 border-l border-slate-800 overflow-hidden">
          <div className="flex border-b border-slate-800 bg-slate-900 shrink-0">
            {[
              { id: 'settings', label: '⚙️' },
              { id: 'faders', label: '🎚️' },
              { id: 'dials', label: '🎛️' },
              { id: 'fx', label: '✨' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setRightTab(t.id as typeof rightTab)}
                className={`flex-1 px-3 py-2 text-sm font-semibold ${
                  rightTab === t.id
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800'
                    : 'text-slate-400 border-b-2 border-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">
            {rightTab === 'settings' && (
              <SceneSettingsPanel scene={selectedScene} onUpdateScene={updateScene} onDeleteEffect={deleteEffect} />
            )}
            {rightTab === 'faders' && (
              <FeatureFaderPanel scene={selectedScene} fixtures={patch} library={library} selectedFixtureIds={selectedFixtureIds} onChannelChange={setChannelValue} getChannelValue={getChannelValue} />
            )}
            {rightTab === 'dials' && (
              <LiveControlDials scene={selectedScene} onEffectChange={updateEffect} />
            )}
            {rightTab === 'fx' && (
              <FXGeneratorPanel scene={selectedScene} selectedFixtureIds={selectedFixtureIds} onAddEffect={addEffect} onDeleteEffect={deleteEffect} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Step 2: Update App.tsx or ControlTab.tsx

```tsx
// Find the SceneEditor import
import { SceneEditor } from './components/pro/SceneEditor'

// Replace with:
import { SceneEditorPro as SceneEditor } from './components/pro/SceneEditorPro'

// Or add a toggle:
const [useProMode, setUseProMode] = useState(true)
return useProMode ? <SceneEditorPro /> : <SceneEditor />
```

### Step 3: Done!

The professional scene editor is now active.

---

## 📖 Usage

### Create Scene
1. Click "+ Neue Szene"
2. Scene appears in grid on left
3. Click grid button to select & edit

### Select Fixtures
1. Click fixture circles in Stage View (left bottom)
2. Shift+Click to multi-select
3. Drag rectangle to select multiple

### Adjust DMX
1. Select fixtures
2. Go to "🎚️ Faders" tab (right)
3. Adjust sliders or type values
4. See real-time changes in DMX

### Create Effects
1. Select fixtures & scene
2. Go to "✨ FX" tab
3. Name effect, choose wave type, adjust params
4. Click "✨ Effekt erstellen"
5. Click "⚡ Effekte AN" to play

### Real-Time Control
1. Create effect
2. Go to "🎛️ Dials" tab
3. Adjust Speed/Size/Phase/Offset
4. Changes apply in real-time

---

## 🎯 Component Breakdown

### Individual Components (Use Any)
```tsx
// Use any single component independently
import { SceneGridPanel } from './SceneGridPanel'
import { FeatureFaderPanel } from './FeatureFaderPanel'

// In your own layout
<SceneGridPanel {...props} />
<FeatureFaderPanel {...props} />
```

### Full Integration
```tsx
// Or use them all together (see Step 1 above)
import { SceneEditorPro } from './SceneEditorPro'
<SceneEditorPro />
```

---

## ✨ Features at a Glance

| Feature | Component | Status |
|---------|-----------|--------|
| Scene Grid | SceneGridPanel | ✅ Ready |
| 2D Fixture View | StageView2D | ✅ Ready |
| DMX Sliders | FeatureFaderPanel | ✅ Ready |
| Scene Settings | SceneSettingsPanel | ✅ Ready |
| Live Dials | LiveControlDials | ✅ Ready |
| FX Generator | FXGeneratorPanel | ✅ Ready |
| Wave Types | sceneEditorHelpers | ✅ Ready (5 types) |
| RAF Effect Loop | SceneEditorPro | ✅ Ready |

---

## 🔧 Troubleshooting

**Problem**: Components not rendering
**Solution**: Check that Zustand stores are initialized (useFixtureStore, useDmxStore)

**Problem**: DMX not updating
**Solution**: Verify useDmxStore.setChannel() is called, check universe/channel values

**Problem**: Effects not playing
**Solution**: Click "⚡ Effekte AN" button to enable RAF loop, verify effects exist in scene

**Problem**: Import errors
**Solution**: All components are in `src/renderer/src/components/pro/`, utils in `src/renderer/src/utils/`

---

## 📚 Documentation

- `SCENE_EDITOR_PROFESSIONAL_COMPONENTS.md` — Full component docs
- `DELIVERY_REPORT.md` — Specifications & checklist
- Individual `.tsx` files — JSDoc + inline comments

---

**Ready to use!** 🚀 Start with Step 1-3 above.
