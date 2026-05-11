"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { SectionLabel } from "@/components/section-label"

const beliefs = [
  "Every platform in collectibles split the collector in half \u2014 passion or portfolio \u2014 and built for the half that\u2019s easier to monetize. The complete collector has never been served.",
  "Category depth is measured at the field level, not the label level. An app that says \u201cBaseball\u201d but can\u2019t distinguish a game-worn jersey from a factory-sealed box has built a label, not a category.",
  "Presentation is not cosmetic. A collection displayed as a spreadsheet row is a collection being disrespected. The way a collector\u2019s pieces are shown IS the utility.",
  "Claiming a capability that doesn\u2019t exist is the fastest way to join the collector app graveyard. This audience verifies claims within minutes and remembers permanently.",
  "Cross-category collectors are not a niche. They are the natural state of serious collecting \u2014 abandoned by an industry that found it easier to build vertically than solve the actual problem.",
]

export function BeliefsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 })

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary/10" />

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4">
            <SectionLabel>Beliefs</SectionLabel>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-16">
            <span className="text-foreground">The convictions the product is built on.</span>
          </h2>
        </motion.div>

        <div className="space-y-0">
          {beliefs.map((belief, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.1 }}
            >
              <p className="text-lg md:text-xl text-foreground leading-relaxed py-8">{belief}</p>
              {index < beliefs.length - 1 && <div className="h-px bg-border" />}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
