"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { PhoneFrame } from "@/components/app-ui/phone-frame"

const intentTags = [
  { tag: "Want to Buy", meaning: "Actively looking to acquire", bg: "var(--status-sale)", text: "#fff" },
  { tag: "Watching Price", meaning: "Monitoring for the right moment", bg: "var(--status-sell-trade)", text: "#fff" },
  { tag: "Researching", meaning: "Gathering information", bg: "var(--status-trade)", text: "#fff" },
  { tag: "Watching", meaning: "Paying attention, no specific intent", bg: "var(--status-nfst)", text: "#fff" },
]

export function WatchlistSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-24 md:py-32"
    >
      <div className="absolute inset-0 bg-background" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-secondary/30 blur-[150px] pointer-events-none" />

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
                <SectionLabel>Tracking</SectionLabel>
              </div>
              <h2 className="text-3xl font-bold text-foreground md:text-5xl lg:text-6xl leading-tight mb-8">
                The want list
                <br />
                <span className="text-muted-foreground">that actually does something.</span>
              </h2>
            </motion.div>

            <motion.div
              className="max-w-2xl space-y-6 text-lg text-muted-foreground leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <p>
                Your want list already lives across saved searches, ISO posts, and mental notes. Tracking puts it in one place and watches for you.
              </p>
              <p>
                Track any item on Vitrine, whether you own it or not. Set your intent privately. Set alerts for what matters. Price changes, status updates, availability shifts — you get the signals you asked for, not the noise you didn&apos;t.
              </p>
            </motion.div>
          </div>

          {/* Right column — single phone */}
          <motion.div
            className="hidden md:flex items-center justify-center flex-shrink-0"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <PhoneFrame size="md" label="Tracking" />
          </motion.div>
        </div>

        {/* Intent tags — full width below */}
        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {intentTags.map((item) => (
              <div
                key={item.tag}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
              >
                <div className="flex-shrink-0">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: item.bg, color: item.text }}
                  >
                    {item.tag}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{item.meaning}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
