// ════════════════════════════════════════════════════════════════════════════
//  SceneTemplateLibrary — Save/load scene presets and templates
// ════════════════════════════════════════════════════════════════════════════

import { useState } from 'react'

interface SceneTemplate {
  id: string
  name: string
  description: string
  category: string
  preview?: string
  createdAt: Date
  modifiedAt: Date
  dataSnapshot: Record<string, any>
}

interface SceneTemplatePanelProps {
  templates: SceneTemplate[]
  onLoadTemplate?: (template: SceneTemplate) => void
  onSaveAsTemplate?: (name: string, description: string, category: string) => void
  onDeleteTemplate?: (templateId: string) => void
  onUpdateTemplate?: (templateId: string, changes: Partial<SceneTemplate>) => void
}

const TEMPLATE_CATEGORIES = [
  'Farben',
  'Bewegungen',
  'Chase',
  'Strobe',
  'Stimmung',
  'Effekte',
  'Übergänge',
  'Custom',
]

const DEFAULT_TEMPLATES: SceneTemplate[] = [
  {
    id: 'tpl-color-fade',
    name: 'Color Fade',
    description: 'Sanfter Farbübergang',
    category: 'Farben',
    createdAt: new Date(),
    modifiedAt: new Date(),
    dataSnapshot: {
      duration: 2000,
      fadeIn: 500,
      fadeOut: 500,
      wave: 'sine',
    },
  },
  {
    id: 'tpl-chase-rainbow',
    name: 'Rainbow Chase',
    description: 'Lauflicht mit Regenbogenfarben',
    category: 'Chase',
    createdAt: new Date(),
    modifiedAt: new Date(),
    dataSnapshot: {
      duration: 4000,
      speed: 2.0,
      wave: 'sawtooth',
      colors: ['#FF0000', '#00FF00', '#0000FF', '#FFFF00'],
    },
  },
  {
    id: 'tpl-strobe-pulse',
    name: 'Strobe Pulse',
    description: 'Strobe-Effekt mit Puls',
    category: 'Strobe',
    createdAt: new Date(),
    modifiedAt: new Date(),
    dataSnapshot: {
      duration: 1000,
      speed: 4.0,
      wave: 'square',
      intensity: 1.0,
    },
  },
]

export function SceneTemplateLibrary({
  templates = DEFAULT_TEMPLATES,
  onLoadTemplate,
  onSaveAsTemplate,
  onDeleteTemplate,
  onUpdateTemplate,
}: SceneTemplatePanelProps): React.JSX.Element {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newTemplateDescription, setNewTemplateDescription] = useState('')
  const [newTemplateCategory, setNewTemplateCategory] = useState('Custom')

  const filtered = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates

  const handleSave = () => {
    if (newTemplateName.trim()) {
      onSaveAsTemplate?.(newTemplateName, newTemplateDescription, newTemplateCategory)
      setNewTemplateName('')
      setNewTemplateDescription('')
      setShowSaveDialog(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-700 shrink-0">
        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
          📚 Scene Template Library
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Speichere und lade Szenen-Vorlagen
        </p>
      </div>

      {/* Controls */}
      <div className="px-4 py-2 border-b border-slate-700 space-y-2 shrink-0">
        {/* View Toggle */}
        <div className="flex gap-1">
          <button
            onClick={() => setView('grid')}
            className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-colors ${
              view === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            ◻ Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-colors ${
              view === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            ≡ List
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            Alle
          </button>
          {TEMPLATE_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid/List */}
      <div className="flex-1 overflow-y-auto p-4">
        {view === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(template => (
              <div
                key={template.id}
                className="bg-slate-800 border border-slate-700 rounded hover:border-slate-500 transition-colors overflow-hidden group"
              >
                {/* Preview */}
                {template.preview && (
                  <div className="h-20 bg-slate-700 flex items-center justify-center">
                    <img
                      src={template.preview}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-2 space-y-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">
                      {template.name}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {template.description}
                    </p>
                  </div>

                  <div className="text-xs text-slate-500">
                    <span className="bg-slate-700 px-1.5 py-0.5 rounded">
                      {template.category}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onLoadTemplate?.(template)}
                      className="flex-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                    >
                      ✓ Load
                    </button>
                    <button
                      onClick={() => onDeleteTemplate?.(template.id)}
                      className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-2">
            {filtered.map(template => (
              <div
                key={template.id}
                className="bg-slate-800 border border-slate-700 rounded p-3 hover:border-slate-500 transition-colors flex justify-between items-start"
              >
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-200">
                    {template.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {template.description}
                  </p>
                  <div className="text-xs text-slate-500 mt-2">
                    <span className="bg-slate-700 px-1.5 py-0.5 rounded">
                      {template.category}
                    </span>
                  </div>
                </div>

                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => onLoadTemplate?.(template)}
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => onDeleteTemplate?.(template.id)}
                    className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-slate-500 text-sm italic text-center py-8">
            Keine Templates in dieser Kategorie
          </div>
        )}
      </div>

      {/* Save Template Button */}
      <div className="px-4 py-3 border-t border-slate-700 bg-slate-800 shrink-0">
        <button
          onClick={() => setShowSaveDialog(true)}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors"
        >
          💾 Save Current as Template
        </button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 max-w-md w-full mx-4 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">
              Save as Template
            </h3>

            <div>
              <label className="block text-sm text-slate-400 mb-2 font-semibold">
                Template Name
              </label>
              <input
                type="text"
                placeholder="z.B. 'My Custom Chase'"
                value={newTemplateName}
                onChange={e => setNewTemplateName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2 font-semibold">
                Description
              </label>
              <textarea
                placeholder="Beschreibe diesen Template..."
                value={newTemplateDescription}
                onChange={e => setNewTemplateDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2 font-semibold">
                Category
              </label>
              <select
                value={newTemplateCategory}
                onChange={e => setNewTemplateCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TEMPLATE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded transition-colors"
              >
                ✓ Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold rounded transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
