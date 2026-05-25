/**
 * TraitPill — inline glass chip for collectible trait
 * (Rookie / Signed / Game Used / Graded).
 *
 * Mirrors apps/native/components/vault/trait-pill.tsx exactly.
 * Same geometry as StatusPill — single material language.
 */

import { getTraitChrome } from "@/lib/design"

// Trait chrome colors are still raw rgba/hex from @vitrine/design-tokens
// (same source native uses); web composites them as inline styles.

interface TraitPillProps {
  traitKey: string
  className?: string
}

export function TraitPill({ traitKey, className }: TraitPillProps) {
  const chrome = getTraitChrome(traitKey)
  if (!chrome) return null

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border px-2.5 py-[3px] text-[10px] font-grotesk font-semibold uppercase tracking-[1px] leading-[13px] ${className ?? ""}`}
      style={{
        backgroundColor: chrome.fill,
        borderColor: chrome.border,
        color: chrome.text,
        borderWidth: "1px",
      }}
    >
      {chrome.label.toUpperCase()}
    </span>
  )
}
