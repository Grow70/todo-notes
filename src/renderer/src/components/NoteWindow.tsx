import { useNoteStore } from '../stores/noteStore'
import TodoItem from './TodoItem'
import AddTodo from './AddTodo'

type Theme = 'light' | 'eye' | 'dark'

const THEMES: { key: Theme; label: string; color: string }[] = [
  { key: 'light', label: '白色主题', color: '#ffffff' },
  { key: 'eye', label: '护眼主题', color: '#cfe8d5' },
  { key: 'dark', label: '深色主题', color: '#2a2d34' }
]

export default function NoteWindow() {
  const noteId = useNoteStore((s) => s.noteId)
  const title = useNoteStore((s) => s.title)
  const setTitle = useNoteStore((s) => s.setTitle)
  const todos = useNoteStore((s) => s.todos)
  const theme = useNoteStore((s) => s.theme)
  const setTheme = useNoteStore((s) => s.setTheme)
  const alwaysOnTop = useNoteStore((s) => s.alwaysOnTop)
  const toggleAlwaysOnTop = useNoteStore((s) => s.toggleAlwaysOnTop)

  const doneCount = todos.filter((t) => t.done).length

  const handleCreate = (): void => {
    void window.noteAPI.createNote()
  }
  const handleDelete = (): void => {
    void window.noteAPI.deleteNote(noteId)
  }

  return (
    <div className="note-window">
      <header className="note-header">
        <input
          className="note-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="便签标题"
          spellCheck={false}
        />
        <div className="header-actions">
          <button
            className={`icon-btn ${alwaysOnTop ? 'active' : ''}`}
            title={alwaysOnTop ? '取消置顶' : '置顶显示'}
            onClick={toggleAlwaysOnTop}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 17v5" />
              <path d="M9 10.8V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6.8l3.1 3.1a1 1 0 0 1 .29.7V17H5.6v-2.4a1 1 0 0 1 .29-.7L9 10.8z" />
            </svg>
          </button>
          <button className="icon-btn" title="新建便签" onClick={handleCreate}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button className="icon-btn danger" title="删除便签" onClick={handleDelete}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <div className="todo-list">
        {todos.length === 0 && <p className="empty-hint">暂无待办事项</p>}
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} />
        ))}
      </div>

      <AddTodo />

      <footer className="note-footer">
        <div className="theme-switch">
          {THEMES.map((t) => (
            <button
              key={t.key}
              className={`theme-dot ${theme === t.key ? 'selected' : ''}`}
              style={{ background: t.color }}
              title={t.label}
              onClick={() => setTheme(t.key)}
            />
          ))}
        </div>
        <span className="counter">
          {doneCount}/{todos.length}
        </span>
      </footer>
    </div>
  )
}
