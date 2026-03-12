import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDmxStore } from '../../store/useDmxStore'
import { useFixtureStore } from '../../store/useFixtureStore'

// 512-channel DMX console (Pro mode)
export function DmxConsole(): React.JSX.Element {
  const { t } = useTranslation()
  const { getChannel, setChannel } = useDmxStore()
  const { patch, library } = useFixtureStore()
  const [universe, setUniverse] = useState(1)

  // Build channel labels from patch
  const channelLabels: Record<number, { fixture: string; channel: string; color: string }> = {}
  for (const fx of patch.filter((p) => p.universe === universe)) {
    const def = library.find((d) => d.id === fx.definitionId)
    const mode = def?.modes[fx.modeIndex]
    if (!mode) continue
    mode.channels.forEach((ch) => {
      const absAddr = fx.startAddress + ch.number - 1
      if (absAddr >= 1 && absAddr <= 512) {
        channelLabels[absAddr] = {
          fixture: fx.name,
          channel: ch.name,
          color: capTypeColor(ch.primaryType)
        }
      }
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Universe selector */}
      <div className="flex items-center gap-3 px-4 py-2 shrink-0" style={{ borderBottom: '1px solid #1e2130' }}>
        <span className="text-xs font-semibold" style={{ color: '#9097b8' }}>{t('dmx.universe')}:</span>
        {[1, 2, 3, 4].map((u) => (
          <button
            key={u}
            onClick={() => setUniverse(u)}
            className="px-3 py-1 rounded text-xs font-medium transition-all"
            style={{
              background: universe === u ? '#6c63ff' : '#1e2130',
              color: universe === u ? '#fff' : '#9097b8'
            }}
          >
            {u}
          </button>
        ))}
        <span className="text-xs ml-auto" style={{ color: '#555a7a' }}>
          {t('dmx.channels')}: 512
        </span>
      </div>

      {/* Faders grid */}
      <div className="flex-1 overflow-x-auto overflow-y-auto px-2 py-2">
        <div className="flex gap-1 min-w-max pb-2">
          {Array.from({ length: 512 }, (_, i) => i + 1).map((ch) => {
            const value = getChannel(universe, ch)
            const label = channelLabels[ch]
            return (
              <div
                key={ch}
                className="flex flex-col items-center gap-0.5 w-8 shrink-0"
                title={label ? `${label.fixture} — ${label.channel}` : `Kanal ${ch}`}
              >
                <div
                  className="w-full h-1 rounded-full"
                  style={{ background: label ? label.color : '#2a2d3e' }}
                />
                <input
                  type="range"
                  className="vertical"
                  min={0}
                  max={255}
                  value={value}
                  onChange={(e) => setChannel(universe, ch, Number(e.target.value))}
                  style={{ height: '80px', accentColor: label?.color ?? '#6c63ff' }}
                />
                <span
                  className="text-[8px] text-center w-full truncate"
                  style={{ color: value > 0 ? (label?.color ?? '#9097b8') : '#555a7a' }}
                >
                  {value > 0 ? value : ch}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function capTypeColor(type: string): string {
  const m: Record<string, string> = {
    Dimmer: '#ffb300', Red: '#ff4d6a', Green: '#00d68f', Blue: '#6c9cff',
    White: '#e8eaf6', Amber: '#ff8800', UV: '#cc44ff', Pan: '#00ccff',
    Tilt: '#00aaff', Gobo: '#aaaaff', Shutter: '#ffcc00', Strobe: '#ff4444', Generic: '#9097b8'
  }
  return m[type] ?? '#9097b8'
}
