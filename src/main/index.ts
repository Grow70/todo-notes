import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen, globalShortcut } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'

// ---------- 类型定义 ----------
interface TodoItem {
  id: string
  text: string
  done: boolean
}

interface NoteBounds {
  x: number
  y: number
  width: number
  height: number
}

interface NoteData {
  id: string
  title: string
  todos: TodoItem[]
  bounds: NoteBounds
  alwaysOnTop: boolean
}

interface Settings {
  theme: 'light' | 'dark'
}

type Theme = Settings['theme']

const DEFAULT_BOUNDS: NoteBounds = { x: 120, y: 120, width: 300, height: 380 }
const BOUNDS_STEP = 32
const MIN_W = 240
const MIN_H = 200

// ---------- 路径 ----------
const userDataDir = app.getPath('userData')
const notesFile = join(userDataDir, 'notes.json')
const settingsFile = join(userDataDir, 'settings.json')
const iconPath = join(__dirname, '../../resources/icon.png')

// ---------- 运行时状态 ----------
let notes: NoteData[] = []
let settings: Settings = { theme: 'light' }
const windows = new Map<string, BrowserWindow>() // noteId -> window
let tray: Tray | null = null
let isQuitting = false

// ---------- 持久化 ----------
function ensureDataDir(): void {
  if (!existsSync(userDataDir)) mkdirSync(userDataDir, { recursive: true })
}

function loadNotes(): void {
  ensureDataDir()
  try {
    if (existsSync(notesFile)) {
      const raw = readFileSync(notesFile, 'utf-8')
      const parsed = JSON.parse(raw)
      notes = Array.isArray(parsed) ? parsed : []
    }
  } catch (err) {
    console.error('加载便签数据失败：', err)
    notes = []
  }
}

function saveNotes(): void {
  ensureDataDir()
  try {
    writeFileSync(notesFile, JSON.stringify(notes, null, 2), 'utf-8')
  } catch (err) {
    console.error('保存便签数据失败：', err)
  }
}

function loadSettings(): void {
  ensureDataDir()
  try {
    if (existsSync(settingsFile)) {
      const parsed = JSON.parse(readFileSync(settingsFile, 'utf-8'))
      if (parsed && ['light', 'dark'].includes(parsed.theme)) {
        settings.theme = parsed.theme
      }
    }
  } catch (err) {
    console.error('加载设置失败：', err)
  }
}

function saveSettings(): void {
  ensureDataDir()
  try {
    writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf-8')
  } catch (err) {
    console.error('保存设置失败：', err)
  }
}

// ---------- 工具 ----------
function clampBoundsToScreen(bounds: NoteBounds): NoteBounds {
  const displays = screen.getAllDisplays()
  if (displays.length === 0) return bounds

  // 检查窗口左上角是否落在任一显示器工作区内
  const visible = displays.some(
    (d) =>
      bounds.x >= d.workArea.x - bounds.width + 40 &&
      bounds.x < d.workArea.x + d.workArea.width &&
      bounds.y >= d.workArea.y &&
      bounds.y < d.workArea.y + d.workArea.height
  )
  if (visible) return bounds

  const primary = screen.getPrimaryDisplay().workArea
  return {
    x: primary.x + BOUNDS_STEP,
    y: primary.y + BOUNDS_STEP,
    width: bounds.width,
    height: bounds.height
  }
}

function nextNoteBounds(): NoteBounds {
  if (notes.length === 0) return { ...DEFAULT_BOUNDS }
  const last = notes[notes.length - 1].bounds
  return {
    x: last.x + BOUNDS_STEP,
    y: last.y + BOUNDS_STEP,
    width: last.width,
    height: last.height
  }
}

// ---------- 窗口创建 ----------
function getPreloadPath(): string {
  return join(__dirname, '../preload/index.js')
}

function createNoteWindow(note: NoteData): BrowserWindow {
  const bounds = clampBoundsToScreen(note.bounds)

  const win = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    minWidth: 240,
    minHeight: 200,
    frame: false,
    transparent: true,
    resizable: true,
    alwaysOnTop: note.alwaysOnTop,
    skipTaskbar: true,
    hasShadow: false,
    show: false,
    icon: existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  windows.set(note.id, win)
  win.setAlwaysOnTop(note.alwaysOnTop, 'floating')

  // 加载渲染进程（开发用 dev server，生产用本地文件）
  const query = `?noteId=${encodeURIComponent(note.id)}`
  if (process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'] + query)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), { query: { noteId: note.id } })
  }

  win.once('ready-to-show', () => win.show())

  // 位置/尺寸变化时防抖保存
  let saveTimer: NodeJS.Timeout | null = null
  const scheduleSaveBounds = (): void => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => saveBoundsOf(win, note.id), 300)
  }
  win.on('moved', scheduleSaveBounds)
  win.on('resized', scheduleSaveBounds)

  win.on('closed', () => {
    windows.delete(note.id)
    // 关闭窗口仅隐藏便签，数据保留；只有点击「删除便签」按钮才真正删除
  })

  return win
}

function saveBoundsOf(win: BrowserWindow, noteId: string): void {
  if (win.isDestroyed()) return
  const note = notes.find((n) => n.id === noteId)
  if (!note) return
  note.bounds = win.getBounds()
  saveNotes()
}

function broadcastTheme(theme: Theme): void {
  for (const win of windows.values()) {
    if (!win.isDestroyed()) {
      win.webContents.send('theme:changed', theme)
    }
  }
}

// ---------- IPC ----------
function registerIpc(): void {
  ipcMain.handle('note:get', (_e, noteId: string) => {
    const note = notes.find((n) => n.id === noteId)
    return note ?? null
  })

  ipcMain.handle('note:update', (_e, payload: { id: string; title?: string; todos?: TodoItem[] }) => {
    const note = notes.find((n) => n.id === payload.id)
    if (!note) return false
    if (typeof payload.title === 'string') note.title = payload.title
    if (Array.isArray(payload.todos)) note.todos = payload.todos
    saveNotes()
    return true
  })

  ipcMain.handle('note:create', () => {
    const note: NoteData = {
      id: randomUUID(),
      title: '新建便签',
      todos: [],
      bounds: clampBoundsToScreen(nextNoteBounds()),
      alwaysOnTop: false
    }
    notes.push(note)
    saveNotes()
    createNoteWindow(note)
    return note.id
  })

  ipcMain.handle('note:delete', (_e, noteId: string) => {
    const win = windows.get(noteId)
    notes = notes.filter((n) => n.id !== noteId)
    saveNotes()
    if (win && !win.isDestroyed()) win.close()
    return true
  })

  ipcMain.handle('note:set-top', (_e, noteId: string, flag: boolean) => {
    const note = notes.find((n) => n.id === noteId)
    if (!note) return false
    note.alwaysOnTop = flag
    saveNotes()
    const win = windows.get(noteId)
    if (win && !win.isDestroyed()) win.setAlwaysOnTop(flag, 'floating')
    return true
  })

  ipcMain.handle('settings:get', () => settings)

  ipcMain.handle('settings:set-theme', (_e, theme: Theme) => {
    if (!['light', 'dark'].includes(theme)) return false
    settings.theme = theme
    saveSettings()
    broadcastTheme(theme)
    return true
  })

  // 透明窗口不支持原生边缘缩放，由渲染端热区 + 主进程轮询光标实现
  ipcMain.on('window:resize-start', (e, dir: string) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (!win || win.isDestroyed()) return
    const startBounds = win.getBounds()
    const start = screen.getCursorScreenPoint()

    const finish = (): void => {
      clearInterval(timer)
      ipcMain.removeListener('window:resize-end', onResizeEnd)
      saveBoundsOfWindow(win)
    }

    const timer = setInterval(() => {
      if (win.isDestroyed()) {
        clearInterval(timer)
        ipcMain.removeListener('window:resize-end', onResizeEnd)
        return
      }
      const cur = screen.getCursorScreenPoint()
      const dx = cur.x - start.x
      const dy = cur.y - start.y
      let { x, y, width, height } = startBounds
      if (dir.includes('e')) width = Math.max(MIN_W, startBounds.width + dx)
      if (dir.includes('s')) height = Math.max(MIN_H, startBounds.height + dy)
      if (dir.includes('w')) {
        width = Math.max(MIN_W, startBounds.width - dx)
        x = startBounds.x + startBounds.width - width
      }
      if (dir.includes('n')) {
        height = Math.max(MIN_H, startBounds.height - dy)
        y = startBounds.y + startBounds.height - height
      }
      win.setBounds({ x, y, width, height })
    }, 16)

    const onResizeEnd = (e2: Electron.IpcMainEvent): void => {
      if (e2.sender === e.sender) finish()
    }
    ipcMain.on('window:resize-end', onResizeEnd)
  })
}

function saveBoundsOfWindow(win: BrowserWindow): void {
  if (win.isDestroyed()) return
  for (const [noteId, w] of windows) {
    if (w === win) {
      saveBoundsOf(win, noteId)
      return
    }
  }
}

// ---------- 托盘 ----------
function createTray(): void {
  let image: Electron.NativeImage
  if (existsSync(iconPath)) {
    image = nativeImage.createFromPath(iconPath)
  } else {
    image = nativeImage.createEmpty()
  }
  tray = new Tray(image)
  tray.setToolTip('桌面待办便签')

  const menu = Menu.buildFromTemplate([
    { label: '新建便签', click: () => createNoteWindow(createBlankNote()) },
    { label: '显示全部', click: () => showAllWindows() },
    { type: 'separator' },
    { label: '退出', click: () => quitApp() }
  ])
  tray.setContextMenu(menu)
  tray.on('click', () => {
    if (notes.length === 0) {
      createNoteWindow(createBlankNote())
    } else {
      showAllWindows()
    }
  })
}

function createBlankNote(): NoteData {
  const note: NoteData = {
    id: randomUUID(),
    title: '新建便签',
    todos: [],
    bounds: clampBoundsToScreen(nextNoteBounds()),
    alwaysOnTop: false
  }
  notes.push(note)
  saveNotes()
  return note
}

function showAllWindows(): void {
  // 为已关闭窗口的便签重建窗口
  for (const note of notes) {
    if (!windows.has(note.id)) {
      createNoteWindow(note)
    }
  }
  for (const win of windows.values()) {
    if (!win.isDestroyed()) {
      if (win.isMinimized()) win.restore()
      win.show()
      win.focus()
    }
  }
}

function registerGlobalShortcut(): void {
  const accelerator = 'CommandOrControl+Alt+N'
  const ok = globalShortcut.register(accelerator, () => {
    if (notes.length === 0) {
      createNoteWindow(createBlankNote())
    } else {
      showAllWindows()
    }
  })
  if (!ok) {
    console.error('全局快捷键注册失败：', accelerator)
  }
}

function quitApp(): void {
  isQuitting = true
  app.quit()
}

// ---------- 单实例锁：双击再次启动时聚焦已有实例 ----------
if (!app.requestSingleInstanceLock()) {
  app.quit()
}

app.on('second-instance', () => {
  if (notes.length === 0) createNoteWindow(createBlankNote())
  else showAllWindows()
})

// ---------- 应用生命周期 ----------
app.whenReady().then(() => {
  loadNotes()
  loadSettings()
  registerIpc()
  try {
    createTray()
  } catch (err) {
    console.error('创建托盘失败：', err)
  }
  registerGlobalShortcut()

  // 恢复所有已保存的便签；首次启动则自动创建一个引导便签
  if (notes.length === 0) {
    const note = createBlankNote()
    note.todos = [
      { id: randomUUID(), text: '点击左侧圆圈完成待办', done: false },
      { id: randomUUID(), text: '右上角「+」新建便签', done: false },
      { id: randomUUID(), text: '拖动标题栏移动，拖边缘调整大小', done: false }
    ]
    saveNotes()
    createNoteWindow(note)
  } else {
    for (const note of notes) createNoteWindow(note)
  }

  app.on('activate', () => {
    // macOS 点击 Dock 时，若无便签则新建，否则显示全部
    if (notes.length === 0) createNoteWindow(createBlankNote())
    else showAllWindows()
  })
})

// 常驻托盘：所有窗口关闭时不退出
app.on('window-all-closed', () => {
  // 不调用 app.quit()，保持托盘常驻
})

app.on('before-quit', () => {
  isQuitting = true
  globalShortcut.unregisterAll()
})
