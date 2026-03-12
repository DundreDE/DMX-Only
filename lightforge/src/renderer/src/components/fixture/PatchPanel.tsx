import { useState, useMemo, useCallback, useRef } from 'react'
import { useFixtureStore } from '../../store/useFixtureStore'
import type { FixtureDefinition, PatchedFixture } from '../../../../shared/types'

// ─── Layout constants ────────────────────────────────────────────────────────
const COLS = 32
const ROWS = 16        // 16 × 32 = 512
const CELL_W = 22      // px
const CELL_H = 26      // px

// ─── Colour palette per fixture ──────────────────────────────────────────────
const PALETTE = ['#6c63ff','#00d68f','#ff8c00','#00cfff','#ff4d6a','#c744ff','#ffd600','#00e676','#ff6d00','#29b6f6']

function fixtureColor(id: string): string {
  let h = 5381
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) & 0x7fffffff
  return PALETTE[Math.abs(h) % PALETTE.length]
}

interface DragInfo {
  definitionId: string
  modeIndex: number
  channelCount: number
  label: string
}

// ─── Root component ───────────────────────────────────────────────────────────
export function PatchPanel(): React.JSX.Element {
  const { library, patch, patchFixture, unpatchFixture } = useFixtureStore()
  const [universe, setUniverse] = useState(1)
  const dragInfo = useRef<DragInfo | null>(null)
  const [hoverAddr, setHoverAddr] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // addr → { fixture, isFirst, isLast, color }
  const occupiedMap = useMemo(() => {
    const map = new Map<number, { fixture: PatchedFixture; isFirst: boolean; isLast: boolean; color: string }>()
    for (const fx of patch.filter((p) => p.universe === universe)) {
      const color = fixtureColor(fx.id)
      for (let i = 0; i < fx.channelCount; i++) {
        const addr = fx.startAddress + i
        if (addr > 512) break
        map.set(addr, { fixture: fx, isFirst: i === 0, isLast: i === fx.channelCount - 1, color })
      }
    }
    return map
  }, [patch, universe])

  const highlightAddrs = useMemo(() => {
    if (!isDragging || hoverAddr === null || !dragInfo.current) return new Set<number>()
    const s = new Set<number>()
    for (let i = 0; i < dragInfo.current.channelCount; i++) {
      const a = hoverAddr + i
      if (a <= 512) s.add(a)
    }
    return s
  }, [isDragging, hoverAddr])

  const hasConflict = useMemo(() => {
    for (const a of highlightAddrs) if (occupiedMap.has(a)) return true
    return false
  }, [highlightAddrs, occupiedMap])

  const handleDragStart = useCallback((info: DragInfo) => {
    dragInfo.current = info
    setIsDragging(true)
  }, [])

  const handleDragEnd = useCallback(() => {
    dragInfo.current = null
    setIsDragging(false)
    setHoverAddr(null)
  }, [])

  const handleDrop = useCallback((addr: number) => {
    const info = dragInfo.current
    if (!info) return
    const def = library.find((d) => d.id === info.definitionId)
    if (def && !hasConflict) {
      patchFixture(def, info.modeIndex, universe, addr, info.label)
    }
    dragInfo.current = null
    setIsDragging(false)
    setHoverAddr(null)
  }, [library, hasConflict, patchFixture, universe])

  const freeCount = 512 - occupiedMap.size

  return (
    <div className="flex h-full overflow-hidden">
      <FixtureSidebar
        library={library}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Universe tabs */}
        <div
          className="flex items-center shrink-0 px-3 gap-0.5"
          style={{ borderBottom: '1px solid #1e2130', background: '#0f1117' }}
        >
          {[1, 2, 3, 4].map((u) => (
            <button
              key={u}
              onClick={() => setUniverse(u)}
              className="px-3 py-2 text-xs font-medium transition-all"
              style={{
                color: universe === u ? '#e8eaf6' : '#555a7a',
                borderBottom: `2px solid ${universe === u ? '#6c63ff' : 'transparent'}`,
                background: 'transparent'
              }}
            >
              Universe {u}
              {patch.filter((p) => p.universe === u).length > 0 && (
                <span className="ml-1" style={{ color: '#6c63ff' }}>●</span>
              )}
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-[10px]" style={{ color: '#555a7a' }}>
            {patch.filter((p) => p.universe === universe).length} Fixtures · {freeCount} frei
          </span>
          <div className="w-3" />
        </div>

        {/* Drop hint */}
        {isDragging && (
          <div
            className="shrink-0 text-center text-[10px] py-1"
            style={{ background: hasConflict ? '#ff4d6a22' : '#6c63ff22', color: hasConflict ? '#ff4d6a' : '#6c63ff' }}
          >
            {hasConflict ? '⚠ Adresskonflikt — hier nicht ablegen' : '← Fixture auf eine freie Adresse ziehen →'}
          </div>
        )}

        {/* 512-channel strip */}
        <DmxStrip
          occupiedMap={occupiedMap}
          highlightAddrs={highlightAddrs}
          hasConflict={hasConflict}
          dragActive={isDragging}
          onHoverAddr={setHoverAddr}
          onDrop={handleDrop}
          onUnpatch={unpatchFixture}
        />
      </div>
    </div>
  )
}

// ─── Fixture sidebar ──────────────────────────────────────────────────────────
function FixtureSidebar({
  library,
  onDragStart,
  onDragEnd,
}: {
  library: FixtureDefinition[]
  onDragStart: (info: DragInfo) => void
  onDragEnd: () => void
}): React.JSX.Element {
  const { addToLibrary } = useFixtureStore()
  const [search, setSearch] = useState('')
  const [modeMap, setModeMap] = useState<Record<string, number>>({})
  const [importing, setImporting] = useState(false)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const getModeIdx = (id: string) => modeMap[id] ?? 0

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return library
    return library.filter(
      (f) => f.model.toLowerCase().includes(q) || f.manufacturer.toLowerCase().includes(q)
    )
  }, [library, search])

  const grouped = useMemo(() => {
    const map = new Map<string, FixtureDefinition[]>()
    for (const f of filtered) {
      const list = map.get(f.manufacturer) ?? []
      list.push(f)
      map.set(f.manufacturer, list)
    }
    return map
  }, [filtered])

  const handleImportFolder = async (): Promise<void> => {
    setImporting(true)
    setImportMsg(null)
    try {
      const result = await window.fixture.importFolder()
      if (result) {
        addToLibrary(result.fixtures)
        setImportMsg(`✓ ${result.fixtureCount} Fixtures`)
      }
    } finally {
      setImporting(false)
    }
  }

  const startDrag = (e: React.DragEvent, def: FixtureDefinition): void => {
    const modeIdx = getModeIdx(def.id)
    const mode = def.modes[modeIdx]
    const chCount = mode?.channels.length ?? 1

    // Custom drag ghost sized to fixture channel count
    const ghost = document.createElement('div')
    ghost.style.cssText = [
      `width:${Math.min(chCount * CELL_W, 300)}px`,
      `height:${CELL_H}px`,
      'position:fixed',
      'top:-9999px',
      'left:0',
      'background:#6c63ffcc',
      'border:1px solid #6c63ff',
      'border-radius:3px',
      'display:flex',
      'align-items:center',
      'padding:0 5px',
      'color:#fff',
      'font-size:10px',
      'font-family:system-ui,sans-serif',
      'white-space:nowrap',
      'overflow:hidden',
      'pointer-events:none',
    ].join(';')
    ghost.textContent = `${def.model}  ${chCount}ch`
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 4, CELL_H / 2)
    requestAnimationFrame(() => document.body.removeChild(ghost))

    onDragStart({ definitionId: def.id, modeIndex: modeIdx, channelCount: chCount, label: def.model })
  }

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden"
      style={{ width: 210, borderRight: '1px solid #1e2130' }}
    >
      {/* Import */}
      <div className="px-2 py-2 shrink-0" style={{ borderBottom: '1px solid #1e2130' }}>
        <button
          onClick={handleImportFolder}
          disabled={importing}
          className="w-full py-1.5 px-2 rounded text-xs font-medium mb-1.5 flex items-center justify-center gap-1.5"
          style={{ background: '#6c63ff', color: '#fff', opacity: importing ? 0.6 : 1 }}
        >
          📂 {importing ? 'Lade…' : 'Fixtures laden'}
        </button>
        {importMsg && <p className="text-[10px] mb-1" style={{ color: '#00d68f' }}>{importMsg}</p>}
        <input
          type="text"
          placeholder="Suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-2 py-1 rounded text-xs outline-none"
          style={{ background: '#2a2d3e', color: '#e8eaf6', border: '1px solid #3a3f5a' }}
        />
      </div>

      {/* Library list */}
      <div className="flex-1 overflow-y-auto">
        {library.length === 0 ? (
          <div className="p-3 text-center text-xs leading-relaxed" style={{ color: '#555a7a' }}>
            Noch keine Fixtures.<br />Oben laden oder unter<br />„Fixtures" importieren.
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-3 text-center text-xs" style={{ color: '#555a7a' }}>Keine Treffer</div>
        ) : (
          Array.from(grouped.entries() as Iterable<[string, FixtureDefinition[]]>).map(([mfr, fixtures]) => (
            <div key={mfr}>
              <div
                className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider sticky top-0"
                style={{ background: '#131620', color: '#555a7a', zIndex: 1 }}
              >
                {mfr}
              </div>
              {fixtures.map((def) => {
                const modeIdx = getModeIdx(def.id)
                const mode = def.modes[modeIdx]
                const chCount = mode?.channels.length ?? 0
                return (
                  <div
                    key={def.id}
                    draggable
                    onDragStart={(e) => startDrag(e, def)}
                    onDragEnd={onDragEnd}
                    className="px-2 py-1.5 select-none transition-colors"
                    style={{ borderBottom: '1px solid #1a1d27', cursor: 'grab' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#1e2130')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <span className="flex-1 text-[11px] truncate" style={{ color: '#e8eaf6' }}>
                        {def.model}
                      </span>
                      <span
                        className="text-[9px] px-1 rounded shrink-0"
                        style={{ background: '#6c63ff22', color: '#6c63ff' }}
                      >
                        {chCount}ch
                      </span>
                    </div>
                    {def.modes.length > 1 && (
                      <select
                        value={modeIdx}
                        onChange={(e) =>
                          setModeMap((m) => ({ ...m, [def.id]: Number(e.target.value) }))
                        }
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-1 rounded text-[9px] outline-none"
                        style={{
                          background: '#2a2d3e',
                          color: '#9097b8',
                          border: '1px solid #3a3f5a',
                          height: 18,
                        }}
                      >
                        {def.modes.map((m, i) => (
                          <option key={i} value={i}>
                            {m.name} ({m.channels.length}ch)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      {library.length > 0 && (
        <div className="px-2 py-1.5 shrink-0" style={{ borderTop: '1px solid #1e2130' }}>
          <span className="text-[9px]" style={{ color: '#3a3f5a' }}>
            {library.length} Fixtures · zum Patchen ziehen
          </span>
        </div>
      )}
    </div>
  )
}

// ─── 512-channel strip ────────────────────────────────────────────────────────
function DmxStrip({
  occupiedMap,
  highlightAddrs,
  hasConflict,
  dragActive,
  onHoverAddr,
  onDrop,
  onUnpatch,
}: {
  occupiedMap: Map<number, { fixture: PatchedFixture; isFirst: boolean; isLast: boolean; color: string }>
  highlightAddrs: Set<number>
  hasConflict: boolean
  dragActive: boolean
  onHoverAddr: (addr: number) => void
  onDrop: (addr: number) => void
  onUnpatch: (id: string) => void
}): React.JSX.Element {
  const hlColor = hasConflict ? '#ff4d6a' : '#6c63ff'

  return (
    <div
      className="flex-1 overflow-y-auto p-2"
      style={{ userSelect: 'none' }}
      onDragLeave={(e) => {
        // Reset hover when leaving the strip entirely
        if (!e.currentTarget.contains(e.relatedTarget as Node)) onHoverAddr(-1)
      }}
    >
      {Array.from({ length: ROWS }, (_, rowIdx) => {
        const rowStart = rowIdx * COLS + 1
        return (
          <div key={rowIdx} className="flex items-stretch" style={{ marginBottom: 2 }}>
            {/* Row label */}
            <div
              className="shrink-0 flex items-center justify-end pr-1 text-[9px]"
              style={{ width: 26, color: '#3a3f5a', fontVariantNumeric: 'tabular-nums' }}
            >
              {rowStart}
            </div>

            {/* 32 channel cells */}
            {Array.from({ length: COLS }, (_, colIdx) => {
              const addr = rowStart + colIdx
              const entry = occupiedMap.get(addr)
              const isHl = highlightAddrs.has(addr)

              // Background & border
              let bg = '#1a1d27'
              let borderStyle = `1px solid #1e2130`
              let borderLeft = borderStyle
              let cursor = dragActive ? 'crosshair' : 'default'
              let labelText = ''
              let labelColor = 'transparent'

              if (entry) {
                bg = entry.color + '38'
                borderStyle = `1px solid ${entry.color}28`
                borderLeft = borderStyle
                if (entry.isFirst) {
                  bg = entry.color + '70'
                  borderLeft = `2px solid ${entry.color}`
                  labelText = entry.fixture.name
                  labelColor = entry.color
                  cursor = 'pointer'
                }
              }

              if (isHl) {
                bg = `${hlColor}44`
                borderStyle = `1px solid ${hlColor}88`
                borderLeft = borderStyle
              }

              return (
                <div
                  key={addr}
                  title={
                    entry
                      ? `${entry.fixture.name} · Adresse ${entry.fixture.startAddress}–${entry.fixture.startAddress + entry.fixture.channelCount - 1} · ${entry.fixture.channelCount}ch`
                      : `Kanal ${addr}`
                  }
                  style={{
                    width: CELL_W,
                    height: CELL_H,
                    flexShrink: 0,
                    background: bg,
                    borderTop: borderStyle,
                    borderBottom: borderStyle,
                    borderRight: borderStyle,
                    borderLeft,
                    boxSizing: 'border-box',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor,
                  }}
                  onDragOver={
                    dragActive
                      ? (e) => { e.preventDefault(); onHoverAddr(addr) }
                      : undefined
                  }
                  onDrop={
                    dragActive
                      ? (e) => { e.preventDefault(); onDrop(addr) }
                      : undefined
                  }
                  onClick={entry?.isFirst ? () => onUnpatch(entry.fixture.id) : undefined}
                >
                  {/* Fixture name on first cell */}
                  {entry?.isFirst && (
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        fontSize: 7,
                        color: labelColor,
                        display: 'flex',
                        alignItems: 'center',
                        paddingLeft: 3,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        fontWeight: 600,
                      }}
                    >
                      {labelText}
                    </span>
                  )}
                  {/* Channel number in empty cells */}
                  {!entry && !isHl && (
                    <span
                      style={{
                        position: 'absolute',
                        inset: 0,
                        fontSize: 7,
                        color: '#2a2f45',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {addr}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

