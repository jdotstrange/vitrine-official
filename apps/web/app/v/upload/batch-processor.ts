import type { SupabaseClient } from "@supabase/supabase-js"
import type {
  UploadCard,
  CardProcessingState,
  ListingStatus,
} from "./types"

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 90 // 3 minutes max
const VARIANT_WIDTHS = [200, 400, 800] as const
const MAX_DIMENSION = 1200
const JPEG_QUALITY = 0.8

type ProgressCallback = (cardId: string, state: Partial<CardProcessingState>) => void

interface ProcessorConfig {
  supabase: SupabaseClient
  userId: string // users table PK (text)
  supabaseUrl: string
  supabaseAnonKey: string
  onProgress: ProgressCallback
}

function statusToSaleTradeFlags(status: ListingStatus) {
  return {
    availableForSale: status === "FOR_SALE" || status === "SELL_TRADE",
    availableForTrade: status === "FOR_TRADE" || status === "SELL_TRADE",
  }
}

async function processOneCard(
  card: UploadCard,
  config: ProcessorConfig,
  batchId: string | null,
): Promise<void> {
  const { supabase, userId, supabaseUrl, supabaseAnonKey, onProgress } = config
  const { id: cardId, photos, metadata } = card

  try {
    onProgress(cardId, { status: "uploading", progress: 0.05 })

    const uploadedUrls: string[] = []
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]
      const basePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.jpg`

      const jpegBlob = await fileToJpegBlob(photo.file)

      const { data, error } = await supabase.storage
        .from("collectible-images")
        .upload(basePath, jpegBlob, {
          contentType: "image/jpeg",
          upsert: false,
        })

      if (error) throw new Error(`Photo upload failed: ${error.message}`)

      const { data: urlData } = supabase.storage
        .from("collectible-images")
        .getPublicUrl(data.path)

      uploadedUrls.push(urlData.publicUrl)

      await uploadVariants(supabase, basePath, photo.file)

      onProgress(cardId, { progress: 0.05 + (0.25 * (i + 1)) / photos.length })
    }

    // ───────────────────────────────────────────────────────────────────
    // Phase 2: Insert collectible row with all final user-provided fields
    // up-front. The server-side `complete_and_publish` trigger handles the
    // flip to `extraction_status = 'complete'` and (conditionally) sets
    // `published_at` once extraction finishes — no client-side commit needed.
    // ───────────────────────────────────────────────────────────────────
    onProgress(cardId, { status: "queued", progress: 0.32 })

    const collectibleId = `col-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const now = new Date().toISOString()
    const title = metadata.context.trim() || "New Collectible"
    const { availableForSale, availableForTrade } = statusToSaleTradeFlags(metadata.status)
    const valueNum =
      metadata.value && metadata.value.trim().length > 0
        ? Number.parseFloat(metadata.value)
        : null

    const insertPayload: Record<string, unknown> = {
      id: collectibleId,
      user_id: userId,
      title,
      description: metadata.context.trim() || null,
      photos: uploadedUrls,
      category: "pending",
      privacy: metadata.visibility,
      visibility: metadata.visibility,
      tags: metadata.tags,
      available_for_sale: availableForSale,
      available_for_trade: availableForTrade,
      collectible_type: "memorabilia",
      extraction_status: "queued",
      created_at: now,
      updated_at: now,
      batch_id: batchId,
      value: valueNum !== null && Number.isFinite(valueNum) ? valueNum : null,
    }

    const { error: insertError } = await supabase.from("collectibles").insert(insertPayload)

    if (insertError) throw new Error(`Insert failed: ${insertError.message}`)

    onProgress(cardId, { collectibleId, progress: 0.34 })

    if (metadata.showcaseIds.length > 0) {
      for (const showcaseId of metadata.showcaseIds) {
        if (showcaseId.startsWith("local-")) continue
        await supabase
          .from("showcase_collectibles")
          .insert({
            id: crypto.randomUUID(),
            showcase_id: showcaseId,
            collectible_id: collectibleId,
            display_order: 0,
          })
          .then(() => {}) // best-effort
      }
    }

    onProgress(cardId, { progress: 0.35 })

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
        imageUrls: uploadedUrls.slice(0, 4),
        title,
        hint: metadata.context.trim() || undefined,
      }),
    })

    if (!enqueueRes.ok) {
      const body = await enqueueRes.json().catch(() => ({}))
      throw new Error(
        (body as { error?: string; message?: string }).error ||
          (body as { error?: string; message?: string }).message ||
          `Enqueue returned ${enqueueRes.status}`,
      )
    }

    const enqueuePayload = (await enqueueRes.json()) as { job_id?: string }
    const jobId = enqueuePayload.job_id
    if (!jobId) throw new Error("No job_id returned from extraction service")

    await supabase
      .from("collectibles")
      .update({ extraction_job_id: jobId, updated_at: new Date().toISOString() })
      .eq("id", collectibleId)

    onProgress(cardId, { status: "processing", jobId, progress: 0.4 })

    // ───────────────────────────────────────────────────────────────────
    // Phase 4: Poll for terminal extraction status. Terminal states are
    // `'complete'` (set by the trigger after `'extracted'`) or `'failed'`.
    // We never see `'extracted'` linger because the trigger flips it
    // immediately in the same UPDATE.
    // ───────────────────────────────────────────────────────────────────
    let attempts = 0
    let extractionDone = false

    while (!extractionDone && attempts < MAX_POLL_ATTEMPTS) {
      await sleep(POLL_INTERVAL_MS)
      attempts++

      const { data: row, error: pollError } = await supabase
        .from("collectibles")
        .select("extraction_status, extraction_failure_reason")
        .eq("id", collectibleId)
        .maybeSingle()

      if (pollError || !row) continue

      const estatus = (row as { extraction_status: string }).extraction_status
      const failureReason = (row as { extraction_failure_reason: string | null })
        .extraction_failure_reason

      const pollProgress = 0.4 + Math.min(0.55, (attempts / MAX_POLL_ATTEMPTS) * 0.55)
      onProgress(cardId, { progress: pollProgress })

      if (estatus === "complete") {
        extractionDone = true
        onProgress(cardId, {
          status: "done",
          progress: 1,
          collectibleId,
          photoUrls: uploadedUrls,
        })
      } else if (estatus === "failed") {
        throw new Error(failureReason || "AI extraction failed for this item")
      }
    }

    if (!extractionDone) {
      throw new Error("Extraction timed out — please try again")
    }
  } catch (err) {
    onProgress(cardId, {
      status: "failed",
      error: err instanceof Error ? err.message : "Unknown error",
    })
  }
}

export interface BatchResult {
  batchId: string
  successful: number
  failed: number
}

interface BatchItemRecord {
  cardIndex: number
  cardId: string
  collectibleId: string | null
  status: "done" | "failed"
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

/**
 * Process a batch of cards with limited concurrency.
 * Creates a batch_uploads record (with auto_publish) and updates it as
 * items reach a terminal state.
 */
export async function processBatch(
  cards: UploadCard[],
  config: Omit<ProcessorConfig, "onProgress"> & { onProgress: ProgressCallback },
  concurrency = 3,
  globals?: Record<string, unknown>,
  autoPublish: boolean = true,
): Promise<BatchResult | null> {
  const { supabase, userId } = config
  const readyCards = cards.filter((c) => c.photos.length > 0 && c.processing.status === "idle")
  if (readyCards.length === 0) return null

  const { data: batchRow, error: batchError } = await supabase
    .from("batch_uploads")
    .insert({
      user_id: userId,
      total_items: readyCards.length,
      status: "processing",
      auto_publish: autoPublish,
      defaults: globals ?? null,
      items: readyCards.map((card, i) => ({
        cardIndex: i,
        cardId: card.id,
        collectibleId: null,
        status: "processing",
        title: card.metadata.context.trim() || "New Collectible",
        thumbnailUrl: "",
        photoUrls: [],
        metadata: {
          status: card.metadata.status,
          value: card.metadata.value,
          visibility: card.metadata.visibility,
          showcaseIds: card.metadata.showcaseIds,
          tags: card.metadata.tags,
        },
        error: null,
        retryCount: 0,
      })),
    })
    .select("id")
    .single()

  if (batchError || !batchRow) {
    console.error("[BatchProcessor] Failed to create batch record:", batchError)
  }

  const batchId = (batchRow?.id as string | undefined) ?? null
  const results: BatchItemRecord[] = []
  let successful = 0
  let failed = 0

  const originalOnProgress = config.onProgress
  const itemResults = new Map<string, Partial<BatchItemRecord>>()

  const wrappedConfig: ProcessorConfig = {
    ...config,
    onProgress: (cardId, update) => {
      originalOnProgress(cardId, update)

      if (update.photoUrls) {
        itemResults.set(cardId, { ...itemResults.get(cardId), photoUrls: update.photoUrls })
      }
      if (update.collectibleId) {
        itemResults.set(cardId, { ...itemResults.get(cardId), collectibleId: update.collectibleId })
      }

      if (update.status === "done" || update.status === "failed") {
        const card = readyCards.find((c) => c.id === cardId)
        if (!card) return

        const cardIndex = readyCards.indexOf(card)
        const tracked = itemResults.get(cardId)
        const photoUrls = tracked?.photoUrls ?? []
        const item: BatchItemRecord = {
          cardIndex,
          cardId,
          collectibleId: update.collectibleId ?? tracked?.collectibleId ?? null,
          status: update.status as "done" | "failed",
          title: card.metadata.context.trim() || "New Collectible",
          thumbnailUrl: photoUrls[0] ? photoUrls[0].replace(/\.jpg$/, "_200.jpg") : "",
          photoUrls,
          metadata: {
            status: card.metadata.status,
            value: card.metadata.value,
            visibility: card.metadata.visibility,
            showcaseIds: card.metadata.showcaseIds,
            tags: card.metadata.tags,
          },
          error: update.error ?? null,
          retryCount: 0,
        }

        if (update.status === "done") successful++
        else failed++

        results.push(item)
      }
    },
  }

  const queue = [...readyCards]
  const active: Promise<void>[] = []

  async function runNext(): Promise<void> {
    const card = queue.shift()
    if (!card) return
    await processOneCard(card, wrappedConfig, batchId)
    await runNext()
  }

  for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
    active.push(runNext())
  }

  await Promise.all(active)

  if (batchId) {
    const finalStatus = failed === 0 ? "completed" : successful === 0 ? "failed" : "partial"
    await supabase
      .from("batch_uploads")
      .update({
        status: finalStatus,
        completed_at: new Date().toISOString(),
        successful_items: successful,
        failed_items: failed,
        items: results,
      })
      .eq("id", batchId)
  }

  return { batchId: batchId ?? "", successful, failed }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function resizeToBlob(file: File, maxWidth: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)

      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, w, h)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src)
          if (blob) resolve(blob)
          else reject(new Error("Canvas toBlob returned null"))
        },
        "image/jpeg",
        JPEG_QUALITY,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error("Failed to load image for resize"))
    }
    img.src = URL.createObjectURL(file)
  })
}

function fileToJpegBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const longest = Math.max(img.width, img.height)
      const scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)

      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, w, h)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src)
          if (blob) resolve(blob)
          else reject(new Error("Canvas toBlob returned null"))
        },
        "image/jpeg",
        JPEG_QUALITY,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error("Failed to load image for JPEG conversion"))
    }
    img.src = URL.createObjectURL(file)
  })
}

async function uploadVariants(
  supabase: SupabaseClient,
  basePath: string,
  file: File,
): Promise<void> {
  const lastDot = basePath.lastIndexOf(".")
  const stem = basePath.slice(0, lastDot)
  const ext = basePath.slice(lastDot) // ".jpg"

  await Promise.all(
    VARIANT_WIDTHS.map(async (width) => {
      try {
        const blob = await resizeToBlob(file, width)
        const variantPath = `${stem}_${width}${ext}`
        await supabase.storage
          .from("collectible-images")
          .upload(variantPath, blob, {
            contentType: "image/jpeg",
            upsert: false,
          })
      } catch {
        // Best-effort — don't block the pipeline for variant failures
      }
    }),
  )
}
