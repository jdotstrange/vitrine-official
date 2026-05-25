"use client"

import type { GlobalDefaults, ListingStatus, Visibility } from "./types"
import { STATUS_OPTIONS, STATUS_CONFIG } from "./types"
import { ShowcasePicker } from "./showcase-picker"

interface GlobalControlsProps {
  defaults: GlobalDefaults
  onChange: <K extends keyof GlobalDefaults>(
    field: K,
    value: GlobalDefaults[K]
  ) => void
  onApplyAll: () => void
  onAddTag: () => void
  onRemoveTag: (tag: string) => void
}

export function GlobalControls({
  defaults,
  onChange,
  onApplyAll,
  onAddTag,
  onRemoveTag,
}: GlobalControlsProps) {
  return (
    <div className="rounded-xl border border-frost-border bg-sheet-bg p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs uppercase tracking-wide text-fg2 font-medium">
            Batch Defaults
          </h2>
          <p className="text-[10px] text-fg3 mt-0.5">
            Pre-fill new cards. Cards with manual edits keep their values.
          </p>
        </div>
        <button
          onClick={onApplyAll}
          className="text-[10px] uppercase tracking-wide text-brand-volt border border-brand-volt/30 rounded-md px-3 py-1.5 hover:bg-brand-volt/5 transition-colors"
        >
          Apply to all
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Status */}
        <div>
          <label className="text-[10px] uppercase tracking-wide text-fg3 mb-1.5 block">
            Status
          </label>
          <div className="grid grid-cols-2 gap-1">
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
                  className={`rounded-md border px-2 py-1 text-[9px] uppercase tracking-wide transition-all ${
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
        </div>

        {/* Value */}
        <div>
          <label className="text-[10px] uppercase tracking-wide text-fg3 mb-1.5 block">
            Value
          </label>
          <div className="flex items-center rounded-md border border-frost-border bg-void overflow-hidden">
            <span className="pl-2 text-xs text-fg3">$</span>
            <input
              type="text"
              inputMode="decimal"
              value={defaults.value}
              onChange={(e) =>
                onChange("value", e.target.value.replace(/[^\d.]/g, ""))
              }
              placeholder="0.00"
              className="flex-1 px-2 py-1.5 text-xs text-fg1 bg-transparent outline-none placeholder:text-fg3/50"
            />
          </div>
        </div>

        {/* Visibility */}
        <div>
          <label className="text-[10px] uppercase tracking-wide text-fg3 mb-1.5 block">
            Visibility
          </label>
          <div className="grid grid-cols-2 gap-1">
            {(["public", "private"] as const).map((option) => {
              const active = defaults.visibility === option
              return (
                <button
                  key={option}
                  onClick={() => onChange("visibility", option)}
                  className={`rounded-md border py-1.5 text-[9px] uppercase tracking-wide transition-all ${
                    active
                      ? "border-brand-volt/50 bg-brand-volt/5 text-fg1"
                      : "border-frost-border bg-void text-fg3 hover:text-fg2"
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        </div>

        {/* Showcases */}
        <div>
          <label className="text-[10px] uppercase tracking-wide text-fg3 mb-1.5 block">
            Showcases
          </label>
          <ShowcasePicker
            selectedIds={defaults.showcaseIds}
            onChange={(ids) => onChange("showcaseIds", ids)}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="text-[10px] uppercase tracking-wide text-fg3 mb-1.5 block">
            Tags
          </label>
          <div className="flex flex-wrap gap-1">
            {defaults.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onRemoveTag(tag)}
                className="rounded border border-frost-border bg-void px-1.5 py-0.5 text-[9px] text-fg1 hover:border-semantic-red/50 transition-colors"
              >
                #{tag}
              </button>
            ))}
            <button
              onClick={onAddTag}
              className="rounded border border-brand-volt/30 px-1.5 py-0.5 text-[9px] text-brand-volt hover:border-brand-volt/60 transition-colors"
            >
              + Tag
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
