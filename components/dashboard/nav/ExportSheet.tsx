"use client"

import { CheckmarkCircle02Icon, FileExportIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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

interface ExportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exportGroupOptions: string[]
  exportProgress: {
    processed: number
    total: number
    status: "idle" | "exporting" | "done" | "error"
  }
  selectedExportGroups: string[]
  onToggleExportGroup: (name: string) => void
  onExportBookmarks: (groups: string[]) => void
}

export function ExportSheet({
  open,
  onOpenChange,
  exportGroupOptions,
  exportProgress,
  selectedExportGroups,
  onToggleExportGroup,
  onExportBookmarks,
}: ExportSheetProps) {
  const isExporting = exportProgress.status === "exporting"
  const isDone = exportProgress.status === "done"

  const handleSelectAll = () => {
    exportGroupOptions.forEach((name) => {
      if (!selectedExportGroups.includes(name)) {
        onToggleExportGroup(name)
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md p-0">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-lg">
            <HugeiconsIcon icon={FileExportIcon} size={18} />
            Export Bookmarks
          </SheetTitle>
          <SheetDescription>Select which groups to export to HTML.</SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-5">
          {isDone ? (
            <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-2">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-emerald-600">
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} />
                </span>
                <div className="space-y-1">
                  <div className="text-sm font-semibold">Export complete</div>
                  <p className="text-xs text-muted-foreground">
                    Your bookmarks HTML file was downloaded.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <SheetSection className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-2">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>Export preview</span>
                  <span>{exportGroupOptions.length} groups</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Choose groups to export</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="rounded-lg cursor-pointer"
                      onClick={handleSelectAll}
                      disabled={isExporting}
                    >
                      Select all
                    </Button>
                  </div>
                </div>

                <ul className="space-y-2">
                  {exportGroupOptions.map((name) => (
                    <li key={name}>
                      <label className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-sm cursor-pointer">
                        <span className="truncate">{name}</span>
                        <Checkbox
                          checked={selectedExportGroups.includes(name)}
                          onCheckedChange={() => onToggleExportGroup(name)}
                          disabled={isExporting}
                        />
                      </label>
                    </li>
                  ))}
                </ul>
              </SheetSection>

              {exportProgress.status !== "idle" ? (
                <div className="space-y-1">
                  <div
                    className="h-2 w-full overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-label="Export progress"
                    aria-valuemin={0}
                    aria-valuemax={exportProgress.total}
                    aria-valuenow={exportProgress.processed}
                  >
                    <div
                      className="h-2 w-full origin-left rounded-full bg-primary transition-transform"
                      style={{
                        transform: `scaleX(${exportProgress.total === 0 ? 0 : exportProgress.processed / exportProgress.total})`,
                      }}
                    />
                  </div>
                  <p className="sr-only" aria-live="polite">
                    Export {exportProgress.status}. {exportProgress.processed} of{" "}
                    {exportProgress.total}.
                  </p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{exportProgress.status}</span>
                    <span>
                      {exportProgress.processed}/{exportProgress.total}
                    </span>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </SheetBody>

        <SheetFooter className="gap-2">
          {isDone ? (
            <Button
              size="sm"
              className="rounded-lg cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          ) : (
            <div className="flex w-full items-center gap-2">
              <Button
                size="sm"
                className="flex-1 rounded-lg cursor-pointer"
                onClick={() => onExportBookmarks(selectedExportGroups)}
                disabled={
                  selectedExportGroups.length === 0 ||
                  exportProgress.status === "exporting" ||
                  exportProgress.status === "done"
                }
              >
                {isExporting ? "Exporting…" : "Export selected"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="rounded-lg cursor-pointer"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
