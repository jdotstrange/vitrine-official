import type React from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  className?: string
  title?: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ className, title = "Nothing here yet.", description, action }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-void-elevated">
        <div className="h-6 w-6 rounded-full border-2 border-dashed border-muted-foreground" />
      </div>
      <h3 className="font-serif text-xl text-foreground">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
