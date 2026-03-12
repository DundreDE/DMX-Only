# LightForge – Copilot Instructions

LightForge is an Electron + React + TypeScript DMX512 lighting control application. Users can import fixtures, patch them to DMX universes, program scenes/chasers, and output to hardware or a software preview.

## Commands

```bash
npm run dev          # Development with hot reload
npm run build        # Typecheck + production build
npm run build:win    # Windows installer
npm run lint         # ESLint (cached)
npm run format       # Prettier
npm run typecheck    # Full TypeScript check (main + renderer)
npm run typecheck:node  # Main/preload only
npm run typecheck:web   # Renderer only
```

No test framework exists in this project.

## Architecture

The app is split into three Electron process layers:

```
src/main/       – Node.js main process: DMX engine, file I/O, IPC handlers
src/preload/    – Context bridge: exposes typed IPC APIs to the renderer
src/renderer/   – React UI: Zustand stores, components, i18n
src/shared/     – Types shared across all layers (types.ts)
```

**Data flow:**
1. Main process (`src/main/index.ts`) registers `ipcMain.handle()` handlers and owns the `DmxEngine`
2. Preload (`src/preload/index.ts`) wraps those handlers into typed APIs exposed via `contextBridge.exposeInMainWorld`
3. Renderer calls `window.dmx.*`, `window.fixture.*`, `window.project.*`, or `window.windowAPI.*`
4. DMX universe state is pushed from main → renderer as `dmx:universe-update` events; renderer stores mirror this in `useDmxStore`

## IPC Conventions

- **Request-response:** `ipcMain.handle('namespace:action', handler)` → `ipcRenderer.invoke('namespace:action', args)` → `window.dmx.action(args)`
- **Fire-and-forget:** `ipcRenderer.send('window:action')` → `ipcMain.on('window:action', handler)`
- **Push events (main → renderer):** `mainWindow.webContents.send('dmx:universe-update', data)` → `ipcRenderer.on('dmx:universe-update', cb)`
- IPC channel names follow `namespace:action` format (e.g., `dmx:setChannel`, `fixture:importQxf`, `project:save`)
- All IPC APIs are typed in `src/preload/index.d.ts`

## State Management (Zustand)

Three stores in `src/renderer/src/store/`:

| Store | Owns |
|-------|------|
| `useAppStore` | UI state: current tab (`setup`/`control`/`live`/`settings`), output status, dirty flag |
| `useDmxStore` | DMX universe buffers (mirrored from main), master level, blackout |
| `useFixtureStore` | Fixture library, patch config, scenes, chasers |

`useDmxStore` methods (e.g., `setChannel`) call both the local store **and** `window.dmx.*` IPC — do not call IPC separately when using the store.

## Shared Types (`src/shared/types.ts`)

Key types to know:

- `FixtureDefinition` / `FixtureMode` / `FixtureChannel` / `FixtureCapability` — imported from QLC+ `.qxf` XML
- `PatchedFixture` — fixture placed at a universe + start address
- `Scene` — named snapshot of DMX values, keyed by universe then channel (sparse)
- `Chaser` / `ChaserStep` — timed sequence of scenes
- `DmxOutputInfo` — hardware output descriptor (type: `enttec-open` | `enttec-pro` | `artnet` | `udmx` | `preview`)
- `Project` — top-level save format (JSON), contains settings, fixtures, patch, scenes, chasers

## QXF Fixture Format (QLC+)

QXF files are XML with root `<FixtureDefinition xmlns="http://www.qlcplus.org/FixtureDefinition">`. Structure:

```xml
<FixtureDefinition>
  <Manufacturer>Stairville</Manufacturer>
  <Model>LED PAR56</Model>
  <Type>Color Changer</Type>           <!-- Moving Head, Color Changer, Dimmer, etc. -->

  <!-- Channel definitions (referenced by name from Mode) -->
  <Channel Name="Red" Preset="IntensityRed"/>          <!-- shorthand via Preset -->
  <Channel Name="Mode">
    <Group Byte="0">Colour</Group>                     <!-- Group = channel category -->
    <Capability Min="0" Max="63">RGB control</Capability>
    <Capability Min="64" Max="127" Preset="ColorMacro" Res1="#ff0000">Red</Capability>
  </Channel>

  <!-- Modes reference channels by name; Number is 0-based in XML -->
  <Mode Name="5 Channel">
    <Channel Number="0">Mode</Channel>
    <Channel Number="1">Red</Channel>
    <!-- Head groups = LED pixel groups within one mode -->
    <Head><Channel>1</Channel><Channel>2</Channel></Head>
  </Mode>

  <Physical>
    <Bulb Type="LED" Lumens="0" ColourTemperature="0"/>
    <Dimensions Width="220" Height="220" Weight="1.4" Depth="210"/>
    <Lens DegreesMin="0" DegreesMax="0" Name="Other"/>
    <Focus Type="Fixed" PanMax="0" TiltMax="0"/>
    <Layout Width="4" Height="1"/>                     <!-- pixel grid for multi-head -->
    <Technical PowerConsumption="16" DmxConnector="3-pin"/>
  </Physical>
</FixtureDefinition>
```

**Parser details (`src/main/fixtures/QxfParser.ts`):**
- Uses a **custom regex-based XML parser** (no DOM/xml2js) — `getTagContent()` and `getTagWithAttrs()`
- Channel `Number` in XML is 0-based; `FixtureChannel.number` is stored as **1-based** (parser adds +1)
- `primaryType` is derived from channel `Preset` attribute first, then channel name text matching via `mapCapabilityType()`
- Known `FixtureCapabilityType` values: `Dimmer`, `Red`, `Green`, `Blue`, `White`, `Amber`, `UV`, `Pan`, `PanFine`, `Tilt`, `TiltFine`, `Gobo`, `Shutter`, `Strobe`, `Speed`, `ColorWheel`, `Maintenance`, `Nothing`, `Generic`
- Common channel `Preset` values: `IntensityRed/Green/Blue/White/Dimmer/MasterDimmer`, `PositionPan/PanFine/Tilt/TiltFine`, `SpeedPanTiltFastSlow`, `BeamZoomBigSmall`
- Capability `Preset` values include: `ShutterOpen/Close`, `StrobeSlowToFast/FastToSlow`, `RampUp/DownFastToSlow`, `ColorMacro` (with hex in `Res1`), `ResetAll/Zoom`
- Folder scan expects `<root>/<Manufacturer Name>/fixture.qxf`; an optional `manufacturer.yml` with `name:` key overrides the display name
- `Physical` block and `<Head>` groups are parsed from XML but currently **not stored** in `FixtureDefinition` (only manufacturer, model, type, modes are kept)

## UI Structure (Daslight 5 style)

The UI is modelled after Daslight 5 with three top-level tabs managed by `useAppStore.tab`:

```
TitleBar  ─ SETUP | CONTROL | LIVE tabs (centre) · Blackout · Master fader · Output indicator · Settings ⚙ · Window controls
  ↓
SETUP      ─ sub-tabs: Patch (drag-to-512-strip patcher) | Fixture-Bibliothek
CONTROL    ─ sub-tabs: Szenen (scene grid + attribute faders) | Chaser | DMX Konsole
LIVE       ─ large scene button grid · Master fader · Blackout (right panel)
SETTINGS   ─ serial port selection for USB/DMX hardware
```

**Key components:**

| File | Purpose |
|------|---------|
| `src/renderer/src/components/layout/TitleBar.tsx` | Global top bar: tab nav, blackout, master, output status |
| `src/renderer/src/components/fixture/PatchPanel.tsx` | Drag-to-DMX-strip patcher (512 cells, 16×32) |
| `src/renderer/src/components/fixture/FixtureBrowser.tsx` | Searchable fixture library browser |
| `src/renderer/src/components/control/ControlTab.tsx` | Scene grid, bank tabs, attribute faders, sub-tab nav |
| `src/renderer/src/components/live/LiveTab.tsx` | Large scene buttons, master fader, blackout |
| `src/renderer/src/components/pro/Settings.tsx` | USB/serial port config |
| `src/renderer/src/components/pro/ChaserEditor.tsx` | Chaser programming (reused in CONTROL) |
| `src/renderer/src/components/pro/DmxConsole.tsx` | Direct channel console (reused in CONTROL) |

**`AppTab` type:** `'setup' | 'control' | 'live' | 'settings'` — `useAppStore.tab` / `setTab()`

**Scene model:** scenes have `color?: string` (hex, for button colouring) and `bank?: string` (organises into bank tabs in CONTROL).

## Key Conventions

- **Component structure:** grouped by feature under `src/renderer/src/components/` (`control/`, `live/`, `fixture/`, `layout/`, `pro/`, `beginner/`, `shared/`)
- **Styling:** Tailwind CSS utility classes; dark theme colours applied via inline `style` props (background `#0f1117`, surface `#1e2130`, accent `#6c63ff`)
- **IDs:** use `crypto.randomUUID()` (available as `randomUUID()` from `src/renderer/src/utils/uuid.ts`) for all scene/chaser/patched fixture IDs
- **i18n:** all user-visible strings should go through `useTranslation()` from `react-i18next`; translation files are in `src/renderer/src/i18n/` (English + German)
- **TypeScript configs:** `tsconfig.node.json` covers main + preload; `tsconfig.web.json` covers the renderer. Path alias `@renderer/*` → `src/renderer/src/*`
