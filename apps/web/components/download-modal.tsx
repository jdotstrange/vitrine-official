"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/constants"

interface DownloadModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  )
}

function PlayStoreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
    </svg>
  )
}

export function DownloadModal({ open: controlledOpen, onOpenChange, trigger }: DownloadModalProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  // Use controlled or internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, setIsOpen])

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Trigger element */}
      {trigger && (
        <div onClick={() => setIsOpen(true)} className="cursor-pointer">
          {trigger}
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-md p-4"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="download-modal-title"
        >
          <div
            ref={modalRef}
            className={cn(
              "relative w-full max-w-md rounded-2xl glass-premium p-8 text-center",
              "animate-[scale-in_0.2s_ease-out]",
            )}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Content */}
            <h2 id="download-modal-title" className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Your whole collection.<br />One place.
            </h2>
            <p className="text-muted-foreground mb-8">Free on iOS and Android.</p>

            {/* Download Buttons */}
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-all hover:scale-105 hover:shadow-[var(--shadow-accent)]"
              >
                <AppleIcon className="h-5 w-5" />
                Download for iOS
              </a>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-full bg-secondary px-6 py-3 font-medium text-foreground border border-border transition-all hover:scale-105 hover:border-foreground/20"
              >
                <PlayStoreIcon className="h-5 w-5" />
                Download for Android
              </a>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setIsOpen(false)}
              className="mt-6 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  )
}
