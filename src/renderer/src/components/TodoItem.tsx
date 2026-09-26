import { useEffect, useState, type KeyboardEvent } from 'react'
import { useNoteStore } from '../stores/noteStore'

/**
 * 单条待办
 * - 勾选对勾弹性弹出
 * - 删除时先满帧滑出动画再真正派发删除（避免列表瞬间塌陷）
 * - 键盘可操作：Space/Enter 切换完成
 */
export default function TodoItem({
  todo,
  onRemoving
}: {
  todo: { id: string; text: string; done: boolean }
  onRemoving: (id: string) => void
}) {
  const toggleTodo = useNoteStore((s) => s.toggleTodo)
  const deleteTodo = useNoteStore((s) => s.deleteTodo)
  const [removing, setRemoving] = useState(false)

  const handleDelete = (): void => {
    if (removing) return
    setRemoving(true)
    onRemoving(todo.id)
    setTimeout(() => deleteTodo(todo.id), 250)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggleTodo(todo.id)
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      handleDelete()
    }
  }

  return (
    <div
      className={`todo-item ${todo.done ? 'done' : ''} ${removing ? 'removing' : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-pressed={todo.done}
    >
      <button
        className="check"
        onClick={() => toggleTodo(todo.id)}
        aria-label={todo.done ? '标记未完成' : '标记完成'}
      >
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </button>
      <span className="todo-text">{todo.text}</span>
      <button
        className="todo-delete"
        onClick={handleDelete}
        aria-label="删除"
        title="删除"
      >
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}