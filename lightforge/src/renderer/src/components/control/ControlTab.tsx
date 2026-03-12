import { useState, useMemo, useRef } from 'react'
import { useFixtureStore } from '../../store/useFixtureStore'
import { useDmxStore } from '../../store/useDmxStore'
import { ChaserEditor } from '../pro/ChaserEditor'
import { DmxConsole } from '../pro/DmxConsole'
import type { Scene, PatchedFixture, FixtureDefinition, Bank } from '../../../../shared/types'

type CtrlSub = 'scenes' | 'chasers' | 'console'

// Default colour palette for new banks
const BANK_COLOURS = [
  '#e53935', '#d81b60', '#8e24aa', '#5e35b1', '#1e88e5',
  '#00acc1', '#00897b', '#43a047', '#fb8c00', '#f4511e',
  '#546e7a', '#6c63ff', '#ff6584', '#f9a825', '#00d68f',
]

export function ControlTab(): React.JSX.Element {
  const [sub, setSub] = useState<CtrlSub>('scenes')

  return (
    <div className="flex flex-col h-full">
      {/* Sub-tab bar */}
      <div
        className="flex items-center gap-0.5 px-3 shrink-0"
        style={{ borderBottom: '1px solid #1e2130', background: '#0f1117' }}
      >
        {(['scenes', 'chasers', 'console'] as CtrlSub[]).map((t) => (
          <button
            key={t}
            onClick={() => setSub(t)}
            className="px-3 py-2 text-xs font-medium transition-all"
            style={{
              color: sub === t ? '#e8eaf6' : '#555a7a',
              borderBottom: `2px solid ${sub === t ? '#6c63ff' : 'transparent'}`,
              background: 'transparent',
            }}
          >
            {t === 'scenes' ? 'Szenen' : t === 'chasers' ? 'Chaser' : 'DMX Konsole'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {sub === 'scenes'  && <ScenesView />}
        {sub === 'chasers' && <ChaserEditor />}
        {sub === 'console' && <DmxConsole />}
      </div>
    </div>
  )
}

// ─── Scenes view ─────────────────────────────────────────────────────────────
function ScenesView(): React.JSX.Element {
  const { scenes, banks, patch, library, addScene, updateScene, deleteScene, addBank, updateBank, deleteBank } = useFixtureStore()
  const { setChannel } = useDmxStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null)  // null = alle
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [showBankModal, setShowBankModal] = useState(false)

  const selectedScene = scenes.find((s) => s.id === selectedId) ?? null
  const selectedBank = banks.find((b) => b.id === selectedBankId) ?? null

  // Fixture groups from patch
  const groups = useMemo(() => {
    const types = new Set<string>()
    for (const fx of patch) {
      const def = library.find((d) => d.id === fx.definitionId)
      if (def) types.add(def.type ?? 'Sonstiges')
    }
    return ['all', ...Array.from(types).sort()]
  }, [patch, library])

  const groupFixtures = useMemo(() => {
    if (selectedGroup === 'all') return patch
    return patch.filter((fx) => {
      const def = library.find((d) => d.id === fx.definitionId)
      return (def?.type ?? 'Sonstiges') === selectedGroup
    })
  }, [patch, library, selectedGroup])

  function newScene(): void {
    const bankId = selectedBankId ?? undefined
    const id = addScene({
      name: `Szene ${scenes.length + 1}`,
      fadeTime: 0,
      values: {},
      bankId,
    })
    setSelectedId(id)
  }

  function activateScene(scene: Scene): void {
    for (const [uniStr, vals] of Object.entries(scene.values)) {
      const uni = Number(uniStr)
      vals.forEach((v, idx) => {
        if (v > 0) setChannel(uni, idx + 1, v)
      })
    }
  }

  function handleFaderChange(universe: number, channel: number, value: number): void {
    if (!selectedScene) return
    const existing = selectedScene.values[universe] ?? new Array(512).fill(0)
    const updated = [...existing]
    updated[channel - 1] = value
    updateScene(selectedScene.id, { values: { ...selectedScene.values, [universe]: updated } })
    setChannel(universe, channel, value)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top toolbar: bank dropdown + actions */}
      <div
        className="flex items-center gap-2 px-3 shrink-0"
        style={{ borderBottom: '1px solid #1e2130', background: '#0a0c12', height: 44 }}
      >
        {/* Bank dropdown */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: '#555a7a' }}>Bank</span>
          <div className="relative">
            <select
              value={selectedBankId ?? ''}
              onChange={(e) => setSelectedBankId(e.target.value || null)}
              className="appearance-none pl-2 pr-6 py-1.5 rounded text-xs cursor-pointer"
              style={{
                background: selectedBank ? `${selectedBank.color}22` : '#1e2130',
                color: selectedBank ? selectedBank.color : '#e8eaf6',
                border: `1px solid ${selectedBank ? selectedBank.color + '66' : '#2a2d3e'}`,
                minWidth: 130,
              }}
            >
              <option value="">Alle Szenen</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]" style={{ color: '#9097b8' }}>▾</span>
          </div>
        </div>

        {/* Bank colour swatch (edit current bank) */}
        {selectedBank && (
          <>
            <input
              type="color"
              value={selectedBank.color}
              onChange={(e) => updateBank(selectedBank.id, { color: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer border-0"
              style={{ background: 'transparent', padding: 0 }}
              title="Bank-Farbe ändern"
            />
            <input
              value={selectedBank.name}
              onChange={(e) => updateBank(selectedBank.id, { name: e.target.value })}
              className="px-2 py-1 rounded text-xs w-28"
              style={{ background: '#1e2130', color: '#e8eaf6', border: '1px solid #2a2d3e' }}
              title="Bank umbenennen"
            />
            <button
              onClick={() => { deleteBank(selectedBank.id); setSelectedBankId(null) }}
              className="px-2 py-1 rounded text-[10px] transition-colors"
              style={{ background: '#ff4d6a22', color: '#ff4d6a', border: '1px solid #ff4d6a33' }}
              title="Bank löschen"
            >
              🗑
            </button>
          </>
        )}

        {/* New bank button */}
        <button
          onClick={() => setShowBankModal(true)}
          className="px-2.5 py-1 rounded text-[10px] font-semibold transition-colors"
          style={{ background: '#1e2130', color: '#9097b8', border: '1px solid #2a2d3e' }}
        >
          + Bank
        </button>

        <div className="flex-1" />

        {/* New scene in selected bank */}
        <button
          onClick={newScene}
          className="px-3 py-1.5 rounded text-[10px] font-bold"
          style={{ background: selectedBank?.color ?? '#6c63ff', color: '#fff' }}
        >
          + Szene{selectedBank ? ` in ${selectedBank.name}` : ''}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: fixture groups */}
        <div
          className="flex flex-col shrink-0 overflow-y-auto"
          style={{ width: 140, borderRight: '1px solid #1e2130', background: '#0a0c12' }}
        >
          <div className="px-2 py-2">
            <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: '#3a3f5a' }}>Fixture-Gruppen</p>
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className="w-full text-left px-2 py-1.5 rounded mb-0.5 text-xs transition-all"
                style={{
                  background: selectedGroup === g ? '#6c63ff22' : 'transparent',
                  color: selectedGroup === g ? '#e8eaf6' : '#9097b8',
                  border: `1px solid ${selectedGroup === g ? '#6c63ff55' : 'transparent'}`,
                }}
              >
                {g === 'all' ? '🎛 Alle' : g}
              </button>
            ))}
            {patch.length === 0 && (
              <p className="text-[9px] text-center mt-4" style={{ color: '#3a3f5a' }}>Keine Fixtures gepatch.</p>
            )}
          </div>
        </div>

        {/* Center: bank columns layout */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <BankColumnsView
            banks={banks}
            scenes={scenes}
            visibleBankId={selectedBankId}
            selectedSceneId={selectedId}
            onSelectScene={setSelectedId}
            onActivateScene={activateScene}
            onDeleteScene={deleteScene}
            onRenameScene={(id, name) => updateScene(id, { name })}
          />
        </div>

        {/* Right: scene detail */}
        {selectedScene && (
          <SceneDetailPanel
            scene={selectedScene}
            banks={banks}
            onChange={(changes) => updateScene(selectedScene.id, changes)}
          />
        )}
      </div>

      {/* Bottom: attribute faders */}
      {selectedScene && groupFixtures.length > 0 && (
        <AttributeFaders
          fixtures={groupFixtures}
          library={library}
          scene={selectedScene}
          onValueChange={handleFaderChange}
        />
      )}

      {/* New bank modal */}
      {showBankModal && (
        <NewBankModal
          usedCount={banks.length}
          palette={BANK_COLOURS}
          onConfirm={(name, color) => {
            const id = addBank(name, color)
            setSelectedBankId(id)
            setShowBankModal(false)
          }}
          onCancel={() => setShowBankModal(false)}
        />
      )}
    </div>
  )
}

// ─── Bank columns view ────────────────────────────────────────────────────────
const SCENE_BTN_HEIGHT = 84   // px per scene button including gap
const SCENE_BTN_WIDTH  = 120  // px per scene button
const COL_GAP          = 8    // px

interface BankColumnsViewProps {
  banks: Bank[]
  scenes: Scene[]
  visibleBankId: string | null
  selectedSceneId: string | null
  onSelectScene: (id: string) => void
  onActivateScene: (s: Scene) => void
  onDeleteScene: (id: string) => void
  onRenameScene: (id: string, name: string) => void
}

function BankColumnsView({
  banks, scenes, visibleBankId, selectedSceneId,
  onSelectScene, onActivateScene, onDeleteScene, onRenameScene,
}: BankColumnsViewProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  const visibleBanks = visibleBankId
    ? banks.filter((b) => b.id === visibleBankId)
    : banks

  const unbankered = scenes.filter((s) => !s.bankId)

  if (visibleBanks.length === 0 && unbankered.length === 0 && scenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: '#3a3f5a' }}>
        <span className="text-4xl">🎬</span>
        <p className="text-xs">Erstelle zuerst eine Bank, dann füge Szenen hinzu.</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-x-auto overflow-y-hidden flex gap-3 p-3 h-full"
    >
      {/* One column group per bank */}
      {visibleBanks.map((bank) => {
        const bankScenes = scenes.filter((s) => s.bankId === bank.id)
        return (
          <BankColumn
            key={bank.id}
            bank={bank}
            scenes={bankScenes}
            selectedSceneId={selectedSceneId}
            onSelect={onSelectScene}
            onActivate={onActivateScene}
            onDelete={onDeleteScene}
            onRename={onRenameScene}
          />
        )
      })}

      {/* Scenes without a bank (only shown in "Alle" view) */}
      {!visibleBankId && unbankered.length > 0 && (
        <BankColumn
          bank={{ id: '__none__', name: 'Ohne Bank', color: '#555a7a' }}
          scenes={unbankered}
          selectedSceneId={selectedSceneId}
          onSelect={onSelectScene}
          onActivate={onActivateScene}
          onDelete={onDeleteScene}
          onRename={onRenameScene}
        />
      )}

      {/* Empty state for selected bank */}
      {visibleBankId && visibleBanks.length > 0 && scenes.filter((s) => s.bankId === visibleBankId).length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-2" style={{ color: '#3a3f5a' }}>
          <span className="text-3xl">🎬</span>
          <p className="text-xs">Noch keine Szenen in dieser Bank.</p>
          <p className="text-[10px]">Klick auf „+ Szene in {visibleBanks[0]?.name}" oben.</p>
        </div>
      )}
    </div>
  )
}

// ─── Single bank column ───────────────────────────────────────────────────────
interface BankColumnProps {
  bank: Bank
  scenes: Scene[]
  selectedSceneId: string | null
  onSelect: (id: string) => void
  onActivate: (s: Scene) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
}

function BankColumn({ bank, scenes, selectedSceneId, onSelect, onActivate, onDelete, onRename }: BankColumnProps): React.JSX.Element {
  return (
    <div className="flex flex-col shrink-0" style={{ width: SCENE_BTN_WIDTH }}>
      {/* Bank header */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-t-lg mb-1 shrink-0"
        style={{ background: `${bank.color}22`, borderBottom: `2px solid ${bank.color}` }}
      >
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: bank.color }} />
        <span
          className="text-[10px] font-bold uppercase tracking-wider truncate"
          style={{ color: bank.color }}
        >
          {bank.name}
        </span>
        <span className="text-[9px] ml-auto shrink-0" style={{ color: `${bank.color}88` }}>
          {scenes.length}
        </span>
      </div>

      {/* Scene buttons — flex-col, wrap to next column when full */}
      <div
        className="flex-1 overflow-hidden"
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexWrap: 'wrap',
          alignContent: 'flex-start',
          gap: COL_GAP,
          // Extra width so wrapped columns are visible (parent scrolls horizontally)
          width: '100%',
        }}
      >
        {scenes.map((scene) => (
          <SceneButton
            key={scene.id}
            scene={scene}
            bankColor={bank.color}
            isSelected={selectedSceneId === scene.id}
            onSelect={() => onSelect(scene.id === selectedSceneId ? '' : scene.id)}
            onActivate={() => onActivate(scene)}
            onDelete={() => onDelete(scene.id)}
            onRename={(name) => onRename(scene.id, name)}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Scene button ─────────────────────────────────────────────────────────────
interface SceneButtonProps {
  scene: Scene
  bankColor: string
  isSelected: boolean
  onSelect: () => void
  onActivate: () => void
  onDelete: () => void
  onRename: (name: string) => void
}

function SceneButton({ scene, bankColor, isSelected, onSelect, onActivate, onDelete, onRename }: SceneButtonProps): React.JSX.Element {
  return (
    <div
      onClick={onSelect}
      onDoubleClick={onActivate}
      className="relative rounded-lg cursor-pointer transition-all group shrink-0"
      style={{
        width: SCENE_BTN_WIDTH,
        height: SCENE_BTN_HEIGHT - COL_GAP,
        background: isSelected ? `${bankColor}2e` : `${bankColor}12`,
        border: `2px solid ${isSelected ? bankColor : bankColor + '55'}`,
        boxShadow: isSelected ? `0 0 8px ${bankColor}44` : 'none',
        userSelect: 'none',
      }}
    >
      {/* Colour strip */}
      <div className="rounded-t-md" style={{ background: bankColor, height: 4 }} />

      <div className="flex flex-col h-[calc(100%-4px)] px-2 pt-1.5 pb-1.5 justify-between">
        <p className="text-[11px] font-semibold leading-tight break-words" style={{ color: '#e8eaf6', wordBreak: 'break-word' }}>
          {scene.name}
        </p>
        <span className="text-[9px]" style={{ color: `${bankColor}99` }}>
          {scene.fadeTime > 0 ? `${scene.fadeTime / 1000}s` : 'snap'}
        </span>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity" style={{ background: '#000a' }}>
        <button
          onClick={(e) => { e.stopPropagation(); const n = prompt('Name:', scene.name); if (n) onRename(n) }}
          className="px-1.5 py-0.5 rounded text-[9px]"
          style={{ background: '#ffffff22', color: '#fff' }}
        >✏️</button>
        <button
          onClick={(e) => { e.stopPropagation(); onActivate() }}
          className="px-1.5 py-0.5 rounded text-[9px]"
          style={{ background: bankColor, color: '#fff' }}
        >▶</button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="px-1.5 py-0.5 rounded text-[9px]"
          style={{ background: '#ff4d6a33', color: '#ff4d6a' }}
        >🗑</button>
      </div>
    </div>
  )
}

// ─── New bank modal ───────────────────────────────────────────────────────────
function NewBankModal({ usedCount, palette, onConfirm, onCancel }: {
  usedCount: number
  palette: string[]
  onConfirm: (name: string, color: string) => void
  onCancel: () => void
}): React.JSX.Element {
  const [name, setName] = useState(`Bank ${usedCount + 1}`)
  const [color, setColor] = useState(palette[usedCount % palette.length])

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: '#000a' }}>
      <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: '#1e2130', border: '1px solid #2a2d3e', minWidth: 280 }}>
        <h3 className="text-sm font-bold" style={{ color: '#e8eaf6' }}>Neue Bank erstellen</h3>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider" style={{ color: '#555a7a' }}>Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && onConfirm(name.trim(), color)}
            className="rounded px-3 py-1.5 text-sm"
            style={{ background: '#0f1117', color: '#e8eaf6', border: '1px solid #2a2d3e' }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-wider" style={{ color: '#555a7a' }}>Farbe</label>
          {/* Quick palette */}
          <div className="flex flex-wrap gap-1.5">
            {palette.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full transition-transform"
                style={{
                  background: c,
                  outline: color === c ? `2px solid #fff` : 'none',
                  outlineOffset: 2,
                  transform: color === c ? 'scale(1.15)' : 'scale(1)',
                }}
              />
            ))}
            {/* Custom picker */}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-6 h-6 rounded-full cursor-pointer border-0"
              style={{ padding: 0 }}
              title="Eigene Farbe"
            />
          </div>
          {/* Preview */}
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
            className="px-4 py-1.5 rounded text-xs font-bold transition-opacity"
            style={{ background: color, color: '#fff', opacity: name.trim() ? 1 : 0.5 }}
          >
            Erstellen
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Scene detail panel (right) ───────────────────────────────────────────────
function SceneDetailPanel({ scene, banks, onChange }: { scene: Scene; banks: Bank[]; onChange: (c: Partial<Scene>) => void }): React.JSX.Element {
  return (
    <div
      className="flex flex-col shrink-0 p-3 gap-3 overflow-y-auto"
      style={{ width: 180, borderLeft: '1px solid #1e2130', background: '#0a0c12' }}
    >
      <p className="text-[9px] uppercase tracking-widest" style={{ color: '#3a3f5a' }}>Szene</p>

      <div className="flex flex-col gap-1">
        <label className="text-[9px]" style={{ color: '#555a7a' }}>Name</label>
        <input
          value={scene.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="rounded px-2 py-1 text-xs w-full"
          style={{ background: '#1e2130', color: '#e8eaf6', border: '1px solid #2a2d3e' }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[9px]" style={{ color: '#555a7a' }}>Fade-Zeit (ms)</label>
        <input
          type="number" min={0} step={100}
          value={scene.fadeTime}
          onChange={(e) => onChange({ fadeTime: Number(e.target.value) })}
          className="rounded px-2 py-1 text-xs w-full"
          style={{ background: '#1e2130', color: '#e8eaf6', border: '1px solid #2a2d3e' }}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[9px]" style={{ color: '#555a7a' }}>Bank</label>
        <select
          value={scene.bankId ?? ''}
          onChange={(e) => onChange({ bankId: e.target.value || undefined })}
          className="rounded px-2 py-1 text-xs w-full"
          style={{ background: '#1e2130', color: '#e8eaf6', border: '1px solid #2a2d3e' }}
        >
          <option value="">Keine Bank</option>
          {banks.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

// ─── Attribute faders (bottom) ────────────────────────────────────────────────
interface AttributeFadersProps {
  fixtures: PatchedFixture[]
  library: FixtureDefinition[]
  scene: Scene
  onValueChange: (universe: number, channel: number, value: number) => void
}

function AttributeFaders({ fixtures, library, scene, onValueChange }: AttributeFadersProps): React.JSX.Element {
  const channels = useMemo(() => {
    const result: { universe: number; ch: number; label: string; fixtureName: string }[] = []
    for (const fx of fixtures) {
      const def = library.find((d) => d.id === fx.definitionId)
      if (!def) continue
      const mode = def.modes[fx.modeIndex]
      if (!mode) continue
      for (const ch of mode.channels) {
        result.push({
          universe: fx.universe,
          ch: fx.startAddress + ch.number - 1,
          label: ch.name,
          fixtureName: fx.name,
        })
      }
    }
    return result
  }, [fixtures, library])

  return (
    <div className="shrink-0 flex flex-col" style={{ height: 140, borderTop: '1px solid #1e2130', background: '#0a0c12' }}>
      <div className="px-3 py-1 flex items-center justify-between shrink-0">
        <span className="text-[9px] uppercase tracking-widest" style={{ color: '#3a3f5a' }}>Kanal-Attribute</span>
        <span className="text-[9px]" style={{ color: '#3a3f5a' }}>{channels.length} Kanäle</span>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full items-end gap-2 px-3 pb-2" style={{ minWidth: 'max-content' }}>
          {channels.map(({ universe, ch, label, fixtureName }) => {
            const value = (scene.values[universe] ?? [])[ch - 1] ?? 0
            return (
              <div key={`${universe}-${ch}`} className="flex flex-col items-center gap-0.5" style={{ width: 36 }}>
                <span className="text-[9px]" style={{ color: '#6c63ff' }}>{value}</span>
                <input
                  type="range" min={0} max={255} value={value}
                  onChange={(e) => onValueChange(universe, ch, Number(e.target.value))}
                  className="h-16 accent-violet-500"
                  style={{ writingMode: 'vertical-lr', direction: 'rtl', cursor: 'pointer' }}
                  title={`${fixtureName} — ${label}`}
                />
                <span
                  className="text-[8px] text-center leading-tight"
                  style={{ color: '#555a7a', maxWidth: 34, wordBreak: 'break-word' }}
                >
                  {label.length > 6 ? label.slice(0, 5) + '…' : label}
                </span>
              </div>
            )
          })}
          {channels.length === 0 && (
            <div className="flex items-center justify-center w-full" style={{ color: '#3a3f5a' }}>
              <span className="text-xs">Keine Kanäle — Fixtures patchen und Gruppe auswählen.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

