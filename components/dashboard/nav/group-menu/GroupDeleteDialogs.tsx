import React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { GroupRow } from "@/lib/supabase/queries"

export function GroupDeleteDialogs({
  deleteDialogOpen,
  onDeleteDialogOpenChange,
  deleteTarget,
  onConfirmDelete,
  bulkDeleteDialogOpen,
  onBulkDeleteDialogOpenChange,
  selectedCount,
  onConfirmBulkDelete,
}: {
  deleteDialogOpen: boolean
  onDeleteDialogOpenChange: (open: boolean) => void
  deleteTarget: GroupRow | null
  onConfirmDelete: () => void
  bulkDeleteDialogOpen: boolean
  onBulkDeleteDialogOpenChange: (open: boolean) => void
  selectedCount: number
  onConfirmBulkDelete: () => void
}) {
  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={onDeleteDialogOpenChange}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete group?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `This will remove the group "${deleteTarget.name}" and its bookmarks.`
                : "This will remove the group and its bookmarks."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="rounded-lg cursor-pointer"
              onClick={onConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={onBulkDeleteDialogOpenChange}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected groups?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete {selectedCount} group{selectedCount === 1 ? "" : "s"} and their
              bookmarks.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg cursor-pointer">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="rounded-lg cursor-pointer"
              onClick={onConfirmBulkDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
