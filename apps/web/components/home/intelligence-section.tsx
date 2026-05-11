"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { PhoneFrame } from "@/components/app-ui/phone-frame"

export function IntelligenceSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-32 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-line-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line-color) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-secondary/20 blur-[150px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-5xl px-6">
        <div className="flex flex-col md:flex-row md:gap-16 md:items-center">
          {/* Left column — phone mockup */}
          <motion.div
            className="hidden md:flex flex-shrink-0 items-center justify-center"
            style={{ width: 280 }}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <PhoneFrame src="/screens/value-tracking.png" size="md" />
          </motion.div>

          {/* Right column — copy */}
          <div className="flex-1 min-w-0">
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-4">
                <SectionLabel>Comps</SectionLabel>
              </div>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight text-balance">
                <span className="text-foreground">The Sunday-night ritual,</span>
                <br />
                <span className="text-muted-foreground">minus three browser tabs.</span>
              </h2>
            </motion.div>

            <motion.div
              className="space-y-6 text-lg text-muted-foreground leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <p>
                You already do the Sunday-night check. Vitrine turns it into one view. Value tracking maps recent sales to the exact variant, condition, and authentication status you&apos;ve already cataloged.
              </p>
              <p>
                You cataloged a PSA 9 Jordan rookie. You see PSA 9 Jordan rookie comps. Not what &ldquo;Jordan cards&rdquo; are averaging.
              </p>
              <p className="text-foreground/80 border-l-2 border-border pl-5">
                If the comp data isn&apos;t there yet, you&apos;ll see that. We&apos;d rather show nothing than a guess.
              </p>
            </motion.div>

            {/* Feature bridge */}
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Link href="/features" className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <span>See how value tracking works</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
