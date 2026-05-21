"use client"

import { CheckmarkCircle02Icon, Cancel01Icon, FileImportIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetBody,
  SheetDescription,
  SheetHeader,
  SheetSection,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet"

interface ImportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  importPreview: {
    groups: { name: string; count: number; duplicateCount?: number }[]
    entries: {
      title: string
      url: string
      groupName: string
      isDuplicate?: boolean
      action?: "skip" | "override" | "add"
    }[]
  } | null
  importProgress: {
    processed: number
    total: number
    status: "idle" | "importing" | "stopping" | "done" | "error" | "stopped"
  }
  importResult: {
    imported: number
    cancelled: number
    total: number
    status: "done" | "stopped" | "error"
  } | null
  selectedImportGroups: string[]
  onToggleImportGroup: (name: string) => void
  onImportFileSelected: (file: File) => void
  onUpdateImportAction: (action: "skip" | "override") => void
  onConfirmImport: (groups: string[]) => void
  onClearImport: () => void
}

export function ImportSheet({
  open,
  onOpenChange,
  importPreview,
  importProgress,
  importResult,
  selectedImportGroups,
  onToggleImportGroup,
  onImportFileSelected,
  onUpdateImportAction,
  onConfirmImport,
  onClearImport,
}: ImportSheetProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  const isImporting = importProgress.status === "importing"
  const isStopping = importProgress.status === "stopping"
  const isDone = importProgress.status === "done"
  const isStopped = importProgress.status === "stopped"
  const totalDuplicates = importPreview?.entries.filter((entry) => entry.isDuplicate).length ?? 0

  const duplicateAction = (() => {
    if (!importPreview || totalDuplicates === 0) return null
    const dupActions = importPreview.entries
      .filter((e) => e.isDuplicate)
      .map((e) => e.action)
      .filter((value): value is "skip" | "override" => value === "skip" || value === "override")
    if (dupActions.length === 0) return null
    const first = dupActions[0]
    return dupActions.every((a) => a === first) ? first : null
  })()

  const handleSelectAllGroups = () => {
    if (!importPreview) return
    importPreview.groups.forEach((group) => {
      if (!selectedImportGroups.includes(group.name)) {
        onToggleImportGroup(group.name)
      }
    })
  }

  const resetFileSelection = () => {
    setSelectedFileName(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md p-0">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-lg">
            <HugeiconsIcon icon={FileImportIcon} size={18} />
            Import Bookmarks
          </SheetTitle>
          <SheetDescription>Upload a Netscape bookmarks HTML file to import.</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-5">
          {importProgress.status !== "idle" && !(isDone || isStopped) ? (
            <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-3">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {importProgress.status === "importing"
                    ? "Importing…"
                    : importProgress.status === "stopping"
                      ? "Stopping…"
                      : importProgress.status}
                </span>
                <span>
                  {importProgress.processed}/{importProgress.total}
                </span>
              </div>
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Import progress"
                aria-valuemin={0}
                aria-valuemax={importProgress.total}
                aria-valuenow={importProgress.processed}
              >
                <div
                  className="h-2 w-full origin-left rounded-full bg-primary transition-transform"
                  style={{
                    transform: `scaleX(${importProgress.total === 0 ? 0 : importProgress.processed / importProgress.total})`,
                  }}
                />
              </div>
              <p className="sr-only" aria-live="polite">
                Import {importProgress.status}. {importProgress.processed} of {importProgress.total}
                .
              </p>
            </div>
          ) : null}

          {isDone || isStopped ? (
            <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                {isDone ? (
                  <span className="mt-0.5 text-emerald-600">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
                  </span>
                ) : (
                  <span className="mt-0.5 text-destructive">
                    <HugeiconsIcon icon={Cancel01Icon} size={18} />
                  </span>
                )}
                <div className="space-y-1">
                  <div className="text-sm font-semibold">
                    {isDone ? "Import complete" : "Import stopped"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isDone
                      ? "Your bookmarks were added. Metadata will continue enriching in the background."
                      : importResult
                        ? `${importResult.imported} imported • ${importResult.cancelled} cancelled`
                        : "Import was stopped."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <SheetSection className="space-y-2">
                <Label htmlFor="import-bookmarks-file" className="sr-only">
                  Choose bookmarks HTML file
                </Label>
                <Input
                  ref={fileInputRef}
                  id="import-bookmarks-file"
                  type="file"
                  accept="text/html"
                  className="text-sm"
                  disabled={isImporting || isStopping}
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    setSelectedFileName(file.name)
                    await onImportFileSelected(file)
                    event.target.value = ""
                  }}
                />
                {selectedFileName ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/10 px-3 py-2">
                    <span className="truncate text-xs text-muted-foreground">
                      {selectedFileName}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="rounded-4xl cursor-pointer"
                      disabled={isImporting || isStopping}
                      onClick={() => {
                        onClearImport()
                        resetFileSelection()
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ) : null}
              </SheetSection>

              {importPreview ? (
                <SheetSection className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>Import preview</span>
                    <span>{importPreview.entries.length} bookmarks</span>
                  </div>
                  {totalDuplicates > 0 ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-background/60 px-3 py-2 ring-1 ring-foreground/8">
                      <span className="text-xs text-muted-foreground">
                        {totalDuplicates} duplicate
                        {totalDuplicates > 1 ? "s" : ""}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={duplicateAction === "skip" ? "default" : "secondary"}
                          className="rounded-4xl cursor-pointer"
                          aria-pressed={duplicateAction === "skip"}
                          disabled={isImporting || isStopping}
                          onClick={() => onUpdateImportAction("skip")}
                        >
                          Skip
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={duplicateAction === "override" ? "default" : "secondary"}
                          className="rounded-4xl cursor-pointer"
                          aria-pressed={duplicateAction === "override"}
                          disabled={isImporting || isStopping}
                          onClick={() => onUpdateImportAction("override")}
                        >
                          Override
                        </Button>
                      </div>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Choose groups to import</span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="rounded-4xl cursor-pointer"
                        onClick={handleSelectAllGroups}
                        disabled={isImporting || isStopping}
                      >
                        Select all
                      </Button>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {importPreview.groups.map((group) => (
                      <li key={group.name}>
                        <label className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/10 px-3 py-2 text-sm cursor-pointer">
                          <span className="truncate">{group.name}</span>
                          <span className="flex items-center gap-2 shrink-0">
                            {typeof group.duplicateCount === "number" &&
                            group.duplicateCount > 0 ? (
                              <span className="text-xs text-muted-foreground">
                                ({group.duplicateCount} dup)
                              </span>
                            ) : null}
                            <Checkbox
                              checked={selectedImportGroups.includes(group.name)}
                              onCheckedChange={() => onToggleImportGroup(group.name)}
                              disabled={isImporting || isStopping}
                            />
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </SheetSection>
              ) : (
                <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 text-xs text-muted-foreground">
                  Choose a bookmarks HTML file to preview and import.
                </div>
              )}
            </>
          )}
        </SheetBody>

        <SheetFooter className="gap-2">
          {isDone || isStopped ? (
            <Button
              size="sm"
              className="rounded-4xl cursor-pointer"
              onClick={() => {
                onClearImport()
                resetFileSelection()
                onOpenChange(false)
              }}
            >
              Close
            </Button>
          ) : (
            <div className="flex w-full items-center gap-2">
              <Button
                size="sm"
                className="flex-1 rounded-4xl cursor-pointer"
                onClick={() => onConfirmImport(selectedImportGroups)}
                disabled={selectedImportGroups.length === 0 || isImporting || isStopping}
              >
                {isImporting ? "Importing…" : "Import selected"}
              </Button>
              {isImporting || isStopping ? (
                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-4xl cursor-pointer"
                  disabled={isStopping}
                  onClick={() => {
                    onClearImport()
                  }}
                >
                  {isStopping ? "Stopping…" : "Stop"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-4xl cursor-pointer"
                  onClick={() => {
                    resetFileSelection()
                    onOpenChange(false)
                  }}
                >
                  Close
                </Button>
              )}
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
