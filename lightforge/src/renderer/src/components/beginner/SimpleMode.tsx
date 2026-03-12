import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFixtureStore } from '../../store/useFixtureStore'
import { useDmxStore } from '../../store/useDmxStore'
import type { PatchedFixture, Scene } from '../../../../shared/types'

// ─── Simple Mode: Fixture Faders + Scene Board ─────────────────────────────

export function SimpleMode(): React.JSX.Element {
  const { patch, library, scenes, addScene, deleteScene } = useFixtureStore()
  const { setChannel, getChannel } = useDmxStore()
  const { t } = useTranslation()
  const [activeScene, setActiveScene] = useState<string | null>(null)

  const activateScene = (scene: Scene): void => {
    setActiveScene(scene.id)
    for (const [uni, values] of Object.entries(scene.values)) {
      const universe = Number(uni)
      for (let i = 0; i < values.length; i++) {
        if (values[i] !== undefined && values[i] > 0) {
          setChannel(universe, i + 1, values[i])
        }
      }
    }
  }

  const recordScene = (): void => {
    const name = `Szene ${scenes.length + 1}`
    const values: Record<string, number[]> = {}
    for (const fx of patch) {
      const uni = String(fx.universe)
      const def = library.find((d) => d.id === fx.definitionId)
      if (!def) continue
      const mode = def.modes[fx.modeIndex]
      if (!mode) continue
      if (!values[uni]) values[uni] = new Array(512).fill(0)
      for (let i = 0; i < mode.channels.length; i++) {
        values[uni][fx.startAddress - 1 + i] = getChannel(fx.universe, fx.startAddress + i)
      }
    }
    addScene({ name, fadeTime: 500, values })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Fixture faders */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {patch.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: '#555a7a' }}>
            <span className="text-3xl">🎚️</span>
            <p className="text-sm">Noch keine Fixtures gepatch</p>
            <p className="text-xs">Gehe zu Fixtures → Fixture patchen</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {patch.map((fx) => {
              const def = library.find((d) => d.id === fx.definitionId)
              return <FixtureFader key={fx.id} fixture={fx} def={def} />
            })}
          </div>
        )}
      </div>

      {/* Scene board */}
      <div
        className="shrink-0 px-3 py-2"
        style={{ borderTop: '1px solid #1e2130', background: '#0d0f1a', minHeight: '120px' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#555a7a' }}>
            {t('scene.scenes')}
          </span>
          <button
            onClick={recordScene}
            className="px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1"
            style={{ background: '#6c63ff', color: '#fff' }}
          >
            ⏺ {t('scene.record')}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {scenes.length === 0 && (
            <p className="text-xs" style={{ color: '#555a7a' }}>{t('scene.noScenes')}</p>
          )}
          {scenes.map((scene) => (
            <div key={scene.id} className="relative group">
              <button
                onClick={() => activateScene(scene)}
                className="px-3 py-2 rounded text-xs font-medium transition-all min-w-[80px] text-center"
                style={{
                  background: activeScene === scene.id ? '#6c63ff' : '#1e2130',
                  color: activeScene === scene.id ? '#fff' : '#9097b8',
                  border: `1px solid ${activeScene === scene.id ? '#6c63ff' : '#2a2d3e'}`
                }}
              >
                {scene.name}
              </button>
              <button
                onClick={() => deleteScene(scene.id)}
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] items-center justify-center hidden group-hover:flex"
                style={{ background: '#ff4d6a', color: '#fff' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Single fixture fader card ──────────────────────────────────────────────

function FixtureFader({ fixture, def }: { fixture: PatchedFixture; def: import('../../../../shared/types').FixtureDefinition | undefined }): React.JSX.Element {
  const { setChannel, getChannel } = useDmxStore()

  if (!def) return <></>

  const mode = def.modes[fixture.modeIndex]
  if (!mode) return <></>

  // Group channels by type for simplified faders
  const dimmerChs = mode.channels.filter((c) => c.primaryType === 'Dimmer')
  const redChs = mode.channels.filter((c) => c.primaryType === 'Red')
  const greenChs = mode.channels.filter((c) => c.primaryType === 'Green')
  const blueChs = mode.channels.filter((c) => c.primaryType === 'Blue')
  const whiteChs = mode.channels.filter((c) => c.primaryType === 'White')
  const panChs = mode.channels.filter((c) => c.primaryType === 'Pan')
  const tiltChs = mode.channels.filter((c) => c.primaryType === 'Tilt')

  const hasColor = redChs.length > 0 || greenChs.length > 0 || blueChs.length > 0

  const faders: { label: string; color: string; channels: typeof dimmerChs }[] = []
  if (dimmerChs.length > 0) faders.push({ label: 'DIM', color: '#ffb300', channels: dimmerChs })
  if (redChs.length > 0) faders.push({ label: 'R', color: '#ff4d6a', channels: redChs })
  if (greenChs.length > 0) faders.push({ label: 'G', color: '#00d68f', channels: greenChs })
  if (blueChs.length > 0) faders.push({ label: 'B', color: '#6c9cff', channels: blueChs })
  if (whiteChs.length > 0) faders.push({ label: 'W', color: '#e8eaf6', channels: whiteChs })
  if (panChs.length > 0) faders.push({ label: 'PAN', color: '#00ccff', channels: panChs })
  if (tiltChs.length > 0) faders.push({ label: 'TILT', color: '#00ccff', channels: tiltChs })

  // If no recognized channels, show all as generic faders
  if (faders.length === 0) {
    mode.channels.forEach((ch) => {
      faders.push({ label: String(ch.number), color: '#9097b8', channels: [ch] })
    })
  }

  // Color preview
  const r = redChs.length > 0 ? getChannel(fixture.universe, fixture.startAddress + redChs[0].number - 1) : 0
  const g = greenChs.length > 0 ? getChannel(fixture.universe, fixture.startAddress + greenChs[0].number - 1) : 0
  const b = blueChs.length > 0 ? getChannel(fixture.universe, fixture.startAddress + blueChs[0].number - 1) : 0
  const dim = dimmerChs.length > 0 ? getChannel(fixture.universe, fixture.startAddress + dimmerChs[0].number - 1) : 255
  const dimFactor = dim / 255

  return (
    <div
      className="flex flex-col rounded-lg p-3 gap-2 shrink-0"
      style={{ background: '#1a1d27', border: '1px solid #2a2d3e', minWidth: '90px' }}
    >
      {/* Color preview (if RGB fixture) */}
      {hasColor && (
        <div
          className="w-full h-4 rounded"
          style={{
            background: `rgb(${Math.round(r * dimFactor)},${Math.round(g * dimFactor)},${Math.round(b * dimFactor)})`
          }}
        />
      )}

      {/* Faders */}
      <div className="flex gap-2 justify-center items-end">
        {faders.map((fader, fi) => {
          const ch = fader.channels[0]
          const absChannel = fixture.startAddress + ch.number - 1
          const value = getChannel(fixture.universe, absChannel)

          return (
            <div key={fi} className="flex flex-col items-center gap-1">
              <input
                type="range"
                className="vertical"
                min={0}
                max={255}
                value={value}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  // Set all channels of this group
                  fader.channels.forEach((c) => {
                    setChannel(fixture.universe, fixture.startAddress + c.number - 1, v)
                  })
                }}
                style={{ height: '80px', accentColor: fader.color }}
                title={`${fader.label}: ${value}`}
              />
              <span className="text-[9px] font-bold" style={{ color: fader.color }}>{fader.label}</span>
            </div>
          )
        })}
      </div>

      {/* Fixture name */}
      <div className="text-center">
        <div className="text-[10px] font-medium truncate" style={{ color: '#e8eaf6' }} title={fixture.name}>
          {fixture.name}
        </div>
        <div className="text-[9px]" style={{ color: '#555a7a' }}>
          U{fixture.universe}.{fixture.startAddress}
        </div>
      </div>
    </div>
  )
}
