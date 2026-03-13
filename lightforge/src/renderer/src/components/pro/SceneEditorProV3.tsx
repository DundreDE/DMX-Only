// ════════════════════════════════════════════════════════════════════════════
//  SceneEditorPro v3 — Full integration with Phase 3 features
// ════════════════════════════════════════════════════════════════════════════
//  Includes: Undo/Redo, Fade Transitions, Multi-scene, OSC
// ════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useFixtureStore } from '../../stores/fixtureStore'
import { useDmxStore } from '../../stores/dmxStore'

// Phase 2 Components
import { SceneGridPanel } from './SceneGridPanel'
import { StageView2D } from './StageView2D'
import { FeatureFaderPanel } from './FeatureFaderPanel'
import { SceneSettingsPanel } from './SceneSettingsPanel'
import { LiveControlDials } from './LiveControlDials'
import { FXGeneratorPanel } from './FXGeneratorPanel'
import { TimelinePanel } from './TimelinePanel'
import { PlaybackControlPanel } from './PlaybackControlPanel'
import { ReleaseModeSelector } from './ReleaseModeSelector'
import { MIDIMappingPanel } from './MIDIMappingPanel'
import { KeyboardShortcutsPanel } from './KeyboardShortcutsPanel'
import { AdvancedEffectsPanel } from './AdvancedEffectsPanel'
import { SceneTemplateLibrary } from './SceneTemplateLibrary'

// Phase 3 Components
import { UndoRedoPanel } from './UndoRedoPanel'
import { FadeTransitionPanel } from './FadeTransitionPanel'
import { SceneLayerPanel } from './SceneLayerPanel'
import { OSCPanel } from './OSCPanel'

// Phase 3 Hooks
import { useUndoRedo } from '../../hooks/useUndoRedo'
import { useMultiScene } from '../../hooks/useMultiScene'
import { useFadeTransition } from '../../hooks/useFadeTransition'

// Phase 3 Stores
import { useUndoRedoStore } from '../../stores/undoRedoStore'
import { useMultiSceneStore } from '../../stores/multiSceneStore'
import { useOSCStore } from '../../stores/oscStore'

type ReleaseMode = 'off' | 'group' | 'all' | 'except'
type PlaybackMode = 'forward' | 'reverse' | 'bounce' | 'pause'
type EasingType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'

interface SceneEditorProV3Props {
  initialSceneId?: string
  onSceneChange?: (sceneId: string) => void
  enableTimeline?: boolean
  enableMIDI?: boolean
  enablePhase3?: boolean
}

export function SceneEditorProV3({
  initialSceneId,
  onSceneChange,
  enableTimeline = true,
  enableMIDI = true,
  enablePhase3 = true,
}: SceneEditorProV3Props): React.JSX.Element {
  const fixtures = useFixtureStore(state => state.fixtures)
  const { channels } = useDmxStore()

  // Phase 3 Hooks
  const undoRedo = useUndoRedo()
  const multiScene = useMultiScene()
  const fadeTransition = useFadeTransition()

  // Phase 3 Stores
  const oscConfig = useOSCStore(state => state.config)

  // State
  const [currentScene, setCurrentScene] = useState(initialSceneId || null)
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>([])
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>('forward')
  const [releaseMode, setReleaseMode] = useState<ReleaseMode>('group')
  const [isPlaying, setIsPlaying] = useState(false)
  const [fadeConfig, setFadeConfig] = useState({ duration: 1000, easing: 'ease-in-out' as EasingType })

  // UI State
  const [showTimeline, setShowTimeline] = useState(false)
  const [showMIDIPanel, setShowMIDIPanel] = useState(false)
  const [showKeyboardPanel, setShowKeyboardPanel] = useState(false)
  const [showUndoPanel, setShowUndoPanel] = useState(false)
  const [showFadePanel, setShowFadePanel] = useState(false)
  const [showLayerPanel, setShowLayerPanel] = useState(false)
  const [showOSCPanel, setShowOSCPanel] = useState(false)

  const rafRef = useRef<number | null>(null)
  const timeRef = useRef(0)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault()
        setIsPlaying(p => !p)
      }

      if (e.code === 'Escape') {
        e.preventDefault()
        setIsPlaying(false)
        timeRef.current = 0
      }

      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault()
        undoRedo.undo()
      }

      if (e.ctrlKey && e.key === 'y') {
        e.preventDefault()
        undoRedo.redo()
      }

      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault()
        setShowMIDIPanel(p => !p)
      }

      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        setShowKeyboardPanel(p => !p)
      }

      if (e.ctrlKey && e.key === 't') {
        e.preventDefault()
        if (enableTimeline) setShowTimeline(p => !p)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enableTimeline, undoRedo])

  // RAF loop
  useEffect(() => {
    const loop = () => {
      if (isPlaying) {
        timeRef.current += 1 / 60
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying])

  const handleSceneSelect = useCallback(
    (sceneId: string) => {
      setCurrentScene(sceneId)
      onSceneChange?.(sceneId)
      undoRedo.trackSceneChange('edit', sceneId, { previous: currentScene }, { new: sceneId })
    },
    [currentScene, onSceneChange, undoRedo]
  )

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col overflow-hidden">
      {/* TOP BAR */}
      <div className="h-16 bg-slate-800 border-b border-slate-700 px-4 flex items-center justify-between shrink-0">
        {/* Left */}
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-200">🎬 Scene Editor Pro v3</h2>
            <p className="text-xs text-slate-500">
              {multiScene.activeSceneCount} active {multiScene.releaseMode}
            </p>
          </div>
        </div>

        {/* Center: Transport */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(p => !p)}
            className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false)
              timeRef.current = 0
            }}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded font-semibold text-sm transition-colors"
          >
            ⏹ Stop
          </button>
        </div>

        {/* Right: Phase 3 Controls */}
        {enablePhase3 && (
          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <button
              onClick={() => undoRedo.undo()}
              disabled={!undoRedo.canUndo}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded"
              title="Ctrl+Z"
            >
              ↶
            </button>
            <button
              onClick={() => undoRedo.redo()}
              disabled={!undoRedo.canRedo}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded"
              title="Ctrl+Y"
            >
              ↷
            </button>

            {/* Fade */}
            <button
              onClick={() => setShowFadePanel(p => !p)}
              className={`px-3 py-1 text-xs rounded ${
                showFadePanel
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
            >
              ⏱️
            </button>

            {/* Layers */}
            <button
              onClick={() => setShowLayerPanel(p => !p)}
              className={`px-3 py-1 text-xs rounded ${
                showLayerPanel
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
            >
              🎬 {multiScene.activeSceneCount}
            </button>

            {/* OSC */}
            <button
              onClick={() => setShowOSCPanel(p => !p)}
              className={`px-3 py-1 text-xs rounded ${
                showOSCPanel
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              }`}
            >
              🌐
            </button>
          </div>
        )}
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex-1 flex gap-0 overflow-hidden">
        {/* LEFT: Scene Grid + Stage View */}
        <div className="w-1/4 flex flex-col border-r border-slate-700 overflow-hidden">
          <div className="flex-1 border-b border-slate-700 overflow-hidden">
            <SceneGridPanel
              selectedSceneId={currentScene as string}
              onSelectScene={handleSceneSelect}
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <StageView2D
              fixtures={fixtures}
              selectedFixtures={selectedFixtures}
              onSelectFixture={(id, multi) =>
                setSelectedFixtures(multi ? [...selectedFixtures, id] : [id])
              }
              channels={channels}
            />
          </div>
        </div>

        {/* CENTER: Faders + Settings */}
        <div className="flex-1 flex flex-col border-r border-slate-700 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <FeatureFaderPanel
              selectedFixtures={selectedFixtures}
              fixtures={fixtures}
              channels={channels}
            />
          </div>
          <div className="h-64 border-t border-slate-700 overflow-hidden">
            <SceneSettingsPanel
              sceneId={currentScene as string}
              selectedFixtures={selectedFixtures}
            />
          </div>
        </div>

        {/* RIGHT: Controls */}
        <div className="w-80 flex flex-col border-l border-slate-700 overflow-hidden">
          <div className="h-48 border-b border-slate-700 overflow-hidden">
            <LiveControlDials />
          </div>
          <div className="flex-1 border-b border-slate-700 overflow-y-auto">
            <FXGeneratorPanel selectedFixtures={selectedFixtures} />
          </div>
          <div className="h-48 border-t border-slate-700 overflow-y-auto">
            <ReleaseModeSelector
              releaseMode={releaseMode}
              onReleaseModeChange={setReleaseMode}
            />
          </div>
        </div>
      </div>

      {/* BOTTOM: Timeline + Playback */}
      {showTimeline && enableTimeline && (
        <div className="h-48 border-t border-slate-700 overflow-hidden shrink-0">
          <TimelinePanel sceneId={currentScene as string} isPlaying={isPlaying} playbackMode={playbackMode} />
        </div>
      )}

      <div className="h-20 border-t border-slate-700 bg-slate-800 px-4 py-2 shrink-0">
        <PlaybackControlPanel
          playbackMode={playbackMode}
          releaseMode={releaseMode}
          isPlaying={isPlaying}
          onPlaybackModeChange={setPlaybackMode}
          onPlayPause={() => setIsPlaying(p => !p)}
          onStop={() => {
            setIsPlaying(false)
            timeRef.current = 0
          }}
        />
      </div>

      {/* PHASE 3 PANELS */}
      {enablePhase3 && (
        <>
          {/* Fade Panel */}
          {showFadePanel && (
            <div className="fixed left-96 top-32 bg-slate-800 rounded border border-slate-700 shadow-lg p-4 w-80 z-40">
              <FadeTransitionPanel
                duration={fadeConfig.duration}
                easing={fadeConfig.easing}
                onDurationChange={dur => setFadeConfig(p => ({ ...p, duration: dur }))}
                onEasingChange={eas => setFadeConfig(p => ({ ...p, easing: eas }))}
              />
              <button
                onClick={() => setShowFadePanel(false)}
                className="mt-2 w-full px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded"
              >
                Close
              </button>
            </div>
          )}

          {/* Layer Panel */}
          {showLayerPanel && (
            <div className="fixed right-96 top-32 bg-slate-800 rounded border border-slate-700 shadow-lg w-96 h-96 z-40 overflow-hidden">
              <SceneLayerPanel />
              <button
                onClick={() => setShowLayerPanel(false)}
                className="absolute bottom-2 right-2 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded"
              >
                Close
              </button>
            </div>
          )}

          {/* OSC Panel */}
          {showOSCPanel && (
            <div className="fixed right-0 top-0 w-96 h-full bg-slate-900 border-l border-slate-700 shadow-2xl z-50 overflow-hidden">
              <OSCPanel />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default SceneEditorProV3
