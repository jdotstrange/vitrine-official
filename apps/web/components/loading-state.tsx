import { cn } from "@/lib/utils"

interface LoadingStateProps {
  className?: string
  size?: "sm" | "md" | "lg"
  text?: string
}

export function LoadingState({ className, size = "md", text = "Loading..." }: LoadingStateProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        {/* Pulsing glow ring */}
        <div
          className={cn(
            "rounded-full border-2 border-cyan-glow animate-[pulse-glow_2s_ease-in-out_infinite]",
            sizeClasses[size],
          )}
        />
        {/* Inner dot */}
        <div
          className={cn(
            "absolute inset-0 m-auto rounded-full bg-cyan-glow",
            size === "sm" && "h-1 w-1",
            size === "md" && "h-2 w-2",
            size === "lg" && "h-3 w-3",
          )}
        />
      </div>
      {text && <p className="font-mono text-sm text-muted-foreground animate-pulse">{text}</p>}
    </div>
  )
}
