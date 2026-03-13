// ════════════════════════════════════════════════════════════════════════════
//  SceneLayerPanel — Visualize and control multiple active scenes
// ════════════════════════════════════════════════════════════════════════════

import { useMultiSceneStore } from '../../stores/multiSceneStore'

export function SceneLayerPanel(): React.JSX.Element {
  const { getActiveScenesArray, setMuted, setSoloed, setVolume, stopScene } =
    useMultiSceneStore()

  const activeScenes = getActiveScenesArray()

  return (
    <div className="flex flex-col h-full bg-slate-800 border border-slate-700 rounded overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
          🎬 Scene Layers
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          {activeScenes.length} active scene{activeScenes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeScenes.length === 0 ? (
          <div className="text-slate-500 text-sm italic text-center py-8">
            No active scenes
          </div>
        ) : (
          activeScenes.map((scene, idx) => (
            <div
              key={scene.sceneId}
              className="p-3 bg-slate-700 rounded border-l-4 border-blue-500 space-y-2"
            >
              {/* Layer Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-200">
                    {idx + 1}. {scene.sceneId}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Priority: {scene.priority}
                  </div>
                </div>
                <button
                  onClick={() => stopScene(scene.sceneId)}
                  className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Stop
                </button>
              </div>

              {/* Controls */}
              <div className="flex gap-1 items-center">
                {/* Mute */}
                <button
                  onClick={() => setMuted(scene.sceneId, !scene.isMuted)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    scene.isMuted
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                  title="Mute"
                >
                  🔇
                </button>

                {/* Solo */}
                <button
                  onClick={() => setSoloed(scene.sceneId, !scene.isSolo)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    scene.isSolo
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                  }`}
                  title="Solo"
                >
                  🎧
                </button>

                {/* Volume */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={scene.volume}
                  onChange={e => setVolume(scene.sceneId, parseFloat(e.target.value))}
                  className="flex-1 h-2"
                  title="Volume"
                />
                <div className="text-xs text-slate-400 w-8">
                  {(scene.volume * 100).toFixed(0)}%
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-2 border-t border-slate-700 bg-slate-700 text-xs text-slate-400 shrink-0">
        <div>💡 Drag to reorder priority</div>
        <div>🔇 Mute individual scenes</div>
        <div>🎧 Solo scene (mutes others)</div>
      </div>
    </div>
  )
}
