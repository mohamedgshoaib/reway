import { cookies } from "next/headers"
import { DashboardLoadingState } from "@/components/dashboard/LoadingState"
import {
  getPaletteThemeClassName,
  isDashboardPaletteTheme,
  type DashboardPaletteTheme,
} from "@/lib/themes"

export default async function Loading() {
  const cookieStore = await cookies()
  const paletteThemeValue = cookieStore.get("reway.dashboard.paletteTheme")?.value
  const paletteTheme: DashboardPaletteTheme =
    paletteThemeValue && isDashboardPaletteTheme(paletteThemeValue) ? paletteThemeValue : "default"

  return (
    <div
      data-dashboard-root
      className={`h-dvh overflow-hidden bg-background text-foreground ${getPaletteThemeClassName(paletteTheme)}`}
    >
      <main className="mx-auto flex h-full w-full items-center justify-center px-4 py-6">
        <div className="flex w-full max-w-xl flex-col items-center gap-5 text-center">
          <DashboardLoadingState
            label="Loading your dashboard"
            className="text-sm font-medium text-foreground"
            iconClassName="size-5 text-foreground"
          />
          <p className="text-sm text-muted-foreground">
            Fetching bookmarks, groups, notes, and todos.
          </p>
          <div className="w-full space-y-3" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-2xl bg-muted/20 px-4 py-3 ring-1 ring-foreground/8"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="size-8 shrink-0 rounded-xl bg-muted/50" />
                  <div className="space-y-2 text-left">
                    <div className="h-4 w-48 max-w-[50vw] rounded bg-muted/50" />
                    <div className="h-3 w-28 rounded bg-muted/40" />
                  </div>
                </div>
                <div className="hidden h-3 w-20 rounded bg-muted/40 md:block" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
