"use client"

import type React from "react"
import { useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { EXTENSION_DOWNLOAD_URL, EXTENSION_TUTORIAL_VIDEO_URL } from "@/lib/extension"

interface ExtensionInstallDialogProps {
  children: React.ReactNode
  downloadUrl?: string
  videoUrl?: string
}

export function ExtensionInstallDialog({
  children,
  downloadUrl,
  videoUrl,
}: ExtensionInstallDialogProps) {
  const url = downloadUrl ?? EXTENSION_DOWNLOAD_URL
  const tutorialUrl = videoUrl ?? EXTENSION_TUTORIAL_VIDEO_URL
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Download the Reway Extension</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {url ? (
            <div className="rounded-3xl bg-muted/30 p-3 ring-1 ring-foreground/8">
              <div className="text-sm text-muted-foreground">
                Official download on{" "}
                <span className="font-medium text-foreground">Google Drive</span>
              </div>
              <a
                className="mt-1 block break-all text-sm font-medium text-foreground underline underline-offset-3"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
                {url}
              </a>
            </div>
          ) : (
            <div className="rounded-3xl bg-muted/30 p-3 ring-1 ring-foreground/8 text-sm text-muted-foreground">
              Download link is not configured yet.
            </div>
          )}

          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">Install tutorial</div>
            {tutorialUrl ? (
              <div className="group relative aspect-4/3 overflow-hidden rounded-3xl ring-1 ring-foreground/8 bg-black/5">
                <video
                  ref={videoRef}
                  className="h-full w-full"
                  controls
                  preload="metadata"
                  playsInline
                  src={tutorialUrl}
                />
              </div>
            ) : (
              <div className="rounded-3xl bg-muted/30 p-3 ring-1 ring-foreground/8 text-sm text-muted-foreground">
                Tutorial video is not configured yet.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
