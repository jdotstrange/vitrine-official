"use client"

import { cn } from "@/lib/utils"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorStateProps {
  className?: string
  title?: string
  description?: string
  onRetry?: () => void
}

export function ErrorState({
  className,
  title = "Something went wrong.",
  description = "Try refreshing.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="font-serif text-xl text-foreground">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-muted-foreground">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 flex items-center gap-2 rounded-full border border-border bg-transparent px-5 py-2 text-sm font-medium text-foreground transition-all hover:border-primary hover:text-primary"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </button>
      )}
    </div>
  )
}
