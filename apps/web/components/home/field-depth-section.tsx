"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useScrollReveal } from "@/hooks/use-scroll-reveal"
import { SectionLabel } from "@/components/section-label"
import { useState } from "react"
import { MagneticButton } from "@/components/magnetic-button"
import { PhoneFrame } from "@/components/app-ui/phone-frame"
import { APP_STORE_URL } from "@/lib/constants"
import type { FieldExample } from "@/lib/category-data"

interface Props {
  fieldExamples: FieldExample[]
}

export function FieldDepthSection({ fieldExamples }: Props) {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.15 })
  const [activeExample, setActiveExample] = useState(0)

  const safeIndex = Math.min(activeExample, fieldExamples.length - 1)
  const active = fieldExamples[safeIndex]

  if (!fieldExamples.length) return null

  return (
    <section
      ref={ref}
      className="relative overflow-hidden py-24 md:py-32"
    >
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-secondary/20 blur-[150px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* Header */}
        <div
          className={`mb-16 md:mb-20 text-center transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="mb-4 flex justify-center">
            <SectionLabel>Why the fields matter</SectionLabel>
          </div>
          <h2 className="text-3xl font-bold text-foreground md:text-5xl lg:text-6xl leading-tight mb-8 text-balance">
            A jersey is not a helmet.
            <br />
            <span className="text-muted-foreground">Your inputs should know that.</span>
          </h2>
        </div>

        {/* Editorial copy */}
        <div
          className={`max-w-3xl mx-auto space-y-6 text-lg text-muted-foreground leading-relaxed text-center mb-16 transition-all duration-700 delay-100 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <p>
            Most platforms use one template for everything: name, photo, condition, value. Fine for inventory. Wrong for a serious collection.
          </p>
          <p className="text-foreground font-medium">
            Vitrine changes the fields by subcategory. That&apos;s the difference.
          </p>
        </div>

        {/* Phone trio — fan arrangement */}
        <motion.div
          className={`relative mb-16 flex items-end justify-center transition-all duration-700 delay-150 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ height: 620, width: "100%" }}
        >
          <motion.div
            className="absolute hidden sm:block"
            style={{ left: "calc(50% - 290px)", bottom: 0, zIndex: 1 }}
            initial={{ opacity: 0, y: 40, rotate: -8 }}
            animate={isVisible ? { opacity: 1, y: 0, rotate: -8 } : {}}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <PhoneFrame src="/screens/profile-view.png" size="sm" />
          </motion.div>

          <motion.div
            className="relative"
            style={{ zIndex: 3 }}
            initial={{ opacity: 0, y: 40 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <PhoneFrame src="/screens/collectible-detail.png" size="md" />
          </motion.div>

          <motion.div
            className="absolute hidden sm:block"
            style={{ right: "calc(50% - 290px)", bottom: 0, zIndex: 2 }}
            initial={{ opacity: 0, y: 40, rotate: 8 }}
            animate={isVisible ? { opacity: 1, y: 0, rotate: 8 } : {}}
            transition={{ delay: 0.4, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <PhoneFrame src="/screens/showcase-gallery.png" size="sm" />
          </motion.div>
        </motion.div>

        {/* Interactive field examples — live from DB */}
        <div
          className={`mb-16 transition-all duration-700 delay-200 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="flex flex-wrap justify-center gap-2 mb-8">
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
        </div>

        {/* CTA */}
        <div
          className={`text-center space-y-4 transition-all duration-700 delay-300 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <MagneticButton
            variant="ghost"
            size="lg"
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <span>Catalog one item. You&apos;ll know quickly.</span>
            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </MagneticButton>
          <div>
            <Link href="/features" className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <span>See how fields work across all categories</span>
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
