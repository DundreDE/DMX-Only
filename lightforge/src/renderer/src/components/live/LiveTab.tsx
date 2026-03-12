import { useState } from 'react'
import { useFixtureStore } from '../../store/useFixtureStore'
import { useDmxStore } from '../../store/useDmxStore'
import type { Scene } from '../../../../shared/types'

export function LiveTab(): React.JSX.Element {
  const { scenes, banks } = useFixtureStore()
  const { setChannel, master, setMaster, blackout, setBlackout } = useDmxStore()
  const [activeId, setActiveId] = useState<string | null>(null)

  function activateScene(scene: Scene): void {
    setActiveId(scene.id)
    for (const [uniStr, vals] of Object.entries(scene.values)) {
      const uni = Number(uniStr)
      vals.forEach((v, idx) => {
        if (v > 0) setChannel(uni, idx + 1, v)
      })
    }
  }

  function bankColor(scene: Scene): string {
    const b = banks.find((bk) => bk.id === scene.bankId)
    return b?.color ?? '#6c63ff'
  }

  const visibleBanks = banks.filter((b) => scenes.some((s) => s.bankId === b.id))
  const unbankered = scenes.filter((s) => !s.bankId)

  return (
    <div className="flex h-full" style={{ background: '#0a0c12' }}>
      <div className="flex-1 overflow-auto p-4">
        {scenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: '#3a3f5a' }}>
            <span className="text-5xl">🎬</span>
            <p className="text-sm font-medium" style={{ color: '#555a7a' }}>Keine Szenen vorhanden</p>
            <p className="text-xs">Wechsle zu CONTROL → Szenen, um Szenen zu erstellen.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {visibleBanks.map((bank) => {
              const bankScenes = scenes.filter((s) => s.bankId === bank.id)
              return (
                <div key={bank.id}>
                  <div className="flex items-center gap-2 mb-2" style={{ borderLeft: `3px solid ${bank.color}`, paddingLeft: 8 }}>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: bank.color }}>{bank.name}</span>
                    <span className="text-[9px]" style={{ color: `${bank.color}77` }}>{bankScenes.length} Szene{bankScenes.length !== 1 ? 'n' : ''}</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {bankScenes.map((scene) => (
                      <LiveSceneButton key={scene.id} scene={scene} color={bankColor(scene)} isActive={activeId === scene.id} onActivate={() => activateScene(scene)} />
                    ))}
                  </div>
                </div>
              )
            })}
            {unbankered.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2" style={{ borderLeft: '3px solid #555a7a', paddingLeft: 8 }}>
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#555a7a' }}>Ohne Bank</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {unbankered.map((scene) => (
                    <LiveSceneButton key={scene.id} scene={scene} color="#555a7a" isActive={activeId === scene.id} onActivate={() => activateScene(scene)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div
        className="flex flex-col items-center gap-4 py-4 px-3 shrink-0"
        style={{ width: 90, borderLeft: '1px solid #1e2130', background: '#07090f' }}
      >
        <span className="text-[9px] uppercase tracking-widest" style={{ color: '#3a3f5a' }}>Master</span>
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[10px] font-bold" style={{ color: '#6c63ff' }}>{Math.round((master / 255) * 100)}%</span>
          <input
            type="range" min={0} max={255} value={master}
            onChange={(e) => setMaster(Number(e.target.value))}
            className="flex-1 accent-violet-500"
            style={{ writingMode: 'vertical-lr', direction: 'rtl', cursor: 'pointer', width: 32 }}
          />
          <span className="text-[9px]" style={{ color: '#3a3f5a' }}>0%</span>
        </div>
        <button
          onClick={() => setBlackout(!blackout)}
          className="w-full py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
          style={{
            background: blackout ? '#ff4d6a' : '#1e2130',
            color: blackout ? '#fff' : '#555a7a',
            border: `2px solid ${blackout ? '#ff4d6a' : '#2a2d3e'}`,
            boxShadow: blackout ? '0 0 16px #ff4d6a88' : 'none',
          }}
        >
          {blackout ? 'ON' : 'BLK'}
        </button>
        <span className="text-[8px] uppercase tracking-widest -mt-3" style={{ color: '#3a3f5a' }}>Blackout</span>
      </div>
    </div>
  )
}

function LiveSceneButton({ scene, color, isActive, onActivate }: {
  scene: Scene; color: string; isActive: boolean; onActivate: () => void
}): React.JSX.Element {
  return (
    <button
      onClick={onActivate}
      className="relative rounded-xl text-left transition-all"
      style={{
        background: isActive ? `${color}33` : `${color}15`,
        border: `2px solid ${isActive ? color : color + '44'}`,
        width: 140, height: 110,
        boxShadow: isActive ? `0 0 12px ${color}66` : 'none',
        transform: isActive ? 'scale(0.98)' : 'scale(1)',
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
