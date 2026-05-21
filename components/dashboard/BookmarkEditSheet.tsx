"use client"

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import {
  Folder01Icon,
  Link01Icon,
  TextFontIcon,
  SubtitleIcon,
  CircleIcon,
  Group01Icon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { BookmarkRow, GroupRow } from "@/lib/supabase/queries"

function GroupOption({
  group,
  iconsMap,
}: {
  group: GroupRow
  iconsMap: Record<string, IconSvgElement> | null
}) {
  const Icon = group.icon && iconsMap ? (iconsMap[group.icon] ?? Folder01Icon) : Folder01Icon
  return (
    <div className="flex items-center gap-2">
      <HugeiconsIcon icon={Icon} size={14} />
      <span className="truncate">{group.name}</span>
    </div>
  )
}

interface BookmarkEditSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmark: BookmarkRow | null
  groups: GroupRow[]
  onSave: (
    id: string,
    data: {
      title: string
      url: string
      description?: string
      favicon_url?: string
      group_id?: string
      applyFaviconToDomain?: boolean
    },
  ) => Promise<void>
}

export function BookmarkEditSheet({
  open,
  onOpenChange,
  bookmark,
  groups,
  onSave,
}: BookmarkEditSheetProps) {
  const [iconsMap, setIconsMap] = useState<Record<string, IconSvgElement> | null>(null)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [faviconUrl, setFaviconUrl] = useState("")
  const [faviconScope, setFaviconScope] = useState<"single" | "domain">("single")
  const [groupId, setGroupId] = useState("no-group")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    import("@/lib/hugeicons-list")
      .then((mod) => {
        if (cancelled) return
        setIconsMap(mod.ALL_ICONS_MAP as Record<string, IconSvgElement>)
      })
      .catch(() => {
        if (cancelled) return
        setIconsMap(null)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!bookmark) return
    setTitle(bookmark.title || "")
    setUrl(bookmark.url || "")
    setDescription(bookmark.description || "")
    setFaviconUrl(bookmark.favicon_url || "")
    setFaviconScope("single")
    setGroupId(bookmark.group_id || "no-group")
  }, [bookmark])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookmark || isSaving) return

    if (!title.trim() || !url.trim()) {
      toast.error("Title and URL are required")
      return
    }

    setIsSaving(true)
    try {
      await onSave(bookmark.id, {
        title: title.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        favicon_url: faviconUrl.trim() || undefined,
        group_id: groupId === "no-group" ? undefined : groupId,
        applyFaviconToDomain: faviconUrl.trim().length > 0 && faviconScope === "domain",
      })
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to update bookmark:", error)
      toast.error("Failed to update bookmark")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg p-0">
        <SheetHeader>
          <SheetTitle>Edit Bookmark</SheetTitle>
          <SheetDescription>Update your bookmark details.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <form id="edit-bookmark-sheet" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="edit-sheet-url" className="flex items-center gap-2">
                <HugeiconsIcon icon={Link01Icon} size={16} />
                URL *
              </Label>
              <Input
                id="edit-sheet-url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-sheet-title" className="flex items-center gap-2">
                <HugeiconsIcon icon={TextFontIcon} size={16} />
                Title *
              </Label>
              <Input
                id="edit-sheet-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bookmark title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-sheet-description" className="flex items-center gap-2">
                <HugeiconsIcon icon={SubtitleIcon} size={16} />
                Description
              </Label>
              <Textarea
                id="edit-sheet-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-sheet-favicon" className="flex items-center gap-2">
                <HugeiconsIcon icon={CircleIcon} size={16} />
                Custom Favicon URL
              </Label>
              <Input
                id="edit-sheet-favicon"
                type="url"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                placeholder="https://example.com/favicon.ico"
              />
              {faviconUrl.trim().length > 0 && (
                <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/10 p-3">
                  <p className="text-xs font-medium text-foreground">
                    Apply this custom favicon to
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={faviconScope === "single" ? "default" : "outline"}
                      className="flex-1 rounded-4xl cursor-pointer"
                      onClick={() => setFaviconScope("single")}
                    >
                      This only
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={faviconScope === "domain" ? "default" : "outline"}
                      className="flex-1 rounded-4xl cursor-pointer"
                      onClick={() => setFaviconScope("domain")}
                    >
                      All bookmarks
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <HugeiconsIcon icon={Group01Icon} size={16} />
                Group
              </Label>
              <Select value={groupId} onValueChange={(value) => setGroupId(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-group">No Group</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <GroupOption group={group} iconsMap={iconsMap} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            form="edit-bookmark-sheet"
            type="submit"
            disabled={isSaving}
            className="cursor-pointer"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
