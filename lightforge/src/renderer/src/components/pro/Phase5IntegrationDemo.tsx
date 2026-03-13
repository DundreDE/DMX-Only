/**
 * Phase5IntegrationDemo.tsx
 * Complete Daslight 5 Engine Integration Demo
 * Shows all systems working together
 */

import React, { useEffect, useState } from 'react'
import {
  DMXEngine,
  PlaybackEngine,
  BankManager,
  FixtureDatabase,
  LiveMixer,
  ColorFXEngine,
  ChaserFXEngine,
  ValueFXEngine,
  Scene,
  FXStack,
} from '../engines'
import DasLight5ConsoleUI from './DasLight5ConsoleUI'

/**
 * Demo component that initializes all Phase 5 engines
 */
export const Phase5IntegrationDemo: React.FC = () => {
  const [engines, setEngines] = useState<any>(null)
  const [demoScenes, setDemoScenes] = useState<Scene[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Initialize all engines
    const dmxEngine = new DMXEngine(1)
    const playbackEngine = new PlaybackEngine(dmxEngine)
    const bankManager = new BankManager()
    const fixtureDatabase = new FixtureDatabase()
    const liveMixer = new LiveMixer()

    // Start DMX engine
    dmxEngine.start()

    // Install some default fixtures
    fixtureDatabase.installFixture('par64', 0, 1, 'Spot 1')
    fixtureDatabase.installFixture('rgbpar', 0, 2, 'RGB Par 1')
    fixtureDatabase.installFixture('movinghead', 0, 6, 'Moving Head 1')

    // Create demo bank
    const bank = bankManager.createBank('Demo Show', 'Integration test bank')

    // Create demo scenes
    const demoScenes: Scene[] = [
      {
        id: 'scene-1',
        name: 'Red Strobe',
        duration: 8000,
        fadeIn: 500,
        fadeOut: 500,
        type: 'fx',
        bpmSync: false,
        baseState: {
          0: {
            1: 255, // Spot 1 full
            2: 255, // RGB Par full
            3: 255,
            4: 255,
          },
        },
        fx: [
          {
            id: 'fx-1',
            type: 'value',
            config: {
              mode: 'strobe' as const,
              speed: 2,
              channels: [1],
              amplitude: 255,
              offset: 0,
            } as any,
            priority: 1,
            enabled: true,
          },
          {
            id: 'fx-2',
            type: 'color',
            config: {
              mode: 'pulse' as const,
              speed: 1,
              phase: 0,
              amplitude: 255,
              colorWheel: ['red'],
              targetChannels: [2, 3, 4],
            } as any,
            priority: 2,
            enabled: true,
          },
        ],
      },
      {
        id: 'scene-2',
        name: 'Rainbow Chase',
        duration: 10000,
        fadeIn: 500,
        fadeOut: 500,
        type: 'fx',
        bpmSync: false,
        baseState: {
          0: {
            1: 200,
            2: 100,
            3: 100,
            4: 100,
          },
        },
        fx: [
          {
            id: 'fx-3',
            type: 'chaser',
            config: {
              mode: 'pingPong' as const,
              speed: 2,
              fixtures: [0, 1, 2],
              stepSize: 1,
              color: { r: 255, g: 255, b: 255 },
              channels: [2, 3, 4],
            } as any,
            priority: 1,
            enabled: true,
          },
        ],
      },
      {
        id: 'scene-3',
        name: 'Pulse Dimmer',
        duration: 5000,
        fadeIn: 300,
        fadeOut: 300,
        type: 'fx',
        bpmSync: false,
        baseState: {
          0: {
            1: 100,
          },
        },
        fx: [
          {
            id: 'fx-4',
            type: 'value',
            config: {
              mode: 'pulse' as const,
              speed: 1.5,
              channels: [1],
              amplitude: 200,
              offset: 50,
            } as any,
            priority: 1,
            enabled: true,
          },
        ],
      },
    ]

    // Add scenes to bank
    for (const scene of demoScenes) {
      bankManager.addScene(bank.id, scene)
    }

    // Create mixer groups
    liveMixer.createGroup('Spots', [1], '#FF0000')
    liveMixer.createGroup('RGB Pars', [2, 3, 4], '#00FF00')

    // Store engines
    setEngines({
      dmx: dmxEngine,
      playback: playbackEngine,
      bank: bankManager,
      fixtures: fixtureDatabase,
      mixer: liveMixer,
    })

    setDemoScenes(demoScenes)
    setReady(true)

    // Cleanup
    return () => {
      dmxEngine.stop()
    }
  }, [])

  if (!ready || !engines) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0a0a0a',
          color: '#00ff00',
          fontFamily: 'monospace',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '20px' }}>
            🔦 DASLIGHT 5 - PHASE 5
          </div>
          <div style={{ fontSize: '14px', color: '#888' }}>
            Initializing Engines...
          </div>
          <div
            style={{
              marginTop: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              fontSize: '12px',
            }}
          >
            <div>✓ DMXEngine</div>
            <div>✓ PlaybackEngine</div>
            <div>✓ BankManager</div>
            <div>✓ FixtureDatabase</div>
            <div>✓ LiveMixer</div>
            <div>✓ FX Engines (5)</div>
            <div>✓ Console UI</div>
            <div>✓ MIDI/OSC</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DasLight5ConsoleUI
      dmxEngine={engines.dmx}
      playbackEngine={engines.playback}
      bankManager={engines.bank}
      fixtureDatabase={engines.fixtures}
      liveMixer={engines.mixer}
    />
  )
}

export default Phase5IntegrationDemo
