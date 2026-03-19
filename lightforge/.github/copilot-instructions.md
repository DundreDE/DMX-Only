# LightForge – Copilot Instructions

**LightForge** is a professional Electron + React + TypeScript DMX512 lighting control application for programming scenes, effects, and chasing sequences, then outputting to real hardware (USB DMX, ArtNet) or software preview. The UI mirrors industry standard Daslight 5.

## Quick Commands

```bash
npm run dev              # Development with hot reload (electron-vite)
npm run build           # Typecheck + production build  
npm run build:win       # Windows installer
npm run lint            # ESLint (cached)
npm run format          # Prettier code style
npm run typecheck       # Full TypeScript check (main + preload + renderer)
npm run typecheck:node  # Check main + preload only
npm run typecheck:web   # Check renderer only
```

**Code style:** Prettier enforces `singleQuote: true`, `semi: false`, `printWidth: 100`, `trailingComma: none`. Run `npm run format` before committing.

## Architecture – Three-Layer Process Model

```
┌─────────────────────────────────────────────────────────┐
│ RENDERER (React UI Layer)                              │
│ • Zustand stores (fixture, dmx, app, sceneBuilder)    │
│ • Components organized by feature (control, live, etc)│
│ • RAF-based effect engines (50fps frame generation)   │
└──────────────────────┬──────────────────────────────────┘
                       │ IPC (Promise-based)
                       ↓
┌─────────────────────────────────────────────────────────┐
│ PRELOAD (Context Bridge)                               │
│ • Exposes: window.dmx, window.fixture, window.project │
│ • Type-safe namespace routing                          │
└──────────────────────┬──────────────────────────────────┘
                       │ ipcRenderer.invoke/on
                       ↓
┌─────────────────────────────────────────────────────────┐
│ MAIN PROCESS (Node.js Backend)                         │
│ • DmxEngine: real-time 40Hz universe generation       │
│ • Outputs: SerialDmxOutput (ENTTEC), PreviewOutput   │
│ • File I/O, hardware connection management            │
└─────────────────────────────────────────────────────────┘
```

**Critical flows:**
- **DMX Output:** `renderer: setChannel()` → IPC `dmx:setChannel` → `main: DmxEngine.setChannel()` → serial/ArtNet @ 40Hz
- **Universe Feedback:** `main: DmxEngine` sends `dmx:universe-update` events → `renderer: useDmxStore` mirrors values
- **Scene Playback:** RAF loop in `SceneEditorPro` evaluates effects in real-time → batches IPC updates to main

## IPC Conventions

**Namespace-based API design** enforces security and clarity:

```typescript
// Register in main process:
ipcMain.handle('namespace:action', handler)

// Call from renderer:
const result = await window.namespace.action(args)
```

**Request-response pattern** (standard for most operations):
```typescript
// main/index.ts
ipcMain.handle('dmx:setChannel', (_e, universeIndex, channel, value) => {
  dmxEngine.setChannel(universeIndex, channel, value)
  return { success: true }
})

// renderer component
await window.dmx.setChannel(0, 1, 255)
```

**Fire-and-forget pattern** (rare; only for window controls):
```typescript
ipcRenderer.send('window:action') // no reply expected
ipcMain.on('window:action', handler)
```

**Push events** (main → renderer for real-time updates):
```typescript
mainWindow.webContents.send('dmx:universe-update', data)
ipcRenderer.on('dmx:universe-update', (data) => useDmxStore.applyUpdate(data))
```

**Current API endpoints:**
- `window.dmx.*` — setChannel, setChannels, setMaster, setBlackout, connectSerial, etc.
- `window.fixture.*` — importQxf, importFolder
- `window.project.*` — save, open, new
- `window.windowAPI.*` — minimize, maximize, close
- All APIs are typed in `src/preload/index.d.ts`

## State Management – Zustand Stores

Stores are organized by domain concern. Always import and use stores directly; avoid wrapping.

**Base stores** (`src/renderer/src/store/`):

| Store | Owns | Used For |
|-------|------|----------|
| `useFixtureStore` | Fixture library, patch config, scenes, chasers, banks, effects | Loading/saving project state; building UI selections |
| `useDmxStore` | Current DMX universe values (mirrored from main), master level, blackout | Real-time DMX display; fader sync |
| `useAppStore` | UI state: active tab (setup/control/live/settings), language, settings | Navigation; theme switching |

**Advanced stores** (`src/renderer/src/stores/`):

| Store | Purpose | Used For |
|-------|---------|----------|
| `sceneBuilderStore` | Scene editor state: selected effects, cues, channel groups, preview mode | Advanced scene editing; multi-effect layers |
| `undoRedoStore` | Undo/redo history stack (scene/effect changes) | Undo/redo buttons; change history |
| `oscStore` | OSC mapping and control bindings | OSC panel configuration |
| `multiSceneStore` | Multi-scene orchestration, sequencing, fade timing | Complex scene playback workflows |

**Key rule:** `useDmxStore.setChannel()` automatically calls both the local store **and** the main process IPC. Never call `window.dmx.setChannel()` separately when a store method exists.

## Dual DMX Engines (Main + Renderer)

**Main process** (`src/main/dmx/DmxEngine.ts`):
- Owns the canonical 100 universes (512-channel Uint8Array each)
- Refreshes at 40Hz (25ms per frame) for hardware stability
- All serial/ArtNet/hardware output happens here
- Tracks output connections (ENTTEC Pro/Open, Preview, ArtNet)

**Renderer process** (`src/renderer/src/engines/`):
- Contains specialized effect engines (Color, Chaser, Move, Value, Curve)
- RAF loop (50fps) evaluates effects and generates DMX frames
- Allows scene preview without sending to hardware
- Runs independently; batches updates to main process via IPC

**Why the split?**
- Main ensures hardware reliability and real-time performance
- Renderer provides instant visual feedback and complex effect previewing
- Decoupled: can pause/stop renderer effects without affecting hardware output

**40Hz vs 50Hz:** Main process syncs to USB safe rate (40Hz); renderer's RAF loop runs at screen refresh (typically 50-60fps) for smoother motion.

## Shared Types (`src/shared/types.ts`)

Key types to know:

- `FixtureDefinition` / `FixtureMode` / `FixtureChannel` / `FixtureCapability` — imported from QLC+ `.qxf` XML
- `PatchedFixture` — fixture placed at a universe + start address
- `Scene` — named snapshot of DMX values with effects (sparse by universe/channel)
- `SceneEffect` — timed effect with wave shape (sine/triangle/square/sawtooth/random), BPM speed, amplitude
- `Chaser` / `ChaserStep` — timed sequence of scenes
- `DmxOutputInfo` — hardware output descriptor (`enttec-open` | `enttec-pro` | `artnet` | `udmx` | `preview`)
- `Project` — top-level save format (JSON), contains settings, fixtures, patch, scenes, chasers
- `FixtureCapabilityType` — `Dimmer`, `Red`, `Green`, `Blue`, `White`, `Amber`, `UV`, `Pan`, `PanFine`, `Tilt`, `TiltFine`, `Gobo`, `Shutter`, `Strobe`, `Speed`, `ColorWheel`, `Maintenance`, `Nothing`, `Generic`

## Effects System – Wave-Based & Composable

Scenes support multiple effect engines that compose together with blend modes:

```typescript
interface SceneEffect {
  id: string
  label: string
  target: FixtureCapabilityType  // which channel type to affect (Red, Blue, Pan, etc.)
  wave: EfxWave                   // 'sine' | 'triangle' | 'square' | 'sawtooth' | 'random'
  speed: number                   // BPM (beats per minute)
  size: number                    // amplitude 0-255
  base: number                    // centre value 0-255
  offset: number                  // phase spread (degrees)
  fixtureIds: string[]            // patched fixtures to apply to
}
```

**Wave calculation:** Use `calcWave(wave, time_s, bpm, size, base, offset)` from `src/renderer/src/utils/sceneEditorHelpers.ts`. Outputs 0-255 DMX value at any time point.

**Effect engines** (`src/renderer/src/engines/`):
- `ColorFXEngine` — RGB/HSV effects (red chase, color pulse)
- `MoveFXEngine` — Pan/Tilt motion (sweep, rotate)
- `ChaserFXEngine` — Scene sequencing (step through scenes)
- `ValueFXEngine` — Generic channel values (dimmer ramp, speed)
- `CurveFXEngine` — Bezier curve interpolation (smooth fades)

**RAF playback loop:** `SceneEditorPro` uses `requestAnimationFrame` to:
1. Calculate effect values for current time
2. Apply effects to DMX universe (blend with base values)
3. Send batch updates to main process via IPC
4. Effects only play when RAF loop is active (button toggle controls this)

## QXF Fixture Format (QLC+ XML)

QXF files are standard QLC+ fixture definitions (3000+ available). Parser: `src/main/fixtures/QxfParser.ts` (regex-based, no external XML library).

```xml
<FixtureDefinition xmlns="http://www.qlcplus.org/FixtureDefinition">
  <Manufacturer>Stairville</Manufacturer>
  <Model>LED PAR56</Model>
  <Type>Color Changer</Type>  <!-- Moving Head, Color Changer, Dimmer, etc. -->

  <!-- Channel definitions (referenced by name in Mode) -->
  <Channel Name="Red" Preset="IntensityRed"/>  <!-- Preset = shorthand type -->
  <Channel Name="Mode">
    <Group Byte="0">Colour</Group>              <!-- Group = visual category -->
    <Capability Min="0" Max="63">RGB control</Capability>
    <Capability Min="64" Max="127" Preset="ColorMacro" Res1="#ff0000">Red</Capability>
  </Channel>

  <!-- Modes = device configurations (e.g., "5 Channel", "16 Channel") -->
  <Mode Name="5 Channel">
    <Channel Number="0">Mode</Channel>
    <Channel Number="1">Red</Channel>          <!-- Channel Number is 0-based in XML -->
    <Head><Channel>1</Channel><Channel>2</Channel></Head>  <!-- pixel groups -->
  </Mode>

  <Physical>
    <Bulb Type="LED" Lumens="0" ColourTemperature="0"/>
    <Layout Width="4" Height="1"/>  <!-- pixel grid dimensions -->
  </Physical>
</FixtureDefinition>
```

**Parser details** (`src/main/fixtures/QxfParser.ts`):
- **Regex-based:** Custom XML parser (no DOM/xml2js dependency)
- **Channel numbering:** XML uses 0-based; parser converts to **1-based** in `FixtureChannel.number` (+1)
- **Type mapping:** `Channel.Preset` → `FixtureCapabilityType` first; fallback to regex match on channel name
- **Valid Presets:** `IntensityRed`, `IntensityGreen`, `IntensityBlue`, `IntensityWhite`, `PositionPan`, `PositionTilt`, `SpeedPanTiltFastSlow`, etc.
- **Capability Types:** Dimmer, Red, Green, Blue, White, Amber, UV, Pan, PanFine, Tilt, TiltFine, Gobo, Shutter, Strobe, Speed, ColorWheel, Maintenance, Nothing, Generic
- **Folder structure:** `<root>/<Manufacturer Name>/fixture.qxf`; optional `manufacturer.yml` with `name:` overrides display name
- **Note:** `Physical` block and `<Head>` groups are parsed but not currently stored in `FixtureDefinition`

## UI Structure & Pro Components

The UI is modelled after Daslight 5 with three top-level tabs (`useAppStore.tab`):

```
TitleBar  ─ SETUP | CONTROL | LIVE tabs · Blackout · Master fader · Output status · Settings ⚙ · Window controls
  ↓
SETUP      ─ sub-tabs: Patch (drag-drop patcher) | Fixture-Bibliothek
CONTROL    ─ sub-tabs: Szenen (scene grid + attribute faders) | Chaser | DMX Konsole
LIVE       ─ large scene button grid · Master fader · Blackout
SETTINGS   ─ serial port selection, MIDI/OSC config
```

**Base UI components** (`src/renderer/src/components/`):
- `layout/TitleBar.tsx` — Global top bar: tab nav, blackout, master, output status
- `fixture/PatchPanel.tsx` — Drag-to-DMX-strip patcher
- `control/ControlTab.tsx` — Scene grid & sub-tabs
- `live/LiveTab.tsx` — Large scene buttons + master

**Pro components** (`src/renderer/src/components/pro/` - advanced features):
- `SceneEditorPro.tsx` — Full-featured scene editor with effects RAF loop
- `SceneGridPanel.tsx` — Grid layout for scene selection
- `FeatureFaderPanel.tsx` — DMX sliders by channel type (Red, Green, Blue, etc.)
- `StageView2D.tsx` — 2D fixture visualization
- `FXGeneratorPanel.tsx` — Wave effect creator (sine/triangle/square/sawtooth)
- `LiveControlDials.tsx` — Real-time effect parameter adjustment
- `ChaserEditor.tsx` — Chaser sequence programming
- `DmxConsole.tsx` — Direct channel-by-channel control
- `OSCPanel.tsx` — OSC control mapping
- `MIDIMappingPanel.tsx` — MIDI input configuration
- `KeyboardShortcutsPanel.tsx` — Keyboard bindings
- `CueSequenceBuilder.tsx`, `TimelinePanel.tsx` — Advanced timing/sequencing
- `UndoRedoPanel.tsx` — Undo/redo management

**Scene model:** Scenes have `color?: string` (hex for button) and `bank?: string` (organizing tabs). Support `effects?: SceneEffect[]`.

## Key Conventions

**Component structure** (`src/renderer/src/components/`):
- `layout/` — Global TitleBar, Sidebar, layout containers
- `fixture/` — PatchPanel (drag-drop), FixtureBrowser, fixture import UI
- `control/` — Scene editor, scene grid, bank management, channel control
- `live/` — Performance/live mode with large scene buttons and master fader
- `pro/` — Advanced features: SceneEditorPro, effects, MIDI, OSC, sequencing, FX
- `beginner/` — Simplified UI for new users
- `shared/` — Reusable UI components (buttons, sliders, dialogs)

**Styling:** 
- Tailwind CSS v4 (Vite plugin) — zero runtime overhead
- Dark theme: inline `style` props for theme colors
- Color scheme: bg: `#0f1117`, surface: `#1e2130`, accent: `#6c63ff` (purple), text: `#e0e0e0`
- No separate CSS files; utility classes + inline styles only

**ID generation:**
- All scene, chaser, patched fixture, and effect IDs use `randomUUID()` from `src/renderer/src/utils/uuid.ts` (wraps `crypto.randomUUID()`)
- Never hardcode IDs; always generate on creation

**Localization (i18n):**
- All user-visible strings use `useTranslation()` from `react-i18next`
- Translation files: `src/renderer/src/i18n/locales/en.json` (English) + `de.json` (German)
- New strings: add to both English and German files for consistency

**TypeScript split:**
- `tsconfig.node.json` — compiles main process and preload (Node.js environment)
- `tsconfig.web.json` — compiles renderer (browser environment; path alias `@renderer/*` → `src/renderer/src/*`)
- Main `tsconfig.json` — composite config references both; run `npm run typecheck` to validate all three targets

**Component props pattern:**
- Pass store data directly to components; avoid prop-drilling wrappers
- Use `useCallback` in parent to memoize event handlers passed to child components
- Prefer custom hooks for reusable logic over component composition

**Error handling in IPC:**
- Never throw from IPC handlers; return `{ success: boolean, data?: T, error?: string }`
- Always validate IPC input; untrusted serialized data can cause runtime errors
- Use try-catch in IPC handler to catch parser errors and respond with error objects

## File Organization Summary

```
src/
├── main/                          ← Node.js main process
│   ├── index.ts                   (IPC handlers, DmxEngine lifecycle)
│   ├── dmx/
│   │   ├── DmxEngine.ts           (40Hz universe management)
│   │   ├── IDmxOutput.ts          (interface for pluggable outputs)
│   │   ├── SerialDmxOutput.ts     (ENTTEC Pro/Open via serialport)
│   │   └── PreviewOutput.ts       (in-memory preview)
│   └── fixtures/
│       └── QxfParser.ts           (QLC+ XML fixture parser)
│
├── preload/                       ← Context bridge
│   ├── index.ts                   (namespace APIs: dmx, fixture, project, windowAPI)
│   └── index.d.ts                 (TypeScript definitions for window.*)
│
├── renderer/src/                  ← React UI
│   ├── store/                     (base stores)
│   │   ├── useFixtureStore.ts     (library, patch, scenes, chasers)
│   │   ├── useDmxStore.ts         (universe values, master, blackout)
│   │   └── useAppStore.ts         (UI state: tab, language, settings)
│   ├── stores/                    (advanced stores)
│   │   ├── sceneBuilderStore.ts
│   │   ├── undoRedoStore.ts
│   │   ├── oscStore.ts
│   │   └── multiSceneStore.ts
│   ├── engines/                   (stateful effect & playback engines)
│   │   ├── DMXEngine.ts
│   │   ├── PlaybackEngine.ts
│   │   ├── ColorFXEngine.ts
│   │   ├── ChaserFXEngine.ts
│   │   ├── MoveFXEngine.ts
│   │   ├── ValueFXEngine.ts
│   │   ├── CurveFXEngine.ts
│   │   └── FixtureDatabase.ts
│   ├── components/
│   │   ├── pro/                   (SceneEditorPro and 10+ advanced panels)
│   │   ├── live/
│   │   ├── control/
│   │   ├── fixture/
│   │   ├── layout/
│   │   ├── beginner/
│   │   └── shared/
│   ├── utils/                     (pure functions & helpers)
│   │   ├── sceneEditorHelpers.ts  (calcWave, color conversion)
│   │   ├── fadeTransitionEngine.ts
│   │   ├── effectBuilderEngine.ts
│   │   └── uuid.ts                (randomUUID wrapper)
│   ├── i18n/
│   │   ├── index.ts               (i18next setup)
│   │   └── locales/
│   │       ├── en.json
│   │       └── de.json
│   ├── App.tsx                    (tab routing, DMX listener setup)
│   └── main.tsx                   (React root)
│
└── shared/
    └── types.ts                   (cross-process types)
```

**Naming conventions:**
- Store files: `use*Store.ts` (Zustand hook naming)
- Engine files: `*Engine.ts` (stateful classes)
- Utility files: `*Helpers.ts` or function names
- IPC channels: `namespace:action` (e.g., `dmx:setChannel`, `fixture:importQxf`)
- React components: `PascalCase.tsx`

## MCP Servers

This project is configured to use two MCP servers for enhanced development:

- **Serial Port MCP** — Debug DMX hardware connections, inspect serial output, and test ENTTEC protocol timing
- **Playwright MCP** — UI integration testing for component interactions and scene editor workflows (when test suite is added)

Configure these in your Copilot CLI settings for faster iteration on hardware integration and UI testing.

## Architectural Patterns & Best Practices

### Mirror Store Pattern
When receiving real-time data from main process (e.g., universe values), store them in Zustand stores for instant UI feedback without IPC latency. Example: `useDmxStore` mirrors main process `DmxEngine` universe buffers via `dmx:universe-update` events.

**When adding a new real-time feature:** Create a store + IPC push event pattern:
1. Main process: `ipcMain.on('some-action', ...)` then `mainWindow.webContents.send('some-update', data)`
2. Renderer: `useStore.applyUpdate()` in IPC listener + component subscribes to store

### Strategy Pattern for Hardware Outputs
Multiple hardware types (ENTTEC, ArtNet, Preview) implement `IDmxOutput` interface. New outputs plug in without modifying core `DmxEngine`.

**To add new hardware support:**
1. Create `src/main/dmx/NewOutput.ts` implementing `IDmxOutput`
2. Register in `src/main/index.ts` IPC handler
3. No changes to core engine needed

### Composed Effect Engines
Rather than one monolithic playback engine, multiple specialized effect engines (Color, Chaser, Move, Value, Curve) run in parallel. Each engine evaluates effects independently; blend modes combine results.

**Pattern for adding new effect type:**
1. Create `src/renderer/src/engines/NewFXEngine.ts` with `apply(time, universe)` method
2. Register in `PlaybackEngine.ts` effect composition
3. Extend `SceneEffect` type if needed
4. Update UI panels to create/edit new effect type

### Dual-Process Separation of Concerns
- **Main:** Hardware reliability, I/O, real-time frame generation (40Hz)
- **Renderer:** UI responsiveness, previewing, effect design (50fps RAF)

**Never:** Call serial port code from renderer; always go through IPC.
**Always:** Send batch updates to avoid IPC overhead on every channel change.

### Pluggable Output Architecture
```typescript
interface IDmxOutput {
  readonly info: DmxOutputInfo
  start(): Promise<void>
  stop(): Promise<void>
  send(universe: number, data: Uint8Array): Promise<void>
}
```

Each output implementation handles its own connection state, timing, and error recovery. Main process doesn't know implementation details.

## Common Development Tasks

**Adding a new scene effect type:**
1. Extend `SceneEffect` interface in `src/shared/types.ts`
2. Add new effect engine in `src/renderer/src/engines/`
3. Register in `PlaybackEngine.ts` composition
4. Create UI panel in `src/renderer/src/components/pro/`
5. Add store state to `sceneBuilderStore` if needed

**Adding a new IPC handler:**
1. Implement async handler in `src/main/index.ts` → `ipcMain.handle('namespace:action', ...)`
2. Type signature in `src/preload/index.d.ts` → `window.namespace.action(args): Promise<Result>`
3. Call from renderer: `await window.namespace.action(...)`
4. For push events: main sends via `mainWindow.webContents.send()`, renderer listens in `ipcRenderer.on()` → store update

**Adding new hardware output:**
1. Create `src/main/dmx/MyOutput.ts` extending `IDmxOutput`
2. Register selection in `src/main/index.ts` IPC handler `dmx:connectMyHardware`
3. Add serial port scanning if needed
4. Test with `PreviewOutput` first for rapid iteration

**Modifying DMX universe state:**
- From renderer: Always use store method → `useDmxStore.setChannel(universe, channel, value)` (handles IPC)
- From main: Direct: `dmxEngine.setChannel(universe, channel, value)` 
- Never call `window.dmx.*` from renderer when store method exists

**TypeScript type checking:**
- Before committing: `npm run typecheck` (checks all three environments)
- Catch type mismatches across IPC boundaries during type-check, not runtime
- If type-check fails: read error carefully; likely mismatch between `src/preload/index.d.ts` and actual handler
