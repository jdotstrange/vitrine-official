"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { Check } from "lucide-react"

const features = [
  "Dynamic fields per subcategory across all categories",
  "Gallery-quality showcases \u2014 unlimited, public or private",
  "Tracking with intent tags and alerts",
  "Consolidated value tracking from comp sources",
  "Collector profiles where the collection is the identity",
  "Community groups and direct messaging",
  "Cross-platform \u2014 iOS and Android",
]

export function TierSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })

  return (
    <section ref={sectionRef} className="relative py-16 md:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />

      <div className="relative z-10 max-w-2xl mx-auto px-6">
        <motion.div
          className="rounded-2xl border border-primary/20 bg-card p-8 md:p-10"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Vitrine</h2>
            <span className="text-2xl md:text-3xl font-bold text-primary">Free</span>
          </div>

          <p className="text-muted-foreground mb-8">Everything. No gates.</p>

          <div className="space-y-3 mb-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
              >
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-foreground">{feature}</span>
              </motion.div>
            ))}
          </div>

          <div className="pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              No credit card required. No item limits. No expiration.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
