"use client"

import { motion } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { CheckCircle2, Clock } from "lucide-react"

const inDevelopment = [
  "Marketplace — collector-to-collector transactions with authentication integration",
  "Verification Hub — connecting collectors with vetted authenticators",
]

export function RoadmapSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-secondary/30 blur-[150px] pointer-events-none" />

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
            <SectionLabel>Honest roadmap</SectionLabel>
          </div>
          <h2 className="text-3xl font-bold text-foreground md:text-5xl lg:text-6xl leading-tight mb-8">
            Every feature on this page is live.
            <br />
            <span className="text-muted-foreground">Here&apos;s what&apos;s next.</span>
          </h2>
        </motion.div>

        {/* Body */}
        <motion.p
          className="max-w-3xl text-lg text-muted-foreground leading-relaxed mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Everything above is in the app today. The features below are in development, with honest timelines.
        </motion.p>

        {/* Live indicator */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-attention/10 border border-attention/20">
            <CheckCircle2 className="w-4 h-4 text-attention" />
            <span className="text-sm font-medium text-foreground">All features above &mdash; live today</span>
          </div>
        </motion.div>

        {/* In development */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h3 className="text-xl font-bold text-foreground mb-6">In development</h3>
          <div className="space-y-3">
            {inDevelopment.map((item) => (
              <div
                key={item}
                className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card"
              >
                <Clock className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Closing line */}
        <motion.p
          className="max-w-3xl text-lg text-muted-foreground leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          If it&apos;s described as live on this page, open the app and verify. If it&apos;s listed as coming, that&apos;s where it is. Better a hard line than a soft promise.
        </motion.p>
      </div>
    </section>
  )
}
