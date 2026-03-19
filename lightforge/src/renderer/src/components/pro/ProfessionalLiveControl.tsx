import React, { useState, useCallback } from 'react'
import { Panel, Button, Slider, Badge } from './UIComponents'
import type { Scene, PatchedFixture } from '../../../shared/types'

/**
 * Professional Live Control Panel
 * Large scene buttons with master fader, effect controls, and responsive layout
 */
export const ProfessionalLiveControl: React.FC<{
  scenes: Scene[]
  patched: PatchedFixture[]
  currentScene: Scene | null
  masterLevel: number
  blackout: boolean
  effectsPlaying: boolean
  onSelectScene: (scene: Scene) => void
  onMasterChange: (value: number) => void
  onBlackoutToggle: () => void
  onEffectsToggle: () => void
}> = ({
  scenes,
  patched,
  currentScene,
  masterLevel,
  blackout,
  effectsPlaying,
  onSelectScene,
  onMasterChange,
  onBlackoutToggle,
  onEffectsToggle
}) => {
  const [bankPage, setBankPage] = useState(0)
  const [showMini, setShowMini] = useState(false)

  // Group scenes by bank
  const banks = useCallback(() => {
    const grouped = new Map<string, Scene[]>()
    scenes.forEach(scene => {
      const bank = scene.bankId || 'default'
      if (!grouped.has(bank)) grouped.set(bank, [])
      grouped.get(bank)!.push(scene)
    })
    return Array.from(grouped.entries())
  }, [scenes])

  const bankList = banks()
  const currentBank = bankList[bankPage]
  const currentBankScenes = currentBank?.[1] || []

  // Calculate button grid
  const buttonCols = 4
  const buttonRows = 3
  const buttonsPerPage = buttonCols * buttonRows

  return (
    <Panel header="Live Control Pro">
      {/* Top Status Bar */}
      <div className="flex gap-3 mb-4 p-3 bg-gradient-to-r from-[var(--color-bg-input)] to-[var(--color-bg-elevated)] rounded items-center">
        <div className="flex-1">
          <p className="text-xs text-[var(--color-text-secondary)]">Current Scene</p>
          <p className="font-bold text-lg text-[var(--color-text-primary)]">
            {currentScene?.name || '—'}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={blackout ? 'danger' : 'secondary'}
            onClick={onBlackoutToggle}
            className="px-4 py-2"
          >
            ⊘ {blackout ? 'BLACKOUT' : 'Blackout'}
          </Button>

          <Button
            variant={effectsPlaying ? 'success' : 'secondary'}
            onClick={onEffectsToggle}
          >
            {effectsPlaying ? '⚡ Effects' : 'Effects'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 h-full">
        {/* Main Scene Grid (Left & Center) */}
        <div className="col-span-2 flex flex-col gap-3">
          {/* Scene Buttons */}
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${buttonCols}, 1fr)`, gridTemplateRows: `repeat(${buttonRows}, 1fr)` }}>
            {Array.from({ length: buttonsPerPage }).map((_, idx) => {
              const sceneIndex = bankPage * buttonsPerPage + idx
              const scene = currentBankScenes[sceneIndex]

              if (!scene) {
                return (
                  <button
                    key={idx}
                    className="bg-[var(--color-bg-input)] border-2 border-dashed border-[var(--color-border)] rounded-lg hover:border-[var(--color-border-hover)] transition-all"
                  >
                    <span className="text-[var(--color-text-muted)] text-sm">Empty</span>
                  </button>
                )
              }

              return (
                <button
                  key={scene.id}
                  onClick={() => onSelectScene(scene)}
                  className={`p-4 rounded-lg font-semibold transition-all transform hover:scale-105 active:scale-95 border-2 flex flex-col justify-between ${
                    currentScene?.id === scene.id
                      ? 'border-[var(--color-success)] bg-[var(--color-accent)] text-white shadow-lg'
                      : 'border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-accent)]'
                  }`}
                  style={{
                    backgroundColor:
                      currentScene?.id === scene.id
                        ? undefined
                        : scene.color || 'var(--color-bg-surface)',
                    minHeight: '100px'
                  }}
                >
                  <span className="text-sm truncate">{scene.name}</span>
                  <span className="text-xs opacity-75">Scene</span>
                </button>
              )
            })}
          </div>

          {/* Bank Navigation */}
          {bankList.length > 1 && (
            <div className="flex gap-2 justify-center">
              <Button
                variant="secondary"
                onClick={() => setBankPage(Math.max(0, bankPage - 1))}
                disabled={bankPage === 0}
              >
                ◄ Prev
              </Button>

              <div className="flex-1 text-center text-sm text-[var(--color-text-secondary)]">
                Bank {bankPage + 1} / {bankList.length}
              </div>

              <Button
                variant="secondary"
                onClick={() => setBankPage(Math.min(bankList.length - 1, bankPage + 1))}
                disabled={bankPage === bankList.length - 1}
              >
                Next ►
              </Button>
            </div>
          )}

          {/* All Scenes Quick View */}
          {showMini && (
            <div className="max-h-32 overflow-y-auto bg-[var(--color-bg-input)] p-2 rounded space-y-1">
              {scenes.map(scene => (
                <button
                  key={scene.id}
                  onClick={() => {
                    onSelectScene(scene)
                    setShowMini(false)
                  }}
                  className="w-full text-left p-1 text-xs hover:bg-[var(--color-bg-hover)] rounded transition-colors"
                >
                  {scene.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Master Control */}
        <div className="flex flex-col gap-3 bg-[var(--color-bg-input)] p-4 rounded">
          <h3 className="font-semibold text-center">Master Control</h3>

          {/* Master Fader */}
          <div className="flex-1 flex flex-col items-center gap-4">
            {/* Vertical Master Slider */}
            <div className="h-40 w-12 flex items-center justify-center">
              <input
                type="range"
                min={0}
                max={255}
                value={masterLevel}
                onChange={(e) => onMasterChange(Number(e.target.value))}
                className="w-4 h-40"
                style={{
                  writingMode: 'bt-lr',
                  WebkitAppearance: 'slider-vertical'
                } as React.CSSProperties}
              />
            </div>

            {/* Master Level Display */}
            <div className="text-center">
              <p className="text-2xl font-bold">{Math.round((masterLevel / 255) * 100)}%</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{masterLevel}/255</p>
            </div>

            {/* Quick Master Buttons */}
            <div className="w-full space-y-2">
              <Button
                variant="secondary"
                onClick={() => onMasterChange(255)}
                className="w-full"
              >
                Full
              </Button>
              <Button
                variant="secondary"
                onClick={() => onMasterChange(127)}
                className="w-full"
              >
                50%
              </Button>
              <Button
                variant="danger"
                onClick={() => onMasterChange(0)}
                className="w-full"
              >
                Off
              </Button>
            </div>
          </div>

          {/* Info Section */}
          <div className="pt-3 border-t border-[var(--color-border)] space-y-2 text-xs">
            <div>
              <p className="text-[var(--color-text-secondary)]">Fixtures</p>
              <p className="font-bold">{patched.length}</p>
            </div>
            <div>
              <p className="text-[var(--color-text-secondary)]">Channels</p>
              <p className="font-bold">
                {patched.reduce((sum, f) => sum + f.channelCount, 0)} / 512
              </p>
            </div>

            {/* Toggle Mini View */}
            <Button
              variant="secondary"
              onClick={() => setShowMini(!showMini)}
              className="w-full mt-2"
            >
              {showMini ? '▼ Hide' : '▲ All Scenes'}
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  )
}

/**
 * Compact Live Control for Performance Mode
 */
export const CompactLiveControl: React.FC<{
  scenes: Scene[]
  currentScene: Scene | null
  masterLevel: number
  onSelectScene: (scene: Scene) => void
  onMasterChange: (value: number) => void
}> = ({ scenes, currentScene, masterLevel, onSelectScene, onMasterChange }) => {
  return (
    <div className="space-y-3">
      {/* Current Scene Display */}
      <div className="p-4 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-light)] rounded-lg text-white">
        <p className="text-xs opacity-75">Now Playing</p>
        <h2 className="text-2xl font-bold">{currentScene?.name || '—'}</h2>
      </div>

      {/* Master Fader Compact */}
      <Slider
        label={`Master: ${Math.round((masterLevel / 255) * 100)}%`}
        min={0}
        max={255}
        value={masterLevel}
        onChange={(e) => onMasterChange(Number(e.target.value))}
      />

      {/* Scene Grid - Compact */}
      <div className="grid grid-cols-2 gap-2">
        {scenes.slice(0, 6).map(scene => (
          <button
            key={scene.id}
            onClick={() => onSelectScene(scene)}
            className={`p-3 rounded-lg font-semibold text-sm transition-all ${
              currentScene?.id === scene.id
                ? 'bg-[var(--color-success)] text-white'
                : 'bg-[var(--color-bg-surface)] border border-[var(--color-border)] hover:border-[var(--color-accent)]'
            }`}
          >
            {scene.name}
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * Effect Speed Controller for Live Adjustment
 */
export const LiveEffectController: React.FC<{
  effectSpeed: number
  onSpeedChange: (speed: number) => void
  isPlaying: boolean
  onPlayPause: () => void
}> = ({ effectSpeed, onSpeedChange, isPlaying, onPlayPause }) => {
  return (
    <div className="bg-[var(--color-bg-input)] p-3 rounded space-y-3">
      <h3 className="font-semibold text-sm">Effect Control</h3>

      <div className="flex gap-2">
        <Button
          variant={isPlaying ? 'success' : 'secondary'}
          onClick={onPlayPause}
          className="flex-1"
        >
          {isPlaying ? '⏸ Stop' : '▶ Play'}
        </Button>
      </div>

      <Slider
        label={`Speed: ${effectSpeed} BPM`}
        min={20}
        max={240}
        value={effectSpeed}
        onChange={(e) => onSpeedChange(Number(e.target.value))}
      />

      <div className="grid grid-cols-3 gap-2">
        {[60, 120, 180].map(bpm => (
          <Button
            key={bpm}
            variant="secondary"
            onClick={() => onSpeedChange(bpm)}
            className="text-sm"
          >
            {bpm}
          </Button>
        ))}
      </div>
    </div>
  )
}
