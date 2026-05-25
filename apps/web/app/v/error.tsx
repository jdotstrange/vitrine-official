"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, RotateCcw } from "lucide-react"

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[App Error]", error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-status-danger/10 border border-status-danger/30 flex items-center justify-center mb-5">
        <AlertCircle className="text-status-danger" size={28} />
      </div>
      <h1
        className="text-fg1 mb-2"
        style={{
          fontFamily: "var(--font-grotesk)",
          fontSize: 22,
          letterSpacing: 1.2,
          fontWeight: 700,
        }}
      >
        Something went wrong
      </h1>
      <p className="text-fg2 text-sm max-w-md mb-6">
        {error.message ||
          "An unexpected error occurred. We've logged it and we're looking into it."}
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md bg-brand-volt px-4 py-2 text-sm font-semibold text-text-inverse hover:opacity-90 transition-opacity"
        >
          <RotateCcw size={14} />
          Try again
        </button>
        <Link
          href="/v"
          className="rounded-md border border-frost-border px-4 py-2 text-sm text-fg1 hover:border-brand-volt/40 transition-colors"
        >
          Back to Portfolio
        </Link>
      </div>

      {error.digest && (
        <p className="mt-6 text-fg3 text-[11px] font-mono">
          ref: {error.digest}
        </p>
      )}
    </div>
  )
}
