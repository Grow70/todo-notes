import { useEffect } from 'react'
import { useNoteStore } from './stores/noteStore'
import NoteWindow from './components/NoteWindow'
import ResizeHandles from './components/ResizeHandles'

export default function App(): JSX.Element {
  const init = useNoteStore((s) => s.init)
  const ready = useNoteStore((s) => s.ready)
  const theme = useNoteStore((s) => s.theme)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const noteId = params.get('noteId') ?? ''
    if (noteId) void init(noteId)
  }, [init])

  if (!ready) return <></>

  return (
    <div className="note-root" data-theme={theme}>
      <NoteWindow />
      <ResizeHandles />
    </div>
  )
}
