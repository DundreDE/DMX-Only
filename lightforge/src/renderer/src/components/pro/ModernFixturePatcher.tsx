import React, { useState, useCallback, useMemo } from 'react'
import { Panel, Button, Select, Input, Badge } from './UIComponents'
import type { PatchedFixture, FixtureDefinition } from '../../../shared/types'

/**
 * Modern Fixture Patcher Component
 * Drag-drop grid-based DMX universe patcher with smart organization
 */
export const ModernFixturePatcher: React.FC<{
  patched: PatchedFixture[]
  fixtures: FixtureDefinition[]
  onPatch: (fixture: PatchedFixture) => void
  onUnpatch: (fixtureId: string) => void
  onRename: (fixtureId: string, name: string) => void
}> = ({ patched, fixtures, onPatch, onUnpatch, onRename }) => {
  const [selectedUniverse, setSelectedUniverse] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  // Filter fixtures by universe
  const universeFix = useMemo(() => {
    return patched.filter(f => f.universe === selectedUniverse).sort((a, b) => a.startAddress - b.startAddress)
  }, [patched, selectedUniverse])

  // Get fixture category
  const getCategory = (fixture: FixtureDefinition): string => {
    if (fixture.type.toLowerCase().includes('dimmer')) return 'Dimmers'
    if (fixture.type.toLowerCase().includes('rgb') || fixture.type.toLowerCase().includes('color')) return 'RGB/Color'
    if (fixture.type.toLowerCase().includes('moving') || fixture.type.toLowerCase().includes('mover')) return 'Moving Lights'
    if (fixture.type.toLowerCase().includes('strobe') || fixture.type.toLowerCase().includes('effect')) return 'Effects'
    return 'Other'
  }

  // Get available fixtures
  const availableFixtures = useMemo(() => {
    let result = fixtures

    if (searchQuery) {
      result = result.filter(f =>
        f.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterCategory !== 'all') {
      result = result.filter(f => getCategory(f) === filterCategory)
    }

    return result
  }, [fixtures, searchQuery, filterCategory])

  // Get fixture info
  const getFixtureName = (definitionId: string): string => {
    const def = fixtures.find(f => f.id === definitionId)
    return def ? `${def.manufacturer} ${def.model}` : 'Unknown'
  }

  const handleStartPatch = (fixture: FixtureDefinition) => {
    const newPatch: PatchedFixture = {
      id: `patched_${Date.now()}`,
      definitionId: fixture.id,
      name: fixture.model,
      universe: selectedUniverse,
      startAddress: 1,
      modeIndex: 0,
      channelCount: fixture.modes[0]?.channels.length || 1
    }
    onPatch(newPatch)
  }

  return (
    <Panel header="DMX Universe Patcher">
      <div className="grid grid-cols-3 gap-4 h-full">
        {/* Left: Fixture Browser */}
        <div className="flex flex-col gap-3 border-r border-[var(--color-border)] pr-4">
          <h3 className="font-semibold text-sm">Available Fixtures</h3>

          <Input
            placeholder="Search fixtures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Select
            options={[
              { value: 'all', label: 'All Categories' },
              { value: 'Dimmers', label: 'Dimmers' },
              { value: 'RGB/Color', label: 'RGB/Color' },
              { value: 'Moving Lights', label: 'Moving Lights' },
              { value: 'Effects', label: 'Effects' },
              { value: 'Other', label: 'Other' }
            ]}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          />

          <div className="flex-1 overflow-y-auto space-y-2">
            {availableFixtures.length === 0 ? (
              <div className="text-center text-xs text-[var(--color-text-secondary)] py-4">
                No fixtures found
              </div>
            ) : (
              availableFixtures.map(fixture => (
                <button
                  key={fixture.id}
                  onClick={() => handleStartPatch(fixture)}
                  className="w-full text-left p-2 bg-[var(--color-bg-input)] hover:bg-[var(--color-bg-hover)] rounded border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all"
                >
                  <p className="font-semibold text-xs">{fixture.manufacturer}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{fixture.model}</p>
                  <Badge variant="primary" className="mt-1 text-xs">
                    {getCategory(fixture)}
                  </Badge>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Middle: Universe Grid */}
        <div className="flex flex-col gap-3 border-r border-[var(--color-border)] pr-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Universe</h3>
            <Select
              options={Array.from({ length: 100 }, (_, i) => ({
                value: String(i),
                label: `${i}`
              }))}
              value={String(selectedUniverse)}
              onChange={(e) => setSelectedUniverse(Number(e.target.value))}
              style={{ width: '80px' }}
            />
          </div>

          {/* DMX Grid Visualization */}
          <div className="bg-[var(--color-bg-input)] p-3 rounded overflow-y-auto flex-1">
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: 512 }, (_, i) => {
                const fixture = universeFix.find(f => i >= f.startAddress - 1 && i < f.startAddress - 1 + f.channelCount)
                const isStart = fixture && i === fixture.startAddress - 1

                return (
                  <div
                    key={i}
                    title={fixture ? `${fixture.name} (${i + 1})` : `Channel ${i + 1}`}
                    className={`h-6 rounded text-xs font-bold flex items-center justify-center cursor-pointer transition-all ${
                      fixture
                        ? isStart
                          ? 'bg-[var(--color-accent)] text-white'
                          : 'bg-[var(--color-accent-dim)]'
                        : 'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]'
                    }`}
                  >
                    {isStart ? fixture?.name.charAt(0).toUpperCase() : ''}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Channel Info */}
          <div className="text-xs text-[var(--color-text-secondary)] text-center">
            {universeFix.length} fixture{universeFix.length !== 1 ? 's' : ''} · {
              universeFix.reduce((sum, f) => sum + f.channelCount, 0)
            } channels used
          </div>
        </div>

        {/* Right: Patched Fixtures */}
        <div className="flex flex-col gap-3">
          <h3 className="font-semibold text-sm">Patched Fixtures (Universe {selectedUniverse})</h3>

          <div className="flex-1 overflow-y-auto space-y-2">
            {universeFix.length === 0 ? (
              <div className="text-center text-xs text-[var(--color-text-secondary)] py-4">
                No fixtures patched
              </div>
            ) : (
              universeFix.map((fixture) => (
                <div
                  key={fixture.id}
                  className="p-2 bg-[var(--color-bg-input)] rounded border border-[var(--color-border)]"
                >
                  {editingId === fixture.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        variant="primary"
                        onClick={() => {
                          onRename(fixture.id, editingName)
                          setEditingId(null)
                        }}
                        className="px-2 py-1 text-xs"
                      >
                        ✓
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <p className="font-semibold text-xs">{fixture.name}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {getFixtureName(fixture.definitionId)}
                          </p>
                        </div>
                        <Badge variant="success" className="text-xs">
                          {fixture.channelCount}ch
                        </Badge>
                      </div>

                      <div className="text-xs text-[var(--color-text-muted)] mb-2">
                        CH {fixture.startAddress}-{fixture.startAddress + fixture.channelCount - 1}
                      </div>

                      <div className="flex gap-1">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setEditingId(fixture.id)
                            setEditingName(fixture.name)
                          }}
                          className="px-2 py-1 text-xs flex-1"
                        >
                          Rename
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => onUnpatch(fixture.id)}
                          className="px-2 py-1 text-xs"
                        >
                          ✕
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Batch Operations */}
          {universeFix.length > 0 && (
            <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
              <Button variant="secondary" className="w-full text-xs">
                💾 Save Group
              </Button>
              <Button variant="secondary" className="w-full text-xs">
                🔄 Auto Organize
              </Button>
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}

/**
 * Quick Patcher for rapid fixture assignment
 */
export const QuickPatcher: React.FC<{
  onPatch: (fixture: PatchedFixture) => void
}> = ({ onPatch }) => {
  const [autoStartAddress, setAutoStartAddress] = useState(1)
  const [autoUniverse, setAutoUniverse] = useState(0)

  return (
    <div className="bg-[var(--color-bg-input)] p-3 rounded space-y-2">
      <h4 className="font-semibold text-xs">Quick Patch</h4>
      
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Start Address"
          type="number"
          min={1}
          max={512}
          value={autoStartAddress}
          onChange={(e) => setAutoStartAddress(Number(e.target.value))}
        />
        <Select
          label="Universe"
          options={Array.from({ length: 10 }, (_, i) => ({
            value: String(i),
            label: `U${i}`
          }))}
          value={String(autoUniverse)}
          onChange={(e) => setAutoUniverse(Number(e.target.value))}
        />
      </div>
    </div>
  )
}
