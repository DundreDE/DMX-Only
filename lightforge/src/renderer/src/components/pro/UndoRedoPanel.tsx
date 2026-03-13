// ════════════════════════════════════════════════════════════════════════════
//  UndoRedoPanel — UI for undo/redo history
// ════════════════════════════════════════════════════════════════════════════

import { useUndoRedoStore } from '../../stores/undoRedoStore'

export function UndoRedoPanel(): React.JSX.Element {
  const { history, currentIndex, canUndo, canRedo, undo, redo, clearHistory, jumpToAction } =
    useUndoRedoStore()

  return (
    <div className="flex items-center gap-2 px-2 py-1">
      {/* Undo Button */}
      <button
        onClick={() => undo()}
        disabled={!canUndo()}
        className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors font-semibold"
        title="Ctrl+Z"
      >
        ↶ Undo
      </button>

      {/* Redo Button */}
      <button
        onClick={() => redo()}
        disabled={!canRedo()}
        className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors font-semibold"
        title="Ctrl+Y"
      >
        ↷ Redo
      </button>

      {/* History Status */}
      <div className="text-xs text-slate-400 ml-2">
        {currentIndex + 1} / {history.length}
      </div>

      {/* Clear Button */}
      {history.length > 0 && (
        <button
          onClick={() => clearHistory()}
          className="ml-auto px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          Clear
        </button>
      )}

      {/* History Dropdown */}
      {history.length > 0 && (
        <div className="relative group">
          <button className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors">
            📋 History
          </button>
          <div className="absolute right-0 top-8 w-48 bg-slate-800 border border-slate-600 rounded shadow-lg max-h-64 overflow-y-auto z-50 hidden group-hover:block">
            {history.map((action, idx) => (
              <button
                key={action.id}
                onClick={() => jumpToAction(idx)}
                className={`w-full text-left px-3 py-2 text-xs border-b border-slate-700 transition-colors ${
                  idx === currentIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="font-semibold">{action.description}</div>
                <div className="text-slate-500 text-xs mt-1">
                  {new Date(action.timestamp).toLocaleTimeString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
