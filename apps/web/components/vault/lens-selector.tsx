/**
 * LensSelector — horizontal segmented switcher with sticky-header semantics.
 *
 * Mirrors apps/native/components/vault/lens-selector.tsx visually:
 *   - Upper-case grotesk-semibold labels, letter-spacing 1.2
 *   - Active item: full-contrast ink + 2pt underline
 *   - Locked item: tertiary ink + lock glyph
 *   - Hairline frost borders top and bottom
 *
 * Web interaction model: click instead of swipe, URL `?lens=` deep links.
 * Visual chrome is identical to native.
 */

"use client"

import { Lock } from "lucide-react"

export interface LensItem<K extends string = string> {
  key: K
  label: string
  locked?: boolean
}

export interface LensSelectorProps<K extends string = string> {
  items: readonly LensItem<K>[]
  activeKey: K
  onChange: (key: K) => void
  variant?: "compact" | "display"
  className?: string
}

export function LensSelector<K extends string = string>({
  items,
  activeKey,
  onChange,
  variant = "compact",
  className,
}: LensSelectorProps<K>) {
  const isDisplay = variant === "display"

  return (
    <div
      className={`relative bg-void ${
        isDisplay
          ? "border-b border-frost-divider pt-2"
          : "border-y border-frost-border"
      } ${className ?? ""}`}
    >
      <div
        role="tablist"
        className={`flex overflow-x-auto no-scrollbar justify-center ${
          isDisplay ? "px-5 gap-7" : "px-5 gap-7"
        }`}
        style={{ scrollbarWidth: "none" }}
      >
        {items.map((item) => {
          const isActive = item.key === activeKey
          const isLocked = Boolean(item.locked)
          return (
            <button
              key={item.key}
              role="tab"
              aria-selected={isActive}
              aria-label={isLocked ? `${item.label}, locked` : item.label}
              onClick={() => onChange(item.key)}
              className={`relative flex items-center justify-center shrink-0 ${
                isDisplay ? "h-[46px]" : "h-11"
              }`}
            >
              <div
                className={`flex items-center gap-1.5 ${
                  isDisplay ? "py-2" : "py-1.5"
                }`}
              >
                {isLocked && (
                  <Lock
                    size={isDisplay ? 12 : 10}
                    strokeWidth={2.5}
                    style={{
                      color: isActive
                        ? isDisplay
                          ? "var(--brand-volt)"
                          : "var(--fg1)"
                        : "var(--fg3)",
                    }}
                  />
                )}
                <span
                  className={`font-grotesk font-semibold uppercase ${
                    isDisplay
                      ? "text-[22px] tracking-[3px]"
                      : "text-[11px] tracking-[1.2px]"
                  }`}
                  style={{
                    color: isActive
                      ? isDisplay
                        ? "var(--brand-volt)"
                        : "var(--fg1)"
                      : isLocked
                        ? "var(--fg3)"
                        : "var(--fg2)",
                  }}
                >
                  {item.label.toUpperCase()}
                </span>
              </div>
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-[1px]"
                  style={{
                    backgroundColor: isDisplay ? "var(--brand-volt)" : "var(--fg1)",
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
