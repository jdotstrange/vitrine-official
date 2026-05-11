"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { PhoneFrame } from "@/components/app-ui/phone-frame"
import { Search, BarChart3, Clock, AlertCircle } from "lucide-react"

const trackingFeatures = [
  {
    icon: Search,
    text: "Consolidated comps from multiple sources — no more cross-referencing manually",
  },
  {
    icon: BarChart3,
    text: "Matched to your specific variant, condition, and authentication — not category averages",
  },
  {
    icon: Clock,
    text: "Price movement over time on pieces you're watching",
  },
  {
    icon: AlertCircle,
    text: "Honest gaps where data is insufficient — never a fabricated estimate",
  },
]

export function TrackingSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-24 md:py-32"
    >
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
        <div className="absolute left-1/4 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/20 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="flex flex-col md:flex-row md:gap-16 md:items-center">
          {/* Left column — copy */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="mb-10"
            >
              <div className="mb-4">
                <SectionLabel>Comps</SectionLabel>
              </div>
              <h2 className="text-3xl font-bold md:text-5xl lg:text-6xl leading-tight mb-8 text-balance">
                <span className="text-foreground">Three browser tabs, one Sunday night, </span>
                <span className="text-muted-foreground">zero reasons to keep doing it.</span>
              </h2>
            </motion.div>

            <motion.div
              className="max-w-2xl space-y-6 text-lg text-muted-foreground leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <p>
                Vitrine consolidates comp sources and maps recent sales to your specific variant, condition, and authentication status. A PSA 9 Jordan rookie shows PSA 9 Jordan rookie comps — not what &ldquo;Jordan cards&rdquo; are averaging.
              </p>
              <p>
                If a piece doesn&apos;t have enough comp data, you see that. Not a guess. Not &ldquo;similar items.&rdquo; Nothing — because nothing is more honest than a number that isn&apos;t real.
              </p>
            </motion.div>
          </div>

          {/* Right column — overlapping phone pair */}
          <motion.div
            className="hidden md:block relative flex-shrink-0"
            style={{ width: 340, height: 520 }}
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <motion.div
              className="absolute"
              style={{ left: 0, top: 50, zIndex: 1 }}
              initial={{ opacity: 0, x: -20, y: 20 }}
              animate={isInView ? { opacity: 0.85, x: 0, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              <PhoneFrame size="sm" label="Comp results" />
            </motion.div>

            <motion.div
              className="absolute"
              style={{ left: 100, top: 0, zIndex: 2 }}
              initial={{ opacity: 0, x: 20, y: 20 }}
              animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <PhoneFrame size="sm" label="Price history" />
            </motion.div>
          </motion.div>
        </div>
      </div>

    </section>
  )
}

export function TrackingFeaturesGrid() {
  return (
    <section className="relative py-12 md:py-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="grid sm:grid-cols-2 gap-4">
          {trackingFeatures.map((feature) => (
            <motion.div
              key={feature.text}
              className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <feature.icon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-muted-foreground">{feature.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
