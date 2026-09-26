import { useState } from 'react'
import { useNoteStore } from '../stores/noteStore'

export default function AddTodo() {
  const [text, setText] = useState('')
  const addTodo = useNoteStore((s) => s.addTodo)

  const submit = (): void => {
    if (!text.trim()) return
    addTodo(text)
    setText('')
  }

  return (
    <div className="add-todo">
      <input
        className="add-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
        placeholder="添加待办，回车确认"
      />
      <button className="add-btn" onClick={submit} aria-label="添加待办">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}
