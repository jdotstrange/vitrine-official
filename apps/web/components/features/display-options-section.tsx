"use client"

import { motion } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { Maximize2, Grid, List } from "lucide-react"

const displayModes = [
  {
    icon: Maximize2,
    label: "Spatial view",
    description: "Large cards with rich detail for appreciating each piece.",
  },
  {
    icon: Grid,
    label: "Grid view",
    description: "Compact thumbnails for browsing the full catalog.",
  },
  {
    icon: List,
    label: "List view",
    description: "Dense, scannable rows for finding something specific.",
  },
]

export function DisplayOptionsSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4">
            <SectionLabel>Display</SectionLabel>
          </div>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl leading-tight mb-6">
            Three views. <span className="text-muted-foreground">Same collection.</span>
          </h2>
        </motion.div>

        {/* Modes grid + body */}
        <motion.div
          className="grid sm:grid-cols-3 gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {displayModes.map((mode) => (
            <div
              key={mode.label}
              className="p-6 rounded-2xl border border-border bg-card hover:border-muted-foreground/20 transition-colors"
            >
              <mode.icon className="w-5 h-5 text-muted-foreground mb-4" />
              <h4 className="text-base font-medium text-foreground mb-2">{mode.label}</h4>
              <p className="text-sm text-muted-foreground">{mode.description}</p>
            </div>
          ))}
        </motion.div>

        <motion.p
          className="max-w-3xl text-lg text-muted-foreground leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          Switch by intent. Admire, browse, or search. The collection stays the same.
        </motion.p>
      </div>
    </section>
  )
}
