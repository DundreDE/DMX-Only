import { useEffect } from "react"
import { TitleBar } from "./components/layout/TitleBar"
import { PatchPanel } from "./components/fixture/PatchPanel"
import { FixtureBrowser } from "./components/fixture/FixtureBrowser"
import { ControlTab } from "./components/control/ControlTab"
import { LiveTab } from "./components/live/LiveTab"
import { Settings } from "./components/pro/Settings"
import { useAppStore } from "./store/useAppStore"
import { useDmxStore } from "./store/useDmxStore"
import { useState } from "react"

function App(): React.JSX.Element {
  const { tab } = useAppStore()
  const { setUniverseValues } = useDmxStore()

  useEffect(() => {
    const unsub = window.dmx.onUniverseUpdate(({ universe, values }) => {
      setUniverseValues(universe, values)
    })
    return unsub
  }, [])

  return (
    <div className="flex flex-col w-full h-full" style={{ background: "#0f1117" }}>
      <TitleBar />
      <main className="flex-1 overflow-hidden">
        {tab === 'setup'    && <SetupTab />}
        {tab === 'control'  && <ControlTab />}
        {tab === 'live'     && <LiveTab />}
        {tab === 'settings' && <Settings />}
      </main>
    </div>
  )
}

// Setup tab: two sub-tabs (Fixtures | Patch)
function SetupTab(): React.JSX.Element {
  const [sub, setSub] = useState<'patch' | 'fixtures'>('patch')
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-0.5 px-3 shrink-0" style={{ borderBottom: '1px solid #1e2130', background: '#0f1117' }}>
        {([['patch', '🔌 Patch'], ['fixtures', '📦 Fixture-Bibliothek']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSub(id)}
            className="px-3 py-2 text-xs font-medium transition-all"
            style={{
              color: sub === id ? '#e8eaf6' : '#555a7a',
              borderBottom: `2px solid ${sub === id ? '#6c63ff' : 'transparent'}`,
              background: 'transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {sub === 'patch'    && <PatchPanel />}
        {sub === 'fixtures' && <FixtureBrowser />}
      </div>
    </div>
  )
}

export default App
