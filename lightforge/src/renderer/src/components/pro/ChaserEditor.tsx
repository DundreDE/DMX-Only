import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFixtureStore } from '../../store/useFixtureStore'
import type { Chaser, ChaserStep, Scene } from '../../../../shared/types'

export function ChaserEditor(): React.JSX.Element {
  const { t } = useTranslation()
  const { chasers, scenes, addChaser, updateChaser, deleteChaser } = useFixtureStore()
  const [editingId, setEditingId] = useState<string | null>(null)

  const createChaser = (): void => {
    const id = addChaser({ name: `Chaser ${chasers.length + 1}`, steps: [], loop: true, running: false })
    setEditingId(id)
  }

  return (
    <div className="flex h-full">
      {/* List */}
      <div className="flex flex-col w-52 shrink-0" style={{ borderRight: '1px solid #1e2130' }}>
        <div className="px-3 py-2 flex items-center justify-between" style={{ borderBottom: '1px solid #1e2130' }}>
          <span className="text-xs font-semibold" style={{ color: '#9097b8' }}>{t('chaser.chasers')}</span>
          <button onClick={createChaser} className="px-2 py-0.5 rounded text-[11px]" style={{ background: '#6c63ff', color: '#fff' }}>
            + Neu
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chasers.map((ch) => (
            <div
              key={ch.id}
              className="flex items-center justify-between px-3 py-2 cursor-pointer transition-colors"
              style={{
                background: editingId === ch.id ? '#6c63ff22' : 'transparent',
                borderLeft: `2px solid ${editingId === ch.id ? '#6c63ff' : 'transparent'}`,
                borderBottom: '1px solid #1a1d27'
              }}
              onClick={() => setEditingId(ch.id)}
            >
              <div>
                <div className="text-xs font-medium" style={{ color: editingId === ch.id ? '#6c63ff' : '#e8eaf6' }}>{ch.name}</div>
                <div className="text-[10px]" style={{ color: '#555a7a' }}>{ch.steps.length} Schritte{ch.loop ? ' • ⟳' : ''}</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteChaser(ch.id); if (editingId === ch.id) setEditingId(null) }}
                className="w-5 h-5 flex items-center justify-center rounded text-[10px]"
                style={{ color: '#555a7a' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#ff4d6a')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#555a7a')}
              >✕</button>
            </div>
          ))}
          {chasers.length === 0 && (
            <p className="px-3 py-4 text-xs text-center" style={{ color: '#555a7a' }}>Noch keine Chaser</p>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        {editingId == null ? (
          <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: '#555a7a' }}>
            <span className="text-3xl">🔄</span>
            <p className="text-sm">Chaser auswählen oder neu erstellen</p>
          </div>
        ) : (
          <ChaserDetail chaserID={editingId} scenes={scenes} updateChaser={updateChaser} />
        )}
      </div>
    </div>
  )
}

function ChaserDetail({
  chaserID,
  scenes,
  updateChaser
}: {
  chaserID: string
  scenes: Scene[]
  updateChaser: (id: string, changes: Partial<Chaser>) => void
}): React.JSX.Element {
  const { chasers } = useFixtureStore()
  const chaser = chasers.find((c) => c.id === chaserID)
  if (!chaser) return <></>

  const addStep = (): void => {
    if (scenes.length === 0) return
    const newStep: ChaserStep = { sceneId: scenes[0].id, holdTime: 1000, fadeTime: 500 }
    updateChaser(chaserID, { steps: [...chaser.steps, newStep] })
  }

  const updateStep = (idx: number, changes: Partial<ChaserStep>): void => {
    const steps = chaser.steps.map((s, i) => (i === idx ? { ...s, ...changes } : s))
    updateChaser(chaserID, { steps })
  }

  const removeStep = (idx: number): void => {
    updateChaser(chaserID, { steps: chaser.steps.filter((_, i) => i !== idx) })
  }

  return (
    <div className="px-4 py-3">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          value={chaser.name}
          onChange={(e) => updateChaser(chaserID, { name: e.target.value })}
          className="px-2 py-1 rounded text-sm font-semibold"
          style={{ background: '#2a2d3e', color: '#e8eaf6', border: '1px solid #3a3f5a' }}
        />
        <label className="flex items-center gap-1 text-xs" style={{ color: '#9097b8' }}>
          <input
            type="checkbox"
            checked={chaser.loop}
            onChange={(e) => updateChaser(chaserID, { loop: e.target.checked })}
            className="accent-violet-500"
          />
          Wiederholen
        </label>
        <button onClick={addStep} className="px-3 py-1 rounded text-xs ml-auto" style={{ background: '#6c63ff', color: '#fff' }}>
          + Schritt
        </button>
      </div>

      {/* Steps */}
      {chaser.steps.length === 0 ? (
        <p className="text-xs text-center py-8" style={{ color: '#555a7a' }}>
          Noch keine Schritte — klicke auf „+ Schritt"
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {chaser.steps.map((step, idx) => {
            const scene = scenes.find((s) => s.id === step.sceneId)
            return (
              <div key={idx} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: '#1a1d27', border: '1px solid #2a2d3e' }}>
                <span className="text-xs font-mono w-5 text-center shrink-0" style={{ color: '#555a7a' }}>{idx + 1}</span>

                {/* Scene select */}
                <select
                  value={step.sceneId}
                  onChange={(e) => updateStep(idx, { sceneId: e.target.value })}
                  className="flex-1 px-2 py-1 rounded text-xs"
                  style={{ background: '#2a2d3e', color: '#e8eaf6', border: '1px solid #3a3f5a' }}
                >
                  {scenes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                {/* Hold time */}
                <label className="flex items-center gap-1 text-[11px]" style={{ color: '#9097b8' }}>
                  Hold:
                  <input
                    type="number" min={0} max={60000} step={100} value={step.holdTime}
                    onChange={(e) => updateStep(idx, { holdTime: Number(e.target.value) })}
                    className="w-16 px-1 py-0.5 rounded text-[11px]"
                    style={{ background: '#2a2d3e', color: '#e8eaf6', border: '1px solid #3a3f5a' }}
                  />
                  <span style={{ color: '#555a7a' }}>ms</span>
                </label>

                {/* Fade time */}
                <label className="flex items-center gap-1 text-[11px]" style={{ color: '#9097b8' }}>
                  Fade:
                  <input
                    type="number" min={0} max={10000} step={100} value={step.fadeTime}
                    onChange={(e) => updateStep(idx, { fadeTime: Number(e.target.value) })}
                    className="w-16 px-1 py-0.5 rounded text-[11px]"
                    style={{ background: '#2a2d3e', color: '#e8eaf6', border: '1px solid #3a3f5a' }}
                  />
                  <span style={{ color: '#555a7a' }}>ms</span>
                </label>

                <button
                  onClick={() => removeStep(idx)}
                  className="w-5 h-5 flex items-center justify-center rounded text-[10px]"
                  style={{ color: '#555a7a' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ff4d6a')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#555a7a')}
                >✕</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
