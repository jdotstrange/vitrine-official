"use client"

import { useState, useCallback } from "react"
import { usePathname } from "next/navigation"
import type {
  UploadCard as UploadCardType,
  CardMetadata,
  GlobalDefaults,
  CardPhoto,
  CardProcessingState,
} from "./types"
import {
  DEFAULT_METADATA,
  DEFAULT_GLOBALS,
  MAX_CARDS_PER_BATCH,
  MAX_PHOTOS_PER_CARD,
  INITIAL_PROCESSING_STATE,
} from "./types"
import { BatchDefaultsDrawer } from "./batch-defaults-drawer"
import { UploadCard } from "./upload-card"
import { GhostCard } from "./ghost-card"
import { processBatch, type BatchResult } from "./batch-processor"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/contexts/user-context"

let cardIdCounter = 0
function nextCardId() {
  return `card-${++cardIdCounter}`
}

function createEmptyCard(globals: GlobalDefaults): UploadCardType {
  return {
    id: nextCardId(),
    photos: [],
    metadata: {
      ...DEFAULT_METADATA,
      status: globals.status,
      value: globals.value,
      visibility: globals.visibility,
      showcaseIds: [...globals.showcaseIds],
      tags: [...globals.tags],
    },
    overrides: new Set(),
    processing: { ...INITIAL_PROCESSING_STATE },
  }
}

export default function BulkUploadPage() {
  const { profile } = useUser()
  // The standalone /batch shell has no sidebar, so the fixed footer should
  // be centered inside the same max-width container as the top bar. The
  // full-app /v/* surface still has the 240px sidebar and uses the original
  // left-60 footer offset.
  const pathname = usePathname()
  const isStandalone = pathname.startsWith("/batch")
  const [globals, setGlobals] = useState<GlobalDefaults>(DEFAULT_GLOBALS)
  const [cards, setCards] = useState<UploadCardType[]>(() => [
    createEmptyCard(DEFAULT_GLOBALS),
  ])
  const [tagDialogTarget, setTagDialogTarget] = useState<string | null>(null)
  const [isBatchRunning, setIsBatchRunning] = useState(false)
  const [autoPublish, setAutoPublish] = useState(true)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const filledCardCount = cards.filter((c) => c.photos.length > 0).length
  const processingCount = cards.filter(
    (c) => c.processing.status !== "idle" && c.processing.status !== "done" && c.processing.status !== "failed"
  ).length
  const doneCount = cards.filter((c) => c.processing.status === "done").length

  // --- Global controls ---

  const handleGlobalChange = useCallback(
    <K extends keyof GlobalDefaults>(field: K, value: GlobalDefaults[K]) => {
      setGlobals((prev) => ({ ...prev, [field]: value }))
      setCards((prev) =>
        prev.map((card) => {
          if (card.overrides.has(field)) return card
          return {
            ...card,
            metadata: { ...card.metadata, [field]: value },
          }
        })
      )
    },
    []
  )


  // --- Card operations ---

  const handleAddCard = useCallback(() => {
    setCards((prev) => [...prev, createEmptyCard(globals)])
  }, [globals])

  const handleRemoveCard = useCallback((cardId: string) => {
    setCards((prev) => {
      const next = prev.filter((c) => c.id !== cardId)
      return next.length === 0 ? [createEmptyCard(DEFAULT_GLOBALS)] : next
    })
  }, [])

  const handleAddPhotos = useCallback(
    (cardId: string, files: File[]) => {
      setCards((prev) =>
        prev.map((card) => {
          if (card.id !== cardId) return card
          const remaining = MAX_PHOTOS_PER_CARD - card.photos.length
          const toAdd = files.slice(0, remaining).map(
            (file): CardPhoto => ({
              id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              file,
              previewUrl: URL.createObjectURL(file),
            })
          )
          return { ...card, photos: [...card.photos, ...toAdd] }
        })
      )
    },
    []
  )

  const handleRemovePhoto = useCallback(
    (cardId: string, photoId: string) => {
      setCards((prev) =>
        prev.map((card) => {
          if (card.id !== cardId) return card
          const photo = card.photos.find((p) => p.id === photoId)
          if (photo) URL.revokeObjectURL(photo.previewUrl)
          return { ...card, photos: card.photos.filter((p) => p.id !== photoId) }
        })
      )
    },
    []
  )

  const handleMetadataChange = useCallback(
    <K extends keyof CardMetadata>(
      cardId: string,
      field: K,
      value: CardMetadata[K]
    ) => {
      setCards((prev) =>
        prev.map((card) => {
          if (card.id !== cardId) return card
          const newOverrides = new Set(card.overrides)
          if (field !== "context") {
            newOverrides.add(field)
          }
          return {
            ...card,
            metadata: { ...card.metadata, [field]: value },
            overrides: newOverrides,
          }
        })
      )
    },
    []
  )

  const handleRemoveTag = useCallback((cardId: string, tag: string) => {
    setCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) return card
        const newOverrides = new Set(card.overrides)
        newOverrides.add("tags")
        return {
          ...card,
          metadata: {
            ...card.metadata,
            tags: card.metadata.tags.filter((t) => t !== tag),
          },
          overrides: newOverrides,
        }
      })
    )
  }, [])

  const handleAddTag = useCallback((cardId: string) => {
    const tag = prompt("Enter tag (lowercase, no spaces):")
    if (!tag) return
    const cleaned = tag.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32)
    if (!cleaned) return
    setCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) return card
        if (card.metadata.tags.includes(cleaned)) return card
        const newOverrides = new Set(card.overrides)
        newOverrides.add("tags")
        return {
          ...card,
          metadata: { ...card.metadata, tags: [...card.metadata.tags, cleaned] },
          overrides: newOverrides,
        }
      })
    )
  }, [])

  const handleGlobalAddTag = useCallback(() => {
    const tag = prompt("Enter tag (lowercase, no spaces):")
    if (!tag) return
    const cleaned = tag.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32)
    if (!cleaned) return
    setGlobals((prev) => {
      if (prev.tags.includes(cleaned)) return prev
      return { ...prev, tags: [...prev.tags, cleaned] }
    })
    setCards((prev) =>
      prev.map((card) => {
        if (card.overrides.has("tags")) return card
        if (card.metadata.tags.includes(cleaned)) return card
        return {
          ...card,
          metadata: { ...card.metadata, tags: [...card.metadata.tags, cleaned] },
        }
      })
    )
  }, [])

  const handleGlobalRemoveTag = useCallback((tag: string) => {
    setGlobals((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }))
    setCards((prev) =>
      prev.map((card) => {
        if (card.overrides.has("tags")) return card
        return {
          ...card,
          metadata: {
            ...card.metadata,
            tags: card.metadata.tags.filter((t) => t !== tag),
          },
        }
      })
    )
  }, [])

  // --- Processing ---

  const handleProgressUpdate = useCallback(
    (cardId: string, update: Partial<CardProcessingState>) => {
      setCards((prev) =>
        prev.map((card) => {
          if (card.id !== cardId) return card
          return {
            ...card,
            processing: { ...card.processing, ...update },
          }
        })
      )
    },
    []
  )

  const handleProcessBatch = useCallback(async () => {
    if (!profile?.id || isBatchRunning) return

    // Snapshot ready cards before state update
    const readyCards = cards.filter(
      (c) => c.photos.length > 0 && c.processing.status === "idle"
    )
    if (readyCards.length === 0) return

    setIsBatchRunning(true)

    // Mark all ready cards as starting
    setCards((prev) =>
      prev.map((card) => {
        if (card.photos.length === 0 || card.processing.status !== "idle") return card
        return { ...card, processing: { ...INITIAL_PROCESSING_STATE, status: "uploading", progress: 0.01 } }
      })
    )

    const supabase = createClient()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const result = await processBatch(
      readyCards,
      {
        supabase,
        userId: profile.id,
        supabaseUrl,
        supabaseAnonKey,
        onProgress: handleProgressUpdate,
      },
      3,
      globals as unknown as Record<string, unknown>,
      autoPublish,
    )

    setIsBatchRunning(false)

    if (result && result.batchId) {
      console.info(`[BulkUpload] Batch ${result.batchId} complete: ${result.successful} success, ${result.failed} failed`)
    }
  }, [profile, isBatchRunning, cards, handleProgressUpdate, globals, autoPublish])

  const handleRetry = useCallback(
    (cardId: string) => {
      // Reset the card's processing state so it re-enters the queue
      setCards((prev) =>
        prev.map((card) => {
          if (card.id !== cardId) return card
          return { ...card, processing: { ...INITIAL_PROCESSING_STATE } }
        })
      )
    },
    []
  )

  return (
    <div className="max-w-[1600px] mx-auto p-6 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-grotesk text-2xl font-semibold text-fg1">
            Batch Catalog
          </h1>
          <p className="mt-1 text-sm text-fg2">
            Pre queue up to {MAX_CARDS_PER_BATCH} unique collectibles at once. Looking Glass will identify, classify, and catalog each piece automatically, we'll notify you directly when everything is complete.
          </p>
        </div>

        {/* Batch config trigger */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="relative flex items-center gap-2 rounded-lg border border-frost-border bg-sheet-bg px-3 py-2 text-[10px] uppercase tracking-wide text-fg2 hover:text-fg1 hover:border-frost-border/80 transition-colors"
          aria-label="Batch defaults"
        >
          <SettingsIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Defaults</span>
        </button>
      </div>

      {/* Batch defaults drawer */}
      <BatchDefaultsDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        defaults={globals}
        onChange={handleGlobalChange}
        onAddTag={handleGlobalAddTag}
        onRemoveTag={handleGlobalRemoveTag}
        autoPublish={autoPublish}
        onAutoPublishChange={setAutoPublish}
      />

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <UploadCard
            key={card.id}
            card={card}
            index={i}
            onAddPhotos={handleAddPhotos}
            onRemovePhoto={handleRemovePhoto}
            onMetadataChange={handleMetadataChange}
            onRemoveCard={handleRemoveCard}
            onRemoveTag={handleRemoveTag}
            onAddTag={handleAddTag}
            onRetry={handleRetry}
          />
        ))}
        <GhostCard
          onAdd={handleAddCard}
          disabled={cards.length >= MAX_CARDS_PER_BATCH}
        />
      </div>

      {/* Fixed footer — surface-aware. Standalone /batch: centered max-1600 to
          match the top bar. Full-app /v/*: offset by sidebar width (240px). */}
      <div
        className={`fixed bottom-0 border-t border-frost-border bg-void/90 backdrop-blur-sm py-4 z-10 flex items-center justify-between ${
          isStandalone
            ? "left-1/2 -translate-x-1/2 w-full max-w-[1600px] px-6"
            : "left-60 right-0 px-6"
        }`}
      >
        <span className="text-sm text-fg2">
          {isBatchRunning ? (
            <>
              <span className="text-fg1 font-medium">{doneCount}</span>
              /{filledCardCount} complete
              {processingCount > 0 && (
                <span className="ml-2 text-brand-volt animate-pulse">
                  {processingCount} processing…
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-fg1 font-medium">{filledCardCount}</span>
              /{MAX_CARDS_PER_BATCH} collectibles ready
            </>
          )}
        </span>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[11px] text-fg2">
              <span
                className="font-medium"
                style={{ color: autoPublish ? "var(--semantic-green)" : "var(--semantic-orange)" }}
              >
                {autoPublish ? "Publish immediately" : "Hold for review"}
              </span>
              <span className="mx-1.5 text-fg3">·</span>
              <button
                onClick={() => setDrawerOpen(true)}
                className="text-fg3 hover:text-brand-volt transition-colors underline underline-offset-2"
              >
                change
              </button>
            </p>
            <p className="text-[9px] text-fg3 mt-0.5">
              {autoPublish
                ? "Collectibles go live as soon as Looking Glass finishes"
                : "Collectibles wait in your Queue until you publish"}
            </p>
          </div>
          <button
            onClick={handleProcessBatch}
            disabled={filledCardCount === 0 || isBatchRunning}
            className="rounded-full bg-brand-volt px-6 py-2.5 text-sm font-medium uppercase tracking-wider text-void shadow-[0_4px_12px_rgba(232,224,212,0.3)] transition-all hover:opacity-90 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isBatchRunning ? "Processing…" : "Process Batch"}
          </button>
        </div>
      </div>
    </div>
  )
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
