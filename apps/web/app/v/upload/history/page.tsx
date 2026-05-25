"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/contexts/user-context"

/**
 * The bulk uploader page is mounted under two surfaces:
 *   - `/batch/*`  → standalone, dark-mode shipping surface
 *   - `/v/upload/*` (and re-exported at `/v/catalog/*`) → full-app surface
 *
 * Links inside this page need to keep the user on the surface they entered.
 */
function useSurfacePrefix(): { upload: string; history: string } {
  const pathname = usePathname()
  if (pathname.startsWith("/batch")) {
    return { upload: "/batch", history: "/batch/history" }
  }
  return { upload: "/v/upload", history: "/v/upload/history" }
}

interface BatchRecord {
  id: string
  started_at: string
  completed_at: string | null
  status: string
  total_items: number
  successful_items: number
  failed_items: number
}

export default function BatchHistoryPage() {
  const { profile } = useUser()
  const surface = useSurfacePrefix()
  const [batches, setBatches] = useState<BatchRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return

    async function load() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("batch_uploads")
        .select("id, started_at, completed_at, status, total_items, successful_items, failed_items")
        .eq("user_id", profile!.id)
        .order("started_at", { ascending: false })
        .limit(50)

      if (!error && data) {
        setBatches(data as BatchRecord[])
      }
      setIsLoading(false)
    }

    load()
  }, [profile])

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-grotesk text-2xl font-semibold text-fg1">
            Upload History
          </h1>
          <p className="mt-1 text-sm text-fg2">
            View past batch uploads and retry failed collectibles.
          </p>
        </div>
        <Link
          href={surface.upload}
          className="rounded-full border border-frost-border px-4 py-2 text-xs uppercase tracking-wide text-fg2 hover:text-fg1 hover:border-frost-border/80 transition-colors"
        >
          New Batch
        </Link>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-frost-border bg-sheet-bg animate-pulse"
            />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-fg3 text-sm">No batch uploads yet.</p>
          <Link
            href={surface.upload}
            className="mt-3 inline-block text-brand-volt text-sm hover:underline"
          >
            Start your first batch
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map((batch) => (
            <BatchRow
              key={batch.id}
              batch={batch}
              historyPrefix={surface.history}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function BatchRow({
  batch,
  historyPrefix,
}: {
  batch: BatchRecord
  historyPrefix: string
}) {
  const date = new Date(batch.started_at)
  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })

  const statusColor =
    batch.status === "completed"
      ? "text-semantic-green"
      : batch.status === "partial"
      ? "text-semantic-orange"
      : batch.status === "processing"
      ? "text-brand-volt"
      : "text-semantic-red"

  const statusLabel =
    batch.status === "completed"
      ? "All succeeded"
      : batch.status === "partial"
      ? `${batch.failed_items} failed`
      : batch.status === "processing"
      ? "In progress"
      : "Failed"

  return (
    <Link
      href={`${historyPrefix}/${batch.id}`}
      className="block rounded-xl border border-frost-border bg-sheet-bg p-4 hover:border-frost-border/80 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-fg1">
              Batch of {batch.total_items}
            </span>
            <span className={`text-[10px] font-medium uppercase tracking-wide ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-xs text-fg3">
            {formattedDate} at {formattedTime}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Stats */}
          <div className="flex items-center gap-3 text-xs">
            {batch.successful_items > 0 && (
              <span className="text-semantic-green">
                {batch.successful_items} ✓
              </span>
            )}
            {batch.failed_items > 0 && (
              <span className="text-semantic-red">
                {batch.failed_items} ✗
              </span>
            )}
          </div>

          {/* Arrow */}
          <svg
            className="w-4 h-4 text-fg3 group-hover:text-fg1 transition-colors"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 4l4 4-4 4" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
