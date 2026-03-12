import { useState } from 'react'
import { SceneEditor } from '../pro/SceneEditor'
import { ChaserEditor } from '../pro/ChaserEditor'
import { DmxConsole } from '../pro/DmxConsole'

type CtrlSub = 'scenes' | 'chasers' | 'console'

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
        {sub === 'scenes'  && <SceneEditor />}
        {sub === 'chasers' && <ChaserEditor />}
        {sub === 'console' && <DmxConsole />}
      </div>
    </div>
  )
}
