import { useAppStore, type AppTab } from '../../store/useAppStore'
import { useDmxStore } from '../../store/useDmxStore'

const TABS: { id: AppTab; label: string }[] = [
  { id: 'setup',    label: 'SETUP'   },
  { id: 'control',  label: 'CONTROL' },
  { id: 'live',     label: 'LIVE'    },
]

export function TitleBar(): React.JSX.Element {
  const { tab, setTab, projectName, isDirty, outputConnected, outputName } = useAppStore()
  const { master, setMaster, blackout, setBlackout } = useDmxStore()

  return (
    <div
      className="flex items-center h-10 shrink-0 select-none"
      style={{ WebkitAppRegion: 'drag', background: '#0a0c12', borderBottom: '1px solid #1e2130' } as React.CSSProperties}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 shrink-0">
        <span className="text-[11px] font-black tracking-widest uppercase" style={{ color: '#6c63ff' }}>
          LightForge
        </span>
        <span className="text-[10px]" style={{ color: '#3a3f5a' }}>
          {projectName}{isDirty ? ' ●' : ''}
        </span>
      </div>

      {/* Tab navigation */}
      <div
        className="flex items-stretch h-full gap-px ml-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-5 text-[11px] font-bold tracking-widest transition-all"
            style={{
              background: tab === t.id ? '#1e2130' : 'transparent',
              color: tab === t.id ? '#e8eaf6' : '#555a7a',
              borderBottom: `2px solid ${tab === t.id ? '#6c63ff' : 'transparent'}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />

      {/* Global controls */}
      <div
        className="flex items-center gap-2 px-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Blackout */}
        <button
          onClick={() => setBlackout(!blackout)}
          className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all"
          style={{
            background: blackout ? '#ff4d6a' : '#1e2130',
            color: blackout ? '#fff' : '#555a7a',
            border: `1px solid ${blackout ? '#ff4d6a' : '#2a2d3e'}`,
          }}
        >
          BLACKOUT
        </button>

        {/* Master dimmer */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] uppercase tracking-wider" style={{ color: '#555a7a' }}>Master</span>
          <input
            type="range"
            min={0}
            max={255}
            value={master}
            onChange={(e) => setMaster(Number(e.target.value))}
            className="w-20 h-1 accent-violet-500"
            style={{ cursor: 'pointer' }}
            title={`Master: ${Math.round((master / 255) * 100)}%`}
          />
          <span className="text-[10px] w-7 text-right" style={{ color: '#6c63ff' }}>
            {Math.round((master / 255) * 100)}%
          </span>
        </div>

        {/* Output status */}
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded"
          style={{ background: '#1e2130', border: '1px solid #2a2d3e' }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: outputConnected ? '#00d68f' : '#555a7a' }} />
          <span className="text-[10px] max-w-[120px] truncate" style={{ color: '#9097b8' }}>{outputName}</span>
        </div>

        {/* Settings icon */}
        <button
          onClick={() => setTab('settings')}
          className="w-7 h-7 flex items-center justify-center rounded text-sm transition-colors"
          style={{
            background: tab === 'settings' ? '#6c63ff22' : 'transparent',
            color: tab === 'settings' ? '#6c63ff' : '#555a7a',
          }}
          title="Einstellungen"
        >⚙</button>

        {/* Window controls */}
        <div className="flex items-center gap-0.5 ml-1">
          <button onClick={() => window.windowAPI.minimize()} className="w-6 h-6 flex items-center justify-center rounded text-xs transition-colors hover:bg-white/10" style={{ color: '#9097b8' }}>─</button>
          <button onClick={() => window.windowAPI.maximize()} className="w-6 h-6 flex items-center justify-center rounded text-xs transition-colors hover:bg-white/10" style={{ color: '#9097b8' }}>□</button>
          <button onClick={() => window.windowAPI.close()}   className="w-6 h-6 flex items-center justify-center rounded text-xs transition-colors hover:bg-red-600/80"  style={{ color: '#9097b8' }}>✕</button>
        </div>
      </div>
    </div>
  )
}
