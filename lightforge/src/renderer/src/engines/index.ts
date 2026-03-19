/**
 * engines/index.ts
 * Central export for all Daslight 5 engines
 */

export { DMXEngine, globalDMXEngine, DMXState, DMXChannel, FXState } from './DMXEngine'
export { ColorFXEngine, ColorFXConfig, RGBColor } from './ColorFXEngine'
export { ChaserFXEngine, ChaserFXConfig } from './ChaserFXEngine'
export { MoveFXEngine, MoveFXConfig, Position } from './MoveFXEngine'
export { ValueFXEngine, ValueFXConfig } from './ValueFXEngine'
export { CurveFXEngine, CurveFXConfig, CurvePoint } from './CurveFXEngine'
export { FixtureDatabase, globalFixtureDatabase, FixtureProfile, FixtureChannel, FixtureMode, InstalledFixture } from './FixtureDatabase'
export { PlaybackEngine, globalPlaybackEngine, Scene, FXStack, PlaybackState } from './PlaybackEngine'
export { BankManager, SceneBank } from './BankManager'
export { SuperSceneTimeline, TimelineTrack, TimelineClip, AudioContent, ControlEvent, SuperSceneTimeline as SuperSceneTimelineType, TimelineMarker, AutomationTrack, AutomationKeyframe } from './SuperSceneTimeline'
export { LiveMixer, globalLiveMixer, MixerGroup, MixerFader, MixerEffect, MixerBus } from './LiveMixer'

/**
 * Initialize all engines with default settings
 */
export function initializeDasLight5Engines() {
  const globalDMXEngine = require('./DMXEngine').globalDMXEngine
  const globalFixtureDatabase = require('./FixtureDatabase').globalFixtureDatabase
  const globalPlaybackEngine = require('./PlaybackEngine').globalPlaybackEngine
  const globalLiveMixer = require('./LiveMixer').globalLiveMixer

  globalDMXEngine.start()

  return {
    dmx: globalDMXEngine,
    fixtures: globalFixtureDatabase,
    playback: globalPlaybackEngine,
    mixer: globalLiveMixer,
    banks: new (require('./BankManager').BankManager)(),
  }
}
