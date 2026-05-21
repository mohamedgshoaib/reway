import { useRef, useState } from "react"
import type { NoteRow } from "@/lib/supabase/queries"
import { NOTE_COLORS } from "./config"
import { NoteCreateCard } from "./NoteCreateCard"
import { NoteDeleteDialog } from "./NoteDeleteDialog"
import { NoteEditCard } from "./NoteEditCard"
import { NoteRow as NoteRowItem } from "./NoteRow"
import { NotesBulkDeleteDialog } from "./NotesBulkDeleteDialog"
import { NotesSelectionBar } from "./NotesSelectionBar"

export function NotesSection({
  notes,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onDeleteNotes,
  onActionMenuOpenChange,
}: {
  notes: NoteRow[]
  onCreateNote: (formData: { text: string; color?: string | null }) => Promise<string>
  onUpdateNote: (id: string, formData: { text: string; color?: string | null }) => Promise<void>
  onDeleteNote: (id: string) => Promise<void>
  onDeleteNotes: (ids: string[]) => Promise<void>
  onActionMenuOpenChange?: (open: boolean) => void
}) {
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)

  const [isNotesSelectionMode, setIsNotesSelectionMode] = useState(false)
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(() => new Set())
  const [notesBulkDeleteDialogOpen, setNotesBulkDeleteDialogOpen] = useState(false)

  const [creatingNote, setCreatingNote] = useState(false)
  const [newNoteText, setNewNoteText] = useState("")
  const [newNoteColor, setNewNoteColor] = useState<string | null>(NOTE_COLORS[5])
  const [isCreatingNote, setIsCreatingNote] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editNoteText, setEditNoteText] = useState("")
  const [editNoteColor, setEditNoteColor] = useState<string | null>(null)
  const [isUpdatingNote, setIsUpdatingNote] = useState(false)

  const [noteDeleteDialogOpen, setNoteDeleteDialogOpen] = useState(false)
  const noteIdPendingDelete = useRef<string | null>(null)

  const toggleSelectedNote = (id: string) => {
    setSelectedNoteIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exitNotesSelectionMode = () => {
    setIsNotesSelectionMode(false)
    setSelectedNoteIds(new Set())
  }

  const handleCreateNote = async () => {
    if (!newNoteText.trim()) return
    setIsCreatingNote(true)
    try {
      await onCreateNote({ text: newNoteText.trim(), color: newNoteColor })
      setCreatingNote(false)
      setNewNoteText("")
      setNewNoteColor(NOTE_COLORS[5])
    } finally {
      setIsCreatingNote(false)
    }
  }

  const handleSaveNote = async (id: string) => {
    if (!editNoteText.trim()) return
    setIsUpdatingNote(true)
    try {
      await onUpdateNote(id, {
        text: editNoteText.trim(),
        color: editNoteColor,
      })
      setEditingNoteId(null)
    } finally {
      setIsUpdatingNote(false)
    }
  }

  return (
    <>
      {isNotesSelectionMode ? (
        <NotesSelectionBar
          selectedCount={selectedNoteIds.size}
          onCancel={exitNotesSelectionMode}
          onDelete={() => {
            if (selectedNoteIds.size === 0) return
            setNotesBulkDeleteDialogOpen(true)
          }}
        />
      ) : null}

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain scrollbar-hover-only flex flex-col gap-1">
        {notes.map((note) => {
          const isEditing = editingNoteId === note.id

          if (isEditing) {
            return (
              <NoteEditCard
                key={note.id}
                note={note}
                editText={editNoteText}
                setEditText={setEditNoteText}
                editColor={editNoteColor}
                setEditColor={setEditNoteColor}
                isUpdating={isUpdatingNote}
                onCancel={() => setEditingNoteId(null)}
                onSave={() => void handleSaveNote(note.id)}
              />
            )
          }

          return (
            <NoteRowItem
              key={note.id}
              note={note}
              expanded={expandedNoteId === note.id}
              onToggleExpanded={() =>
                setExpandedNoteId((prev) => (prev === note.id ? null : note.id))
              }
              selectionMode={isNotesSelectionMode}
              selected={selectedNoteIds.has(note.id)}
              onToggleSelected={() => toggleSelectedNote(note.id)}
              onEnterSelectionMode={() => {
                setIsNotesSelectionMode(true)
                setSelectedNoteIds(new Set([note.id]))
              }}
              onEdit={() => {
                setEditingNoteId(note.id)
                setEditNoteText(note.text)
                setEditNoteColor(note.color ?? NOTE_COLORS[5])
              }}
              onDelete={() => {
                noteIdPendingDelete.current = note.id
                setNoteDeleteDialogOpen(true)
              }}
              onActionMenuOpenChange={onActionMenuOpenChange}
            />
          )
        })}
      </div>

      <NoteCreateCard
        creating={creatingNote}
        setCreating={setCreatingNote}
        text={newNoteText}
        setText={setNewNoteText}
        color={newNoteColor}
        setColor={setNewNoteColor}
        isCreating={isCreatingNote}
        onCreate={() => void handleCreateNote()}
      />

      <NotesBulkDeleteDialog
        open={notesBulkDeleteDialogOpen}
        onOpenChange={setNotesBulkDeleteDialogOpen}
        selectedCount={selectedNoteIds.size}
        onConfirm={async () => {
          await onDeleteNotes(Array.from(selectedNoteIds))
          setNotesBulkDeleteDialogOpen(false)
          exitNotesSelectionMode()
        }}
      />

      <NoteDeleteDialog
        open={noteDeleteDialogOpen}
        onOpenChange={setNoteDeleteDialogOpen}
        onConfirm={() => {
          if (!noteIdPendingDelete.current) return
          void onDeleteNote(noteIdPendingDelete.current)
          setNoteDeleteDialogOpen(false)
          noteIdPendingDelete.current = null
        }}
      />
    </>
  )
}
