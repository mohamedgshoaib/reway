"use client"

import { Alert02Icon, Refresh01Icon, Home01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import React from "react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; reset: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo })

    // Log error to monitoring service in production
    console.error("Error Boundary caught an error:", error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} reset={this.handleReset} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, reset }: { error?: Error; reset: () => void }) {
  const handleGoHome = () => {
    window.location.href = "/"
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 bg-background">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <HugeiconsIcon icon={Alert02Icon} size={32} className="text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            {error?.message || "An unexpected error occurred while loading this page."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} className="gap-2" variant="default">
            <HugeiconsIcon icon={Refresh01Icon} size={16} />
            Try Again
          </Button>

          <Button onClick={handleGoHome} className="gap-2" variant="outline">
            <HugeiconsIcon icon={Home01Icon} size={16} />
            Go Home
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && error && (
          <details className="mt-6 text-left">
            <summary className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground">
              Error Details (Development Only)
            </summary>
            <pre className="mt-2 text-xs bg-muted/50 p-3 rounded-lg overflow-auto text-muted-foreground">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  )
}

// Hook for async error handling in function components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error: Error) => {
    console.error("Async error caught:", error)
    setError(error)
  }, [])

  if (error) {
    throw error
  }

  return { handleError, resetError }
}
