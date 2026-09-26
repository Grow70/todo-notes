import { contextBridge, ipcRenderer } from 'electron'

interface TodoItem {
  id: string
  text: string
  done: boolean
}

type Theme = 'light' | 'eye' | 'dark'

const noteAPI = {
  getNote: (noteId: string): Promise<any> => ipcRenderer.invoke('note:get', noteId),
  updateNote: (payload: { id: string; title?: string; todos?: TodoItem[] }): Promise<boolean> =>
    ipcRenderer.invoke('note:update', payload),
  createNote: (): Promise<string> => ipcRenderer.invoke('note:create'),
  deleteNote: (noteId: string): Promise<boolean> => ipcRenderer.invoke('note:delete', noteId),
  setAlwaysOnTop: (noteId: string, flag: boolean): Promise<boolean> =>
    ipcRenderer.invoke('note:set-top', noteId, flag),
  getSettings: (): Promise<{ theme: Theme }> => ipcRenderer.invoke('settings:get'),
  setTheme: (theme: Theme): Promise<boolean> => ipcRenderer.invoke('settings:set-theme', theme),
  resizeStart: (dir: string): void => ipcRenderer.send('window:resize-start', dir),
  resizeEnd: (): void => ipcRenderer.send('window:resize-end'),
  onThemeChange: (cb: (theme: Theme) => void): (() => void) => {
    const listener = (_e: Electron.IpcRendererEvent, theme: Theme): void => cb(theme)
    ipcRenderer.on('theme:changed', listener)
    return () => ipcRenderer.removeListener('theme:changed', listener)
  }
}

contextBridge.exposeInMainWorld('noteAPI', noteAPI)
