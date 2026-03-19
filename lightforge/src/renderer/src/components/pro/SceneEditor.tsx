// ════════════════════════════════════════════════════════════════════════════
//  SceneEditor.tsx — LightForge world-class scene editor
// ════════════════════════════════════════════════════════════════════════════
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useFixtureStore } from '../../store/useFixtureStore'
import { useDmxStore } from '../../store/useDmxStore'
import type {
  Scene, Bank, PatchedFixture, FixtureDefinition,
  FixtureCapabilityType, SceneEffect, EfxWave,
} from '../../../../shared/types'

// ── Pure helpers ─────────────────────────────────────────────────────────────
const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v))

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h / 60) % 6
  const f = h / 60 - Math.floor(h / 60)
  const p = v * (1 - s), q = v * (1 - f * s), t2 = v * (1 - (1 - f) * s)
  const rows: [number, number, number][] = [
    [v, q, p], [t2, v, p], [p, v, q], [p, t2, v], [q, p, v], [v, p, t2],
  ]
  return rows[i].map(x => Math.round(x * 255)) as [number, number, number]
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  const v = max, s = max === 0 ? 0 : d / max
  let h = 0
  if (d > 0) {
    if (max === r)      h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else                h = (r - g) / d + 4
    h = (h * 60 + 360) % 360
  }
  return [h, s, v]
}

function calcWave(wave: EfxWave, t: number, bpm: number, size: number, base: number, deg: number): number {
  const freq = bpm / 60
  const phase = 2 * Math.PI * freq * t + (deg * Math.PI / 180)
  let w = 0
  if (wave === 'sine')     w = Math.sin(phase)
  if (wave === 'triangle') {
    const normalized = ((phase / Math.PI) % 2 + 2) % 2
    w = normalized < 1 ? 2 * normalized - 1 : 2 * (2 - normalized) - 1
  }
  if (wave === 'square')   w = Math.sign(Math.sin(phase))
  if (wave === 'sawtooth') w = 2 * (((freq * t + deg / 360) % 1 + 1) % 1) - 1
  if (wave === 'random') {
    const beat = Math.floor(freq * t)
    w = ((Math.sin(beat * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1 * 2 - 1
  }
  return clamp(Math.round(base + (size / 2) * w), 0, 255)
}

function capColor(type: FixtureCapabilityType): string {
  const m: Record<string, string> = {
    Dimmer: '#ffb300', Red: '#ff4d6a', Green: '#00d68f', Blue: '#6c9cff',
    White: '#e8eaf6', Amber: '#ff8800', UV: '#cc44ff', Pan: '#00ccff',
    Tilt: '#00aaff', Gobo: '#9090ff', Strobe: '#ff6666', Speed: '#88ffcc',
    ColorWheel: '#ff88ff', Shutter: '#ffcc44',
  }
  return m[type] ?? '#9097b8'
}

type FixCat = 'rgb' | 'moving' | 'generic'

function detectCat(fx: PatchedFixture, lib: FixtureDefinition[]): FixCat {
  const mode = lib.find(d => d.id === fx.definitionId)?.modes[fx.modeIndex]
  if (!mode) return 'generic'
  const t = new Set(mode.channels.map(c => c.primaryType))
  if (t.has('Red') && t.has('Green') && t.has('Blue')) return 'rgb'
  if (t.has('Pan') || t.has('Tilt')) return 'moving'
  return 'generic'
}

const BANK_COLOURS = [
  '#e53935', '#d81b60', '#8e24aa', '#5e35b1', '#1e88e5',
  '#00acc1', '#00897b', '#43a047', '#fb8c00', '#f4511e',
  '#546e7a', '#6c63ff', '#ff6584', '#f9a825', '#00d68f',
]

const COLOR_PRESETS = [
  { label: 'Rot',   r: 255, g: 0,   b: 0   },
  { label: 'Grün',  r: 0,   g: 255, b: 0   },
  { label: 'Blau',  r: 0,   g: 0,   b: 255 },
  { label: 'Weiß',  r: 255, g: 255, b: 255 },
  { label: 'Amber', r: 255, g: 176, b: 0   },
  { label: 'Lila',  r: 148, g: 0,   b: 211 },
  { label: 'Cyan',  r: 0,   g: 255, b: 255 },
  { label: 'Aus',   r: 0,   g: 0,   b: 0   },
]

// ════════════════════════════════════════════════════════════════════════════
//  SceneEditor — main export
// ════════════════════════════════════════════════════════════════════════════
export function SceneEditor(): React.JSX.Element {
  const {
    scenes, banks, patch, library,
    addScene, updateScene, deleteScene,
    addBank, updateBank, deleteBank,
  } = useFixtureStore()
  const { setChannel } = useDmxStore()

  const [selectedBankId, setSelectedBankId]   = useState<string | null>(null)
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null)
  const [selectedGroup, setSelectedGroup]     = useState<string>('all')
  const [efxActive, setEfxActive]             = useState(false)
  const [showBankModal, setShowBankModal]     = useState(false)
  const [bpm, setBpm]                         = useState(120)
  const tapsRef                               = useRef<number[]>([])

  const selectedScene = scenes.find(s => s.id === selectedSceneId) ?? null
  const selectedBank  = banks.find(b => b.id === selectedBankId)  ?? null

  // ── Fixture groups ────────────────────────────────────────────────────────
  const groups = useMemo(() => {
    const types = new Set<string>()
    for (const fx of patch) {
      const def = library.find(d => d.id === fx.definitionId)
      if (def) types.add(def.type ?? 'Sonstiges')
    }
    return ['all', ...Array.from(types).sort()]
  }, [patch, library])

  const groupFixtures = useMemo(() => {
    if (selectedGroup === 'all') return patch
    return patch.filter(fx => {
      const def = library.find(d => d.id === fx.definitionId)
      return (def?.type ?? 'Sonstiges') === selectedGroup
    })
  }, [patch, library, selectedGroup])

  // ── Scene value helpers ───────────────────────────────────────────────────
  function getVal(scene: Scene, universe: number, ch: number): number {
    return (scene.values[universe] ?? [])[ch - 1] ?? 0
  }

  const setVal = useCallback((universe: number, ch: number, value: number): void => {
    if (!selectedScene) return
    const existing = selectedScene.values[universe] ?? new Array(512).fill(0)
    const updated  = [...existing]
    updated[ch - 1] = value
    updateScene(selectedScene.id, { values: { ...selectedScene.values, [universe]: updated } })
    setChannel(universe, ch, value)
  }, [selectedScene, updateScene, setChannel])

  // ── EFX RAF engine ────────────────────────────────────────────────────────
  const storeRef = useRef({ scenes, patch, library, setChannel, selectedSceneId, bpm })
  storeRef.current = { scenes, patch, library, setChannel, selectedSceneId, bpm }

  useEffect(() => {
    if (!efxActive) return
    let rafId: number
    const t0 = performance.now()

    function tick(now: number): void {
      const t = (now - t0) / 1000
      const { scenes: sc, patch: p, library: lib, setChannel: sch, selectedSceneId: sid, bpm: globalBpm } = storeRef.current
      const scene = sc.find(s => s.id === sid)
      if (!scene) { rafId = requestAnimationFrame(tick); return }
      const effects: SceneEffect[] = scene.effects ?? []
      if (effects.length === 0) { rafId = requestAnimationFrame(tick); return }

      for (const efx of effects) {
        efx.fixtureIds.forEach((fxId, idx) => {
          const fx   = p.find(f => f.id === fxId);   if (!fx) return
          const mode = lib.find(d => d.id === fx.definitionId)?.modes[fx.modeIndex]; if (!mode) return
          const ch   = mode.channels.find(c => c.primaryType === efx.target);         if (!ch) return
          const spread = efx.fixtureIds.length > 1 ? (360 / efx.fixtureIds.length) * idx : 0
          const val  = calcWave(efx.wave, t, efx.speed > 0 ? efx.speed : globalBpm, efx.size, efx.base, efx.offset + spread)
          sch(fx.universe, fx.startAddress + ch.number - 1, val)
        })
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [efxActive])

  // ── Preset actions ────────────────────────────────────────────────────────
  function applyBlackout(): void {
    for (const fx of groupFixtures) {
      const mode = library.find(d => d.id === fx.definitionId)?.modes[fx.modeIndex]
      if (!mode) continue
      mode.channels.forEach(ch => setVal(fx.universe, fx.startAddress + ch.number - 1, 0))
    }
  }

  function applyFull(): void {
    for (const fx of groupFixtures) {
      const mode = library.find(d => d.id === fx.definitionId)?.modes[fx.modeIndex]
      if (!mode) continue
      mode.channels.forEach(ch => {
        const t = ch.primaryType
        if (t === 'Dimmer' || t === 'Red' || t === 'Green' || t === 'Blue' || t === 'White')
          setVal(fx.universe, fx.startAddress + ch.number - 1, 255)
      })
    }
  }

  function applyRandom(): void {
    for (const fx of groupFixtures) {
      const cat  = detectCat(fx, library)
      const mode = library.find(d => d.id === fx.definitionId)?.modes[fx.modeIndex]
      if (!mode) continue
      if (cat === 'rgb') {
        const [r, g, b] = [Math.random(), Math.random(), Math.random()].map(x => Math.round(x * 255))
        mode.channels.forEach(ch => {
          const v = ch.primaryType === 'Red' ? r : ch.primaryType === 'Green' ? g : ch.primaryType === 'Blue' ? b : ch.primaryType === 'Dimmer' ? 255 : null
          if (v !== null) setVal(fx.universe, fx.startAddress + ch.number - 1, v)
        })
      }
    }
  }

  function applyFan(targetType: FixtureCapabilityType, lo: number, hi: number): void {
    groupFixtures.forEach((fx, idx) => {
      const mode = library.find(d => d.id === fx.definitionId)?.modes[fx.modeIndex]
      if (!mode) return
      const ch = mode.channels.find(c => c.primaryType === targetType)
      if (!ch) return
      const t = groupFixtures.length > 1 ? idx / (groupFixtures.length - 1) : 0.5
      setVal(fx.universe, fx.startAddress + ch.number - 1, Math.round(lo + t * (hi - lo)))
    })
  }

  function activateScene(scene: Scene): void {
    for (const [uniStr, vals] of Object.entries(scene.values)) {
      const uni = Number(uniStr)
      vals.forEach((v, i) => { if (v > 0) setChannel(uni, i + 1, v) })
    }
  }

  function newScene(): void {
    const id = addScene({
      name: `Szene ${scenes.length + 1}`, fadeTime: 0, values: {},
      bankId: selectedBankId ?? undefined, effects: [],
    })
    setSelectedSceneId(id)
  }

  function copyScene(scene: Scene): void {
    const copy: Omit<Scene, 'id'> = {
      name: `${scene.name} (Kopie)`, fadeTime: scene.fadeTime,
      bankId: scene.bankId, values: JSON.parse(JSON.stringify(scene.values)),
      effects: JSON.parse(JSON.stringify(scene.effects ?? [])),
    }
    const id = addScene(copy)
    setSelectedSceneId(id)
  }

  function handleTap(): void {
    const now = performance.now()
    const taps = tapsRef.current.filter(t => now - t < 3000)
    taps.push(now)
    tapsRef.current = taps
    if (taps.length >= 2) {
      const intervals = taps.slice(1).map((t, i) => t - taps[i])
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      setBpm(Math.min(300, Math.max(20, Math.round(60000 / avg))))
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top toolbar */}
      <TopBar
        banks={banks} scenes={scenes}
        selectedBankId={selectedBankId} selectedBank={selectedBank}
        onSelectBank={setSelectedBankId}
        onNewBank={() => setShowBankModal(true)}
        onNewScene={newScene}
        onUpdateBank={updateBank}
        onDeleteBank={id => { deleteBank(id); setSelectedBankId(null) }}
        bpm={bpm} onBpmChange={setBpm} onTap={handleTap}
        selectedScene={selectedScene}
        onCopyScene={copyScene}
        onUpdateScene={(id, c) => updateScene(id, c)}
        onDeleteScene={id => { deleteScene(id); setSelectedSceneId(null) }}
      />

      {/* Main 3-column area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: scene list */}
        <SceneListPanel
          banks={banks}
          scenes={selectedBankId ? scenes.filter(s => s.bankId === selectedBankId) : scenes}
          selectedBankId={selectedBankId}
          selectedSceneId={selectedSceneId}
          onSelect={setSelectedSceneId}
          onActivate={activateScene}
          onDelete={id => { deleteScene(id); if (selectedSceneId === id) setSelectedSceneId(null) }}
          onRename={(id, name) => updateScene(id, { name })}
          onCopy={s => copyScene(s)}
        />

        {/* Center: fixture cards */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Group tabs + preset buttons */}
          <div
            className="flex items-center gap-1 px-3 shrink-0 overflow-x-auto"
            style={{ height: 40, borderBottom: '1px solid #1e2130', background: '#090b10' }}
          >
            {groups.map(g => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className="px-2.5 py-1 rounded text-[10px] whitespace-nowrap shrink-0 transition-all"
                style={{
                  background: selectedGroup === g ? '#6c63ff' : '#1a1d27',
                  color: selectedGroup === g ? '#fff' : '#9097b8',
                  border: `1px solid ${selectedGroup === g ? '#6c63ff' : '#2a2d3e'}`,
                }}
              >
                {g === 'all' ? '🎛 Alle' : g}
              </button>
            ))}
            <div className="flex-1 min-w-2" />
            {selectedScene && (
              <>
                <PresetBtn label="⬛ Blackout" color="#ff4d6a" onClick={applyBlackout} />
                <PresetBtn label="☀ Full"     color="#ffb300" onClick={applyFull} />
                <PresetBtn label="🎲 Random"  color="#00d68f" onClick={applyRandom} />
                <FanMenu onFan={applyFan} />
                <button
                  onClick={() => setEfxActive(v => !v)}
                  className="px-2.5 py-1 rounded text-[10px] shrink-0 font-semibold transition-all"
                  style={{
                    background: efxActive ? '#6c63ff' : '#1a1d27',
                    color: efxActive ? '#fff' : '#9097b8',
                    border: `1px solid ${efxActive ? '#6c63ff' : '#2a2d3e'}`,
                    boxShadow: efxActive ? '0 0 12px #6c63ff55' : 'none',
                  }}
                >
                  ⚡ EFX {efxActive ? 'ON' : 'OFF'}
                </button>
              </>
            )}
          </div>

          {/* Fixture cards */}
          {selectedScene ? (
            <div className="flex-1 overflow-y-auto p-3">
              {groupFixtures.length === 0 ? (
                <Empty icon="🎛" text="Keine Fixtures gepatch." />
              ) : (
                <div className="flex flex-wrap gap-3">
                  {groupFixtures.map(fx => (
                    <FixtureCard
                      key={fx.id}
                      fixture={fx} library={library}
                      scene={selectedScene}
                      getVal={getVal} setVal={setVal}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Empty icon="🎬" text="Szene auswählen oder erstellen" />
          )}
        </div>

        {/* Right: EFX panel */}
        <EfxPanel
          scene={selectedScene} patch={patch} library={library}
          onUpdate={effects => selectedScene && updateScene(selectedScene.id, { effects })}
        />
      </div>

      {showBankModal && (
        <NewBankModal
          usedCount={banks.length} palette={BANK_COLOURS}
          onConfirm={(name, color) => { addBank(name, color); setShowBankModal(false) }}
          onCancel={() => setShowBankModal(false)}
        />
      )}
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function Empty({ icon, text }: { icon: string; text: string }): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full gap-2" style={{ color: '#3a3f5a' }}>
      <span className="text-4xl">{icon}</span>
      <p className="text-xs">{text}</p>
    </div>
  )
}

function PresetBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }): React.JSX.Element {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 rounded text-[10px] shrink-0 transition-all"
      style={{ background: `${color}18`, color, border: `1px solid ${color}44` }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}33` }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}18` }}
    >
      {label}
    </button>
  )
}

function FanMenu({ onFan }: { onFan: (t: FixtureCapabilityType, lo: number, hi: number) => void }): React.JSX.Element {
  const [open, setOpen]   = useState(false)
  const [tgt, setTgt]     = useState<FixtureCapabilityType>('Pan')
  const [lo, setLo]       = useState(0)
  const [hi, setHi]       = useState(255)

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="px-2 py-1 rounded text-[10px] transition-all"
        style={{ background: open ? '#00ccff22' : '#1a1d27', color: '#00ccff', border: '1px solid #00ccff44' }}
      >
        🌀 Fan
      </button>
      {open && (
        <div
          className="absolute top-8 right-0 z-40 rounded-xl p-3 flex flex-col gap-2"
          style={{ background: '#1a1d27', border: '1px solid #2a2d3e', minWidth: 200, boxShadow: '0 8px 32px #0008' }}
        >
          <p className="text-[10px] font-bold" style={{ color: '#e8eaf6' }}>Fan Spread</p>
          <label className="text-[9px]" style={{ color: '#555a7a' }}>Kanal-Typ</label>
          <select
            value={tgt}
            onChange={e => setTgt(e.target.value as FixtureCapabilityType)}
            className="rounded px-2 py-1 text-[10px]"
            style={{ background: '#0f1117', color: '#e8eaf6', border: '1px solid #2a2d3e' }}
          >
            {(['Pan','Tilt','Dimmer','Red','Green','Blue'] as FixtureCapabilityType[]).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div className="flex gap-2 items-center">
            <div className="flex flex-col gap-0.5 flex-1">
              <label className="text-[9px]" style={{ color: '#555a7a' }}>Min {lo}</label>
              <input type="range" min={0} max={255} value={lo} onChange={e => setLo(Number(e.target.value))} className="accent-violet-500" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1">
              <label className="text-[9px]" style={{ color: '#555a7a' }}>Max {hi}</label>
              <input type="range" min={0} max={255} value={hi} onChange={e => setHi(Number(e.target.value))} className="accent-violet-500" />
            </div>
          </div>
          <button
            onClick={() => { onFan(tgt, lo, hi); setOpen(false) }}
            className="px-3 py-1.5 rounded text-[10px] font-bold"
            style={{ background: '#6c63ff', color: '#fff' }}
          >
            Anwenden
          </button>
        </div>
      )}
    </div>
  )
}

// ── Top toolbar ───────────────────────────────────────────────────────────────
interface TopBarProps {
  banks: Bank[]; scenes: Scene[]
  selectedBankId: string | null; selectedBank: Bank | null
  onSelectBank: (id: string | null) => void
  onNewBank: () => void; onNewScene: () => void
  onUpdateBank: (id: string, c: Partial<Bank>) => void
  onDeleteBank: (id: string) => void
  bpm: number; onBpmChange: (v: number) => void; onTap: () => void
  selectedScene: Scene | null
  onCopyScene: (s: Scene) => void
  onUpdateScene: (id: string, c: Partial<Scene>) => void
  onDeleteScene: (id: string) => void
}

function TopBar({ banks, scenes, selectedBankId, selectedBank, onSelectBank, onNewBank, onNewScene, onUpdateBank, onDeleteBank, bpm, onBpmChange, onTap, selectedScene, onCopyScene, onUpdateScene, onDeleteScene }: TopBarProps): React.JSX.Element {
  return (
    <div className="flex flex-col shrink-0" style={{ borderBottom: '1px solid #1e2130', background: '#090b10' }}>
      {/* Row 1: banks + global controls */}
      <div className="flex items-center gap-2 px-3" style={{ height: 44 }}>
        <span className="text-[10px] uppercase tracking-wider shrink-0" style={{ color: '#555a7a' }}>Bank</span>
        <div className="relative shrink-0">
          <select
            value={selectedBankId ?? ''}
            onChange={e => onSelectBank(e.target.value || null)}
            className="appearance-none pl-2 pr-6 py-1.5 rounded text-xs cursor-pointer"
            style={{
              background: selectedBank ? `${selectedBank.color}22` : '#1a1d27',
              color: selectedBank ? selectedBank.color : '#e8eaf6',
              border: `1px solid ${selectedBank ? selectedBank.color + '66' : '#2a2d3e'}`,
              minWidth: 130,
            }}
          >
            <option value="">Alle Szenen</option>
            {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]" style={{ color: '#9097b8' }}>▾</span>
        </div>

        {selectedBank && (
          <>
            <input
              type="color" value={selectedBank.color}
              onChange={e => onUpdateBank(selectedBank.id, { color: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer border-0 shrink-0" style={{ padding: 0 }}
            />
            <input
              value={selectedBank.name}
              onChange={e => onUpdateBank(selectedBank.id, { name: e.target.value })}
              className="px-2 py-1 rounded text-xs w-24"
              style={{ background: '#1a1d27', color: '#e8eaf6', border: '1px solid #2a2d3e' }}
            />
            <button
              onClick={() => onDeleteBank(selectedBank.id)}
              className="px-2 py-1 rounded text-[10px]"
              style={{ background: '#ff4d6a22', color: '#ff4d6a', border: '1px solid #ff4d6a33' }}
            >🗑</button>
          </>
        )}

        <button onClick={onNewBank} className="px-2.5 py-1 rounded text-[10px] font-semibold" style={{ background: '#1a1d27', color: '#9097b8', border: '1px solid #2a2d3e' }}>
          + Bank
        </button>

        <div className="flex-1" />

        {/* BPM + Tap */}
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-[9px] uppercase tracking-wider" style={{ color: '#555a7a' }}>BPM</span>
          <input
            type="number" min={20} max={300} value={bpm}
            onChange={e => onBpmChange(clamp(Number(e.target.value), 20, 300))}
            className="w-12 text-center rounded px-1 py-0.5 text-[11px] tabular-nums font-bold"
            style={{ background: '#1a1d27', color: '#6c63ff', border: '1px solid #2a2d3e' }}
          />
          <button
            onClick={onTap}
            className="px-2 py-1 rounded text-[10px] font-bold"
            style={{ background: '#6c63ff22', color: '#6c63ff', border: '1px solid #6c63ff44' }}
          >TAP</button>
        </div>

        <span className="text-[10px] shrink-0" style={{ color: '#3a3f5a' }}>{scenes.length} Szenen</span>
        <button
          onClick={onNewScene}
          className="px-3 py-1.5 rounded text-[10px] font-bold shrink-0"
          style={{ background: selectedBank?.color ?? '#6c63ff', color: '#fff' }}
        >
          + Szene{selectedBank ? ` in ${selectedBank.name}` : ''}
        </button>
      </div>

      {/* Row 2: selected scene metadata */}
      {selectedScene && (
        <div
          className="flex items-center gap-2 px-3"
          style={{ height: 36, borderTop: '1px solid #1e2130', background: '#0d0f18' }}
        >
          <span className="text-[9px] uppercase tracking-wider shrink-0" style={{ color: '#555a7a' }}>Szene:</span>
          <input
            value={selectedScene.name}
            onChange={e => onUpdateScene(selectedScene.id, { name: e.target.value })}
            className="px-2 py-0.5 rounded text-xs font-semibold"
            style={{ background: '#1a1d27', color: '#e8eaf6', border: '1px solid #2a2d3e', maxWidth: 160 }}
          />
          <span className="text-[9px] uppercase tracking-wider shrink-0" style={{ color: '#555a7a' }}>Fade</span>
          <div className="flex items-center gap-1">
            <input
              type="number" min={0} max={60} step={0.1} value={selectedScene.fadeTime}
              onChange={e => onUpdateScene(selectedScene.id, { fadeTime: Number(e.target.value) })}
              className="w-12 text-center rounded px-1 py-0.5 text-[10px] tabular-nums"
              style={{ background: '#1a1d27', color: '#9097b8', border: '1px solid #2a2d3e' }}
            />
            <span className="text-[9px]" style={{ color: '#555a7a' }}>s</span>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => onCopyScene(selectedScene)}
            className="px-2 py-0.5 rounded text-[9px]"
            style={{ background: '#00d68f22', color: '#00d68f', border: '1px solid #00d68f33' }}
          >⎘ Kopieren</button>
          <button
            onClick={() => onDeleteScene(selectedScene.id)}
            className="px-2 py-0.5 rounded text-[9px]"
            style={{ background: '#ff4d6a22', color: '#ff4d6a', border: '1px solid #ff4d6a33' }}
          >🗑 Löschen</button>
        </div>
      )}
    </div>
  )
}

// ── Scene list panel (left) ───────────────────────────────────────────────────
interface SceneListPanelProps {
  banks: Bank[]; scenes: Scene[]
  selectedBankId: string | null; selectedSceneId: string | null
  onSelect: (id: string) => void
  onActivate: (s: Scene) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
  onCopy: (s: Scene) => void
}

function SceneListPanel({ banks, scenes, selectedBankId, selectedSceneId, onSelect, onActivate, onDelete, onRename, onCopy }: SceneListPanelProps): React.JSX.Element {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName]   = useState('')

  const startEdit = (scene: Scene, e: React.MouseEvent): void => {
    e.stopPropagation()
    setEditingId(scene.id)
    setEditName(scene.name)
  }

  const commitEdit = (): void => {
    if (editingId && editName.trim()) onRename(editingId, editName.trim())
    setEditingId(null)
  }

  const bankGroups = useMemo(() => {
    const relevant = selectedBankId ? banks.filter(b => b.id === selectedBankId) : banks
    const groups = relevant.map(bank => ({
      bank,
      scenes: scenes.filter(s => s.bankId === bank.id),
    }))
    if (!selectedBankId) {
      const unbanked = scenes.filter(s => !s.bankId)
      if (unbanked.length > 0)
        groups.push({ bank: { id: '__none__', name: 'Ohne Bank', color: '#555a7a' }, scenes: unbanked })
    }
    return groups
  }, [banks, scenes, selectedBankId])

  return (
    <div className="flex flex-col shrink-0 overflow-hidden" style={{ width: 196, borderRight: '1px solid #1e2130', background: '#090b10' }}>
      <div className="px-3 py-2 shrink-0" style={{ borderBottom: '1px solid #1e2130' }}>
        <p className="text-[9px] uppercase tracking-widest" style={{ color: '#3a3f5a' }}>Szenen</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {bankGroups.length === 0 && (
          <p className="text-[10px] text-center mt-8 px-3 leading-relaxed" style={{ color: '#3a3f5a' }}>
            Keine Szenen.<br />Erstelle zuerst eine Bank.
          </p>
        )}
        {bankGroups.map(({ bank, scenes: bScenes }) => (
          <div key={bank.id}>
            <div
              className="flex items-center gap-1.5 px-2 py-1.5 sticky top-0"
              style={{ background: `${bank.color}18`, borderBottom: `1px solid ${bank.color}33` }}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: bank.color }} />
              <span className="text-[9px] font-bold uppercase tracking-wider flex-1 truncate" style={{ color: bank.color }}>
                {bank.name}
              </span>
              <span className="text-[8px] shrink-0" style={{ color: `${bank.color}88` }}>{bScenes.length}</span>
            </div>
            {bScenes.map(scene => (
              <div
                key={scene.id}
                className="flex items-center gap-1 px-2 py-1.5 cursor-pointer group transition-all"
                style={{
                  background: selectedSceneId === scene.id ? `${bank.color}1e` : 'transparent',
                  borderLeft: `2px solid ${selectedSceneId === scene.id ? bank.color : 'transparent'}`,
                }}
                onClick={() => { if (editingId !== scene.id) onSelect(scene.id) }}
                onDoubleClick={() => onActivate(scene)}
              >
                {editingId === scene.id ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null) }}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 px-1 py-0 rounded text-[10px] outline-none"
                    style={{ background: '#1a1d27', color: '#e8eaf6', border: '1px solid #6c63ff' }}
                  />
                ) : (
                  <span className="flex-1 text-[10px] truncate" style={{ color: selectedSceneId === scene.id ? '#e8eaf6' : '#9097b8' }}>
                    {scene.name}
                  </span>
                )}
                <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 shrink-0">
                  <button onClick={e => { e.stopPropagation(); onActivate(scene) }} title="Aktivieren" className="text-[9px] px-1 rounded" style={{ color: '#00d68f' }}>▶</button>
                  <button onClick={e => startEdit(scene, e)} title="Umbenennen" className="text-[9px] px-1 rounded" style={{ color: '#9097b8' }}>✏</button>
                  <button onClick={e => { e.stopPropagation(); onCopy(scene) }} title="Kopieren" className="text-[9px] px-1 rounded" style={{ color: '#6c63ff' }}>⎘</button>
                  <button onClick={e => { e.stopPropagation(); onDelete(scene.id) }} title="Löschen" className="text-[9px] px-1 rounded" style={{ color: '#ff4d6a' }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Dimmer Slider ─────────────────────────────────────────────────────────────
function DimmerSlider({ value, onChange }: { value: number; onChange: (v: number) => void }): React.JSX.Element {
  const pct = Math.round((value / 255) * 100)
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] w-6 font-bold shrink-0" style={{ color: '#ffb300' }}>DIM</span>
      <div className="relative flex-1" style={{ height: 14 }}>
        <div className="absolute inset-0 rounded-full overflow-hidden" style={{ background: '#1a1d27' }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, background: 'linear-gradient(to right, #ff6600, #ffb300, #fff9)' }}
          />
        </div>
        <input
          type="range" min={0} max={255} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ height: 14 }}
        />
      </div>
      <span className="text-[9px] w-8 text-right tabular-nums font-mono shrink-0" style={{ color: '#ffb300' }}>
        {pct}%
      </span>
    </div>
  )
}

// ── Gobo Selector ─────────────────────────────────────────────────────────────
function GoboSelector({ value, capabilities, onChange }: {
  value: number
  capabilities: Array<{ min: number; max: number; name: string }>
  onChange: (v: number) => void
}): React.JSX.Element {
  const items = capabilities.length > 1
    ? capabilities
    : Array.from({ length: 8 }, (_, i) => ({ min: i * 32, max: i * 32 + 31, name: i === 0 ? 'Open' : `Gobo ${i}` }))

  return (
    <div className="flex flex-wrap gap-1">
      {items.map(item => {
        const mid    = Math.round((item.min + item.max) / 2)
        const active = Math.abs(mid - value) <= 16 || (value >= item.min && value <= item.max)
        return (
          <button
            key={item.min}
            onClick={() => onChange(mid)}
            title={item.name}
            className="px-1.5 py-0.5 rounded text-[8px] transition-all"
            style={{
              background: active ? '#9090ff' : '#1a1d27',
              color: active ? '#fff' : '#9097b8',
              border: `1px solid ${active ? '#9090ff' : '#2a2d3e'}`,
              maxWidth: 52,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.name.length > 6 ? item.name.slice(0, 5) + '…' : item.name}
          </button>
        )
      })}
    </div>
  )
}

// ── Fixture card (smart) ──────────────────────────────────────────────────────
interface FixtureCardProps {
  fixture: PatchedFixture; library: FixtureDefinition[]
  scene: Scene
  getVal: (scene: Scene, uni: number, ch: number) => number
  setVal: (uni: number, ch: number, val: number) => void
}

function FixtureCard({ fixture, library, scene, getVal, setVal }: FixtureCardProps): React.JSX.Element {
  const def  = library.find(d => d.id === fixture.definitionId)
  const mode = def?.modes[fixture.modeIndex]
  if (!mode) return <></>

  const cat  = detectCat(fixture, library)

  const findAddr = (type: FixtureCapabilityType): number | null => {
    const ch = mode.channels.find(c => c.primaryType === type)
    return ch ? fixture.startAddress + ch.number - 1 : null
  }

  const rAddr   = findAddr('Red')
  const gAddr   = findAddr('Green')
  const bAddr   = findAddr('Blue')
  const dimAddr = findAddr('Dimmer')
  const panAddr = findAddr('Pan')
  const tltAddr = findAddr('Tilt')

  const isRgbCh  = (type: FixtureCapabilityType) => cat === 'rgb'   && (type === 'Red' || type === 'Green' || type === 'Blue')
  const isMvCh   = (type: FixtureCapabilityType) => cat === 'moving' && (type === 'Pan' || type === 'Tilt')
  const isDimCh  = (type: FixtureCapabilityType) => type === 'Dimmer'

  const extraChannels = mode.channels.filter(ch => !isRgbCh(ch.primaryType) && !isMvCh(ch.primaryType) && !isDimCh(ch.primaryType))

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden shrink-0"
      style={{ background: '#131620', border: '1px solid #2a2d3e', minWidth: 190 }}
    >
      {/* Card header */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid #1e2130', background: '#1a1d27' }}>
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat === 'rgb' ? '#ff4d6a' : cat === 'moving' ? '#00ccff' : '#9097b8' }} />
        <span className="text-[11px] font-bold truncate flex-1" style={{ color: '#e8eaf6' }}>{fixture.name}</span>
        <span className="text-[9px] shrink-0" style={{ color: '#555a7a' }}>U{fixture.universe}.{fixture.startAddress}</span>
      </div>

      <div className="flex flex-col gap-2 p-3">
        {/* Dimmer */}
        {dimAddr !== null && (
          <DimmerSlider
            value={getVal(scene, fixture.universe, dimAddr)}
            onChange={v => setVal(fixture.universe, dimAddr!, v)}
          />
        )}

        {/* RGB Color Picker */}
        {cat === 'rgb' && rAddr !== null && gAddr !== null && bAddr !== null && (
          <>
            <ColorPicker
              r={getVal(scene, fixture.universe, rAddr)}
              g={getVal(scene, fixture.universe, gAddr)}
              b={getVal(scene, fixture.universe, bAddr)}
              onChange={(r, g, b) => {
                setVal(fixture.universe, rAddr!, r)
                setVal(fixture.universe, gAddr!, g)
                setVal(fixture.universe, bAddr!, b)
              }}
            />
            {/* Color presets */}
            <div className="flex flex-wrap gap-1">
              {COLOR_PRESETS.map(p => (
                <button
                  key={p.label}
                  title={p.label}
                  onClick={() => {
                    setVal(fixture.universe, rAddr!, p.r)
                    setVal(fixture.universe, gAddr!, p.g)
                    setVal(fixture.universe, bAddr!, p.b)
                  }}
                  className="w-5 h-5 rounded transition-transform hover:scale-110"
                  style={{
                    background: `rgb(${p.r},${p.g},${p.b})`,
                    border: '1px solid #2a2d3e',
                    outline: (
                      getVal(scene, fixture.universe, rAddr) === p.r &&
                      getVal(scene, fixture.universe, gAddr) === p.g &&
                      getVal(scene, fixture.universe, bAddr) === p.b
                    ) ? '2px solid #fff' : 'none',
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* XY Pad for Pan/Tilt */}
        {cat === 'moving' && panAddr !== null && tltAddr !== null && (
          <XYPad
            panVal={getVal(scene, fixture.universe, panAddr)}
            tiltVal={getVal(scene, fixture.universe, tltAddr)}
            onChangePan={v => setVal(fixture.universe, panAddr!, v)}
            onChangeTilt={v => setVal(fixture.universe, tltAddr!, v)}
          />
        )}

        {/* Extra channels (generic sliders + gobo) */}
        {extraChannels.map(ch => {
          const absAddr = fixture.startAddress + ch.number - 1
          const val     = getVal(scene, fixture.universe, absAddr)
          const color   = capColor(ch.primaryType)
          if (ch.primaryType === 'Gobo') {
            return (
              <div key={ch.number} className="flex flex-col gap-1">
                <span className="text-[9px]" style={{ color }}>Gobo</span>
                <GoboSelector
                  value={val}
                  capabilities={(ch.capabilities ?? []).map(c => ({ min: c.min, max: c.max, name: c.name }))}
                  onChange={v => setVal(fixture.universe, absAddr, v)}
                />
              </div>
            )
          }
          return (
            <div key={ch.number} className="flex items-center gap-2">
              <span
                className="text-[9px] shrink-0 truncate"
                style={{ color, width: 56 }}
                title={ch.name}
              >
                {ch.name.length > 7 ? ch.name.slice(0, 6) + '…' : ch.name}
              </span>
              <input
                type="range" min={0} max={255} value={val}
                onChange={e => setVal(fixture.universe, absAddr, Number(e.target.value))}
                className="flex-1 cursor-pointer" style={{ accentColor: color }}
              />
              <span className="text-[9px] w-7 text-right tabular-nums shrink-0" style={{ color }}>
                {val}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Color Picker ──────────────────────────────────────────────────────────────
interface ColorPickerProps { r: number; g: number; b: number; onChange: (r: number, g: number, b: number) => void }

function ColorPicker({ r, g, b, onChange }: ColorPickerProps): React.JSX.Element {
  const [hsv, setHsv]  = useState<[number, number, number]>(() => rgbToHsv(r, g, b))
  const dragging       = useRef(false)
  const svRef          = useRef<HTMLDivElement>(null)
  const hueRef         = useRef<HTMLDivElement>(null)
  const hsvRef         = useRef(hsv)
  hsvRef.current       = hsv

  // Sync from external changes (e.g. scene switched), but not during drag
  useEffect(() => {
    if (dragging.current) return
    const [nh, ns, nv] = rgbToHsv(r, g, b)
    setHsv(prev => ns < 0.02 ? [prev[0], ns, nv] : [nh, ns, nv])
  }, [r, g, b])

  const applyHSV = (h: number, s: number, v: number): void => {
    const next: [number, number, number] = [h, s, v]
    setHsv(next)
    hsvRef.current = next
    const [nr, ng, nb] = hsvToRgb(h, s, v)
    onChange(nr, ng, nb)
  }

  const onSVDown = (e: React.MouseEvent): void => {
    e.preventDefault()
    dragging.current = true
    const update = (ev: MouseEvent): void => {
      const rect = svRef.current!.getBoundingClientRect()
      applyHSV(hsvRef.current[0], clamp((ev.clientX - rect.left) / rect.width, 0, 1), clamp(1 - (ev.clientY - rect.top) / rect.height, 0, 1))
    }
    update(e.nativeEvent)
    const up = (): void => { dragging.current = false; window.removeEventListener('mousemove', update); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', update)
    window.addEventListener('mouseup', up)
  }

  const onHueDown = (e: React.MouseEvent): void => {
    e.preventDefault()
    dragging.current = true
    const update = (ev: MouseEvent): void => {
      const rect = hueRef.current!.getBoundingClientRect()
      applyHSV(clamp(((ev.clientX - rect.left) / rect.width) * 360, 0, 360), hsvRef.current[1], hsvRef.current[2])
    }
    update(e.nativeEvent)
    const up = (): void => { dragging.current = false; window.removeEventListener('mousemove', update); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', update)
    window.addEventListener('mouseup', up)
  }

  const [H, S, V] = hsv
  const displayRgb = hsvToRgb(H, S, V)
  const hex        = `#${displayRgb.map(x => x.toString(16).padStart(2, '0')).join('')}`

  return (
    <div style={{ width: 172 }} className="flex flex-col gap-2">
      {/* SV square */}
      <div
        ref={svRef}
        className="relative rounded cursor-crosshair"
        style={{ height: 100, background: `hsl(${H},100%,50%)`, userSelect: 'none' }}
        onMouseDown={onSVDown}
      >
        <div className="absolute inset-0 rounded" style={{ background: 'linear-gradient(to right,#fff,transparent)' }} />
        <div className="absolute inset-0 rounded" style={{ background: 'linear-gradient(to bottom,transparent,#000)' }} />
        <div
          className="absolute w-3 h-3 rounded-full border-2 border-white pointer-events-none"
          style={{ left: `${S * 100}%`, top: `${(1 - V) * 100}%`, transform: 'translate(-50%,-50%)', background: hex, boxShadow: '0 0 4px rgba(0,0,0,0.9)' }}
        />
      </div>

      {/* Hue strip */}
      <div
        ref={hueRef}
        className="rounded cursor-pointer relative"
        style={{ height: 13, background: 'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)', userSelect: 'none' }}
        onMouseDown={onHueDown}
      >
        <div
          className="absolute top-0 bottom-0 w-2 rounded border border-white pointer-events-none"
          style={{ left: `${(H / 360) * 100}%`, transform: 'translateX(-50%)', background: `hsl(${H},100%,50%)` }}
        />
      </div>

      {/* Hex + preview */}
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 rounded shrink-0" style={{ background: hex, border: '1px solid #2a2d3e' }} />
        <input
          value={hex}
          onChange={e => {
            if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
              const rv = parseInt(e.target.value.slice(1, 3), 16)
              const gv = parseInt(e.target.value.slice(3, 5), 16)
              const bv = parseInt(e.target.value.slice(5, 7), 16)
              onChange(rv, gv, bv)
            }
          }}
          className="flex-1 px-2 py-0.5 rounded text-[10px] font-mono"
          style={{ background: '#0f1117', color: '#e8eaf6', border: '1px solid #2a2d3e' }}
        />
      </div>

      {/* R / G / B inputs */}
      <div className="flex gap-1">
        {(['R', 'G', 'B'] as const).map((label, i) => {
          const val   = displayRgb[i]
          const color = ['#ff4d6a', '#00d68f', '#6c9cff'][i]
          return (
            <div key={label} className="flex flex-col items-center gap-0.5 flex-1">
              <input
                type="number" min={0} max={255} value={val}
                onChange={e => {
                  const nv = clamp(Number(e.target.value), 0, 255)
                  const nr: [number, number, number] = [...displayRgb] as [number, number, number]
                  nr[i] = nv
                  onChange(nr[0], nr[1], nr[2])
                }}
                className="w-full text-center rounded text-[9px] px-1 py-0.5 tabular-nums"
                style={{ background: '#0f1117', color, border: `1px solid ${color}44` }}
              />
              <span className="text-[8px]" style={{ color }}>{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── XY Pad ────────────────────────────────────────────────────────────────────
interface XYPadProps { panVal: number; tiltVal: number; onChangePan: (v: number) => void; onChangeTilt: (v: number) => void }

function XYPad({ panVal, tiltVal, onChangePan, onChangeTilt }: XYPadProps): React.JSX.Element {
  const padRef = useRef<HTMLDivElement>(null)

  const onDown = (e: React.MouseEvent): void => {
    e.preventDefault()
    const update = (ev: MouseEvent): void => {
      const rect = padRef.current!.getBoundingClientRect()
      onChangePan(clamp(Math.round(((ev.clientX - rect.left) / rect.width) * 255), 0, 255))
      onChangeTilt(clamp(Math.round(((ev.clientY - rect.top) / rect.height) * 255), 0, 255))
    }
    update(e.nativeEvent)
    const up = (): void => { window.removeEventListener('mousemove', update); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', update)
    window.addEventListener('mouseup', up)
  }

  return (
    <div className="flex flex-col gap-1.5 items-start">
      <div
        ref={padRef}
        className="relative rounded cursor-crosshair"
        style={{ width: 148, height: 120, background: '#0d0f18', border: '1px solid #2a2d3e', userSelect: 'none' }}
        onMouseDown={onDown}
      >
        {/* Grid */}
        <div
          className="absolute inset-0 rounded pointer-events-none"
          style={{ background: 'linear-gradient(#1e2130 1px,transparent 1px),linear-gradient(90deg,#1e2130 1px,transparent 1px)', backgroundSize: '24px 24px' }}
        />
        {/* Crosshair centre */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px pointer-events-none" style={{ background: '#2a2d3e' }} />
        <div className="absolute top-1/2 left-0 right-0 h-px pointer-events-none" style={{ background: '#2a2d3e' }} />
        {/* Dot */}
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white pointer-events-none"
          style={{
            left: `${(panVal / 255) * 100}%`, top: `${(tiltVal / 255) * 100}%`,
            transform: 'translate(-50%,-50%)',
            background: '#6c63ff', boxShadow: '0 0 10px #6c63ffaa',
          }}
        />
      </div>
      {/* Labels */}
      <div className="flex gap-4 text-[9px]" style={{ color: '#555a7a' }}>
        <span>Pan <span style={{ color: '#00ccff' }}>{panVal}</span></span>
        <span>Tilt <span style={{ color: '#00aaff' }}>{tiltVal}</span></span>
      </div>
    </div>
  )
}

// ── EFX Panel (right) ─────────────────────────────────────────────────────────
const EFX_WAVES: EfxWave[] = ['sine','triangle','square','sawtooth','random']
const EFX_TARGETS: FixtureCapabilityType[] = ['Dimmer','Red','Green','Blue','Pan','Tilt','Strobe','Speed','Shutter']

// ── Waveform SVG Preview ──────────────────────────────────────────────────────
function WaveformSVG({ wave, width = 48, height = 20, active }: { wave: EfxWave; width?: number; height?: number; active?: boolean }): React.JSX.Element {
  const points = useMemo(() => {
    const steps = 60
    const pts: string[] = []
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width
      const phase = (i / steps) * 2 * Math.PI
      let y = 0
      if (wave === 'sine')     y = Math.sin(phase)
      if (wave === 'triangle') y = (2 / Math.PI) * Math.asin(Math.sin(phase))
      if (wave === 'square')   y = Math.sign(Math.sin(phase))
      if (wave === 'sawtooth') y = 2 * ((i / steps + 0.5) % 1) - 1
      if (wave === 'random') {
        const beat = Math.floor((i / steps) * 4)
        y = ((Math.sin(beat * 127.1 + 311.7) * 43758.5453) % 1 + 1) % 1 * 2 - 1
      }
      const cy = height / 2 - (y * (height / 2 - 2))
      pts.push(`${x.toFixed(1)},${cy.toFixed(1)}`)
    }
    return pts.join(' ')
  }, [wave, width, height])

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polyline
        points={points}
        fill="none"
        stroke={active ? '#6c63ff' : '#555a7a'}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface EfxPanelProps {
  scene: Scene | null; patch: PatchedFixture[]; library: FixtureDefinition[]
  onUpdate: (effects: SceneEffect[]) => void
}

function EfxPanel({ scene, patch, onUpdate }: EfxPanelProps): React.JSX.Element {
  const effects: SceneEffect[] = scene?.effects ?? []

  function addEffect(): void {
    const efx: SceneEffect = {
      id: Math.random().toString(36).slice(2),
      label: `EFX ${effects.length + 1}`,
      target: 'Dimmer', wave: 'sine',
      speed: 60, size: 128, base: 128, offset: 0,
      fixtureIds: patch.map(f => f.id),
    }
    onUpdate([...effects, efx])
  }

  return (
    <div className="flex flex-col shrink-0 overflow-hidden" style={{ width: 268, borderLeft: '1px solid #1e2130', background: '#090b10' }}>
      <div className="flex items-center justify-between px-3 py-2 shrink-0" style={{ borderBottom: '1px solid #1e2130' }}>
        <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: '#6c63ff' }}>⚡ EFX Engine</span>
        {scene && (
          <button onClick={addEffect} className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ background: '#6c63ff', color: '#fff' }}>+ Add</button>
        )}
      </div>

      {!scene ? (
        <Empty icon="⚡" text="Szene wählen um EFX hinzuzufügen" />
      ) : effects.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3" style={{ color: '#3a3f5a' }}>
          <span className="text-3xl">🌊</span>
          <p className="text-[10px] text-center px-4 leading-relaxed">
            Automatische Welleneffekte für Dimmer, Farben, Pan/Tilt und mehr.
          </p>
          <button onClick={addEffect} className="px-4 py-2 rounded text-[10px] font-bold" style={{ background: '#6c63ff22', color: '#6c63ff', border: '1px solid #6c63ff44' }}>
            + Ersten EFX hinzufügen
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
          {effects.map(efx => (
            <EfxCard
              key={efx.id} efx={efx} patch={patch}
              onChange={changes => onUpdate(effects.map(e => e.id === efx.id ? { ...e, ...changes } : e))}
              onDelete={() => onUpdate(effects.filter(e => e.id !== efx.id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── EFX Card ──────────────────────────────────────────────────────────────────
function EfxCard({ efx, patch, onChange, onDelete }: {
  efx: SceneEffect; patch: PatchedFixture[]
  onChange: (c: Partial<SceneEffect>) => void; onDelete: () => void
}): React.JSX.Element {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#131620', border: '1px solid #2a2d3e' }}>
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer"
        style={{ background: '#1a1d27', borderBottom: expanded ? '1px solid #2a2d3e' : 'none' }}
        onClick={() => setExpanded(v => !v)}
      >
        <span className="text-[9px]" style={{ color: '#555a7a' }}>{expanded ? '▼' : '▶'}</span>
        <input
          value={efx.label}
          onChange={e => { e.stopPropagation(); onChange({ label: e.target.value }) }}
          onClick={e => e.stopPropagation()}
          className="flex-1 bg-transparent text-[11px] font-semibold outline-none"
          style={{ color: '#6c63ff' }}
        />
        <span className="text-[10px] px-1.5 rounded shrink-0 flex items-center gap-1" style={{ background: '#6c63ff22', color: '#6c63ff' }}>
          <WaveformSVG wave={efx.wave} width={24} height={12} active />
        </span>
        <button onClick={e => { e.stopPropagation(); onDelete() }} className="text-[10px] shrink-0" style={{ color: '#555a7a' }}>✕</button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-2.5 p-2.5">
          {/* Wave selector with waveform previews */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-wider" style={{ color: '#555a7a' }}>Wave</label>
            <div className="flex gap-1 flex-wrap">
              {EFX_WAVES.map(w => (
                <button
                  key={w}
                  onClick={() => onChange({ wave: w })}
                  className="flex flex-col items-center gap-0.5 px-1.5 py-1 rounded transition-all"
                  style={{
                    background: efx.wave === w ? '#6c63ff22' : '#1e2130',
                    border: `1px solid ${efx.wave === w ? '#6c63ff' : '#2a2d3e'}`,
                  }}
                >
                  <WaveformSVG wave={w} width={44} height={16} active={efx.wave === w} />
                  <span className="text-[8px]" style={{ color: efx.wave === w ? '#6c63ff' : '#555a7a' }}>{w}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target channel type */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-wider" style={{ color: '#555a7a' }}>Ziel-Kanal</label>
            <select
              value={efx.target}
              onChange={e => onChange({ target: e.target.value as FixtureCapabilityType })}
              className="rounded px-2 py-1 text-[10px]"
              style={{ background: '#1e2130', color: '#e8eaf6', border: '1px solid #2a2d3e' }}
            >
              {EFX_TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Sliders: Speed, Size, Base, Offset */}
          {(
            [
              { key: 'speed',  label: 'Speed',  unit: 'BPM', min: 1,  max: 300 },
              { key: 'size',   label: 'Größe',  unit: '',    min: 0,  max: 255 },
              { key: 'base',   label: 'Base',   unit: '',    min: 0,  max: 255 },
              { key: 'offset', label: 'Phase',  unit: '°',   min: 0,  max: 360 },
            ] as { key: keyof SceneEffect; label: string; unit: string; min: number; max: number }[]
          ).map(({ key, label, unit, min, max }) => (
            <div key={key} className="flex flex-col gap-0.5">
              <div className="flex justify-between">
                <label className="text-[9px] uppercase tracking-wider" style={{ color: '#555a7a' }}>{label}</label>
                <span className="text-[9px] tabular-nums" style={{ color: '#9097b8' }}>
                  {efx[key] as number}{unit}
                </span>
              </div>
              <input
                type="range" min={min} max={max} value={efx[key] as number}
                onChange={e => onChange({ [key]: Number(e.target.value) })}
                className="accent-violet-500 cursor-pointer"
              />
            </div>
          ))}

          {/* Fixture selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] uppercase tracking-wider" style={{ color: '#555a7a' }}>Fixtures</label>
            <div className="flex flex-wrap gap-1">
              {patch.map(fx => {
                const active = efx.fixtureIds.includes(fx.id)
                return (
                  <button
                    key={fx.id}
                    onClick={() => onChange({
                      fixtureIds: active
                        ? efx.fixtureIds.filter(id => id !== fx.id)
                        : [...efx.fixtureIds, fx.id],
                    })}
                    className="px-1.5 py-0.5 rounded text-[9px] transition-all"
                    style={{
                      background: active ? '#6c63ff' : '#1e2130',
                      color: active ? '#fff' : '#555a7a',
                      border: `1px solid ${active ? '#6c63ff' : '#2a2d3e'}`,
                    }}
                  >
                    {fx.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── New bank modal ────────────────────────────────────────────────────────────
function NewBankModal({ usedCount, palette, onConfirm, onCancel }: {
  usedCount: number; palette: string[]
  onConfirm: (name: string, color: string) => void; onCancel: () => void
}): React.JSX.Element {
  const [name,  setName]  = useState(`Bank ${usedCount + 1}`)
  const [color, setColor] = useState(palette[usedCount % palette.length])

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: '#000b' }}>
      <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: '#1e2130', border: '1px solid #2a2d3e', minWidth: 290 }}>
        <h3 className="text-sm font-bold" style={{ color: '#e8eaf6' }}>Neue Bank erstellen</h3>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider" style={{ color: '#555a7a' }}>Name</label>
          <input
            autoFocus value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && name.trim() && onConfirm(name.trim(), color)}
            className="rounded px-3 py-1.5 text-sm"
            style={{ background: '#0f1117', color: '#e8eaf6', border: '1px solid #2a2d3e' }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-wider" style={{ color: '#555a7a' }}>Farbe</label>
          <div className="flex flex-wrap gap-1.5">
            {palette.map(c => (
              <button
                key={c} onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full transition-transform"
                style={{ background: c, outline: color === c ? '2px solid #fff' : 'none', outlineOffset: 2, transform: color === c ? 'scale(1.15)' : 'scale(1)' }}
              />
            ))}
            <input
              type="color" value={color} onChange={e => setColor(e.target.value)}
              className="w-6 h-6 rounded-full cursor-pointer border-0" style={{ padding: 0 }}
            />
          </div>
          <div
            className="rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-widest"
            style={{ background: `${color}22`, border: `2px solid ${color}`, color }}
          >
            {name || 'Bank-Name'}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-3 py-1.5 rounded text-xs" style={{ background: '#131620', color: '#9097b8' }}>
            Abbrechen
          </button>
          <button
            onClick={() => name.trim() && onConfirm(name.trim(), color)}
            disabled={!name.trim()}
            className="px-4 py-1.5 rounded text-xs font-bold"
            style={{ background: color, color: '#fff', opacity: name.trim() ? 1 : 0.5 }}
          >
            Erstellen
          </button>
        </div>
      </div>
    </div>
  )
}

