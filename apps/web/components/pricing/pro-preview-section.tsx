"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { SectionLabel } from "@/components/section-label"

export function ProPreviewSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 })

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/10 via-background to-background" />

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4">
            <SectionLabel>What&apos;s coming</SectionLabel>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-12 text-balance">
            <span className="text-foreground">Pro is coming.</span>{" "}
            <span className="text-muted-foreground">Here&apos;s the honest version.</span>
          </h2>
        </motion.div>

        <motion.div
          className="space-y-8 text-lg md:text-xl text-muted-foreground leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <p>
            Later this year, Vitrine Pro will add deeper tools for collectors who&apos;ve already decided this is their home. Pro expands what you can do&nbsp;&mdash; it doesn&apos;t gate what you already have. Nothing in the free tier goes away.
          </p>
          <p>
            We&apos;re still building it. When it&apos;s ready, we&apos;ll tell you what it costs, what it includes, and why we think it&apos;s worth it. Until then, everything is yours.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
