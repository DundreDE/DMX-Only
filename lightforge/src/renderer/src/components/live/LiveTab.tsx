import { useState, useRef } from 'react'
import { useFixtureStore } from '../../store/useFixtureStore'
import { useDmxStore } from '../../store/useDmxStore'
import type { Scene, PatchedFixture, FixtureDefinition, FixtureCapabilityType } from '../../../../shared/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

type FixCat = 'moving' | 'bar' | 'rgb' | 'generic'

function detectCat(fx: PatchedFixture, lib: FixtureDefinition[]): FixCat {
  const mode = lib.find(d => d.id === fx.definitionId)?.modes[fx.modeIndex]
  if (!mode) return 'generic'
  const types = mode.channels.map(c => c.primaryType)
  if (types.filter(t => t === 'Red').length > 1) return 'bar'
  if (types.includes('Pan') || types.includes('Tilt')) return 'moving'
  if (types.includes('Red') && types.includes('Green') && types.includes('Blue')) return 'rgb'
  return 'generic'
}

function addr(fx: PatchedFixture, lib: FixtureDefinition[], type: FixtureCapabilityType): number | null {
  const mode = lib.find(d => d.id === fx.definitionId)?.modes[fx.modeIndex]
  const ch = mode?.channels.find(c => c.primaryType === type)
  return ch ? fx.startAddress + ch.number - 1 : null
}

interface SegAddrs { r: number | null; g: number | null; b: number | null; w: number | null; a: number | null }

function getSegments(fx: PatchedFixture, lib: FixtureDefinition[]): SegAddrs[] {
  const mode = lib.find(d => d.id === fx.definitionId)?.modes[fx.modeIndex]
  if (!mode) return []
  const reds = mode.channels.filter(c => c.primaryType === 'Red')
  return reds.map(redCh => {
    const base = redCh.number - 1
    const nearby = mode.channels.slice(base, base + 6)
    const a = (t: FixtureCapabilityType) => {
      const ch = nearby.find(c => c.primaryType === t)
      return ch ? fx.startAddress + ch.number - 1 : null
    }
    return { r: fx.startAddress + redCh.number - 1, g: a('Green'), b: a('Blue'), w: a('White'), a: a('Amber') }
  })
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const f = (n: number) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)) }
  return [Math.round(f(5) * 255), Math.round(f(3) * 255), Math.round(f(1) * 255)]
}

const CAT_LABEL: Record<FixCat, string> = { moving: '🎯', bar: '▬', rgb: '●', generic: '⚙' }

const COLOR_PRESETS = [
  { label: 'Rot',   r: 255, g: 0,   b: 0,   c: '#ff4d6a' },
  { label: 'Grün',  r: 0,   g: 255, b: 0,   c: '#00d68f' },
  { label: 'Blau',  r: 0,   g: 0,   b: 255, c: '#6c9cff' },
  { label: 'Weiß',  r: 255, g: 255, b: 255, c: '#e8eaf6' },
  { label: 'Amber', r: 255, g: 140, b: 0,   c: '#ff8800' },
  { label: 'Lila',  r: 160, g: 0,   b: 255, c: '#aa44ff' },
  { label: 'Cyan',  r: 0,   g: 255, b: 255, c: '#00ffff' },
  { label: 'Aus',   r: 0,   g: 0,   b: 0,   c: '#333344' },
]

// ── XY Pad ────────────────────────────────────────────────────────────────────

function XYPad({ pan, tilt, onPan, onTilt }: {
  pan: number; tilt: number; onPan: (v: number) => void; onTilt: (v: number) => void
}): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  function update(e: React.PointerEvent | PointerEvent): void {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    onPan(Math.round(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * 255))
    onTilt(Math.round(Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) * 255))
  }

  return (
    <div
      ref={ref}
      className="relative rounded-lg cursor-crosshair select-none shrink-0"
      style={{
        width: 160, height: 140,
        background: '#0a0d14',
        border: '1px solid #2a2d3e',
        backgroundImage: 'linear-gradient(#ffffff06 1px,transparent 1px),linear-gradient(90deg,#ffffff06 1px,transparent 1px)',
        backgroundSize: '20px 20px',
      }}
      onPointerDown={e => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); update(e) }}
      onPointerMove={e => { if (dragging.current) update(e) }}
      onPointerUp={() => { dragging.current = false }}
    >
      {/* crosshair */}
      <div className="absolute inset-0 pointer-events-none" style={{ left: '50%', top: 0, bottom: 0, width: 1, background: '#ffffff09', position: 'absolute' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ top: '50%', left: 0, right: 0, height: 1, background: '#ffffff09', position: 'absolute' }} />
      {/* dot */}
      <div
        className="absolute w-4 h-4 rounded-full pointer-events-none"
        style={{
          left: `${(pan / 255) * 100}%`, top: `${(tilt / 255) * 100}%`,
          transform: 'translate(-50%,-50%)',
          background: '#6c63ff', boxShadow: '0 0 10px #6c63ffaa',
          border: '2px solid #fff3',
        }}
      />
      <div className="absolute bottom-1 left-1.5 pointer-events-none text-[9px]" style={{ color: '#555a7a' }}>
        P:{pan} T:{tilt}
      </div>
    </div>
  )
}

// ── Moving Head Controls ──────────────────────────────────────────────────────

function MovingHeadControls({ fx, lib, universe, getCh, setCh }: {
  fx: PatchedFixture; lib: FixtureDefinition[]; universe: number
  getCh: (ch: number) => number; setCh: (ch: number, v: number) => void
}): React.JSX.Element {
  const panA = addr(fx, lib, 'Pan');    const tiltA = addr(fx, lib, 'Tilt')
  const dimA = addr(fx, lib, 'Dimmer'); const rA = addr(fx, lib, 'Red')
  const gA = addr(fx, lib, 'Green');   const bA = addr(fx, lib, 'Blue')
  const goboA = addr(fx, lib, 'Gobo'); const strobeA = addr(fx, lib, 'Strobe')
  const speedA = addr(fx, lib, 'Speed'); const cwA = addr(fx, lib, 'ColorWheel')

  const g = (a: number | null) => (a ? getCh(a) : 0)
  const s = (a: number | null, v: number) => { if (a) setCh(a, v) }

  const mode = lib.find(d => d.id === fx.definitionId)?.modes[fx.modeIndex]
  const goboCaps = mode?.channels.find(c => c.primaryType === 'Gobo')?.capabilities ?? []
  const cwCaps   = mode?.channels.find(c => c.primaryType === 'ColorWheel')?.capabilities ?? []

  const r = g(rA); const gr = g(gA); const b = g(bA)

  const VFader = ({ a, label, color, accent }: { a: number | null; label: string; color: string; accent: string }) => a === null ? null : (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <span className="text-[8px] uppercase tracking-wide" style={{ color }}>{label}</span>
      <span className="text-[9px] font-bold tabular-nums" style={{ color }}>{a === dimA ? `${Math.round(g(a)/255*100)}%` : g(a)}</span>
      <input type="range" min={0} max={255} value={g(a)}
        onChange={e => s(a, Number(e.target.value))}
        className={`accent-${accent}`}
        style={{ writingMode: 'vertical-lr', direction: 'rtl', height: 100, width: 28, cursor: 'pointer' }} />
    </div>
  )

  return (
    <div className="flex gap-5 items-start flex-wrap">
      {/* XY Pad */}
      {panA !== null && tiltA !== null && (
        <div className="flex flex-col gap-1 shrink-0">
          <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: '#00ccff' }}>Pan / Tilt</span>
          <XYPad pan={g(panA)} tilt={g(tiltA)} onPan={v => s(panA, v)} onTilt={v => s(tiltA, v)} />
        </div>
      )}

      {/* Vertical faders */}
      <div className="flex gap-3 items-end shrink-0">
        <VFader a={dimA} label="Dim" color="#ffb300" accent="yellow-400" />
        <VFader a={strobeA} label="Strb" color="#ff6666" accent="red-400" />
        <VFader a={speedA} label="Spd" color="#88ffcc" accent="emerald-400" />
      </div>

      {/* Color */}
      {(rA ?? gA ?? bA) !== null && (
        <div className="flex flex-col gap-2 shrink-0">
          <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: '#9097b8' }}>Farbe</span>
          <div className="w-14 h-8 rounded-lg border" style={{ background: `rgb(${r},${gr},${b})`, borderColor: '#2a2d3e' }} />
          <div className="flex flex-wrap gap-1" style={{ maxWidth: 116 }}>
            {COLOR_PRESETS.map(p => (
              <button key={p.label} onClick={() => { s(rA, p.r); s(gA, p.g); s(bA, p.b) }}
                className="px-1.5 py-0.5 rounded text-[8px] font-bold"
                style={{ background: p.c + '33', border: `1px solid ${p.c}66`, color: p.c }}
              >{p.label}</button>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            {rA !== null && <div className="flex items-center gap-1"><span className="text-[8px] w-2.5" style={{ color: '#ff4d6a' }}>R</span><input type="range" min={0} max={255} value={r} onChange={e => s(rA, Number(e.target.value))} className="w-24 accent-red-400" /></div>}
            {gA !== null && <div className="flex items-center gap-1"><span className="text-[8px] w-2.5" style={{ color: '#00d68f' }}>G</span><input type="range" min={0} max={255} value={gr} onChange={e => s(gA, Number(e.target.value))} className="w-24 accent-green-400" /></div>}
            {bA !== null && <div className="flex items-center gap-1"><span className="text-[8px] w-2.5" style={{ color: '#6c9cff' }}>B</span><input type="range" min={0} max={255} value={b} onChange={e => s(bA, Number(e.target.value))} className="w-24 accent-blue-400" /></div>}
          </div>
        </div>
      )}

      {/* Color Wheel */}
      {cwA !== null && cwCaps.length > 0 && (
        <div className="flex flex-col gap-1.5 shrink-0">
          <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: '#ff88ff' }}>Farbrad</span>
          <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 160 }}>
            {cwCaps.map(cap => {
              const active = g(cwA) >= cap.min && g(cwA) <= cap.max
              return (
                <button key={cap.name} onClick={() => s(cwA, Math.round((cap.min + cap.max) / 2))}
                  className="px-2 py-1 rounded text-[9px] text-left"
                  style={{ background: active ? '#ff88ff33' : '#1a1d27', border: `1px solid ${active ? '#ff88ff66' : '#2a2d3e'}`, color: active ? '#ff88ff' : '#9097b8' }}
                >{cap.name}</button>
              )
            })}
          </div>
        </div>
      )}

      {/* Gobo */}
      {goboA !== null && goboCaps.length > 0 && (
        <div className="flex flex-col gap-1.5 shrink-0">
          <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: '#9090ff' }}>Gobo</span>
          <div className="flex flex-wrap gap-1" style={{ maxWidth: 130 }}>
            {goboCaps.map(cap => {
              const active = g(goboA) >= cap.min && g(goboA) <= cap.max
              return (
                <button key={cap.name} onClick={() => s(goboA, Math.round((cap.min + cap.max) / 2))}
                  className="px-2 py-1.5 rounded text-[8px] font-medium"
                  style={{ background: active ? '#9090ff33' : '#1a1d27', border: `1px solid ${active ? '#9090ff88' : '#2a2d3e'}`, color: active ? '#c0c0ff' : '#9097b8' }}
                >{cap.name.length > 8 ? cap.name.slice(0, 7) + '…' : cap.name}</button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── LED Bar Controls ──────────────────────────────────────────────────────────

function BarControls({ fx, lib, universe, getCh, setCh }: {
  fx: PatchedFixture; lib: FixtureDefinition[]; universe: number
  getCh: (ch: number) => number; setCh: (ch: number, v: number) => void
}): React.JSX.Element {
  const segs = getSegments(fx, lib)
  const dimA = addr(fx, lib, 'Dimmer')
  const g = (a: number | null) => (a ? getCh(a) : 0)
  const s = (a: number | null, v: number) => { if (a) setCh(a, v) }

  const applyAll = (r: number, gr: number, b: number) => segs.forEach(sg => { s(sg.r, r); s(sg.g, gr); s(sg.b, b) })

  const PATTERNS = [
    { label: '⬛ Aus',        fn: () => applyAll(0, 0, 0) },
    { label: '⬜ Weiß',       fn: () => applyAll(255, 255, 255) },
    { label: '🔴 Rot',        fn: () => applyAll(255, 0, 0) },
    { label: '🟢 Grün',       fn: () => applyAll(0, 255, 0) },
    { label: '🔵 Blau',       fn: () => applyAll(0, 0, 255) },
    { label: '🟠 Amber',      fn: () => applyAll(255, 140, 0) },
    { label: '🌈 Regenbogen', fn: () => segs.forEach((sg, i) => { const [r, gr, b] = hsvToRgb((i / segs.length) * 360, 1, 1); s(sg.r, r); s(sg.g, gr); s(sg.b, b) }) },
    { label: '🔀 Alternierend', fn: () => segs.forEach((sg, i) => i % 2 === 0 ? (s(sg.r, 255), s(sg.g, 0), s(sg.b, 0)) : (s(sg.r, 0), s(sg.g, 0), s(sg.b, 255))) },
  ]

  return (
    <div className="flex flex-col gap-3">
      {/* Patterns */}
      <div className="flex flex-wrap gap-1.5">
        {PATTERNS.map(p => (
          <button key={p.label} onClick={p.fn}
            className="px-2.5 py-1 rounded text-[9px] font-medium transition-colors"
            style={{ background: '#1a1d27', border: '1px solid #2a2d3e', color: '#9097b8' }}
          >{p.label}</button>
        ))}
      </div>

      {/* Master dimmer */}
      {dimA !== null && (
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase w-14 shrink-0" style={{ color: '#ffb300' }}>Master Dim</span>
          <input type="range" min={0} max={255} value={g(dimA)} onChange={e => s(dimA, Number(e.target.value))} className="flex-1 accent-yellow-400" />
          <span className="text-[9px] w-8 text-right font-bold" style={{ color: '#ffb300' }}>{Math.round(g(dimA) / 255 * 100)}%</span>
        </div>
      )}

      {/* Per-segment */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {segs.map((sg, i) => {
          const r = g(sg.r); const gr = g(sg.g); const b = g(sg.b)
          return (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
              {/* Color preview */}
              <div className="w-9 h-9 rounded-lg border" style={{ background: `rgb(${r},${gr},${b})`, borderColor: '#2a2d3e' }} />
              <span className="text-[8px] font-bold" style={{ color: '#555a7a' }}>{i + 1}</span>
              {/* Preset swatches */}
              <div className="flex flex-wrap gap-0.5 justify-center" style={{ width: 40 }}>
                {COLOR_PRESETS.map(p => (
                  <button key={p.label} onClick={() => { s(sg.r, p.r); s(sg.g, p.g); s(sg.b, p.b) }}
                    className="w-4 h-4 rounded-sm"
                    style={{ background: p.c, border: '1px solid #ffffff11' }}
                    title={p.label}
                  />
                ))}
              </div>
              {/* RGB mini-sliders */}
              <div className="flex flex-col gap-0.5 w-full">
                {sg.r !== null && <input type="range" min={0} max={255} value={r} onChange={e => s(sg.r, Number(e.target.value))} className="w-full accent-red-400" style={{ height: 4 }} />}
                {sg.g !== null && <input type="range" min={0} max={255} value={gr} onChange={e => s(sg.g, Number(e.target.value))} className="w-full accent-green-400" style={{ height: 4 }} />}
                {sg.b !== null && <input type="range" min={0} max={255} value={b} onChange={e => s(sg.b, Number(e.target.value))} className="w-full accent-blue-400" style={{ height: 4 }} />}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── RGB PAR Controls ──────────────────────────────────────────────────────────

function RgbControls({ fx, lib, universe, getCh, setCh }: {
  fx: PatchedFixture; lib: FixtureDefinition[]; universe: number
  getCh: (ch: number) => number; setCh: (ch: number, v: number) => void
}): React.JSX.Element {
  const rA = addr(fx, lib, 'Red');  const gA = addr(fx, lib, 'Green'); const bA = addr(fx, lib, 'Blue')
  const wA = addr(fx, lib, 'White'); const aA = addr(fx, lib, 'Amber'); const dimA = addr(fx, lib, 'Dimmer')
  const g = (a: number | null) => (a ? getCh(a) : 0)
  const s = (a: number | null, v: number) => { if (a) setCh(a, v) }
  const r = g(rA); const gr = g(gA); const b = g(bA)

  const CHANNELS = [
    { a: rA, label: 'Red', color: '#ff4d6a', accent: 'red-400' },
    { a: gA, label: 'Green', color: '#00d68f', accent: 'green-400' },
    { a: bA, label: 'Blue', color: '#6c9cff', accent: 'blue-400' },
    { a: wA, label: 'White', color: '#e8eaf6', accent: 'slate-200' },
    { a: aA, label: 'Amber', color: '#ff8800', accent: 'orange-400' },
    { a: dimA, label: 'Dimmer', color: '#ffb300', accent: 'yellow-400' },
  ]

  return (
    <div className="flex gap-5 items-start">
      {/* Color preview + presets */}
      <div className="flex flex-col gap-2 shrink-0">
        <div className="w-16 h-16 rounded-xl border-2" style={{ background: `rgb(${r},${gr},${b})`, borderColor: '#2a2d3e' }} />
        <div className="flex flex-wrap gap-1" style={{ maxWidth: 70 }}>
          {COLOR_PRESETS.map(p => (
            <button key={p.label} onClick={() => { s(rA, p.r); s(gA, p.g); s(bA, p.b) }}
              className="px-1 py-0.5 rounded text-[8px] font-bold"
              style={{ background: p.c + '33', border: `1px solid ${p.c}66`, color: p.c }}
            >{p.label}</button>
          ))}
        </div>
      </div>
      {/* Channel faders */}
      <div className="flex flex-col gap-1.5">
        {CHANNELS.filter(c => c.a !== null).map(c => (
          <div key={c.label} className="flex items-center gap-2">
            <span className="text-[9px] font-semibold w-12 shrink-0" style={{ color: c.color }}>{c.label}</span>
            <input type="range" min={0} max={255} value={g(c.a)} onChange={e => s(c.a, Number(e.target.value))} className={`w-36 accent-${c.accent}`} />
            <span className="text-[9px] w-8 text-right tabular-nums" style={{ color: c.color }}>
              {c.a === dimA ? `${Math.round(g(c.a) / 255 * 100)}%` : g(c.a)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Generic Controls ──────────────────────────────────────────────────────────

function GenericControls({ fx, lib, getCh, setCh }: {
  fx: PatchedFixture; lib: FixtureDefinition[]
  getCh: (ch: number) => number; setCh: (ch: number, v: number) => void
}): React.JSX.Element {
  const mode = lib.find(d => d.id === fx.definitionId)?.modes[fx.modeIndex]
  if (!mode) return <span style={{ color: '#555a7a' }}>Kein Mode gefunden</span>
  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: 200 }}>
      {mode.channels.map(ch => {
        const a = fx.startAddress + ch.number - 1
        const v = getCh(a)
        return (
          <div key={ch.number} className="flex items-center gap-2">
            <span className="text-[9px] w-28 truncate shrink-0" style={{ color: '#9097b8' }} title={ch.name}>{ch.name}</span>
            <input type="range" min={0} max={255} value={v} onChange={e => setCh(a, Number(e.target.value))} className="flex-1 accent-violet-500" />
            <span className="text-[9px] w-6 text-right tabular-nums" style={{ color: '#6c63ff' }}>{v}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Fixture Strip ─────────────────────────────────────────────────────────────

function FixtureStrip({ patch, library }: {
  patch: PatchedFixture[]; library: FixtureDefinition[]
}): React.JSX.Element {
  const [open, setOpen] = useState(true)
  const [selId, setSelId] = useState<string | null>(patch[0]?.id ?? null)
  const { getChannel, setChannel } = useDmxStore()

  const sel = patch.find(f => f.id === selId) ?? patch[0] ?? null

  const getCh = (ch: number) => (sel ? getChannel(sel.universe, ch) : 0)
  const setCh = (ch: number, v: number) => { if (sel) setChannel(sel.universe, ch, v) }

  const cat = sel ? detectCat(sel, library) : 'generic'

  return (
    <div className="shrink-0" style={{ borderTop: '1px solid #1e2130', background: '#07090f' }}>
      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 py-1.5" style={{ borderBottom: open ? '1px solid #1e2130' : 'none' }}>
        <span className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: '#3a3f5a' }}>Fixtures</span>
        <div className="flex gap-1.5 flex-1 overflow-x-auto">
          {patch.map(fx => {
            const fxCat = detectCat(fx, library)
            const isActive = fx.id === selId
            return (
              <button key={fx.id} onClick={() => { setSelId(fx.id); setOpen(true) }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold shrink-0 transition-all"
                style={{
                  background: isActive ? '#6c63ff22' : '#1a1d27',
                  border: `1px solid ${isActive ? '#6c63ff88' : '#2a2d3e'}`,
                  color: isActive ? '#a0a8f0' : '#555a7a',
                }}
              >
                <span>{CAT_LABEL[fxCat]}</span>
                <span className="max-w-[80px] truncate">{fx.name}</span>
                <span className="text-[8px] opacity-60">{fx.universe}.{fx.startAddress}</span>
              </button>
            )
          })}
        </div>
        <button onClick={() => setOpen(o => !o)}
          className="w-6 h-6 rounded flex items-center justify-center text-xs shrink-0"
          style={{ background: '#1a1d27', color: '#555a7a', border: '1px solid #2a2d3e' }}
        >{open ? '▼' : '▲'}</button>
      </div>

      {/* Controls area */}
      {open && sel && (
        <div className="overflow-x-auto p-4" style={{ minHeight: 200 }}>
          {cat === 'moving' && <MovingHeadControls fx={sel} lib={library} universe={sel.universe} getCh={getCh} setCh={setCh} />}
          {cat === 'bar'    && <BarControls        fx={sel} lib={library} universe={sel.universe} getCh={getCh} setCh={setCh} />}
          {cat === 'rgb'    && <RgbControls        fx={sel} lib={library} universe={sel.universe} getCh={getCh} setCh={setCh} />}
          {cat === 'generic' && <GenericControls   fx={sel} lib={library}                         getCh={getCh} setCh={setCh} />}
        </div>
      )}
    </div>
  )
}

// ── Main LiveTab ──────────────────────────────────────────────────────────────

export function LiveTab(): React.JSX.Element {
  const { scenes, banks, patch, library } = useFixtureStore()
  const { setChannel, master, setMaster, blackout, setBlackout } = useDmxStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [bpm, setBpm] = useState(120)
  const tapsRef = useRef<number[]>([])

  function handleTap(): void {
    const now = Date.now()
    tapsRef.current = [...tapsRef.current.filter(t => now - t < 3000), now]
    if (tapsRef.current.length >= 2) {
      const intervals = tapsRef.current.slice(1).map((t, i) => t - tapsRef.current[i])
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
      setBpm(Math.round(Math.min(300, Math.max(20, 60000 / avg))))
    }
  }

  function activateScene(scene: Scene): void {
    setActiveId(scene.id)
    for (const [uniStr, vals] of Object.entries(scene.values)) {
      const uni = Number(uniStr)
      vals.forEach((v, idx) => { if (v > 0) setChannel(uni, idx + 1, v) })
    }
  }

  const bankColor = (scene: Scene) => banks.find(b => b.id === scene.bankId)?.color ?? '#6c63ff'
  const visibleBanks = banks.filter(b => scenes.some(s => s.bankId === b.id))
  const unbanked = scenes.filter(s => !s.bankId)

  return (
    <div className="flex h-full" style={{ background: '#0a0c12' }}>
      {/* Main area: scenes + fixture strip */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Scene area */}
        <div className="flex-1 overflow-auto p-4">
          {scenes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: '#3a3f5a' }}>
              <span className="text-5xl">🎬</span>
              <p className="text-sm font-medium" style={{ color: '#555a7a' }}>Keine Szenen vorhanden</p>
              <p className="text-xs">Wechsle zu CONTROL → Szenen erstellen.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {visibleBanks.map(bank => {
                const bankScenes = scenes.filter(s => s.bankId === bank.id)
                return (
                  <div key={bank.id}>
                    <div className="flex items-center gap-2 mb-2" style={{ borderLeft: `3px solid ${bank.color}`, paddingLeft: 8 }}>
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: bank.color }}>{bank.name}</span>
                      <span className="text-[9px]" style={{ color: `${bank.color}77` }}>{bankScenes.length} Szene{bankScenes.length !== 1 ? 'n' : ''}</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {bankScenes.map(scene => (
                        <LiveSceneButton key={scene.id} scene={scene} color={bankColor(scene)} isActive={activeId === scene.id} onActivate={() => activateScene(scene)} />
                      ))}
                    </div>
                  </div>
                )
              })}
              {unbanked.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2" style={{ borderLeft: '3px solid #555a7a', paddingLeft: 8 }}>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#555a7a' }}>Ohne Bank</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {unbanked.map(scene => (
                      <LiveSceneButton key={scene.id} scene={scene} color="#555a7a" isActive={activeId === scene.id} onActivate={() => activateScene(scene)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fixture strip (bottom) */}
        {patch.length > 0 && <FixtureStrip patch={patch} library={library} />}
      </div>

      {/* Right sidebar: Master + BPM + Blackout */}
      <div
        className="flex flex-col items-center gap-4 py-4 px-3 shrink-0"
        style={{ width: 90, borderLeft: '1px solid #1e2130', background: '#07090f' }}
      >
        <span className="text-[9px] uppercase tracking-widest" style={{ color: '#3a3f5a' }}>Master</span>
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[10px] font-bold" style={{ color: '#6c63ff' }}>{Math.round((master / 255) * 100)}%</span>
          <input type="range" min={0} max={255} value={master} onChange={e => setMaster(Number(e.target.value))}
            className="flex-1 accent-violet-500"
            style={{ writingMode: 'vertical-lr', direction: 'rtl', cursor: 'pointer', width: 32 }} />
          <span className="text-[9px]" style={{ color: '#3a3f5a' }}>0%</span>
        </div>

        <div className="flex flex-col items-center gap-1 w-full">
          <span className="text-[9px] uppercase tracking-widest" style={{ color: '#3a3f5a' }}>BPM</span>
          <span className="text-base font-black tabular-nums" style={{ color: '#6c63ff' }}>{bpm}</span>
          <button onPointerDown={handleTap}
            className="w-full py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
            style={{ background: '#6c63ff22', color: '#6c63ff', border: '2px solid #6c63ff66', userSelect: 'none' }}
          >TAP</button>
        </div>

        <button onClick={() => setBlackout(!blackout)}
          className="w-full py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
          style={{
            background: blackout ? '#ff4d6a' : '#1e2130',
            color: blackout ? '#fff' : '#555a7a',
            border: `2px solid ${blackout ? '#ff4d6a' : '#2a2d3e'}`,
            boxShadow: blackout ? '0 0 16px #ff4d6a88' : 'none',
          }}
        >{blackout ? 'ON' : 'BLK'}</button>
        <span className="text-[8px] uppercase tracking-widest -mt-3" style={{ color: '#3a3f5a' }}>Blackout</span>
      </div>
    </div>
  )
}

// ── Scene button ──────────────────────────────────────────────────────────────

function LiveSceneButton({ scene, color, isActive, onActivate }: {
  scene: Scene; color: string; isActive: boolean; onActivate: () => void
}): React.JSX.Element {
  return (
    <button onClick={onActivate}
      className="relative rounded-xl text-left transition-all"
      style={{
        background: isActive ? `${color}33` : `${color}15`,
        border: `2px solid ${isActive ? color : color + '44'}`,
        width: 140, height: 110,
        boxShadow: isActive ? `0 0 14px ${color}66` : 'none',
        transform: isActive ? 'scale(0.97)' : 'scale(1)',
      }}
    >
      <div className="rounded-t-xl" style={{ background: color, height: 6 }} />
      <div className="p-3 flex flex-col gap-1 h-[calc(100%-6px)] justify-between">
        <p className="text-sm font-semibold leading-tight" style={{ color: '#e8eaf6' }}>{scene.name}</p>
        <span className="text-[10px]" style={{ color: `${color}cc` }}>
          {scene.fadeTime > 0 ? `${scene.fadeTime / 1000}s` : 'snap'}
        </span>
      </div>
      {isActive && <div className="absolute top-2 right-2 w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />}
    </button>
  )
}

