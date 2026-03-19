import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import i18n from '../../i18n'
import { useAppStore } from '../../store/useAppStore'
import { useFixtureStore } from '../../store/useFixtureStore'

interface PortEntry {
  path: string
  displayName: string
  manufacturer?: string
}

export function Settings(): React.JSX.Element {
  const { t } = useTranslation()
  const { outputName, outputConnected } = useAppStore()
  const { library, clearLibrary } = useFixtureStore()
  const [lang, setLang] = useState(i18n.language)

  const [ports, setPorts] = useState<PortEntry[]>([])
  const [scanning, setScanning] = useState(false)
  const [selectedPort, setSelectedPort] = useState<string>('')
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  const changeLanguage = (l: string): void => {
    setLang(l)
    i18n.changeLanguage(l)
    localStorage.setItem('lightforge-language', l)
  }

  const handleScanPorts = async (): Promise<void> => {
    setScanning(true)
    setConnectError(null)
    try {
      const found = await window.dmx.listSerialPorts()
      setPorts(found)
      if (found.length > 0 && !selectedPort) setSelectedPort(found[0].path)
    } finally {
      setScanning(false)
    }
  }

  const handleConnect = async (): Promise<void> => {
    if (!selectedPort) return
    setConnecting(true)
    setConnectError(null)
    try {
      const port = ports.find((p) => p.path === selectedPort)
      const result = await window.dmx.connectSerial(selectedPort, port?.displayName ?? selectedPort)
      if (result.success && result.info) {
        useAppStore.getState().setOutputStatus(result.info.connected, result.info.name)
      } else {
        setConnectError(result.error ?? 'Verbindung fehlgeschlagen')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Verbindung fehlgeschlagen'
      setConnectError(message)
      console.error('DMX connection error:', error)
    } finally {
      setConnecting(false)
    }
  }

  const handleUsePreview = async (): Promise<void> => {
    const info = await window.dmx.usePreview()
    useAppStore.getState().setOutputStatus(info.connected, info.name)
  }

  return (
    <div className="flex flex-col gap-6 px-6 py-5 max-w-xl">
      <h2 className="text-base font-semibold" style={{ color: '#e8eaf6' }}>{t('settings.settings')}</h2>

      {/* Language */}
      <Section title={t('settings.language')}>
        <div className="flex gap-2">
          {[{ code: 'de', label: '🇩🇪 Deutsch' }, { code: 'en', label: '🇬🇧 English' }].map((l) => (
            <button
              key={l.code}
              onClick={() => changeLanguage(l.code)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-all"
              style={{
                background: lang === l.code ? '#6c63ff' : '#1e2130',
                color: lang === l.code ? '#fff' : '#9097b8',
                border: `1px solid ${lang === l.code ? '#6c63ff' : '#2a2d3e'}`
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      </Section>

      {/* DMX Output */}
      <Section title={t('settings.dmxOutput')}>
        {/* Current status */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ background: outputConnected ? '#00d68f' : '#555a7a' }} />
          <span className="text-xs" style={{ color: '#9097b8' }}>{outputName}</span>
        </div>

        {/* Hardware: USB/Serial */}
        <div className="mb-3 p-3 rounded" style={{ background: '#131620', border: '1px solid #2a2d3e' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#555a7a' }}>
            USB / Seriell (FTDI, RS485, Enttec Open)
          </p>

          <div className="flex gap-2 mb-2">
            <select
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
              className="flex-1 px-2 py-1.5 rounded text-xs outline-none"
              style={{ background: '#2a2d3e', color: '#e8eaf6', border: '1px solid #3a3f5a' }}
            >
              {ports.length === 0 && (
                <option value="">— Ports scannen —</option>
              )}
              {ports.map((p) => (
                <option key={p.path} value={p.path}>{p.displayName}</option>
              ))}
            </select>

            <button
              onClick={handleScanPorts}
              disabled={scanning}
              className="px-3 py-1.5 rounded text-xs shrink-0"
              style={{ background: '#1e2130', color: '#9097b8', border: '1px solid #2a2d3e', opacity: scanning ? 0.6 : 1 }}
            >
              {scanning ? '…' : '🔍 Scannen'}
            </button>
          </div>

          <button
            onClick={handleConnect}
            disabled={connecting || !selectedPort || ports.length === 0}
            className="w-full py-1.5 rounded text-xs font-medium transition-all"
            style={{
              background: selectedPort && ports.length > 0 ? '#6c63ff' : '#2a2d3e',
              color: selectedPort && ports.length > 0 ? '#fff' : '#555a7a',
              opacity: connecting ? 0.6 : 1
            }}
          >
            {connecting ? 'Verbinde…' : '⚡ Verbinden'}
          </button>

          {connectError && (
            <p className="text-[10px] mt-2" style={{ color: '#ff4d6a' }}>⚠ {connectError}</p>
          )}

          {ports.length === 0 && !scanning && (
            <p className="text-[10px] mt-2" style={{ color: '#555a7a' }}>
              Kabel einstecken, dann auf Scannen klicken.
            </p>
          )}
        </div>

        {/* Preview fallback */}
        <button
          onClick={handleUsePreview}
          className="px-3 py-1.5 rounded text-xs"
          style={{ background: '#1e2130', color: '#9097b8', border: '1px solid #2a2d3e' }}
        >
          🖥 {t('dmx.preview')}
        </button>
      </Section>

      {/* Fixture Library */}
      <Section title={t('fixture.fixtures')}>
        <p className="text-xs mb-2" style={{ color: '#9097b8' }}>
          {library.length} Fixtures in der Bibliothek
        </p>
        <button
          onClick={() => { if (confirm('Fixture-Bibliothek leeren?')) clearLibrary() }}
          className="px-3 py-1.5 rounded text-xs"
          style={{ background: '#ff4d6a22', color: '#ff4d6a', border: '1px solid #ff4d6a44' }}
        >
          Bibliothek leeren
        </button>
      </Section>

      {/* About */}
      <Section title={t('settings.about')}>
        <div className="text-xs space-y-1" style={{ color: '#9097b8' }}>
          <p><span style={{ color: '#6c63ff', fontWeight: 600 }}>LightForge</span> — Freie DMX-Lichtsteuerung</p>
          <p>Open Source • MIT Lizenz</p>
          <p style={{ color: '#555a7a' }}>
            Kompatibel mit QLC+ Fixtures (.qxf)<br />
            Unterstützt: USB/RS485 FTDI, Enttec Open, Preview
          </p>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#555a7a' }}>{title}</h3>
      <div className="pl-2">{children}</div>
    </div>
  )
}
