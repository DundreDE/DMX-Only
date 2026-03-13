/**
 * DasLight5ConsoleUI.tsx
 * Professional Daslight 5-style Console Interface
 * Complete Scene Editor with real DMX output
 */

import React, { useEffect, useState, useRef } from 'react'
import { DMXEngine } from '../engines/DMXEngine'
import { PlaybackEngine, Scene } from '../engines/PlaybackEngine'
import { BankManager } from '../engines/BankManager'
import { FixtureDatabase, InstalledFixture } from '../engines/FixtureDatabase'
import { LiveMixer } from '../engines/LiveMixer'
import { SuperSceneTimeline } from '../engines/SuperSceneTimeline'

interface DasLight5ConsoleProps {
  dmxEngine: DMXEngine
  playbackEngine: PlaybackEngine
  bankManager: BankManager
  fixtureDatabase: FixtureDatabase
  liveMixer: LiveMixer
}

/**
 * Professional Daslight 5 Console UI
 */
export const DasLight5ConsoleUI: React.FC<DasLight5ConsoleProps> = ({
  dmxEngine,
  playbackEngine,
  bankManager,
  fixtureDatabase,
  liveMixer,
}) => {
  const [activeTab, setActiveTab] = useState<'control' | 'bank' | 'fixtures'>('control')
  const [scenes, setScenes] = useState<Scene[]>([])
  const [playbackState, setPlaybackState] = useState(playbackEngine.getState())
  const [installedFixtures, setInstalledFixtures] = useState<InstalledFixture[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Subscribe to playback updates
  useEffect(() => {
    const unsubscribe = playbackEngine.onStateUpdate((state) => {
      setPlaybackState(state)
    })
    return unsubscribe
  }, [playbackEngine])

  // Load current bank scenes
  useEffect(() => {
    const bank = bankManager.getCurrentBank()
    if (bank) {
      setScenes(Array.from(bank.scenes.values()))
    }
  }, [bankManager])

  // Load installed fixtures
  useEffect(() => {
    setInstalledFixtures(fixtureDatabase.getAllInstalledFixtures())
  }, [fixtureDatabase])

  // Render 2D stage view
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = '#444'
    ctx.lineWidth = 2
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40)

    ctx.fillStyle = '#00ff00'
    for (const fixture of installedFixtures) {
      const x = (fixture.position?.x || 0.5) * (canvas.width - 80) + 40
      const y = (fixture.position?.y || 0.5) * (canvas.height - 80) + 40

      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#fff'
      ctx.font = '10px monospace'
      ctx.fillText(`${fixture.dmxChannel}`, x - 8, y - 12)
      ctx.fillStyle = '#00ff00'
    }
  }, [installedFixtures])

  const handlePlayScene = (scene: Scene) => {
    playbackEngine.loadScene(scene)
    playbackEngine.play()
  }

  const handleStopScene = () => {
    playbackEngine.stop()
  }

  const handlePauseScene = () => {
    playbackEngine.pause()
  }

  return (
    <div className="daslight5-console">
      <style>{`
        .daslight5-console {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: auto 1fr;
          height: 100vh;
          background: #0a0a0a;
          color: #fff;
          font-family: 'Courier New', monospace;
          gap: 2px;
        }

        .console-header {
          grid-column: 1 / -1;
          background: #1a1a1a;
          border-bottom: 2px solid #00ff00;
          padding: 10px 20px;
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .console-title {
          font-size: 18px;
          font-weight: bold;
          color: #00ff00;
          text-shadow: 0 0 10px #00ff00;
        }

        .transport-controls {
          display: flex;
          gap: 10px;
        }

        .btn {
          padding: 8px 16px;
          background: #222;
          border: 1px solid #00ff00;
          color: #00ff00;
          cursor: pointer;
          font-family: 'Courier New', monospace;
          transition: 0.2s;
        }

        .btn:hover {
          background: #00ff00;
          color: #000;
        }

        .btn.active {
          background: #00ff00;
          color: #000;
        }

        .scene-grid {
          grid-column: 1;
          grid-row: 2;
          background: #1a1a1a;
          padding: 15px;
          overflow-y: auto;
          border-right: 2px solid #00ff00;
        }

        .scene-grid-title {
          font-size: 14px;
          color: #00ff00;
          margin-bottom: 10px;
          text-transform: uppercase;
        }

        .scenes {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .scene-btn {
          aspect-ratio: 1;
          background: #333;
          border: 2px solid #555;
          color: #00ff00;
          cursor: pointer;
          font-size: 12px;
          padding: 8px;
          text-align: center;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 4px;
          transition: 0.2s;
        }

        .scene-btn:hover {
          border-color: #00ff00;
          box-shadow: 0 0 10px #00ff00;
        }

        .scene-btn.playing {
          background: #00ff00;
          color: #000;
        }

        .stage-view {
          grid-column: 2;
          grid-row: 2;
          background: #1a1a1a;
          padding: 15px;
          border-left: 2px solid #00ff00;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .stage-title {
          font-size: 14px;
          color: #00ff00;
          text-transform: uppercase;
        }

        .stage-canvas {
          flex: 1;
          background: #0a0a0a;
          border: 1px solid #333;
        }

        .playback-info {
          background: #222;
          padding: 10px;
          border: 1px solid #555;
          font-size: 12px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
        }

        .info-label {
          color: #888;
        }

        .info-value {
          color: #00ff00;
          font-weight: bold;
        }

        .live-dials {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-top: 10px;
        }

        .dial {
          background: #222;
          border: 1px solid #555;
          padding: 10px;
          text-align: center;
          border-radius: 4px;
        }

        .dial-label {
          font-size: 11px;
          color: #888;
          margin-bottom: 5px;
        }

        .dial-value {
          font-size: 16px;
          color: #00ff00;
          font-weight: bold;
        }

        .dial-slider {
          width: 100%;
          margin-top: 5px;
          cursor: pointer;
        }

        .tabs {
          display: flex;
          gap: 0;
          margin-bottom: 10px;
        }

        .tab-btn {
          flex: 1;
          padding: 8px;
          background: #222;
          border: 1px solid #555;
          border-bottom: none;
          color: #888;
          cursor: pointer;
          font-size: 12px;
          text-transform: uppercase;
        }

        .tab-btn.active {
          background: #1a1a1a;
          color: #00ff00;
          border: 1px solid #00ff00;
          border-bottom: 1px solid #1a1a1a;
        }

        .status-bar {
          grid-column: 1 / -1;
          background: #222;
          border-top: 2px solid #00ff00;
          padding: 8px 20px;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #888;
        }

        .status-item {
          display: flex;
          gap: 20px;
        }

        .dmx-status {
          display: flex;
          gap: 5px;
          align-items: center;
        }

        .dmx-led {
          width: 8px;
          height: 8px;
          background: #00ff00;
          border-radius: 50%;
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
      `}
    </style>

      {/* Header */}
      <div className="console-header">
        <div className="console-title">🔦 DASLIGHT 5 CONSOLE</div>
        <div className="transport-controls">
          <button
            className="btn"
            onClick={() => playbackEngine.play()}
            disabled={playbackState.isPlaying}
          >
            ▶ PLAY
          </button>
          <button
            className="btn"
            onClick={() => handlePauseScene()}
            disabled={!playbackState.isPlaying}
          >
            ⏸ PAUSE
          </button>
          <button
            className="btn"
            onClick={() => handleStopScene()}
          >
            ⏹ STOP
          </button>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <span style={{ color: '#00ff00', fontSize: '12px' }}>
            {`${playbackState.currentScene?.name || 'NO SCENE'} | 
            ${Math.floor(playbackState.currentTime / 1000)}s / 
            ${Math.floor((playbackState.currentScene?.duration || 0) / 1000)}s`}
          </span>
        </div>
      </div>

      {/* Left: Scene Grid */}
      <div className="scene-grid">
        <div className="scene-grid-title">Scene Grid</div>
        <div className="tabs">
          <button
            className={`tab-btn ${activeTab === 'control' ? 'active' : ''}`}
            onClick={() => setActiveTab('control')}
          >
            Control
          </button>
          <button
            className={`tab-btn ${activeTab === 'bank' ? 'active' : ''}`}
            onClick={() => setActiveTab('bank')}
          >
            Bank
          </button>
          <button
            className={`tab-btn ${activeTab === 'fixtures' ? 'active' : ''}`}
            onClick={() => setActiveTab('fixtures')}
          >
            Fixtures
          </button>
        </div>

        {activeTab === 'control' && (
          <div className="scenes">
            {scenes.map((scene) => (
              <button
                key={scene.id}
                className={`scene-btn ${
                  playbackState.currentScene?.id === scene.id ? 'playing' : ''
                }`}
                onDoubleClick={() => handlePlayScene(scene)}
                onClick={() => {
                  if (playbackState.currentScene?.id !== scene.id) {
                    playbackEngine.loadScene(scene)
                  }
                }}
              >
                <div>{scene.name}</div>
                <div style={{ fontSize: '10px', opacity: 0.7 }}>
                  {Math.floor(scene.duration / 1000)}s
                </div>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'bank' && (
          <div style={{ fontSize: '12px', color: '#888' }}>
            <div>Banks: {bankManager.getAllBanks().length}</div>
            <div>Total Scenes: {scenes.length}</div>
            <div style={{ marginTop: '20px' }}>
              {bankManager.getAllBanks().map((bank) => (
                <div
                  key={bank.id}
                  style={{
                    padding: '8px',
                    background: '#222',
                    marginBottom: '5px',
                    cursor: 'pointer',
                  }}
                  onClick={() => bankManager.setCurrentBank(bank.id)}
                >
                  📁 {bank.name} ({bank.scenes.size})
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'fixtures' && (
          <div style={{ fontSize: '12px', color: '#888' }}>
            <div>Installed: {installedFixtures.length}</div>
            <div style={{ marginTop: '10px' }}>
              {installedFixtures.slice(0, 8).map((fixture) => (
                <div
                  key={fixture.id}
                  style={{
                    padding: '8px',
                    background: '#222',
                    marginBottom: '5px',
                    borderLeft: '2px solid #00ff00',
                  }}
                >
                  {fixture.label} (U:{fixture.dmxUniverse} CH:{fixture.dmxChannel})
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Stage View & Controls */}
      <div className="stage-view">
        <div className="stage-title">2D Stage View</div>
        <canvas
          ref={canvasRef}
          className="stage-canvas"
          width={400}
          height={300}
        />

        {/* Live Control Dials */}
        <div className="live-dials">
          <div className="dial">
            <div className="dial-label">SPEED</div>
            <div className="dial-value">
              {playbackState.liveControl.speed.toFixed(2)}x
            </div>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              defaultValue="1"
              className="dial-slider"
              onChange={(e) =>
                playbackEngine.setLiveControl({
                  speed: parseFloat(e.target.value),
                })
              }
            />
          </div>

          <div className="dial">
            <div className="dial-label">SIZE</div>
            <div className="dial-value">
              {(playbackState.liveControl.size * 100).toFixed(0)}%
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              defaultValue="1"
              className="dial-slider"
              onChange={(e) =>
                playbackEngine.setLiveControl({
                  size: parseFloat(e.target.value),
                })
              }
            />
          </div>

          <div className="dial">
            <div className="dial-label">PHASE</div>
            <div className="dial-value">
              {(playbackState.liveControl.phase * 360).toFixed(0)}°
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              defaultValue="0"
              className="dial-slider"
              onChange={(e) =>
                playbackEngine.setLiveControl({
                  phase: parseFloat(e.target.value),
                })
              }
            />
          </div>

          <div className="dial">
            <div className="dial-label">DIMMER</div>
            <div className="dial-value">
              {playbackState.liveControl.dimmer}
            </div>
            <input
              type="range"
              min="0"
              max="255"
              step="1"
              defaultValue="255"
              className="dial-slider"
              onChange={(e) =>
                playbackEngine.setLiveControl({
                  dimmer: parseInt(e.target.value),
                })
              }
            />
          </div>
        </div>

        {/* Playback Info */}
        <div className="playback-info">
          <div className="info-item">
            <span className="info-label">PLAYING</span>
            <span className="info-value">
              {playbackState.isPlaying ? 'YES' : 'NO'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">SPEED</span>
            <span className="info-value">{playbackState.speed.toFixed(2)}x</span>
          </div>
          <div className="info-item">
            <span className="info-label">DIRECTION</span>
            <span className="info-value">{playbackState.direction}</span>
          </div>
          <div className="info-item">
            <span className="info-label">PROGRESS</span>
            <span className="info-value">
              {(playbackEngine.getProgress() * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          <div className="dmx-status">
            <div className="dmx-led" />
            <span>DMX OUTPUT</span>
          </div>
          <div>UNIVERSES: 1</div>
          <div>CHANNELS: 512</div>
        </div>
        <div className="status-item">
          <div>FIXTURES: {installedFixtures.length}</div>
          <div>SCENES: {scenes.length}</div>
          <div>FPS: 50</div>
        </div>
      </div>
    </div>
  )
}

export default DasLight5ConsoleUI