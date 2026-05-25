"use client"

import type { UploadCard as UploadCardType, CardMetadata, ListingStatus, Visibility } from "./types"
import { STATUS_OPTIONS, STATUS_CONFIG } from "./types"
import { PhotoGrid } from "./photo-grid"
import { ShowcasePicker } from "./showcase-picker"
import { ProcessingOverlay } from "./processing-overlay"

interface UploadCardProps {
  card: UploadCardType
  index: number
  onAddPhotos: (cardId: string, files: File[]) => void
  onRemovePhoto: (cardId: string, photoId: string) => void
  onMetadataChange: <K extends keyof CardMetadata>(
    cardId: string,
    field: K,
    value: CardMetadata[K]
  ) => void
  onRemoveCard: (cardId: string) => void
  onRemoveTag: (cardId: string, tag: string) => void
  onAddTag: (cardId: string) => void
  onRetry?: (cardId: string) => void
}

export function UploadCard({
  card,
  index,
  onAddPhotos,
  onRemovePhoto,
  onMetadataChange,
  onRemoveCard,
  onRemoveTag,
  onAddTag,
  onRetry,
}: UploadCardProps) {
  const hasPhotos = card.photos.length > 0
  const isProcessing = card.processing.status !== "idle"
  const fieldsDisabled = !hasPhotos || isProcessing
  const valueRequired =
    card.metadata.status === "FOR_SALE" || card.metadata.status === "SELL_TRADE"

  return (
    <div className="relative rounded-xl border border-frost-border bg-sheet-bg p-3.5 flex flex-col gap-3 min-w-0">
      {/* Processing overlay */}
      <ProcessingOverlay
        state={card.processing}
        onRetry={onRetry ? () => onRetry(card.id) : undefined}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono text-fg3 uppercase tracking-wide">
          Item {index + 1}
        </span>
        <button
          onClick={() => onRemoveCard(card.id)}
          className="text-[9px] text-fg3 hover:text-semantic-red transition-colors"
          aria-label="Remove card"
        >
          Remove
        </button>
      </div>

      {/* Photo grid */}
      <PhotoGrid
        photos={card.photos}
        onAddPhotos={(files) => onAddPhotos(card.id, files)}
        onRemovePhoto={(photoId) => onRemovePhoto(card.id, photoId)}
      />

      {/* Context field */}
      <input
        type="text"
        value={card.metadata.context}
        onChange={(e) =>
          onMetadataChange(card.id, "context", e.target.value.slice(0, 120))
        }
        disabled={fieldsDisabled}
        placeholder="Context (optional)"
        className="w-full rounded-md border border-frost-border bg-void px-2.5 py-2 text-xs text-fg1 placeholder:text-fg3/50 outline-none focus:border-brand-volt/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      />

      {/* Status pills */}
      <div className="flex gap-1">
        {STATUS_OPTIONS.map((option) => {
          const selected = card.metadata.status === option.key
          const chrome = STATUS_CONFIG[option.key]
          return (
            <button
              key={option.key}
              onClick={() =>
                onMetadataChange(card.id, "status", option.key)
              }
              disabled={fieldsDisabled}
              style={
                selected
                  ? {
                      backgroundColor: chrome.fill,
                      borderColor: chrome.border,
                      color: chrome.text,
                    }
                  : undefined
              }
              className={`flex-1 rounded-md border px-1 py-1 text-[8px] font-medium uppercase tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                selected
                  ? ""
                  : "border-frost-border bg-void text-fg3 hover:text-fg2"
              }`}
            >
              {option.title}
            </button>
          )
        })}
      </div>

      {/* Value */}
      <div className="flex items-center rounded-md border border-frost-border bg-void overflow-hidden">
        <span className="pl-2.5 text-xs text-fg3">$</span>
        <input
          type="text"
          inputMode="decimal"
          value={card.metadata.value}
          onChange={(e) =>
            onMetadataChange(
              card.id,
              "value",
              e.target.value.replace(/[^\d.]/g, "")
            )
          }
          disabled={fieldsDisabled}
          placeholder={valueRequired ? "Required" : "0.00"}
          className={`flex-1 px-2 py-2 text-xs bg-transparent outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
            valueRequired && !card.metadata.value
              ? "text-fg1 placeholder:text-semantic-red/70"
              : "text-fg1 placeholder:text-fg3/50"
          }`}
        />
      </div>

      {/* Visibility */}
      <div className="grid grid-cols-2 gap-1">
        {(["public", "private"] as const).map((option) => {
          const active = card.metadata.visibility === option
          return (
            <button
              key={option}
              onClick={() =>
                onMetadataChange(card.id, "visibility", option)
              }
              disabled={fieldsDisabled}
              className={`flex items-center justify-center gap-1 rounded-md border py-1 text-[9px] uppercase tracking-wide transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                active
                  ? "border-brand-volt/50 bg-brand-volt/5 text-fg1"
                  : "border-frost-border bg-void text-fg3 hover:text-fg2"
              }`}
            >
              {option === "public" ? (
                <EyeIcon className="w-2.5 h-2.5" />
              ) : (
                <LockIcon className="w-2.5 h-2.5" />
              )}
              {option}
            </button>
          )
        })}
      </div>

      {/* Showcases */}
      <ShowcasePicker
        selectedIds={card.metadata.showcaseIds}
        onChange={(ids) => onMetadataChange(card.id, "showcaseIds", ids)}
        disabled={fieldsDisabled}
      />

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {card.metadata.tags.map((tag) => (
          <button
            key={tag}
            onClick={() => onRemoveTag(card.id, tag)}
            className="rounded border border-frost-border bg-void px-1.5 py-0.5 text-[9px] text-fg1 hover:border-semantic-red/50 transition-colors"
          >
            #{tag}
          </button>
        ))}
        <button
          onClick={() => onAddTag(card.id)}
          disabled={fieldsDisabled}
          className="rounded border border-brand-volt/30 px-1.5 py-0.5 text-[9px] text-brand-volt hover:border-brand-volt/60 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Tag
        </button>
      </div>
    </div>
  )
}

function EyeIcon({ className }: { className?: string }) {
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
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function LockIcon({ className }: { className?: string }) {
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
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}
