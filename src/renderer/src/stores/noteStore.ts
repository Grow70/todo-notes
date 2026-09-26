import { create } from 'zustand'

type Theme = 'light' | 'eye' | 'dark'

export interface TodoItem {
  id: string
  text: string
  done: boolean
}

interface NoteState {
  noteId: string
  title: string
  todos: TodoItem[]
  theme: Theme
  alwaysOnTop: boolean
  ready: boolean
  init: (noteId: string) => Promise<void>
  setTitle: (title: string) => void
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void
  setTheme: (theme: Theme) => void
  toggleAlwaysOnTop: () => void
}

function genId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useNoteStore = create<NoteState>((set, get) => ({
  noteId: '',
  title: '便签',
  todos: [],
  theme: 'light',
  alwaysOnTop: false,
  ready: false,

  init: async (noteId: string) => {
    const [note, settings] = await Promise.all([
      window.noteAPI.getNote(noteId),
      window.noteAPI.getSettings()
    ])
    if (note) {
      set({
        noteId: note.id,
        title: note.title,
        todos: note.todos,
        alwaysOnTop: note.alwaysOnTop,
        theme: settings.theme,
        ready: true
      })
    } else {
      set({ noteId, theme: settings.theme, ready: true })
    }
    window.noteAPI.onThemeChange((theme) => set({ theme }))
  },

  setTitle: (title: string) => {
    set({ title })
    const { noteId } = get()
    window.noteAPI.updateNote({ id: noteId, title })
  },

  addTodo: (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const todo: TodoItem = { id: genId(), text: trimmed, done: false }
    const todos = [...get().todos, todo]
    set({ todos })
    window.noteAPI.updateNote({ id: get().noteId, todos })
  },

  toggleTodo: (id: string) => {
    const todos = get().todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    set({ todos })
    window.noteAPI.updateNote({ id: get().noteId, todos })
  },

  deleteTodo: (id: string) => {
    const todos = get().todos.filter((t) => t.id !== id)
    set({ todos })
    window.noteAPI.updateNote({ id: get().noteId, todos })
  },

  setTheme: (theme: Theme) => {
    set({ theme })
    window.noteAPI.setTheme(theme)
  },

  toggleAlwaysOnTop: () => {
    const flag = !get().alwaysOnTop
    set({ alwaysOnTop: flag })
    window.noteAPI.setAlwaysOnTop(get().noteId, flag)
  }
}))
