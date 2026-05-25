"use client"

import { useRef } from "react"
import type { CardPhoto } from "./types"
import { MAX_PHOTOS_PER_CARD } from "./types"

interface PhotoGridProps {
  photos: CardPhoto[]
  onAddPhotos: (files: File[]) => void
  onRemovePhoto: (photoId: string) => void
  disabled?: boolean
}

export function PhotoGrid({
  photos,
  onAddPhotos,
  onRemovePhoto,
  disabled,
}: PhotoGridProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const files = Array.from(e.target.files).filter((f) =>
      f.type.startsWith("image/")
    )
    onAddPhotos(files)
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    )
    onAddPhotos(files)
  }

  const slots = Array.from({ length: MAX_PHOTOS_PER_CARD })

  return (
    <div className="grid grid-cols-3 gap-1.5">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="sr-only"
      />
      {slots.map((_, index) => {
        const photo = photos[index]
        if (photo) {
          return (
            <div
              key={photo.id}
              className={`relative aspect-[5/6] rounded-md overflow-hidden border ${
                index === 0
                  ? "border-brand-volt/50"
                  : "border-frost-border"
              }`}
            >
              <img
                src={photo.previewUrl}
                alt={`Photo ${index + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <button
                onClick={() => onRemovePhoto(photo.id)}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-void/70 border border-frost-border flex items-center justify-center hover:bg-void transition-colors"
                aria-label={`Remove photo ${index + 1}`}
              >
                <XIcon className="w-2 h-2 text-fg1" />
              </button>
              <span className="absolute bottom-0.5 left-0 right-0 text-center text-[8px] font-mono text-fg2">
                {index + 1}
              </span>
            </div>
          )
        }

        return (
          <button
            key={`empty-${index}`}
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            onDragOver={(e) => e.preventDefault()}
            onDrop={disabled ? undefined : handleDrop}
            className="aspect-[5/6] rounded-md border border-dashed border-frost-border bg-sheet-bg flex flex-col items-center justify-center gap-0.5 hover:border-brand-volt/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={`Add photo to slot ${index + 1}`}
          >
            <ImagePlusIcon className="w-3 h-3 text-fg3" />
            <span className="text-[8px] font-mono text-fg3">{index + 1}</span>
          </button>
        )
      })}
    </div>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  )
}

function ImagePlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
      <path d="M14 3v4M12 5h4" />
    </svg>
  )
}
