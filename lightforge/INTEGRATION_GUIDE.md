# SceneEditorAdvanced Integration Guide

**Version:** 1.0  
**Status:** Production Ready  
**Last Updated:** 2024

---

## Quick Start (5 Minutes)

### 1. Import Component
```tsx
import { SceneEditorAdvanced } from '@/components/pro/SceneEditorAdvanced'
```

### 2. Add to Your App
```tsx
export function App() {
  return (
    <SceneEditorAdvanced
      initialSceneId="scene-1"
      enableTimeline={true}
      enableMIDI={true}
      onSceneChange={(sceneId) => {
        console.log('Scene changed to:', sceneId)
      }}
    />
  )
}
```

### 3. That's It!
All features work out of the box:
- Professional UI layout
- MIDI mapping
- Keyboard shortcuts
- Scene templates
- Advanced effects
- Release modes

---

## Complete Integration (30 Minutes)

### Step 1: Verify Store Setup
Ensure your Zustand stores exist:
```tsx
// Must have:
useFixtureStore()          // With fixtures array
useDmxStore()             // With channels, setChannel()
```

### Step 2: Import All Components
Already done in `SceneEditorAdvanced.tsx`:
```tsx
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
```

### Step 3: Setup Store Integration (Optional)
If you want to persist MIDI/Keyboard mappings:

```tsx
// In your store:
interface SceneEditorStore {
  midiMappings: MIDIMapping[]
  keyboardShortcuts: KeyboardShortcut[]
  sceneTemplates: SceneTemplate[]
}

// Add actions:
setMIDIMapping: (mapping) => void
deleteKeyboardShortcut: (id) => void
saveSceneTemplate: (template) => void
```

### Step 4: Add State Management (Optional)
For advanced features:

```tsx
const [releaseMode, setReleaseMode] = useState<ReleaseMode>('group')
const [midiMappings, setMidiMappings] = useState<MIDIMapping[]>([])
const [sceneTemplates, setSceneTemplates] = useState<SceneTemplate[]>([])
```

---

## Configuration Options

### SceneEditorAdvanced Props
```tsx
interface SceneEditorAdvancedProps {
  // Initial scene to load
  initialSceneId?: string

  // Callback when scene changes
  onSceneChange?: (sceneId: string) => void

  // Enable/disable features
  enableTimeline?: boolean        // Default: true
  enableMIDI?: boolean           // Default: true
}
```

### Usage Example
```tsx
<SceneEditorAdvanced
  initialSceneId="intro-scene"
  enableTimeline={false}         // Disable timeline for simpler UI
  enableMIDI={true}
  onSceneChange={(id) => {
    console.log('Playing:', id)
    // Update your app state
    updateCurrentScene(id)
  }}
/>
```

---

## Keyboard Shortcuts (Built-in)

| Shortcut | Action | Component |
|----------|--------|-----------|
| **Space** | Play/Pause | Transport |
| **Escape** | Stop | Transport |
| **Ctrl+M** | Toggle MIDI Panel | Main |
| **Ctrl+K** | Toggle Keyboard Panel | Main |
| **Ctrl+T** | Toggle Timeline | Main |

### Custom Shortcuts (Optional)
Add to `SceneEditorAdvanced.tsx` in the `useEffect`:
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      // Your custom action
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

---

## MIDI Mapping Integration

### How It Works
1. User clicks "Learn Mode" in MIDI panel
2. User presses MIDI controller (CC message)
3. MIDI message is auto-detected
4. Map to: Scene, Parameter, or Button
5. Save mapping

### Example: Connect to DMX
```tsx
// When MIDI mapping triggers:
const handleMIDIValue = (midiNumber: number, value: number) => {
  const mapping = midiMappings.find(m => m.midiNumber === midiNumber)
  if (mapping?.actionType === 'parameter') {
    // Set DMX channel
    setChannel(mapping.actionTarget, value)
  }
}
```

---

## Scene Templates

### Built-in Templates
```
1. Color Fade         → Smooth color transition
2. Rainbow Chase      → Rainbow lauflicht effect
3. Strobe Pulse       → Strobe effect
```

### Create Custom Template
```tsx
const template: SceneTemplate = {
  id: 'tpl-custom',
  name: 'My Custom Scene',
  description: 'My personal scene setup',
  category: 'Custom',
  dataSnapshot: {
    fixtures: [...],
    dmxChannels: {...},
    effects: [...],
  },
  createdAt: new Date(),
  modifiedAt: new Date(),
}
```

### Save/Load
```tsx
// Save
sceneTemplates.push(template)

// Load
const loaded = sceneTemplates.find(t => t.id === 'tpl-custom')
if (loaded) {
  // Apply loaded.dataSnapshot to current scene
}
```

---

## Advanced Effects

### Effect Types
```
1. Color FX    → Farbwechsel
2. Chaser      → Lauflicht
3. Move FX     → Bewegungseffekt
4. Value FX    → Dimmer Puls
5. Curve       → Custom Kurve
```

### Blend Modes
```
Add       → Werte addieren (Helligkeit ↑)
Multiply  → Werte multiplizieren
Override  → Effekt überschreibt
Lerp      → Interpolation (smooth)
```

### Example: Create Effect
```tsx
const effect = {
  id: 'fx-1',
  name: 'Rainbow',
  type: 'color' as EffectType,
  speed: 2.0,
  phase: 0,
  spread: 1.0,
  enabled: true,
  blendMode: 'add' as BlendMode,
  intensity: 1.0,
}
```

---

## Release Modes

### Understanding Release Modes
```
OFF          scene1 + scene2 + scene3 (all play)
GROUP        scene1 stops others in same group
ALL          scene1 stops all others
EXCEPT       scene1 stops all other groups
```

### Implementation
```tsx
const handleReleaseMode = (sceneId: string, mode: ReleaseMode) => {
  switch (mode) {
    case 'off':
      // Allow multiple scenes
      break
    case 'group':
      // Stop same group
      scenes.forEach(s => {
        if (s.group === scenes[sceneId].group && s.id !== sceneId) {
          stopScene(s.id)
        }
      })
      break
    case 'all':
      // Stop all others
      stopAllScenes()
      playScene(sceneId)
      break
    case 'except':
      // Stop other groups
      stopAllScenesByGroupExcept(scenes[sceneId].group)
      break
  }
}
```

---

## Data Persistence

### Save to LocalStorage
```tsx
// Save MIDI mappings
localStorage.setItem(
  'midi-mappings',
  JSON.stringify(midiMappings)
)

// Load MIDI mappings
const saved = localStorage.getItem('midi-mappings')
if (saved) {
  setMidiMappings(JSON.parse(saved))
}
```

### Save to Backend
```tsx
// POST to server
const saveMappings = async (mappings: MIDIMapping[]) => {
  await fetch('/api/midi-mappings', {
    method: 'POST',
    body: JSON.stringify(mappings),
  })
}
```

---

## Styling & Customization

### Colors (Tailwind)
- **Primary:** `blue-600` (interactive elements)
- **Success:** `green-600` (play buttons)
- **Danger:** `red-600` (delete buttons)
- **Warning:** `orange-600` (alerts)
- **Background:** `slate-900` (main), `slate-800` (panels)
- **Text:** `slate-200` (light), `slate-500` (hint)

### Custom Theme
To change colors, edit component files:
```tsx
// Example: Change primary color from blue to purple
className="bg-blue-600"  →  className="bg-purple-600"

// Find & Replace in all components:
// blue-600   → purple-600
// blue-700   → purple-700
// blue-500   → purple-500
```

### Custom Layout
Modify `SceneEditorAdvanced.tsx` layout structure:
```tsx
// Current: Left (grid+stage) | Center (faders+settings) | Right (dials+fx)
// Change to: Top (grid) | Middle (stage+faders) | Right (controls)

// Just rearrange the flex containers:
<div className="flex-1 flex gap-0">
  {/* Rearrange panels here */}
</div>
```

---

## Performance Tips

### 1. Memoization
Components already use `useMemo` for expensive calculations:
```tsx
const channels = useMemo(() => {
  return computeChannels(selectedFixtures)
}, [selectedFixtures])
```

### 2. RAF Loop
Only runs when playing:
```tsx
useEffect(() => {
  if (!state.isPlaying) return
  const loop = () => { /* run effects */ }
  rafRef.current = requestAnimationFrame(loop)
}, [state.isPlaying])
```

### 3. Event Delegation
Use event bubbling for many items:
```tsx
const handleClick = (e: React.MouseEvent) => {
  const target = e.target as HTMLElement
  const sceneId = target.dataset.sceneId
  // Handle single click for many elements
}
```

---

## Troubleshooting

### Issue: Components not rendering
**Solution:** Check imports are correct
```tsx
// ❌ Wrong
import { SceneGridPanel } from './SceneGridPanel'

// ✅ Correct
import { SceneGridPanel } from './components/pro/SceneGridPanel'
```

### Issue: Styles not applied
**Solution:** Ensure Tailwind CSS v4 is configured
```tsx
// Check tailwind.config.ts includes:
content: ['./src/**/*.{tsx,ts}']
```

### Issue: MIDI mapping not working
**Solution:** Check browser console for MIDI API errors
```tsx
if (!navigator.requestMIDIAccess) {
  console.error('MIDI API not supported in this browser')
}
```

### Issue: Keyboard shortcuts not working
**Solution:** Ensure event listener is attached
```tsx
// Add to window or specific element
window.addEventListener('keydown', handler)
// Not: element.addEventListener()
```

---

## Testing

### Unit Test Example
```tsx
import { render, screen } from '@testing-library/react'
import { SceneGridPanel } from './SceneGridPanel'

test('renders scene grid', () => {
  render(<SceneGridPanel selectedSceneId="s1" onSelectScene={jest.fn()} />)
  expect(screen.getByRole('button')).toBeInTheDocument()
})
```

### Integration Test
```tsx
test('plays scene on selection', async () => {
  const onSceneChange = jest.fn()
  render(
    <SceneEditorAdvanced 
      onSceneChange={onSceneChange}
      enableMIDI={true}
    />
  )
  // Simulate user interaction
  // Verify callbacks fired
})
```

---

## Deployment

### Production Build
```bash
npm run build
# Bundles all components into dist/
```

### Docker
```dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Vercel/Netlify
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

---

## Support & Docs

See related documentation:
- `QUICK_START.md` – 5-minute setup
- `SCENE_EDITOR_PROFESSIONAL_COMPONENTS.md` – Full API reference
- `DELIVERY_REPORT.md` – Specification & features
- `PHASE_2_DELIVERY_REPORT.md` – Technical deep dive

---

## License & Attribution

All components created by GitHub Copilot.  
Inspired by Daslight 5 professional DMX lighting control.

---

**Ready to integrate? Start with `SceneEditorAdvanced` — everything else is included!**
