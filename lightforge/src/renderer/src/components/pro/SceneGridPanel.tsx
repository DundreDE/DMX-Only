// ════════════════════════════════════════════════════════════════════════════
//  Scene Grid Panel — Professional scene button grid (Daslight-style)
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'
import type { Scene, Bank } from '../../../../shared/types'

interface SceneGridPanelProps {
  scenes: Scene[]
  banks: Bank[]
  selectedSceneId: string | null
  selectedBankId: string | null
  onSelect: (sceneId: string) => void
  onActivate: (scene: Scene) => void
  onDelete: (sceneId: string) => void
  onRename: (sceneId: string, newName: string) => void
  onCopy: (scene: Scene) => void
}

export function SceneGridPanel({
  scenes,
  banks,
  selectedSceneId,
  selectedBankId,
  onSelect,
  onActivate,
  onDelete,
  onRename,
  onCopy,
}: SceneGridPanelProps): React.JSX.Element {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameText, setRenameText] = useState('')
  const [contextMenu, setContextMenu] = useState<{
    sceneId: string
    x: number
    y: number
  } | null>(null)

  const bankColor = selectedBankId
    ? banks.find(b => b.id === selectedBankId)?.color
    : undefined

  const handleContextMenu = (
    e: React.MouseEvent,
    sceneId: string,
  ): void => {
    e.preventDefault()
    setContextMenu({ sceneId, x: e.clientX, y: e.clientY })
  }

  const handleRenameStart = (scene: Scene): void => {
    setRenamingId(scene.id)
    setRenameText(scene.name)
    setContextMenu(null)
  }

  const handleRenameSave = (sceneId: string): void => {
    if (renameText.trim()) {
      onRename(sceneId, renameText.trim())
    }
    setRenamingId(null)
  }

  const handleSceneClick = (e: React.MouseEvent, sceneId: string): void => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width

    // Left half = play, right half = edit
    if (x < width / 2) {
      const scene = scenes.find(s => s.id === sceneId)
      if (scene) onActivate(scene)
    } else {
      onSelect(sceneId)
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
          Szenen-Gitter
        </h3>
      </div>

      {/* Scene grid - scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {scenes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            Keine Szenen. Erstelle eine neue Szene.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {scenes.map(scene => (
              <div
                key={scene.id}
                className="relative group"
              >
                {renamingId === scene.id ? (
                  <div className="p-2 bg-slate-800 rounded border border-blue-500 flex flex-col gap-1">
                    <input
                      autoFocus
                      value={renameText}
                      onChange={e => setRenameText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')
                          handleRenameSave(scene.id)
                        if (e.key === 'Escape') setRenamingId(null)
                      }}
                      className="px-2 py-1 text-xs bg-slate-700 text-white rounded focus:outline-none"
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleRenameSave(scene.id)}
                        className="flex-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setRenamingId(null)}
                        className="flex-1 px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={e => handleSceneClick(e, scene.id)}
                      onContextMenu={e => handleContextMenu(e, scene.id)}
                      style={{
                        borderColor: bankColor || '#3f46e6',
                        backgroundColor:
                          selectedSceneId === scene.id
                            ? 'rgba(59, 130, 246, 0.3)'
                            : 'rgba(30, 41, 59, 0.8)',
                      }}
                      className="w-full p-3 rounded border-2 text-left transition-colors hover:bg-slate-700 hover:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <div className="text-xs font-semibold text-slate-200 truncate">
                        {scene.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {scene.fadeTime > 0
                          ? `${scene.fadeTime}ms fade`
                          : 'Direkt'}
                      </div>
                      <div className="flex gap-1 mt-2">
                        {scene.effects && scene.effects.length > 0 && (
                          <span className="inline-block px-1.5 py-0.5 text-xs bg-purple-600 text-white rounded">
                            {scene.effects.length}
                            {' '}
                            FX
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Hover actions */}
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          const scene = scenes.find(s => s.id === scene.id)
                          if (scene) onCopy(scene)
                        }}
                        className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs"
                        title="Duplizieren"
                      >
                        📋
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          onDelete(scene.id)
                        }}
                        className="p-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                        title="Löschen"
                      >
                        🗑
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed bg-slate-800 rounded border border-slate-600 shadow-lg z-50 overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(null)}
        >
          {[
            {
              label: '▶ Abspielen',
              action: () => {
                const scene = scenes.find(s => s.id === contextMenu.sceneId)
                if (scene) onActivate(scene)
                setContextMenu(null)
              },
            },
            {
              label: '✎ Bearbeiten',
              action: () => {
                onSelect(contextMenu.sceneId)
                setContextMenu(null)
              },
            },
            {
              label: '✑ Umbenennen',
              action: () => {
                const scene = scenes.find(s => s.id === contextMenu.sceneId)
                if (scene) handleRenameStart(scene)
              },
            },
            {
              label: '📋 Duplizieren',
              action: () => {
                const scene = scenes.find(s => s.id === contextMenu.sceneId)
                if (scene) onCopy(scene)
                setContextMenu(null)
              },
            },
            {
              label: '🗑 Löschen',
              action: () => {
                onDelete(contextMenu.sceneId)
                setContextMenu(null)
              },
            },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={item.action}
              className="block w-full px-4 py-2 text-sm text-left text-slate-200 hover:bg-slate-700 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
