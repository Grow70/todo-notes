export {}

type Theme = 'light' | 'eye' | 'dark'

interface TodoItem {
  id: string
  text: string
  done: boolean
}

interface NoteData {
  id: string
  title: string
  todos: TodoItem[]
  bounds: { x: number; y: number; width: number; height: number }
  alwaysOnTop: boolean
}

interface NoteAPI {
  getNote: (noteId: string) => Promise<NoteData | null>
  updateNote: (payload: { id: string; title?: string; todos?: TodoItem[] }) => Promise<boolean>
  createNote: () => Promise<string>
  deleteNote: (noteId: string) => Promise<boolean>
  setAlwaysOnTop: (noteId: string, flag: boolean) => Promise<boolean>
  getSettings: () => Promise<{ theme: Theme }>
  setTheme: (theme: Theme) => Promise<boolean>
  resizeStart: (dir: string) => void
  resizeEnd: () => void
  onThemeChange: (cb: (theme: Theme) => void) => () => void
}

declare global {
  interface Window {
    noteAPI: NoteAPI
  }
}
