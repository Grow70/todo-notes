import { useState, type KeyboardEvent } from 'react'
import { useNoteStore } from '../stores/noteStore'

/**
 * 添加待办输入框
 * - 聚焦时高亮 + 微光
 * - 有内容时按钮激活态（旋转放大动画）
 * - 回车提交，自动清空
 */
export default function AddTodo() {
  const [text, setText] = useState('')
  const addTodo = useNoteStore((s) => s.addTodo)

  const submit = (): void => {
    if (!text.trim()) return
    addTodo(text)
    setText('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') submit()
    else if (e.key === 'Escape') setText('')
  }

  const hasText = text.trim().length > 0

  return (
    <div className="add-todo">
      <input
        className="add-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="添加待办，回车确认"
        maxLength={200}
        aria-label="添加待办"
      />
      <button
        className={`add-btn ${hasText ? 'has-text' : ''}`}
        onClick={submit}
        disabled={!hasText}
        aria-label="添加待办"
        title="添加待办"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  )
}