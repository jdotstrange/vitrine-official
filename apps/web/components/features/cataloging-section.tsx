"use client"

import { motion } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { useState } from "react"
import type { FieldExample } from "@/lib/category-data"

interface Props {
  fieldExamples: FieldExample[]
}

export function CatalogingSection({ fieldExamples }: Props) {
  const [activeExample, setActiveExample] = useState(0)

  const safeIndex = Math.min(activeExample, fieldExamples.length - 1)
  const active = fieldExamples[safeIndex]

  if (!fieldExamples.length) return null

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-line-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line-color) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-secondary/20 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="mb-16 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4">
            <SectionLabel>Cataloging</SectionLabel>
          </div>
          <h2 className="text-3xl font-bold text-foreground md:text-5xl lg:text-6xl leading-tight mb-8">
            The fields change
            <br />
            <span className="text-muted-foreground">because the items are different.</span>
          </h2>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          className="max-w-3xl text-lg md:text-xl text-muted-foreground leading-relaxed mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Most platforms stop at the category label. Vitrine changes the documentation underneath it.
        </motion.p>

        {/* Dynamic Fields — editorial copy */}
        <motion.div
          className="max-w-3xl space-y-6 text-lg text-muted-foreground leading-relaxed mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <p>
            Pick the subcategory and the right fields surface. A game-worn jersey asks for different documentation than a sealed box because it needs different documentation. You&apos;ve been building those distinctions in spreadsheet columns for years. Here, the architecture already knows them.
          </p>
        </motion.div>

        {/* Interactive field examples — live from DB */}
        <motion.div
          className="mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-wrap gap-2 mb-8">
            {fieldExamples.map((example, i) => (
              <button
                key={example.categoryTitle}
                onClick={() => setActiveExample(i)}
                className="relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border"
                style={{
                  borderColor: safeIndex === i ? "var(--primary)" : "var(--border)",
                  color: safeIndex === i ? "var(--primary-foreground)" : "var(--muted-foreground)",
                  backgroundColor: safeIndex === i ? "var(--primary)" : "transparent",
                }}
              >
                {example.categoryTitle}
              </button>
            ))}
          </div>

          <motion.div
            key={safeIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-border p-6 md:p-8 bg-card"
          >
            <div className="flex items-center gap-2 mb-5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-attention opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-attention" />
              </span>
              <span className="label-caps text-xs text-foreground">
                {active?.categoryTitle} fields
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                {active?.fields.length} fields — live from database
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {active?.fields.map((field, i) => (
                <motion.div
                  key={field}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                  className="px-4 py-3 rounded-xl bg-secondary/50 border border-border"
                >
                  <span className="text-sm text-foreground">{field}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
