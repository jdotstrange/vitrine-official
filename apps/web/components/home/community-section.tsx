"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { PhoneFrame } from "@/components/app-ui/phone-frame"

export function CommunitySection() {
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
        <div className="absolute left-1/4 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-warm-sand/10 blur-[120px]" />
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
                <SectionLabel>Community</SectionLabel>
              </div>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
                <span className="text-foreground">Your collection is</span>
                <br />
                <span className="text-muted-foreground">your identity here.</span>
              </h2>
            </motion.div>

            <motion.div
              className="max-w-2xl space-y-6 text-lg text-muted-foreground leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <p>
                Most collecting communities know you by your posts. Vitrine lets collectors know you by the collection itself.
              </p>
              <p>
                Your showcases, categories, and depth do the introduction. Not your post count. Not your transaction history.
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
                <span>See how profiles and community work</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
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
            {/* Back phone — offset up-left */}
            <motion.div
              className="absolute"
              style={{ left: 0, top: 50, zIndex: 1 }}
              initial={{ opacity: 0, x: -20, y: 20 }}
              animate={isInView ? { opacity: 0.85, x: 0, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              <PhoneFrame src="/screens/profile-view.png" size="sm" />
            </motion.div>

            {/* Front phone — offset down-right */}
            <motion.div
              className="absolute"
              style={{ left: 100, top: 0, zIndex: 2 }}
              initial={{ opacity: 0, x: 20, y: 20 }}
              animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <PhoneFrame src="/screens/collection-pulse.png" size="sm" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
