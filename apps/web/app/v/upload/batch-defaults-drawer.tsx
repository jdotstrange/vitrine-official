"use client"

import { useEffect, useRef } from "react"
import type { GlobalDefaults, ListingStatus, Visibility } from "./types"
import { STATUS_OPTIONS, STATUS_CONFIG } from "./types"
import { ShowcasePicker } from "./showcase-picker"

interface BatchDefaultsDrawerProps {
  isOpen: boolean
  onClose: () => void
  defaults: GlobalDefaults
  onChange: <K extends keyof GlobalDefaults>(
    field: K,
    value: GlobalDefaults[K]
  ) => void
  onAddTag: () => void
  onRemoveTag: (tag: string) => void
  autoPublish: boolean
  onAutoPublishChange: (value: boolean) => void
}

export function BatchDefaultsDrawer({
  isOpen,
  onClose,
  defaults,
  onChange,
  onAddTag,
  onRemoveTag,
  autoPublish,
  onAutoPublishChange,
}: BatchDefaultsDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  return (
    <>
      {/* Scrim */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 z-50 h-full w-80 bg-void border-l border-frost-border flex flex-col transition-transform duration-200 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-frost-border">
          <div>
            <h2 className="text-xs uppercase tracking-wider font-medium text-fg1">
              Batch Defaults
            </h2>
            <p className="text-[11px] text-fg3 mt-0.5">
              Pieces you've already edited individually won't be affected by these changes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-fg3 hover:text-fg1 transition-colors"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Status */}
          <div>
            <label className="text-[10px] uppercase tracking-wide text-fg3 mb-2 block">
              Listing Status
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {STATUS_OPTIONS.map((option) => {
                const selected = defaults.status === option.key
                const chrome = STATUS_CONFIG[option.key]
                return (
                  <button
                    key={option.key}
                    onClick={() => onChange("status", option.key)}
                    style={
                      selected
                        ? {
                            backgroundColor: chrome.fill,
                            borderColor: chrome.border,
                            color: chrome.text,
                          }
                        : undefined
                    }
                    className={`rounded-lg border px-2.5 py-2 text-left transition-all ${
                      selected
                        ? ""
                        : "border-frost-border bg-sheet-bg text-fg3 hover:text-fg2"
                    }`}
                  >
                    <span className="block text-[10px] font-medium uppercase tracking-wide">
                      {option.title}
                    </span>
                    <span className="block text-[9px] opacity-70 mt-0.5">
                      {option.subtitle}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Value */}
          <div>
            <label className="text-[10px] uppercase tracking-wide text-fg3 mb-2 block">
              My Value
            </label>
            <div className="flex items-center rounded-lg border border-frost-border bg-sheet-bg overflow-hidden">
              <span className="pl-3 text-xs text-fg3">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={defaults.value}
                onChange={(e) =>
                  onChange("value", e.target.value.replace(/[^\d.]/g, ""))
                }
                placeholder="0.00"
                className="flex-1 px-2 py-2.5 text-xs text-fg1 bg-transparent outline-none placeholder:text-fg3/50"
              />
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="text-[10px] uppercase tracking-wide text-fg3 mb-2 block">
              Visibility
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["public", "private"] as const).map((option) => {
                const active = defaults.visibility === option
                return (
                  <button
                    key={option}
                    onClick={() => onChange("visibility", option)}
                    className={`flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-[10px] uppercase tracking-wide transition-all ${
                      active
                        ? "border-brand-volt/50 bg-brand-volt/5 text-fg1"
                        : "border-frost-border bg-sheet-bg text-fg3 hover:text-fg2"
                    }`}
                  >
                    {option === "public" ? (
                      <EyeIcon className="w-3 h-3" />
                    ) : (
                      <LockIcon className="w-3 h-3" />
                    )}
                    {option}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Showcases */}
          <div>
            <label className="text-[10px] uppercase tracking-wide text-fg3 mb-2 block">
              Showcases
            </label>
            <ShowcasePicker
              selectedIds={defaults.showcaseIds}
              onChange={(ids) => onChange("showcaseIds", ids)}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] uppercase tracking-wide text-fg3 mb-2 block">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {defaults.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onRemoveTag(tag)}
                  className="rounded-md border border-frost-border bg-sheet-bg px-2 py-1 text-[10px] text-fg1 hover:border-semantic-red/50 transition-colors"
                >
                  #{tag}
                </button>
              ))}
              <button
                onClick={onAddTag}
                className="rounded-md border border-brand-volt/30 px-2 py-1 text-[10px] text-brand-volt hover:border-brand-volt/60 transition-colors"
              >
                + Tag
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-frost-border" />

          {/* After cataloging */}
          <div>
            <label className="text-[10px] uppercase tracking-wide text-fg3 block">
              After Cataloging
            </label>
            <p className="text-[11px] text-fg3 mt-0.5 mb-2">
              Choose what happens after Looking Glass catalogs your collectibles. This setting applies to every collectible in the batch regardless of per-card edits.
            </p>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => onAutoPublishChange(true)}
                style={
                  autoPublish
                    ? {
                        backgroundColor: "var(--semantic-green-fill)",
                        borderColor: "var(--semantic-green-border)",
                        color: "var(--semantic-green)",
                      }
                    : undefined
                }
                className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-3 text-left transition-all ${
                  autoPublish
                    ? ""
                    : "border-frost-border bg-sheet-bg text-fg3 hover:text-fg2"
                }`}
              >
                <RocketIcon className="w-4 h-4 shrink-0" />
                <div>
                  <span className="block text-[10px] font-medium uppercase tracking-wide">
                    Publish immediately
                  </span>
                  <span className="block text-[11px] opacity-70 mt-0.5">
                    Once Looking Glass finishes cataloging, collectibles are published directly to your collection and visible to others
                  </span>
                </div>
              </button>
              <button
                onClick={() => onAutoPublishChange(false)}
                style={
                  !autoPublish
                    ? {
                        backgroundColor: "var(--semantic-orange-fill)",
                        borderColor: "var(--semantic-orange-border)",
                        color: "var(--semantic-orange)",
                      }
                    : undefined
                }
                className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-3 text-left transition-all ${
                  !autoPublish
                    ? ""
                    : "border-frost-border bg-sheet-bg text-fg3 hover:text-fg2"
                }`}
              >
                <QueueIcon className="w-4 h-4 shrink-0" />
                <div>
                  <span className="block text-[10px] font-medium uppercase tracking-wide">
                    Hold for my review
                  </span>
                  <span className="block text-[11px] opacity-70 mt-0.5">
                    Collectibles are cataloged but held in your Queue so you can review Looking Glass's work before publishing
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
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

function RocketIcon({ className }: { className?: string }) {
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
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  )
}

function QueueIcon({ className }: { className?: string }) {
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
      <path d="M16 3h5v5" />
      <path d="M8 3H3v5" />
      <path d="M12 22v-8.3a4 4 0 00-1.172-2.872L3 3" />
      <path d="M15 9l6-6" />
    </svg>
  )
}
