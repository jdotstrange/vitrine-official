"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/contexts/user-context"

/**
 * Surface-aware link prefix — see history/page.tsx for the rationale.
 */
function useHistoryListHref(): string {
  const pathname = usePathname()
  return pathname.startsWith("/batch") ? "/batch/history" : "/v/upload/history"
}

interface BatchItemRecord {
  cardIndex: number
  cardId: string
  collectibleId: string | null
  status: "done" | "failed" | "processing"
  title: string
  thumbnailUrl: string
  photoUrls: string[]
  metadata: {
    status: string
    value: string
    visibility: string
    showcaseIds: string[]
    tags: string[]
  }
  error: string | null
  retryCount: number
}

interface BatchDetail {
  id: string
  started_at: string
  completed_at: string | null
  status: string
  total_items: number
  successful_items: number
  failed_items: number
  defaults: Record<string, unknown> | null
  items: BatchItemRecord[]
  auto_publish: boolean | null
}

interface LiveStatus {
  extractionStatus:
    | "queued"
    | "processing"
    | "extracted"
    | "complete"
    | "failed"
    | string
  publishedAt: string | null
  retryCount: number
  failureReason: string | null
}

type LiveLookup = "deleted" | LiveStatus

interface MergedItem {
  item: BatchItemRecord
  index: number
  live: LiveLookup | null // null = unknown / no collectible_id stored
}

const MAX_RETRIES = 2

export default function BatchDetailPage() {
  const params = useParams()
  const historyHref = useHistoryListHref()
  const batchId = params.id as string
  const { profile } = useUser()
  const [batch, setBatch] = useState<BatchDetail | null>(null)
  const [liveById, setLiveById] = useState<Map<string, LiveStatus | "deleted">>(
    new Map(),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [busyItems, setBusyItems] = useState<Set<number>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)

  const reload = useCallback(async () => {
    if (!profile?.id || !batchId) return

    const supabase = createClient()
    const { data, error } = await supabase
      .from("batch_uploads")
      .select("*")
      .eq("id", batchId)
      .single()

    if (error || !data) {
      setIsLoading(false)
      return
    }

    const batchData = data as unknown as BatchDetail
    setBatch(batchData)

    const collectibleIds = (batchData.items ?? [])
      .map((it) => it.collectibleId)
      .filter((id): id is string => Boolean(id))

    if (collectibleIds.length === 0) {
      setLiveById(new Map())
      setIsLoading(false)
      return
    }

    const { data: liveRows } = await supabase
      .from("collectibles")
      .select(
        "id, extraction_status, published_at, extraction_retry_count, extraction_failure_reason",
      )
      .in("id", collectibleIds)

    const map = new Map<string, LiveStatus | "deleted">()
    const seen = new Set<string>()
    if (liveRows) {
      for (const row of liveRows as Array<{
        id: string
        extraction_status: string
        published_at: string | null
        extraction_retry_count: number | null
        extraction_failure_reason: string | null
      }>) {
        seen.add(row.id)
        map.set(row.id, {
          extractionStatus: row.extraction_status,
          publishedAt: row.published_at,
          retryCount: row.extraction_retry_count ?? 0,
          failureReason: row.extraction_failure_reason,
        })
      }
    }
    for (const id of collectibleIds) {
      if (!seen.has(id)) map.set(id, "deleted")
    }
    setLiveById(map)
    setIsLoading(false)
  }, [profile, batchId])

  useEffect(() => {
    reload()
  }, [reload])

  // Auto-poll while any item is queued/processing so the UI updates as the
  // server-side trigger flips items to complete or failed.
  useEffect(() => {
    if (!batch) return
    const hasInFlight = Array.from(liveById.values()).some(
      (v) => v !== "deleted" && (v.extractionStatus === "queued" || v.extractionStatus === "processing"),
    )
    if (!hasInFlight) return
    const t = setInterval(reload, 4000)
    return () => clearInterval(t)
  }, [batch, liveById, reload])

  const merged: MergedItem[] = (batch?.items ?? []).map((item, index) => {
    let live: LiveLookup | null = null
    if (item.collectibleId) {
      const v = liveById.get(item.collectibleId)
      if (v !== undefined) live = v
    }
    return { item, index, live }
  })

  const awaitingReviewCount = merged.filter((m) => {
    if (!m.live || m.live === "deleted") return false
    return m.live.extractionStatus === "complete" && m.live.publishedAt === null
  }).length

  const setBusy = (idx: number, busy: boolean) => {
    setBusyItems((prev) => {
      const next = new Set(prev)
      if (busy) next.add(idx)
      else next.delete(idx)
      return next
    })
  }

  const handlePublish = useCallback(
    async (idx: number) => {
      const m = merged[idx]
      if (!m?.item.collectibleId) return
      setBusy(idx, true)
      try {
        const supabase = createClient()
        await supabase
          .from("collectibles")
          .update({ published_at: new Date().toISOString() })
          .eq("id", m.item.collectibleId)
        await reload()
      } finally {
        setBusy(idx, false)
      }
    },
    [merged, reload],
  )

  const handleRemove = useCallback(
    async (idx: number) => {
      const m = merged[idx]
      if (!m?.item.collectibleId) return
      if (!confirm("Remove this collectible? This cannot be undone.")) return
      setBusy(idx, true)
      try {
        const supabase = createClient()
        await supabase
          .from("collectibles")
          .delete()
          .eq("id", m.item.collectibleId)
        await reload()
      } finally {
        setBusy(idx, false)
      }
    },
    [merged, reload],
  )

  const handleRetry = useCallback(
    async (idx: number) => {
      const m = merged[idx]
      if (!m?.item.collectibleId || !m.item.photoUrls.length) return
      if (m.live === "deleted" || !m.live) return
      if (m.live.retryCount >= MAX_RETRIES) return

      setBusy(idx, true)
      try {
        const supabase = createClient()
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

        // Re-enqueue the EXISTING row: reset failure state and bump retry count.
        const { error: resetError } = await supabase
          .from("collectibles")
          .update({
            extraction_status: "queued",
            extraction_failure_reason: null,
            extraction_failed_at: null,
            extraction_retry_count: m.live.retryCount + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", m.item.collectibleId)

        if (resetError) throw new Error(resetError.message)

        const { data: sessionData } = await supabase.auth.getSession()
        const accessToken = sessionData?.session?.access_token
        if (!accessToken) throw new Error("Not authenticated")

        const enqueueRes = await fetch(`${supabaseUrl}/functions/v1/enqueue-extraction`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            apikey: supabaseAnonKey,
          },
          body: JSON.stringify({
            imageUrls: m.item.photoUrls.slice(0, 4),
            title: m.item.title || "New Collectible",
          }),
        })

        if (!enqueueRes.ok) {
          const body = await enqueueRes.json().catch(() => ({}))
          throw new Error(
            (body as { error?: string }).error || `Enqueue returned ${enqueueRes.status}`,
          )
        }

        const enqueuePayload = (await enqueueRes.json()) as { job_id?: string }
        const jobId = enqueuePayload.job_id
        if (jobId) {
          await supabase
            .from("collectibles")
            .update({ extraction_job_id: jobId, updated_at: new Date().toISOString() })
            .eq("id", m.item.collectibleId)
        }

        await reload()
      } catch (err) {
        console.error("[BatchDetail] Retry failed:", err)
        await reload()
      } finally {
        setBusy(idx, false)
      }
    },
    [merged, reload],
  )

  const handlePublishAll = useCallback(async () => {
    if (awaitingReviewCount === 0) return
    setBulkBusy(true)
    try {
      const supabase = createClient()
      const ids = merged
        .filter(
          (m) =>
            m.live &&
            m.live !== "deleted" &&
            m.live.extractionStatus === "complete" &&
            m.live.publishedAt === null,
        )
        .map((m) => m.item.collectibleId)
        .filter((id): id is string => Boolean(id))

      if (ids.length > 0) {
        await supabase
          .from("collectibles")
          .update({ published_at: new Date().toISOString() })
          .in("id", ids)
      }
      await reload()
    } finally {
      setBulkBusy(false)
    }
  }, [merged, awaitingReviewCount, reload])

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto p-6">
        <div className="h-8 w-48 rounded bg-frost-border/30 animate-pulse" />
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-sheet-bg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="max-w-[1600px] mx-auto p-6 text-center py-16">
        <p className="text-fg3">Batch not found.</p>
        <Link href={historyHref} className="mt-3 inline-block text-brand-volt text-sm hover:underline">
          Back to history
        </Link>
      </div>
    )
  }

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

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-6">
      <div>
        <Link
          href={historyHref}
          className="inline-flex items-center gap-1 text-xs text-fg3 hover:text-fg1 transition-colors mb-3"
        >
          <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 4l-4 4 4 4" />
          </svg>
          Back to history
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="font-grotesk text-2xl font-semibold text-fg1">
              Batch of {batch.total_items}
            </h1>
            <StatusBadge status={batch.status} />
            {batch.auto_publish === false && (
              <span className="inline-block rounded-full border border-frost-border px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-fg2">
                Hold for review
              </span>
            )}
          </div>

          {awaitingReviewCount > 0 && (
            <button
              onClick={handlePublishAll}
              disabled={bulkBusy}
              className="rounded-full bg-brand-volt px-4 py-2 text-xs font-medium uppercase tracking-wider text-void shadow-[0_4px_12px_rgba(232,224,212,0.3)] transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {bulkBusy ? "Publishing…" : `Publish all (${awaitingReviewCount})`}
            </button>
          )}
        </div>

        <p className="mt-1 text-sm text-fg3">
          {formattedDate} at {formattedTime}
          {batch.successful_items > 0 && (
            <span className="ml-3 text-semantic-green">{batch.successful_items} succeeded</span>
          )}
          {batch.failed_items > 0 && (
            <span className="ml-3 text-semantic-red">{batch.failed_items} failed</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {merged.map((m) => (
          <ItemCard
            key={`${m.item.cardId}-${m.index}`}
            item={m.item}
            live={m.live}
            isBusy={busyItems.has(m.index)}
            onRetry={() => handleRetry(m.index)}
            onPublish={() => handlePublish(m.index)}
            onRemove={() => handleRemove(m.index)}
          />
        ))}
      </div>
    </div>
  )
}

function ItemCard({
  item,
  live,
  isBusy,
  onRetry,
  onPublish,
  onRemove,
}: {
  item: BatchItemRecord
  live: LiveLookup | null
  isBusy: boolean
  onRetry: () => void
  onPublish: () => void
  onRemove: () => void
}) {
  // Resolve display state from live data when present, falling back to the
  // batch JSONB record (used for legacy batches with no live data).
  const isDeleted = live === "deleted"
  const liveStatus = live && live !== "deleted" ? live : null

  const isInFlight =
    !isDeleted &&
    !!liveStatus &&
    (liveStatus.extractionStatus === "queued" ||
      liveStatus.extractionStatus === "processing")

  const isFailed =
    !isDeleted && !!liveStatus && liveStatus.extractionStatus === "failed"

  const isAwaitingReview =
    !isDeleted &&
    !!liveStatus &&
    liveStatus.extractionStatus === "complete" &&
    liveStatus.publishedAt === null

  const isPublished =
    !isDeleted &&
    !!liveStatus &&
    liveStatus.extractionStatus === "complete" &&
    liveStatus.publishedAt !== null

  // Legacy fallback when live row has no record yet (rare): use JSONB.
  const legacyDone = !live && item.status === "done"
  const legacyFailed = !live && item.status === "failed"

  const showSuccessCheck = isPublished || legacyDone
  const showFailedX = isFailed || legacyFailed
  const retryCount = liveStatus?.retryCount ?? item.retryCount
  const canRetry = (isFailed || legacyFailed) && retryCount < MAX_RETRIES && !isBusy
  const isTerminalFailure = (isFailed || legacyFailed) && retryCount >= MAX_RETRIES

  return (
    <div
      className={`relative rounded-xl border bg-sheet-bg overflow-hidden ${
        isDeleted ? "border-frost-border opacity-50" : "border-frost-border"
      }`}
    >
      <div className="aspect-square bg-void relative">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className={`w-full h-full object-cover ${isDeleted ? "grayscale" : ""}`}
          />
        ) : item.photoUrls[0] ? (
          <img
            src={item.photoUrls[0]}
            alt={item.title}
            className={`w-full h-full object-cover ${isDeleted ? "grayscale" : ""}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-fg3 text-xs">No image</span>
          </div>
        )}

        {showSuccessCheck && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-semantic-green/90 flex items-center justify-center" title="Published">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
        {isAwaitingReview && (
          <div className="absolute top-2 right-2 rounded-full border border-brand-volt/40 bg-brand-volt/15 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-brand-volt" title="Awaiting review">
            Review
          </div>
        )}
        {showFailedX && (
          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-semantic-red/90 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
        )}
        {isDeleted && (
          <div className="absolute top-2 right-2 rounded-full border border-frost-border bg-void/80 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-fg3">
            Removed
          </div>
        )}

        {(isInFlight || isBusy) && (
          <div className="absolute inset-0 bg-void/80 flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-brand-volt border-t-transparent rounded-full animate-spin" />
            <span className="text-[9px] text-fg2 uppercase tracking-wide">
              {isBusy ? "Working…" : "Processing…"}
            </span>
          </div>
        )}
      </div>

      <div className="p-2.5 space-y-1.5">
        <p className="text-xs text-fg1 truncate">{item.title}</p>

        {(isFailed || legacyFailed) && (
          <div className="space-y-1.5">
            <p className="text-[9px] text-semantic-red leading-tight">
              {liveStatus?.failureReason || item.error || "Extraction failed"}
            </p>
            {canRetry && (
              <button
                onClick={onRetry}
                className="w-full rounded-md border border-frost-border bg-void px-2 py-1 text-[9px] uppercase tracking-wide text-fg1 hover:border-brand-volt/50 transition-colors"
              >
                Try again ({MAX_RETRIES - retryCount} left)
              </button>
            )}
            <button
              onClick={onRemove}
              disabled={isBusy}
              className="w-full rounded-md border border-frost-border bg-void px-2 py-1 text-[9px] uppercase tracking-wide text-fg2 hover:text-semantic-red hover:border-semantic-red/50 transition-colors disabled:opacity-40"
            >
              Remove
            </button>
            {isTerminalFailure && !canRetry && (
              <p className="text-[9px] text-fg3 leading-tight">
                Max retries reached. Try uploading with clearer photos.
              </p>
            )}
          </div>
        )}

        {isAwaitingReview && (
          <div className="space-y-1.5">
            <button
              onClick={onPublish}
              disabled={isBusy}
              className="w-full rounded-md bg-brand-volt px-2 py-1 text-[9px] uppercase tracking-wide font-medium text-void hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Publish
            </button>
            <button
              onClick={onRemove}
              disabled={isBusy}
              className="w-full rounded-md border border-frost-border bg-void px-2 py-1 text-[9px] uppercase tracking-wide text-fg2 hover:text-semantic-red hover:border-semantic-red/50 transition-colors disabled:opacity-40"
            >
              Discard
            </button>
          </div>
        )}

        {isPublished && retryCount > 0 && (
          <p className="text-[9px] text-fg3">Succeeded on retry {retryCount}</p>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: { label: "Complete", className: "text-semantic-green border-semantic-green/30 bg-semantic-green/5" },
    partial: { label: "Partial", className: "text-semantic-orange border-semantic-orange/30 bg-semantic-orange/5" },
    processing: { label: "Processing", className: "text-brand-volt border-brand-volt/30 bg-brand-volt/5" },
    failed: { label: "Failed", className: "text-semantic-red border-semantic-red/30 bg-semantic-red/5" },
  }[status] ?? { label: status, className: "text-fg3 border-frost-border" }

  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${config.className}`}>
      {config.label}
    </span>
  )
}
