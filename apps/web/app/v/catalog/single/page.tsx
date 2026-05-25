"use client"

/**
 * Single-item Catalog flow — web port of the native upload-entry state machine.
 *
 * Mirrors apps/native/components/upload-entry.tsx
 * Steps: scan (file drop) → theater (AI extraction) → review → finalize → success
 */

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronLeft,
  ImagePlus,
  RotateCcw,
  Sparkles,
  Upload as UploadIcon,
  X,
} from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { createClient } from "@/lib/supabase/client"
import { uploadImageWithVariants } from "@/lib/upload/image"
import { StatusPill, EmptyState } from "@/components/vault"
import type { ListingStatus } from "@vitrine/api"

type Step = "scan" | "theater" | "review" | "finalize" | "success" | "failed"

interface PhotoAsset {
  id: string
  file: File
  previewUrl: string
}

interface ExtractionResult {
  id: string
  title: string
  description: string
  category: string
  subcategory: string
  traits: string[]
  aiMetadata: Record<string, unknown>
}

const POLL_INTERVAL_MS = 2000
const MAX_POLL_ATTEMPTS = 90

export default function CatalogSinglePage() {
  const router = useRouter()
  const { profile } = useUser()
  const [step, setStep] = useState<Step>("scan")
  const [photos, setPhotos] = useState<PhotoAsset[]>([])
  const [hint, setHint] = useState("")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [collectibleId, setCollectibleId] = useState<string | null>(null)
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null)
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])

  // Finalize form
  const [status, setStatus] = useState<ListingStatus>("NFST")
  const [value, setValue] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private" | "unlisted">(
    "public",
  )
  const [submitting, setSubmitting] = useState(false)

  const dropRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ---------------------------------------------------------------------
  // Photo handling
  // ---------------------------------------------------------------------

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"))
    if (arr.length === 0) return
    const next: PhotoAsset[] = arr.map((file) => ({
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    setPhotos((prev) => [...prev, ...next].slice(0, 8))
  }, [])

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const target = prev.find((p) => p.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
  }

  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Drag-and-drop
  useEffect(() => {
    const el = dropRef.current
    if (!el) return
    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
      el.classList.add("border-brand-volt", "bg-brand-volt/[0.04]")
    }
    const onDragLeave = () => {
      el.classList.remove("border-brand-volt", "bg-brand-volt/[0.04]")
    }
    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      el.classList.remove("border-brand-volt", "bg-brand-volt/[0.04]")
      if (e.dataTransfer?.files) addFiles(e.dataTransfer.files)
    }
    el.addEventListener("dragover", onDragOver)
    el.addEventListener("dragleave", onDragLeave)
    el.addEventListener("drop", onDrop)
    return () => {
      el.removeEventListener("dragover", onDragOver)
      el.removeEventListener("dragleave", onDragLeave)
      el.removeEventListener("drop", onDrop)
    }
  }, [addFiles])

  // ---------------------------------------------------------------------
  // Scan → Theater
  // ---------------------------------------------------------------------

  const startExtraction = useCallback(async () => {
    if (!profile?.id || photos.length === 0) return
    setError(null)
    setStep("theater")
    setProgress(0.05)

    try {
      const supabase = createClient()

      // 1. Upload photos with variants
      const urls: string[] = []
      for (let i = 0; i < photos.length; i++) {
        const result = await uploadImageWithVariants(photos[i].file, supabase, {
          pathPrefix: profile.id,
        })
        urls.push(result.originalUrl)
        setProgress(0.05 + (0.25 * (i + 1)) / photos.length)
      }
      setUploadedUrls(urls)

      // 2. Create draft collectible
      const draftId = `col-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const now = new Date().toISOString()
      const title = hint.trim() || "New Collectible"

      const { error: insertError } = await supabase.from("collectibles").insert({
        id: draftId,
        user_id: profile.id,
        title,
        description: hint.trim() || null,
        photos: urls,
        category: "pending",
        privacy: "public",
        visibility: "public",
        tags: [],
        available_for_sale: false,
        available_for_trade: false,
        collectible_type: "memorabilia",
        extraction_status: "queued",
        created_at: now,
        updated_at: now,
      })
      if (insertError) throw new Error(insertError.message)
      setCollectibleId(draftId)
      setProgress(0.35)

      // 3. Enqueue extraction
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error("Not authenticated")

      const enqueueRes = await fetch(
        `${supabaseUrl}/functions/v1/enqueue-extraction`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: supabaseAnonKey,
          },
          body: JSON.stringify({
            imageUrls: urls.slice(0, 4),
            title,
            hint: hint.trim() || undefined,
          }),
        },
      )
      if (!enqueueRes.ok) {
        const body = await enqueueRes.json().catch(() => ({}))
        throw new Error(
          (body as any).error || (body as any).message || "Extraction enqueue failed",
        )
      }
      const { job_id: jobId } = await enqueueRes.json()
      if (!jobId) throw new Error("No job_id")

      await supabase
        .from("collectibles")
        .update({ extraction_job_id: jobId, updated_at: new Date().toISOString() })
        .eq("id", draftId)

      setProgress(0.4)

      // 4. Poll for completion
      let attempts = 0
      let done = false
      while (!done && attempts < MAX_POLL_ATTEMPTS) {
        await sleep(POLL_INTERVAL_MS)
        attempts++

        const { data: row } = await supabase
          .from("collectibles")
          .select(
            "extraction_status, ai_metadata, trait_metadata, title, listing_title, listing_description, category, subcategory",
          )
          .eq("id", draftId)
          .maybeSingle()

        if (!row) continue
        const estatus = (row as any).extraction_status as string
        setProgress(0.4 + Math.min(0.5, (attempts / MAX_POLL_ATTEMPTS) * 0.5))

        if (estatus === "extracted" || estatus === "complete") {
          done = true
          const traits = Array.isArray((row as any).trait_metadata?.traits)
            ? (row as any).trait_metadata.traits
            : []
          setExtraction({
            id: draftId,
            title:
              (row as any).listing_title ?? (row as any).title ?? "New Collectible",
            description: (row as any).listing_description ?? "",
            category: (row as any).category ?? "Collectible",
            subcategory: (row as any).subcategory ?? "",
            traits,
            aiMetadata: (row as any).ai_metadata ?? {},
          })
          setProgress(1)
        } else if (estatus === "failed") {
          throw new Error("AI extraction failed")
        }
      }
      if (!done) throw new Error("Extraction timed out")

      setStep("review")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setStep("failed")
    }
  }, [profile?.id, photos, hint])

  // ---------------------------------------------------------------------
  // Finalize
  // ---------------------------------------------------------------------

  const finalize = useCallback(async () => {
    if (!collectibleId) return
    setSubmitting(true)
    setError(null)
    try {
      const supabase = createClient()
      const availableForSale = status === "FOR_SALE" || status === "SELL_TRADE"
      const availableForTrade = status === "FOR_TRADE" || status === "SELL_TRADE"

      const payload: Record<string, unknown> = {
        extraction_status: "complete",
        available_for_sale: availableForSale,
        available_for_trade: availableForTrade,
        privacy: visibility,
        visibility: visibility,
        updated_at: new Date().toISOString(),
      }
      if (value.trim()) payload.value = parseFloat(value) || 0

      const { error: updateError } = await supabase
        .from("collectibles")
        .update(payload)
        .eq("id", collectibleId)
      if (updateError) throw new Error(updateError.message)

      setStep("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setSubmitting(false)
    }
  }, [collectibleId, status, value, visibility])

  // ---------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------

  const reset = useCallback(async () => {
    if (collectibleId && step === "failed") {
      const supabase = createClient()
      await supabase.from("collectibles").delete().eq("id", collectibleId)
    }
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl))
    setPhotos([])
    setHint("")
    setProgress(0)
    setError(null)
    setCollectibleId(null)
    setExtraction(null)
    setUploadedUrls([])
    setStatus("NFST")
    setValue("")
    setVisibility("public")
    setStep("scan")
  }, [collectibleId, step, photos])

  // ---------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------

  return (
    <div className="min-h-screen">
      <Header step={step} onBack={step !== "scan" ? reset : undefined} />

      <div className="max-w-4xl mx-auto px-8 py-8">
        {step === "scan" && (
          <ScanStep
            photos={photos}
            hint={hint}
            onHintChange={setHint}
            onRemove={removePhoto}
            onAdd={() => inputRef.current?.click()}
            onContinue={startExtraction}
            dropRef={dropRef}
            inputRef={inputRef}
            onFiles={(files) => addFiles(files)}
          />
        )}

        {step === "theater" && <TheaterStep progress={progress} />}

        {step === "review" && extraction && (
          <ReviewStep
            extraction={extraction}
            photoUrls={uploadedUrls}
            onContinue={() => setStep("finalize")}
            onEdit={() =>
              router.push(`/v/collectible/${collectibleId}/edit`)
            }
          />
        )}

        {step === "finalize" && (
          <FinalizeStep
            status={status}
            onStatusChange={setStatus}
            value={value}
            onValueChange={setValue}
            visibility={visibility}
            onVisibilityChange={setVisibility}
            onSubmit={finalize}
            submitting={submitting}
            error={error}
          />
        )}

        {step === "success" && collectibleId && (
          <SuccessStep
            collectibleId={collectibleId}
            onUploadAnother={reset}
          />
        )}

        {step === "failed" && <FailedStep error={error} onRetry={reset} />}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header({
  step,
  onBack,
}: {
  step: Step
  onBack?: () => void
}) {
  const stepLabels: Record<Step, string> = {
    scan: "Add photos",
    theater: "Identifying...",
    review: "Review",
    finalize: "Finalize",
    success: "Complete",
    failed: "Failed",
  }
  return (
    <div className="border-b border-frost-border px-8 py-6 flex items-center gap-4">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-fg2 hover:text-fg1 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      <div className="flex-1">
        <h1
          className="text-fg1 uppercase"
          style={{
            fontFamily: "var(--font-grotesk)",
            fontSize: 28,
            letterSpacing: 1.5,
            fontWeight: 700,
          }}
        >
          Single Upload
        </h1>
        <p className="text-fg2 text-sm mt-1">
          {stepLabels[step]}
        </p>
      </div>
      <Link
        href="/v/catalog/bulk"
        className="text-[11px] text-fg3 hover:text-fg1 uppercase tracking-wider transition-colors"
      >
        Switch to bulk
      </Link>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Scan step
// ---------------------------------------------------------------------------

function ScanStep({
  photos,
  hint,
  onHintChange,
  onRemove,
  onAdd,
  onContinue,
  dropRef,
  inputRef,
  onFiles,
}: {
  photos: PhotoAsset[]
  hint: string
  onHintChange: (v: string) => void
  onRemove: (id: string) => void
  onAdd: () => void
  onContinue: () => void
  dropRef: React.RefObject<HTMLDivElement | null>
  inputRef: React.RefObject<HTMLInputElement | null>
  onFiles: (files: FileList) => void
}) {
  return (
    <div className="space-y-6">
      <div
        ref={dropRef}
        className="rounded-lg border-2 border-dashed border-frost-border p-12 text-center transition-colors"
      >
        {photos.length === 0 ? (
          <div className="space-y-3">
            <UploadIcon size={32} className="mx-auto text-fg3" />
            <p className="text-fg1 font-medium">Drop photos here</p>
            <p className="text-fg3 text-sm">or click below to browse</p>
            <button
              type="button"
              onClick={onAdd}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-brand-volt/10 border border-brand-volt/30 px-4 py-2 text-sm text-fg1 hover:bg-brand-volt/15"
            >
              <ImagePlus size={16} />
              Choose photos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {photos.map((p) => (
              <div key={p.id} className="relative group">
                <div
                  className="rounded-md overflow-hidden bg-frost-border/20"
                  style={{ aspectRatio: "1 / 1" }}
                >
                  <img
                    src={p.previewUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(p.id)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {photos.length < 8 && (
              <button
                type="button"
                onClick={onAdd}
                className="rounded-md border border-dashed border-frost-border flex items-center justify-center text-fg3 hover:text-fg1 hover:border-brand-volt/50 transition-colors"
                style={{ aspectRatio: "1 / 1" }}
              >
                <ImagePlus size={20} />
              </button>
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          if (e.target.files) onFiles(e.target.files)
          e.target.value = ""
        }}
        className="hidden"
      />

      <div>
        <label className="block text-[10px] text-fg3 uppercase tracking-wider mb-2 font-grotesk font-bold">
          Hint (optional)
        </label>
        <input
          type="text"
          value={hint}
          onChange={(e) => onHintChange(e.target.value)}
          placeholder="e.g., 'Charizard PSA 10' or 'Jordan rookie card'"
          className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2.5 text-sm text-fg1 placeholder:text-fg3 focus:outline-none focus:border-brand-volt/50"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onContinue}
          disabled={photos.length === 0}
          className="inline-flex items-center gap-2 rounded-md bg-brand-volt px-5 py-2.5 text-sm font-semibold text-text-inverse hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Sparkles size={16} />
          Identify with AI
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Theater step
// ---------------------------------------------------------------------------

function TheaterStep({ progress }: { progress: number }) {
  return (
    <div className="py-20 text-center space-y-6">
      <div className="mx-auto w-20 h-20 rounded-full bg-brand-volt/10 border border-brand-volt/30 flex items-center justify-center">
        <Sparkles className="text-brand-volt animate-pulse" size={32} />
      </div>
      <div className="space-y-2">
        <h2 className="text-fg1 text-xl font-semibold">Identifying...</h2>
        <p className="text-fg2 text-sm">
          Our AI is analyzing your photos. This usually takes 10–30 seconds.
        </p>
      </div>
      <div className="max-w-md mx-auto">
        <div className="h-1 rounded-full bg-frost-border/30 overflow-hidden">
          <div
            className="h-full bg-brand-volt transition-all duration-500"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <p className="text-fg3 text-[11px] mt-2 font-mono">
          {Math.round(progress * 100)}%
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Review step
// ---------------------------------------------------------------------------

function ReviewStep({
  extraction,
  photoUrls,
  onContinue,
  onEdit,
}: {
  extraction: ExtractionResult
  photoUrls: string[]
  onContinue: () => void
  onEdit: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-brand-volt text-sm">
        <Check size={16} />
        <span>Identified by AI — review the details below</span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="grid grid-cols-2 gap-2">
          {photoUrls.slice(0, 4).map((url, i) => (
            <div
              key={i}
              className="rounded-md overflow-hidden bg-frost-border/20"
              style={{ aspectRatio: "1 / 1" }}
            >
              <img src={url} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-fg3 uppercase tracking-wider mb-1 font-grotesk font-bold">
              Title
            </p>
            <h2 className="text-fg1 text-xl font-semibold">{extraction.title}</h2>
          </div>

          {extraction.description && (
            <div>
              <p className="text-[10px] text-fg3 uppercase tracking-wider mb-1 font-grotesk font-bold">
                Description
              </p>
              <p className="text-fg2 text-sm">{extraction.description}</p>
            </div>
          )}

          <div>
            <p className="text-[10px] text-fg3 uppercase tracking-wider mb-1 font-grotesk font-bold">
              Category
            </p>
            <p className="text-fg1 text-sm">
              {extraction.category}
              {extraction.subcategory ? ` · ${extraction.subcategory}` : ""}
            </p>
          </div>

          {extraction.traits.length > 0 && (
            <div>
              <p className="text-[10px] text-fg3 uppercase tracking-wider mb-2 font-grotesk font-bold">
                Traits
              </p>
              <div className="flex flex-wrap gap-2">
                {extraction.traits.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-frost-border px-2.5 py-1 text-[11px] text-fg2"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-frost-border">
        <button
          type="button"
          onClick={onEdit}
          className="text-fg3 hover:text-fg1 text-sm transition-colors"
        >
          Edit details
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-md bg-brand-volt px-5 py-2.5 text-sm font-semibold text-text-inverse hover:opacity-90 transition-opacity"
        >
          Continue
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Finalize step
// ---------------------------------------------------------------------------

function FinalizeStep({
  status,
  onStatusChange,
  value,
  onValueChange,
  visibility,
  onVisibilityChange,
  onSubmit,
  submitting,
  error,
}: {
  status: ListingStatus
  onStatusChange: (s: ListingStatus) => void
  value: string
  onValueChange: (v: string) => void
  visibility: "public" | "private" | "unlisted"
  onVisibilityChange: (v: "public" | "private" | "unlisted") => void
  onSubmit: () => void
  submitting: boolean
  error: string | null
}) {
  const statuses: ListingStatus[] = ["NFST", "FOR_SALE", "FOR_TRADE", "SELL_TRADE"]

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <label className="block text-[10px] text-fg3 uppercase tracking-wider mb-3 font-grotesk font-bold">
          Status
        </label>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => {
            const active = status === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => onStatusChange(s)}
                className={`transition-opacity ${active ? "" : "opacity-50 hover:opacity-80"}`}
              >
                <StatusPill status={s} />
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="block text-[10px] text-fg3 uppercase tracking-wider mb-2 font-grotesk font-bold">
          Value (USD)
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder="0"
          className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2.5 text-sm text-fg1 placeholder:text-fg3 focus:outline-none focus:border-brand-volt/50"
        />
      </div>

      <div>
        <label className="block text-[10px] text-fg3 uppercase tracking-wider mb-3 font-grotesk font-bold">
          Visibility
        </label>
        <div className="space-y-2">
          {(["public", "unlisted", "private"] as const).map((v) => (
            <label
              key={v}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-colors ${
                visibility === v
                  ? "border-brand-volt/40 bg-brand-volt/[0.04]"
                  : "border-frost-border hover:border-frost-border-strong"
              }`}
            >
              <input
                type="radio"
                checked={visibility === v}
                onChange={() => onVisibilityChange(v)}
                className="accent-[var(--brand-volt)]"
              />
              <div className="flex-1">
                <p className="text-fg1 text-sm capitalize">{v}</p>
                <p className="text-fg3 text-[11px]">
                  {v === "public" && "Visible to everyone"}
                  {v === "unlisted" && "Hidden from feeds; accessible by direct link"}
                  {v === "private" && "Only visible to you"}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-status-danger/30 bg-status-danger/[0.06] px-3 py-2 text-sm text-status-danger">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="w-full rounded-md bg-brand-volt px-5 py-3 text-sm font-semibold text-text-inverse hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Saving..." : "Add to collection"}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Success step
// ---------------------------------------------------------------------------

function SuccessStep({
  collectibleId,
  onUploadAnother,
}: {
  collectibleId: string
  onUploadAnother: () => void
}) {
  return (
    <div className="py-12 text-center space-y-6">
      <div className="mx-auto w-20 h-20 rounded-full bg-status-success/15 border border-status-success/30 flex items-center justify-center">
        <Check className="text-status-success" size={32} />
      </div>
      <div className="space-y-2">
        <h2 className="text-fg1 text-xl font-semibold">Added to your collection</h2>
        <p className="text-fg2 text-sm">
          Your item is now visible based on the privacy you selected.
        </p>
      </div>
      <div className="flex items-center gap-3 justify-center">
        <Link
          href={`/v/collectible/${collectibleId}`}
          className="rounded-md border border-frost-border px-4 py-2 text-sm text-fg1 hover:border-brand-volt/40 transition-colors"
        >
          View item
        </Link>
        <button
          type="button"
          onClick={onUploadAnother}
          className="rounded-md bg-brand-volt px-4 py-2 text-sm font-semibold text-text-inverse hover:opacity-90 transition-opacity"
        >
          Upload another
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Failed step
// ---------------------------------------------------------------------------

function FailedStep({
  error,
  onRetry,
}: {
  error: string | null
  onRetry: () => void
}) {
  return (
    <EmptyState
      icon={<AlertCircle size={28} color="var(--status-danger)" />}
      title="Something went wrong"
      subtitle={error ?? "Please try again."}
      action={
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-md bg-brand-volt px-4 py-2 text-sm font-semibold text-text-inverse hover:opacity-90 transition-opacity"
        >
          <RotateCcw size={14} />
          Try again
        </button>
      }
    />
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
