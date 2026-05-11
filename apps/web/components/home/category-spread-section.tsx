"use client"

import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useScrollReveal } from "@/hooks/use-scroll-reveal"
import { SectionLabel } from "@/components/section-label"
import type { CategoryType } from "@/lib/category-data"

const PREVIEW_COUNT = 3

const CARD_PALETTES = [
  // Mint (primary)
  {
    bg: "rgba(211, 255, 195, 0.18)",
    border: "rgba(211, 255, 195, 0.45)",
    hoverBorder: "rgba(211, 255, 195, 0.7)",
    accent: "#D3FFC3",
    chipBg: "rgba(211, 255, 195, 0.30)",
    chipBorder: "rgba(211, 255, 195, 0.50)",
    shadow: "rgba(211, 255, 195, 0.12)",
    toggleColor: "var(--attention)",
  },
  // Trade blue (status-trade)
  {
    bg: "rgba(107, 158, 181, 0.10)",
    border: "rgba(107, 158, 181, 0.30)",
    hoverBorder: "rgba(107, 158, 181, 0.50)",
    accent: "#6B9EB5",
    chipBg: "rgba(107, 158, 181, 0.14)",
    chipBorder: "rgba(107, 158, 181, 0.30)",
    shadow: "rgba(107, 158, 181, 0.10)",
    toggleColor: "#4A7F94",
  },
  // Sand (accent)
  {
    bg: "rgba(231, 213, 186, 0.18)",
    border: "rgba(231, 213, 186, 0.45)",
    hoverBorder: "rgba(231, 213, 186, 0.7)",
    accent: "#E7D5BA",
    chipBg: "rgba(231, 213, 186, 0.30)",
    chipBorder: "rgba(231, 213, 186, 0.50)",
    shadow: "rgba(231, 213, 186, 0.12)",
    toggleColor: "#8B7A5F",
  },
  // Sale rose (status-sale)
  {
    bg: "rgba(196, 120, 120, 0.08)",
    border: "rgba(196, 120, 120, 0.25)",
    hoverBorder: "rgba(196, 120, 120, 0.45)",
    accent: "#C47878",
    chipBg: "rgba(196, 120, 120, 0.12)",
    chipBorder: "rgba(196, 120, 120, 0.25)",
    shadow: "rgba(196, 120, 120, 0.10)",
    toggleColor: "#A85E5E",
  },
  // Sage (secondary)
  {
    bg: "rgba(234, 239, 222, 0.30)",
    border: "rgba(234, 239, 222, 0.55)",
    hoverBorder: "rgba(234, 239, 222, 0.8)",
    accent: "#EAEFDE",
    chipBg: "rgba(234, 239, 222, 0.45)",
    chipBorder: "rgba(234, 239, 222, 0.60)",
    shadow: "rgba(234, 239, 222, 0.15)",
    toggleColor: "var(--attention)",
  },
  // Sell-trade amber (status-sell-trade)
  {
    bg: "rgba(196, 155, 90, 0.08)",
    border: "rgba(196, 155, 90, 0.25)",
    hoverBorder: "rgba(196, 155, 90, 0.45)",
    accent: "#C49B5A",
    chipBg: "rgba(196, 155, 90, 0.12)",
    chipBorder: "rgba(196, 155, 90, 0.25)",
    shadow: "rgba(196, 155, 90, 0.10)",
    toggleColor: "#A6813C",
  },
  // Deep green (attention)
  {
    bg: "rgba(45, 155, 76, 0.06)",
    border: "rgba(45, 155, 76, 0.18)",
    hoverBorder: "rgba(45, 155, 76, 0.35)",
    accent: "#2D9B4C",
    chipBg: "rgba(45, 155, 76, 0.08)",
    chipBorder: "rgba(45, 155, 76, 0.20)",
    shadow: "rgba(45, 155, 76, 0.08)",
    toggleColor: "#2D9B4C",
  },
  // NFST slate (status-nfst)
  {
    bg: "rgba(122, 122, 128, 0.08)",
    border: "rgba(122, 122, 128, 0.22)",
    hoverBorder: "rgba(122, 122, 128, 0.40)",
    accent: "#7A7A80",
    chipBg: "rgba(122, 122, 128, 0.10)",
    chipBorder: "rgba(122, 122, 128, 0.22)",
    shadow: "rgba(122, 122, 128, 0.08)",
    toggleColor: "#5E5E64",
  },
]

interface Props {
  types: CategoryType[]
}

function TypeCard({ type, index, isVisible }: { type: CategoryType; index: number; isVisible: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const palette = CARD_PALETTES[index % CARD_PALETTES.length]

  const preview = type.categories.slice(0, PREVIEW_COUNT)
  const remaining = type.categories.length - PREVIEW_COUNT
  const showMore = remaining > 0
  const allCats = type.categories

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        backgroundColor: palette.bg,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: palette.border,
      }}
      whileHover={{
        borderColor: palette.hoverBorder,
        boxShadow: `0 6px 24px ${palette.shadow}`,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300"
        style={{ backgroundColor: palette.accent, opacity: expanded ? 1 : 0.5 }}
      />

      <div className="p-5 pb-4">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-foreground">{type.title}</h3>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {preview.map((cat) => (
            <span
              key={cat.id}
              className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium text-foreground"
              style={{
                backgroundColor: palette.chipBg,
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: palette.chipBorder,
              }}
            >
              {cat.title}
            </span>
          ))}

          <AnimatePresence>
            {expanded && (
              <>
                {allCats.slice(PREVIEW_COUNT).map((cat, i) => (
                  <motion.span
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.15, delay: i * 0.02 }}
                    className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium text-foreground"
                    style={{
                      backgroundColor: palette.chipBg,
                      borderWidth: 1,
                      borderStyle: "solid",
                      borderColor: palette.chipBorder,
                    }}
                  >
                    {cat.title}
                  </motion.span>
                ))}
              </>
            )}
          </AnimatePresence>

          {showMore && (
            <button
              onClick={() => setExpanded((prev) => !prev)}
              className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer"
              style={{
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: palette.hoverBorder,
                color: palette.toggleColor,
                backgroundColor: palette.chipBg,
              }}
            >
              {expanded ? "Show less" : `+${remaining} more`}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function CategorySpreadSection({ types }: Props) {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section className="relative overflow-hidden bg-background py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `
              linear-gradient(var(--grid-line-color) 1px, transparent 1px), 
              linear-gradient(90deg, var(--grid-line-color) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute left-1/4 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[150px] pointer-events-none" style={{ background: "var(--category-memorabilia-glow)" }} />
      </div>

      <div
        ref={ref}
        className={`relative z-10 mx-auto max-w-5xl px-6 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <div className="mb-4">
            <SectionLabel>Categories</SectionLabel>
          </div>
          <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl leading-tight text-balance">
            Not one category.
            <br />
            <span className="text-muted-foreground">Every category — with real depth in each.</span>
          </h2>
          <div className="max-w-3xl space-y-4 text-lg text-muted-foreground leading-relaxed">
            <p>
              Most platforms add a category by widening the same template. We add one when the fields actually hold up.
            </p>
          </div>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...types].sort((a, b) => a.title.localeCompare(b.title)).map((type, index) => (
            <TypeCard
              key={type.code}
              type={type}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>

        {/* Closing line */}
        <div className="mt-12 max-w-2xl">
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            More categories are in validation now. We don&apos;t call one live until a specialist collector signs off on the fields.
          </p>
          <Link href="/features" className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <span>See depth status by category</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
