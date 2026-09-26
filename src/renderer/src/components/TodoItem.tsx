import { useNoteStore, type TodoItem as Todo } from '../stores/noteStore'

export default function TodoItem({ todo }: { todo: Todo }) {
  const toggleTodo = useNoteStore((s) => s.toggleTodo)
  const deleteTodo = useNoteStore((s) => s.deleteTodo)

  return (
    <div className={`todo-item ${todo.done ? 'done' : ''}`}>
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
      <button className="todo-delete" onClick={() => deleteTodo(todo.id)} aria-label="删除">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
