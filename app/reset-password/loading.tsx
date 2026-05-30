import { DashboardLoadingState } from "@/components/dashboard/LoadingState"

export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
      <div className="flex flex-col items-center gap-3 text-center">
        <DashboardLoadingState
          label="Loading reset password"
          className="text-sm font-medium text-foreground"
          iconClassName="size-5 text-foreground"
        />
        <p className="text-sm text-muted-foreground">Validating your recovery session.</p>
      </div>
    </div>
  )
}
