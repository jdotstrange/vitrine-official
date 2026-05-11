"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { Check, Clock } from "lucide-react"

const liveFeatures = [
  "Dynamic-field cataloging across multiple categories",
  "Showcases that are public, private, and shareable",
  "Value tracking from consolidated comp sources",
  "Community where the collection is the profile",
  "iOS and Android",
]

const comingFeatures = [
  { feature: "Marketplace — collector-to-collector transactions with authentication integration", timeline: "Target: 2026" },
  { feature: "Verification Hub — connections to vetted authenticators", timeline: "Target: 2026" },
]

export function TrustSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-24 md:py-32"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      <div className="pointer-events-none absolute inset-0">
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
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        {/* Header */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4">
            <SectionLabel>What&apos;s live. What&apos;s coming.</SectionLabel>
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
            <span className="text-foreground">We&apos;d rather tell you what&apos;s real</span>
            <br />
            <span className="text-muted-foreground">than let you assume.</span>
          </h2>
        </motion.div>

        {/* Two columns */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* What's live */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-attention opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-attention" />
              </span>
              <span className="label-caps text-sm text-foreground">
                Live today
              </span>
            </div>
            <div className="space-y-3">
              {liveFeatures.map((feature, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.08 }}
                >
                  <Check className="w-4 h-4 text-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground leading-relaxed">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* What's coming */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-smart-amber" />
              <span className="label-caps text-sm text-smart-amber">
                In development
              </span>
            </div>
            <div className="space-y-3">
              {comingFeatures.map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-smart-amber/15 bg-smart-amber/5 p-4"
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.5 + i * 0.08 }}
                >
                  <Clock className="w-4 h-4 text-smart-amber flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm text-foreground leading-relaxed block">{item.feature}</span>
                    <span className="text-xs text-smart-amber/70 mt-1 block">{item.timeline}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8" />
          </motion.div>
        </div>

        {/* Closing statement */}
        <motion.div
          className="mt-12 max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <p className="text-base text-muted-foreground leading-relaxed border-l-2 border-border pl-5">
            If it&apos;s live, open the app and test it. If it&apos;s coming, we&apos;ll say that plainly. No blurred line between built and planned.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
