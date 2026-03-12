import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFixtureStore } from '../../store/useFixtureStore'
import { useDmxStore } from '../../store/useDmxStore'
import type { Scene } from '../../../../shared/types'

export function SceneEditor(): React.JSX.Element {
  const { t } = useTranslation()
  const { scenes, patch, library, addScene, updateScene, deleteScene } = useFixtureStore()
  const { getChannel, setChannel } = useDmxStore()
  const [editingId, setEditingId] = useState<string | null>(null)

  const recordNew = (): void => {
    const values: Record<string, number[]> = {}
    for (const fx of patch) {
      const uni = String(fx.universe)
      const def = library.find((d) => d.id === fx.definitionId)
      const mode = def?.modes[fx.modeIndex]
      if (!mode) continue
      if (!values[uni]) values[uni] = new Array(512).fill(0)
      for (let i = 0; i < mode.channels.length; i++) {
        values[uni][fx.startAddress - 1 + i] = getChannel(fx.universe, fx.startAddress + i)
      }
    }
    const id = addScene({ name: `Szene ${scenes.length + 1}`, fadeTime: 500, values })
    setEditingId(id)
  }

  const activateScene = (scene: Scene): void => {
    for (const [uni, values] of Object.entries(scene.values)) {
      const universe = Number(uni)
      values.forEach((v, i) => {
        if (v > 0) setChannel(universe, i + 1, v)
      })
    }
  }

  return (
    <div className="flex h-full">
      {/* Scene list */}
      <div className="flex flex-col w-56 shrink-0" style={{ borderRight: '1px solid #1e2130' }}>
        <div className="px-3 py-2 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid #1e2130' }}>
          <span className="text-xs font-semibold" style={{ color: '#9097b8' }}>{t('scene.scenes')}</span>
          <button
            onClick={recordNew}
            className="px-2 py-0.5 rounded text-[11px]"
            style={{ background: '#6c63ff', color: '#fff' }}
          >
            + {t('scene.record')}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {scenes.length === 0 ? (
            <p className="px-3 py-4 text-xs text-center" style={{ color: '#555a7a' }}>{t('scene.noScenes')}</p>
          ) : (
            scenes.map((scene) => (
              <div
                key={scene.id}
                className="flex items-center justify-between px-3 py-1.5 cursor-pointer transition-colors"
                style={{
                  background: editingId === scene.id ? '#6c63ff22' : 'transparent',
                  borderLeft: `2px solid ${editingId === scene.id ? '#6c63ff' : 'transparent'}`,
                  borderBottom: '1px solid #1a1d27'
                }}
                onClick={() => setEditingId(scene.id)}
              >
                <span className="text-xs truncate" style={{ color: editingId === scene.id ? '#6c63ff' : '#9097b8' }}>
                  {scene.name}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); activateScene(scene) }}
                    title={t('scene.activate')}
                    className="w-5 h-5 flex items-center justify-center rounded text-[10px] transition-colors"
                    style={{ color: '#00d68f' }}
                  >▶</button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteScene(scene.id); if (editingId === scene.id) setEditingId(null) }}
                    title={t('scene.deleteScene')}
                    className="w-5 h-5 flex items-center justify-center rounded text-[10px] transition-colors"
                    style={{ color: '#555a7a' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#ff4d6a')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#555a7a')}
                  >✕</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Scene detail editor */}
      <div className="flex-1 overflow-y-auto">
        {editingId == null ? (
          <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: '#555a7a' }}>
            <span className="text-3xl">🎬</span>
            <p className="text-sm">Szene auswählen oder aufnehmen</p>
          </div>
        ) : (
          <SceneDetailEditor sceneId={editingId} />
        )}
      </div>
    </div>
  )
}

function SceneDetailEditor({ sceneId }: { sceneId: string }): React.JSX.Element {
  const { t } = useTranslation()
  const { scenes, updateScene, patch, library } = useFixtureStore()
  const { setChannel } = useDmxStore()
  const scene = scenes.find((s) => s.id === sceneId)
  if (!scene) return <></>

  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(scene.name)

  const getSceneValue = (universe: number, channel: number): number => {
    const uni = String(universe)
    return scene.values[uni]?.[channel - 1] ?? 0
  }

  const setSceneValue = (universe: number, channel: number, value: number): void => {
    const uni = String(universe)
    const existing = scene.values[uni] ?? new Array(512).fill(0)
    const updated = [...existing]
    updated[channel - 1] = value
    updateScene(sceneId, { values: { ...scene.values, [uni]: updated } })
    setChannel(universe, channel, value)
  }

  return (
    <div className="px-4 py-3">
      {/* Scene name & fade time */}
      <div className="flex items-center gap-3 mb-4">
        {editingName ? (
          <input
            autoFocus
            value={nameVal}
            onChange={(e) => setNameVal(e.target.value)}
            onBlur={() => { updateScene(sceneId, { name: nameVal }); setEditingName(false) }}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="px-2 py-1 rounded text-sm font-semibold"
            style={{ background: '#2a2d3e', color: '#e8eaf6', border: '1px solid #6c63ff' }}
          />
        ) : (
          <h3
            className="text-sm font-semibold cursor-pointer"
            style={{ color: '#e8eaf6' }}
            onClick={() => { setNameVal(scene.name); setEditingName(true) }}
          >
            {scene.name} ✏️
          </h3>
        )}
        <label className="flex items-center gap-1 text-xs ml-auto" style={{ color: '#9097b8' }}>
          {t('scene.fadeTime')}:
          <input
            type="number"
            min={0}
            max={60000}
            step={100}
            value={scene.fadeTime}
            onChange={(e) => updateScene(sceneId, { fadeTime: Number(e.target.value) })}
            className="w-16 px-2 py-0.5 rounded text-xs"
            style={{ background: '#2a2d3e', color: '#e8eaf6', border: '1px solid #3a3f5a' }}
          />
          <span style={{ color: '#555a7a' }}>{t('scene.ms')}</span>
        </label>
      </div>

      {/* Fixture channel values */}
      {patch.map((fx) => {
        const def = library.find((d) => d.id === fx.definitionId)
        const mode = def?.modes[fx.modeIndex]
        if (!mode) return null
        return (
          <div key={fx.id} className="mb-4 p-3 rounded-lg" style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold" style={{ color: '#e8eaf6' }}>{fx.name}</span>
              <span className="text-[10px]" style={{ color: '#555a7a' }}>
                U{fx.universe}.{fx.startAddress} • {def?.manufacturer} {def?.model}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {mode.channels.map((ch) => {
                const absAddr = fx.startAddress + ch.number - 1
                const val = getSceneValue(fx.universe, absAddr)
                return (
                  <div key={ch.number} className="flex flex-col items-center gap-1">
                    <input
                      type="range"
                      className="vertical"
                      min={0}
                      max={255}
                      value={val}
                      onChange={(e) => setSceneValue(fx.universe, absAddr, Number(e.target.value))}
                      style={{ height: '60px', accentColor: capTypeColor(ch.primaryType) }}
                    />
                    <span className="text-[9px] text-center" style={{ color: capTypeColor(ch.primaryType), maxWidth: '32px' }}>
                      {val}
                    </span>
                    <span className="text-[8px] text-center truncate" style={{ color: '#555a7a', maxWidth: '36px' }} title={ch.name}>
                      {ch.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function capTypeColor(type: string): string {
  const m: Record<string, string> = {
    Dimmer: '#ffb300', Red: '#ff4d6a', Green: '#00d68f', Blue: '#6c9cff',
    White: '#e8eaf6', Amber: '#ff8800', UV: '#cc44ff', Pan: '#00ccff',
    Tilt: '#00aaff', Gobo: '#aaaaff', Strobe: '#ff4444', Generic: '#9097b8'
  }
  return m[type] ?? '#9097b8'
}
