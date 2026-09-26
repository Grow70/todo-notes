import { useNoteStore } from '../stores/noteStore'
import TodoItem from './TodoItem'
import AddTodo from './AddTodo'

type Theme = 'light' | 'dark'

const THEMES: { key: Theme; label: string; color: string }[] = [
  { key: 'light', label: '白色主题', color: '#f6f1e6' },
  { key: 'dark', label: '深色主题', color: '#1e201c' }
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

  const total = todos.length
  const doneCount = todos.filter((t) => t.done).length
  const progress = total === 0 ? 0 : (doneCount / total) * 100
  const allDone = total > 0 && doneCount === total

  const handleCreate = (): void => {
    void window.noteAPI.createNote()
  }
  const handleDelete = (): void => {
    void window.noteAPI.deleteNote(noteId)
  }

  return (
    <div className={`note-window ${alwaysOnTop ? 'pinned' : ''}`}>
      <header className="note-header">
        <input
          className="note-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="便签标题"
          spellCheck={false}
          aria-label="便签标题"
        />
        <div className="header-actions">
          <button
            className={`icon-btn pin ${alwaysOnTop ? 'active' : ''}`}
            title={alwaysOnTop ? '取消置顶' : '置顶显示'}
            onClick={toggleAlwaysOnTop}
            aria-label={alwaysOnTop ? '取消置顶' : '置顶显示'}
            aria-pressed={alwaysOnTop}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 17v5" />
              <path d="M9 10.8V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6.8l3.1 3.1a1 1 0 0 1 .29.7V17H5.6v-2.4a1 1 0 0 1 .29-.7L9 10.8z" />
            </svg>
          </button>
          <button className="icon-btn" title="新建便签" onClick={handleCreate} aria-label="新建便签">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <button className="icon-btn danger" title="删除便签" onClick={handleDelete} aria-label="删除便签">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      <div className="todo-list" role="list">
        {total === 0 && (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            <div className="empty-title">暂无待办</div>
            <div className="empty-hint">在下方输入框中添加你的第一项</div>
          </div>
        )}
        {todos.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onRemoving={() => undefined} />
        ))}
      </div>

      <AddTodo />

      <footer className="note-footer">
        <div className="progress" title={`已完成 ${doneCount}/${total}`}>
          <div className="progress-line">
            <span className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text">{allDone ? '全部完成' : `${doneCount}/${total}`}</span>
        </div>

        <div className="theme-switch" role="group" aria-label="主题切换">
          {THEMES.map((t) => (
            <button
              key={t.key}
              className={`theme-dot ${theme === t.key ? 'selected' : ''}`}
              style={{ background: t.color }}
              title={t.label}
              aria-label={t.label}
              aria-pressed={theme === t.key}
              onClick={() => setTheme(t.key)}
            />
          ))}
        </div>
      </footer>
    </div>
  )
}