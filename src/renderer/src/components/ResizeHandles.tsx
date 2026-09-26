import type { PointerEvent } from 'react'

const DIRECTIONS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const

/**
 * 透明窗口不支持原生边缘缩放（Electron 限制），
 * 用 8 个边缘热区 + 主进程轮询光标实现自由缩放。
 */
export default function ResizeHandles() {
  const handlePointerDown = (dir: string) => (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    window.noteAPI.resizeStart(dir)
  }
  const handlePointerUp = (): void => {
    window.noteAPI.resizeEnd()
  }

  return (
    <>
      {DIRECTIONS.map((dir) => (
        <div
          key={dir}
          className={`resize-handle rh-${dir}`}
          onPointerDown={handlePointerDown(dir)}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      ))}
    </>
  )
}
