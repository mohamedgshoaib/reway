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

export function TodosBulkDeleteDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  onConfirm: () => Promise<void>
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete selected todos?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete {selectedCount} todo{selectedCount === 1 ? "" : "s"}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-4xl cursor-pointer">Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            className="rounded-4xl cursor-pointer"
            onClick={onConfirm}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
