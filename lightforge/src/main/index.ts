import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { dmxEngine } from './dmx/DmxEngine'
import { SerialDmxOutput, listSerialPorts } from './dmx/SerialDmxOutput'
import { parseQxfFile, scanFixtureFolder } from './fixtures/QxfParser'
import type { Project } from '../shared/types'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  dmxEngine.setWindow(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    dmxEngine.usePreview().then(() => dmxEngine.startRefresh())
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── Window controls ─────────────────────────────────────────────
ipcMain.on('window:minimize', (e) => BrowserWindow.fromWebContents(e.sender)?.minimize())
ipcMain.on('window:maximize', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender)
  if (win?.isMaximized()) win.unmaximize()
  else win?.maximize()
})
ipcMain.on('window:close', (e) => BrowserWindow.fromWebContents(e.sender)?.close())

// ── DMX IPC handlers ─────────────────────────────────────────────
ipcMain.handle('dmx:setChannel', (_e, universe: number, channel: number, value: number) => {
  dmxEngine.setChannel(universe, channel, value)
})

ipcMain.handle('dmx:setChannels', (_e, universe: number, start: number, values: number[]) => {
  dmxEngine.setChannels(universe, start, values)
})

ipcMain.handle('dmx:setMaster', (_e, value: number) => {
  dmxEngine.setMaster(value)
})

ipcMain.handle('dmx:setBlackout', (_e, active: boolean) => {
  dmxEngine.setBlackout(active)
})

ipcMain.handle('dmx:getUniverse', (_e, universe: number) => {
  return dmxEngine.getUniverseSnapshot(universe)
})

ipcMain.handle('dmx:getOutputInfo', () => {
  return dmxEngine.getOutputInfo()
})

ipcMain.handle('dmx:usePreview', async () => {
  await dmxEngine.usePreview()
  return dmxEngine.getOutputInfo()
})

ipcMain.handle('dmx:listSerialPorts', async () => {
  return await listSerialPorts()
})

ipcMain.handle('dmx:connectSerial', async (_e, path: string, displayName: string) => {
  try {
    const output = new SerialDmxOutput(path, displayName)
    await dmxEngine.setOutput(output)
    return { success: true, info: dmxEngine.getOutputInfo() }
  } catch (err) {
    return { success: false, error: String(err) }
  }
})

// ── Fixture IPC handlers ──────────────────────────────────────────
ipcMain.handle('fixture:importQxf', async () => {
  const result = await dialog.showOpenDialog({
    title: 'QLC+ Fixture importieren (.qxf)',
    filters: [{ name: 'QLC+ Fixtures', extensions: ['qxf'] }],
    properties: ['openFile', 'multiSelections']
  })
  if (result.canceled) return []

  const fixtures: import('../shared/types').FixtureDefinition[] = []
  for (const filePath of result.filePaths) {
    try {
      fixtures.push(await parseQxfFile(filePath))
    } catch (err) {
      console.error(`Failed to parse ${filePath}:`, err)
    }
  }
  return fixtures
})

ipcMain.handle('fixture:importFolder', async () => {
  const result = await dialog.showOpenDialog({
    title: 'QLC+ Fixture-Ordner auswählen',
    properties: ['openDirectory']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  return await scanFixtureFolder(result.filePaths[0])
})

// ── Project file IPC handlers ─────────────────────────────────────
ipcMain.handle('project:save', async (_e, project: Project) => {
  const result = await dialog.showSaveDialog({
    title: 'Projekt speichern',
    defaultPath: `${project.name || 'lightforge-project'}.lfproj`,
    filters: [{ name: 'LightForge Projekt', extensions: ['lfproj'] }]
  })
  if (result.canceled || !result.filePath) return false
  await writeFile(result.filePath, JSON.stringify(project, null, 2), 'utf-8')
  return true
})

ipcMain.handle('project:open', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Projekt öffnen',
    filters: [{ name: 'LightForge Projekt', extensions: ['lfproj'] }],
    properties: ['openFile']
  })
  if (result.canceled || result.filePaths.length === 0) return null
  const raw = await readFile(result.filePaths[0], 'utf-8')
  return JSON.parse(raw) as Project
})

// ── App lifecycle ─────────────────────────────────────────────────
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.lightforge')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  dmxEngine.stopRefresh()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
