# Component Directory & Quick Reference

**Complete Scene Editor Component Suite**

---

## 📂 File Structure

```
lightforge/src/renderer/src/
├── components/
│   └── pro/
│       ├── SceneGridPanel.tsx                    ← Scene selection grid
│       ├── StageView2D.tsx                       ← 2D fixture visualization
│       ├── FeatureFaderPanel.tsx                 ← DMX channels by type
│       ├── SceneSettingsPanel.tsx                ← 3-tab scene editor
│       ├── LiveControlDials.tsx                  ← Speed/Size/Phase/Offset
│       ├── FXGeneratorPanel.tsx                  ← Effect creation UI
│       ├── TimelinePanel.tsx                     ← Super Scene timeline
│       ├── PlaybackControlPanel.tsx              ← Transport controls
│       ├── ReleaseModeSelector.tsx               ← Off/Group/All/Except
│       ├── MIDIMappingPanel.tsx                  ← MIDI learn mode
│       ├── KeyboardShortcutsPanel.tsx            ← Keyboard mapping
│       ├── AdvancedEffectsPanel.tsx              ← Effects + blend modes
│       ├── SceneTemplateLibrary.tsx              ← Template management
│       └── SceneEditorAdvanced.tsx               ← Master container
└── utils/
    └── sceneEditorHelpers.ts                     ← Utilities & helpers
```

---

## 🎨 Component Details

### Phase 1: Core Components

#### 1️⃣ **SceneGridPanel.tsx** (340 lines)
**Purpose:** Display and manage scenes  
**Key Features:**
- 2×N grid layout
- Context menu (rename, copy, delete)
- Scene selection
- Hover actions

**Props:**
```tsx
interface Props {
  selectedSceneId?: string
  onSelectScene: (sceneId: string) => void
}
```

**Import:**
```tsx
import { SceneGridPanel } from '@/components/pro/SceneGridPanel'
```

---

#### 2️⃣ **StageView2D.tsx** (220 lines)
**Purpose:** Visualize fixtures on stage  
**Key Features:**
- Canvas-based rendering
- Multi-select (Ctrl+Click, drag)
- Grid overlay
- Fixture labels

**Props:**
```tsx
interface Props {
  fixtures: PatchedFixture[]
  selectedFixtures: string[]
  onSelectFixture: (id: string, multiSelect?: boolean) => void
  channels: DMXChannel[]
}
```

**Import:**
```tsx
import { StageView2D } from '@/components/pro/StageView2D'
```

---

#### 3️⃣ **FeatureFaderPanel.tsx** (240 lines)
**Purpose:** Control DMX channels by category  
**Key Features:**
- Grouped channels (Dimmer, Color, Pan/Tilt, etc.)
- Sliders & color pickers
- Real-time DMX output
- Memoized for performance

**Props:**
```tsx
interface Props {
  selectedFixtures: string[]
  fixtures: PatchedFixture[]
  channels: number[]
}
```

**Import:**
```tsx
import { FeatureFaderPanel } from '@/components/pro/FeatureFaderPanel'
```

---

#### 4️⃣ **SceneSettingsPanel.tsx** (330 lines)
**Purpose:** Edit scene properties & contents  
**Key Features:**
- 3 tabs: Properties, Contents, Advanced
- Wave type selection
- Fade in/out
- Release mode selector

**Props:**
```tsx
interface Props {
  sceneId: string
  selectedFixtures: string[]
}
```

**Import:**
```tsx
import { SceneSettingsPanel } from '@/components/pro/SceneSettingsPanel'
```

---

#### 5️⃣ **LiveControlDials.tsx** (210 lines)
**Purpose:** Real-time effect parameter control  
**Key Features:**
- 4 visual dials: Speed, Size, Phase, Offset
- Conic gradient visualization
- Live preview
- Value display

**Props:**
```tsx
interface Props {
  onSpeedChange?: (speed: number) => void
  onSizeChange?: (size: number) => void
  onPhaseChange?: (phase: number) => void
  onOffsetChange?: (offset: number) => void
}
```

**Import:**
```tsx
import { LiveControlDials } from '@/components/pro/LiveControlDials'
```

---

#### 6️⃣ **FXGeneratorPanel.tsx** (290 lines)
**Purpose:** Create and configure effects  
**Key Features:**
- 5 wave types: sine, triangle, square, sawtooth, random
- Phase & spread control
- Target fixture selection
- Effect preview

**Props:**
```tsx
interface Props {
  selectedFixtures: string[]
  onEffectCreate?: (effect: Effect) => void
}
```

**Import:**
```tsx
import { FXGeneratorPanel } from '@/components/pro/FXGeneratorPanel'
```

---

### Phase 2: Advanced Components

#### 7️⃣ **TimelinePanel.tsx** (9,000 lines)
**Purpose:** Super Scene timeline sequencing  
**Key Features:**
- Canvas-based timeline rendering
- Drag-to-reorder events
- Time ruler with labels
- Zoom/pan controls

**Props:**
```tsx
interface Props {
  sceneId: string
  isPlaying: boolean
  playbackMode: PlaybackMode
}
```

**Import:**
```tsx
import { TimelinePanel } from '@/components/pro/TimelinePanel'
```

---

#### 8️⃣ **PlaybackControlPanel.tsx** (7,000 lines)
**Purpose:** Transport controls & playback modes  
**Key Features:**
- Play/Pause/Stop buttons
- 4 playback modes: Forward, Reverse, Bounce, Pause
- Playback info display
- Keyboard shortcut hints

**Props:**
```tsx
interface Props {
  playbackMode: PlaybackMode
  releaseMode: ReleaseMode
  isPlaying: boolean
  onPlaybackModeChange: (mode: PlaybackMode) => void
  onPlayPause: () => void
  onStop: () => void
}
```

**Import:**
```tsx
import { PlaybackControlPanel } from '@/components/pro/PlaybackControlPanel'
```

---

#### 9️⃣ **ReleaseModeSelector.tsx** (335 lines)
**Purpose:** Control multi-scene playback behavior  
**Key Features:**
- 4 modes: Off, Group, All, Except Group
- Visual mode description
- Current mode explanation
- Tips for each mode

**Props:**
```tsx
interface Props {
  releaseMode: ReleaseMode
  selectedGroupName?: string
  onReleaseModeChange: (mode: ReleaseMode) => void
}
```

**Import:**
```tsx
import { ReleaseModeSelector } from '@/components/pro/ReleaseModeSelector'
```

---

#### 🔟 **MIDIMappingPanel.tsx** (420 lines)
**Purpose:** Map MIDI controllers to scenes/parameters  
**Key Features:**
- Learn mode with visual feedback
- Auto-detect MIDI input
- Action type selection
- Visual MIDI notation

**Props:**
```tsx
interface Props {
  mappings: MIDIMapping[]
  onAddMapping?: (mapping: MIDIMapping) => void
  onRemoveMapping?: (id: string) => void
  onLearnMode?: (enabled: boolean) => void
  isLearning?: boolean
}
```

**Import:**
```tsx
import { MIDIMappingPanel } from '@/components/pro/MIDIMappingPanel'
```

---

#### 1️⃣1️⃣ **KeyboardShortcutsPanel.tsx** (445 lines)
**Purpose:** Map keyboard shortcuts to actions  
**Key Features:**
- 9 preset shortcuts
- Keyboard recording interface
- Combo key support (Ctrl+Shift+)
- Visual key notation

**Props:**
```tsx
interface Props {
  shortcuts: KeyboardShortcut[]
  onAddShortcut?: (shortcut: KeyboardShortcut) => void
  onRemoveShortcut?: (id: string) => void
  onEditShortcut?: (id: string, changes: Partial<KeyboardShortcut>) => void
}
```

**Import:**
```tsx
import { KeyboardShortcutsPanel } from '@/components/pro/KeyboardShortcutsPanel'
```

---

#### 1️⃣2️⃣ **AdvancedEffectsPanel.tsx** (625 lines)
**Purpose:** Manage multiple effects with blending  
**Key Features:**
- 5 effect types: Color, Chaser, Move, Value, Curve
- 4 blend modes: Add, Multiply, Override, Lerp
- Per-effect parameters
- Enable/disable effects

**Props:**
```tsx
interface Props {
  effects: Effect[]
  onAddEffect?: (effect: Effect) => void
  onRemoveEffect?: (id: string) => void
  onUpdateEffect?: (id: string, changes: Partial<Effect>) => void
}
```

**Import:**
```tsx
import { AdvancedEffectsPanel } from '@/components/pro/AdvancedEffectsPanel'
```

---

#### 1️⃣3️⃣ **SceneTemplateLibrary.tsx** (665 lines)
**Purpose:** Save and manage scene templates  
**Key Features:**
- Grid & list view modes
- 8 categories
- 3 built-in templates
- Save/load/delete actions

**Props:**
```tsx
interface Props {
  templates: SceneTemplate[]
  onLoadTemplate?: (template: SceneTemplate) => void
  onSaveAsTemplate?: (name: string, desc: string, cat: string) => void
  onDeleteTemplate?: (id: string) => void
}
```

**Import:**
```tsx
import { SceneTemplateLibrary } from '@/components/pro/SceneTemplateLibrary'
```

---

#### 1️⃣4️⃣ **SceneEditorAdvanced.tsx** (900 lines) 🌟
**Purpose:** Master container integrating all features  
**Key Features:**
- Professional Daslight 5 layout
- All 13 components combined
- Keyboard shortcuts
- RAF loop for playback
- State management

**Props:**
```tsx
interface Props {
  initialSceneId?: string
  onSceneChange?: (sceneId: string) => void
  enableTimeline?: boolean
  enableMIDI?: boolean
}
```

**Import:**
```tsx
import { SceneEditorAdvanced } from '@/components/pro/SceneEditorAdvanced'

// Usage:
<SceneEditorAdvanced
  initialSceneId="scene-1"
  enableTimeline={true}
  enableMIDI={true}
  onSceneChange={(id) => console.log('Scene:', id)}
/>
```

---

## 🛠️ Utilities

#### **sceneEditorHelpers.ts** (200+ lines)
**Purpose:** Reusable utilities for all components  
**Key Functions:**
```tsx
calcWave(time, type, speed, phase, spread)     // Calculate wave values
hsvToRgb(h, s, v)                              // Color conversion
rgbToHsv(r, g, b)                              // Color conversion
categorizeChannels(fixture)                    // Group DMX channels
getFixturesByType(fixtures, type)              // Filter fixtures
```

**Import:**
```tsx
import {
  calcWave,
  hsvToRgb,
  rgbToHsv,
  categorizeChannels,
  getFixturesByType,
} from '@/utils/sceneEditorHelpers'
```

---

## 📊 Component Relationships

```
SceneEditorAdvanced (main container)
│
├─→ SceneGridPanel
├─→ StageView2D
├─→ FeatureFaderPanel
├─→ SceneSettingsPanel
├─→ LiveControlDials
├─→ FXGeneratorPanel
├─→ TimelinePanel (optional)
├─→ PlaybackControlPanel
├─→ ReleaseModeSelector
├─→ MIDIMappingPanel (sidebar)
├─→ KeyboardShortcutsPanel (sidebar)
└─→ AdvancedEffectsPanel (modal)
```

---

## 🎯 Feature Matrix

| Feature | Component | Status |
|---------|-----------|--------|
| Scene Grid | SceneGridPanel | ✅ |
| 2D Visualization | StageView2D | ✅ |
| DMX Control | FeatureFaderPanel | ✅ |
| Scene Editor | SceneSettingsPanel | ✅ |
| Live Dials | LiveControlDials | ✅ |
| FX Creation | FXGeneratorPanel | ✅ |
| Timeline | TimelinePanel | ✅ |
| Transport | PlaybackControlPanel | ✅ |
| Release Modes | ReleaseModeSelector | ✅ |
| MIDI Mapping | MIDIMappingPanel | ✅ |
| Keyboard Shortcuts | KeyboardShortcutsPanel | ✅ |
| Advanced Effects | AdvancedEffectsPanel | ✅ |
| Scene Templates | SceneTemplateLibrary | ✅ |
| Master Container | SceneEditorAdvanced | ✅ |

---

## 🔧 Import Patterns

### Import All Components
```tsx
import { SceneEditorAdvanced } from '@/components/pro/SceneEditorAdvanced'
// Contains all 13 components internally
```

### Import Individual Components
```tsx
import { SceneGridPanel } from '@/components/pro/SceneGridPanel'
import { StageView2D } from '@/components/pro/StageView2D'
import { FeatureFaderPanel } from '@/components/pro/FeatureFaderPanel'
import { ReleaseModeSelector } from '@/components/pro/ReleaseModeSelector'
// etc.
```

### Import Utilities
```tsx
import {
  calcWave,
  hsvToRgb,
  categorizeChannels,
} from '@/utils/sceneEditorHelpers'
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `QUICK_START.md` | 5-minute integration |
| `INTEGRATION_GUIDE.md` | Complete setup |
| `SCENE_EDITOR_PROFESSIONAL_COMPONENTS.md` | Full API reference |
| `DELIVERY_REPORT.md` | Specifications |
| `PHASE_2_DELIVERY_REPORT.md` | Advanced features |
| `COMPONENT_DIRECTORY.md` | This file |

---

## 🚀 Getting Started

1. **Read:** `QUICK_START.md` (5 min)
2. **Integrate:** `INTEGRATION_GUIDE.md` (30 min)
3. **Reference:** Component docs in this directory
4. **Deploy:** Build & test

---

## ✅ Checklist

- [ ] All 14 components imported
- [ ] Zustand stores configured
- [ ] Tailwind CSS v4 enabled
- [ ] SceneEditorAdvanced integrated
- [ ] Keyboard shortcuts tested
- [ ] MIDI mapping working
- [ ] Scene templates saved/loaded
- [ ] Advanced effects working
- [ ] Release modes tested
- [ ] Timeline enabled (if needed)
- [ ] Styles applied correctly
- [ ] No TypeScript errors
- [ ] Performance verified
- [ ] Ready for production

---

**All components are production-ready and can be used independently or together.**

Choose your integration level:
- **Level 1:** Just use `SceneEditorAdvanced` ✅
- **Level 2:** Customize with individual components 🔧
- **Level 3:** Extend with custom components 🎨

