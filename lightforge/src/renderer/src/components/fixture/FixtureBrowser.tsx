import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useFixtureStore } from '../../store/useFixtureStore'
import type { FixtureDefinition } from '../../../../shared/types'

export function FixtureBrowser(): React.JSX.Element {
  const { t } = useTranslation()
  const { library, addToLibrary, getManufacturers, getByManufacturer } = useFixtureStore()
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState(false)
  const [lastImport, setLastImport] = useState<string | null>(null)

  const manufacturers = getManufacturers()

  const displayedFixtures = useMemo((): FixtureDefinition[] => {
    const q = search.trim().toLowerCase()
    if (q) {
      return library
        .filter((f) => f.model.toLowerCase().includes(q) || f.manufacturer.toLowerCase().includes(q))
        .sort((a, b) => a.manufacturer.localeCompare(b.manufacturer) || a.model.localeCompare(b.model))
    }
    if (selectedManufacturer) return getByManufacturer(selectedManufacturer)
    return []
  }, [library, search, selectedManufacturer])

  const handleImportFolder = async (): Promise<void> => {
    setImporting(true)
    setLastImport(null)
    try {
      const result = await window.fixture.importFolder()
      if (result) {
        addToLibrary(result.fixtures)
        setLastImport(
          `✓ ${result.fixtureCount} Fixtures von ${result.manufacturerCount} Herstellern geladen` +
          (result.errors.length ? ` (${result.errors.length} Fehler)` : '')
        )
      }
    } finally {
      setImporting(false)
    }
  }

  const handleImportFiles = async (): Promise<void> => {
    setImporting(true)
    setLastImport(null)
    try {
      const fixtures = await window.fixture.importQxf()
      if (fixtures.length) {
        addToLibrary(fixtures)
        setLastImport(`✓ ${fixtures.length} Fixture(s) importiert`)
      }
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex h-full" style={{ color: '#e8eaf6' }}>
      {/* Left panel: manufacturer list */}
      <div className="flex flex-col w-52 shrink-0" style={{ borderRight: '1px solid #1e2130' }}>
        <div className="px-3 py-2 flex flex-col gap-2" style={{ borderBottom: '1px solid #1e2130' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#555a7a' }}>
            {t('fixture.fixtures')}
          </p>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleImportFolder}
              disabled={importing}
              className="w-full py-1.5 px-2 rounded text-xs font-medium transition-all flex items-center gap-1.5"
              style={{ background: '#6c63ff', color: '#fff', opacity: importing ? 0.6 : 1 }}
            >
              📂 {importing ? 'Lade…' : 'Ordner laden'}
            </button>
            <button
              onClick={handleImportFiles}
              disabled={importing}
              className="w-full py-1.5 px-2 rounded text-xs transition-all"
              style={{ background: '#1e2130', color: '#9097b8', border: '1px solid #2a2d3e' }}
            >
              + {t('fixture.importQxf')}
            </button>
          </div>
          {lastImport && (
            <p className="text-[10px]" style={{ color: '#00d68f' }}>{lastImport}</p>
          )}
        </div>

        {/* Search */}
        <div className="px-2 py-2" style={{ borderBottom: '1px solid #1e2130' }}>
          <input
            type="text"
            placeholder={t('controls.search') + '…'}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedManufacturer(null) }}
            className="w-full px-2 py-1 rounded text-xs outline-none"
            style={{ background: '#2a2d3e', color: '#e8eaf6', border: '1px solid #3a3f5a' }}
          />
        </div>

        {/* Manufacturer list */}
        <div className="flex-1 overflow-y-auto">
          {manufacturers.length === 0 ? (
            <div className="p-3 text-center text-xs" style={{ color: '#555a7a' }}>
              {t('fixture.noFixtures')}
            </div>
          ) : (
            manufacturers.map((m) => (
              <button
                key={m}
                onClick={() => { setSelectedManufacturer(m); setSearch('') }}
                className="w-full text-left px-3 py-1.5 text-xs transition-all"
                style={{
                  background: selectedManufacturer === m ? '#6c63ff22' : 'transparent',
                  color: selectedManufacturer === m ? '#6c63ff' : '#9097b8',
                  borderLeft: selectedManufacturer === m ? '2px solid #6c63ff' : '2px solid transparent'
                }}
              >
                {m}
              </button>
            ))
          )}
        </div>

        {/* Library stats */}
        {library.length > 0 && (
          <div className="px-3 py-2" style={{ borderTop: '1px solid #1e2130', color: '#555a7a' }}>
            <span className="text-[10px]">{library.length} Fixtures • {manufacturers.length} Hersteller</span>
          </div>
        )}
      </div>

      {/* Right panel: fixture list */}
      <div className="flex-1 overflow-y-auto">
        {displayedFixtures.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: '#555a7a' }}>
            {library.length === 0 ? (
              <>
                <span className="text-4xl">💡</span>
                <p className="text-sm">Lade den QLC+ Fixture-Ordner</p>
                <p className="text-xs">oder einzelne .qxf Dateien importieren</p>
                <button
                  onClick={handleImportFolder}
                  className="mt-2 px-4 py-2 rounded font-medium text-sm"
                  style={{ background: '#6c63ff', color: '#fff' }}
                >
                  📂 Fixture-Ordner laden
                </button>
              </>
            ) : (
              <p className="text-sm">Hersteller auswählen oder suchen</p>
            )}
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid #1e2130', color: '#555a7a' }}>
                <th className="text-left px-3 py-2 font-medium">{t('fixture.model')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('fixture.type')}</th>
                <th className="text-left px-3 py-2 font-medium">{t('fixture.channels')}</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {displayedFixtures.map((fx) => (
                <FixtureRow key={fx.id} fixture={fx} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function FixtureRow({ fixture }: { fixture: FixtureDefinition }): React.JSX.Element {
  const { t } = useTranslation()
  const { patchFixture } = useFixtureStore()
  const [expanded, setExpanded] = useState(false)
  const [patchMode, setPatchMode] = useState(false)
  const [modeIdx, setModeIdx] = useState(0)
  const [universe, setUniverse] = useState(1)
  const [address, setAddress] = useState(1)
  const [name, setName] = useState(fixture.model)

  const mode = fixture.modes[modeIdx]

  return (
    <>
      <tr
        className="cursor-pointer transition-colors"
        style={{ borderBottom: '1px solid #1a1d27' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#1e2130')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        onClick={() => setExpanded(!expanded)}
      >
        <td className="px-3 py-1.5 font-medium" style={{ color: '#e8eaf6' }}>
          {fixture.model}
        </td>
        <td className="px-3 py-1.5" style={{ color: '#9097b8' }}>{fixture.type}</td>
        <td className="px-3 py-1.5" style={{ color: '#9097b8' }}>
          {fixture.modes.map((m) => m.channels.length).join(' / ')}
        </td>
        <td className="px-3 py-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setPatchMode(true); setExpanded(true) }}
            className="px-2 py-0.5 rounded text-[10px] transition-colors"
            style={{ background: '#6c63ff22', color: '#6c63ff', border: '1px solid #6c63ff44' }}
          >
            + {t('patch.patch')}
          </button>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={4} style={{ background: '#131620', borderBottom: '1px solid #1e2130' }}>
            <div className="px-4 py-3">
              {/* Mode selector */}
              {fixture.modes.length > 1 && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px]" style={{ color: '#555a7a' }}>{t('fixture.mode')}:</span>
                  <div className="flex gap-1">
                    {fixture.modes.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => setModeIdx(i)}
                        className="px-2 py-0.5 rounded text-[10px] transition-all"
                        style={{
                          background: modeIdx === i ? '#6c63ff' : '#1e2130',
                          color: modeIdx === i ? '#fff' : '#9097b8'
                        }}
                      >
                        {m.name} ({m.channels.length}ch)
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Channel list */}
              {mode && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {mode.channels.map((ch) => (
                    <span
                      key={ch.number}
                      className="px-1.5 py-0.5 rounded text-[10px]"
                      style={{ background: '#1e2130', color: channelColor(ch.primaryType) }}
                    >
                      {ch.number}: {ch.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Patch form */}
              {patchMode && (
                <div className="flex items-center gap-3 flex-wrap p-2 rounded" style={{ background: '#1e2130' }}>
                  <label className="flex items-center gap-1 text-[11px]" style={{ color: '#9097b8' }}>
                    {t('patch.name')}:
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="ml-1 px-2 py-0.5 rounded text-[11px] w-32"
                      style={{ background: '#2a2d3e', color: '#e8eaf6', border: '1px solid #3a3f5a' }}
                    />
                  </label>
                  <label className="flex items-center gap-1 text-[11px]" style={{ color: '#9097b8' }}>
                    {t('patch.universe')}:
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={universe}
                      onChange={(e) => setUniverse(Number(e.target.value))}
                      className="ml-1 px-2 py-0.5 rounded text-[11px] w-14"
                      style={{ background: '#2a2d3e', color: '#e8eaf6', border: '1px solid #3a3f5a' }}
                    />
                  </label>
                  <label className="flex items-center gap-1 text-[11px]" style={{ color: '#9097b8' }}>
                    {t('patch.startAddress')}:
                    <input
                      type="number"
                      min={1}
                      max={512}
                      value={address}
                      onChange={(e) => setAddress(Number(e.target.value))}
                      className="ml-1 px-2 py-0.5 rounded text-[11px] w-16"
                      style={{ background: '#2a2d3e', color: '#e8eaf6', border: '1px solid #3a3f5a' }}
                    />
                  </label>
                  <button
                    onClick={() => {
                      patchFixture(fixture, modeIdx, universe, address, name)
                      setPatchMode(false)
                      setExpanded(false)
                    }}
                    className="px-3 py-1 rounded text-[11px] font-medium"
                    style={{ background: '#6c63ff', color: '#fff' }}
                  >
                    {t('controls.apply')}
                  </button>
                  <button
                    onClick={() => setPatchMode(false)}
                    className="px-3 py-1 rounded text-[11px]"
                    style={{ background: '#1a1d27', color: '#9097b8' }}
                  >
                    {t('controls.cancel')}
                  </button>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function channelColor(type: string): string {
  const map: Record<string, string> = {
    Dimmer: '#ffb300', Red: '#ff4d6a', Green: '#00d68f', Blue: '#6c9cff',
    White: '#e8eaf6', Amber: '#ff8800', UV: '#cc44ff', Pan: '#00ccff',
    Tilt: '#00ccff', Gobo: '#aaaaff', Shutter: '#ffcc00', Strobe: '#ff4444',
    Speed: '#88ff88', ColorWheel: '#ff88cc', Generic: '#9097b8'
  }
  return map[type] ?? '#9097b8'
}
