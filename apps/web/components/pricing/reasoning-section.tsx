"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { SectionLabel } from "@/components/section-label"

export function ReasoningSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 })

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary/10" />
      <div
        className="absolute inset-0 opacity-[0.3] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-line-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line-color) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4">
            <SectionLabel>Why free</SectionLabel>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-12 text-balance">
            <span className="text-foreground">We haven&apos;t earned the right to charge you yet.</span>
          </h2>
        </motion.div>

        <motion.div
          className="space-y-8 text-lg md:text-xl text-muted-foreground leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <p>
            This audience has been charged by apps that died six months later. You&apos;ve hit paywalls before the product proved itself. You&apos;ve paid for &ldquo;Pro&rdquo; tiers that unlocked features that should have been in the free version.
          </p>
          <p>
            We made a decision: you&apos;ll have enough experience with Vitrine to know whether we&apos;ve earned your money before we ever ask for it. That means the full product&nbsp;&mdash; every feature, every category, every showcase&nbsp;&mdash; is free until you&apos;ve decided this is worth paying for.
          </p>
          <p className="text-foreground font-medium">
            That&apos;s not a promotion. It&apos;s a commitment.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
