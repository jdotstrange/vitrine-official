"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { Check, Clock } from "lucide-react"

const liveItems = [
  "Collection management with dynamic fields per subcategory",
  "Gallery-quality showcases \u2014 public, private, shareable",
  "Tracking \u2014 track any item, tag your intent, get alerts when things change",
  "Collector profiles where the collection is the identity",
  "Community groups",
  "Direct messaging with item and showcase embedding",
  "Consolidated value tracking from comp sources",
  "Cross-platform \u2014 iOS, Android",
]

const inDevItems = [
  "Integrated marketplace \u2014 collector-to-collector transactions with authentication",
  "Verification Hub \u2014 connecting collectors with vetted authenticators",
]

export function RoadmapSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 })

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/10 via-background to-background" />
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
            <SectionLabel>Roadmap</SectionLabel>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-6 text-balance">
            <span className="text-foreground">Where we are and where we&apos;re headed</span>{" "}
            <span className="text-muted-foreground">&mdash; without blurring the line.</span>
          </h2>
        </motion.div>

        {/* Live */}
        <motion.div
          className="mt-16 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h3 className="text-sm font-medium uppercase tracking-wider text-primary mb-6">What&apos;s live today</h3>
          <div className="grid gap-3">
            {liveItems.map((item, index) => (
              <motion.div
                key={item}
                className="flex items-center gap-4 p-4 rounded-xl border border-primary/20 bg-primary/[0.03]"
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.15 + index * 0.05 }}
              >
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-foreground">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* In development */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-6">In development</h3>
          <div className="grid gap-3">
            {inDevItems.map((item, index) => (
              <motion.div
                key={item}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
                initial={{ opacity: 0, y: 10 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.35 + index * 0.05 }}
              >
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="font-medium text-muted-foreground">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
