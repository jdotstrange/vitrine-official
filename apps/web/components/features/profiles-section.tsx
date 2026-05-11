"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { PhoneFrame } from "@/components/app-ui/phone-frame"

export function ProfilesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-24 md:py-32"
    >
      <div className="absolute inset-0 bg-background" />
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-secondary/30 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Header — full width */}
        <motion.div
          className="mb-16 md:mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4">
            <SectionLabel>Your profile</SectionLabel>
          </div>
          <h2 className="text-3xl font-bold md:text-5xl lg:text-6xl leading-tight mb-8 text-balance">
            <span className="text-foreground">A collector&apos;s profile should look like a collection. </span>
            <span className="text-muted-foreground">Not a social feed.</span>
          </h2>
        </motion.div>

        {/* Description with floating phone */}
        <div className="relative">
          {/* Floating phone — right side, hanging past text */}
          <motion.div
            className="hidden md:block absolute right-0 -top-4 z-10"
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <PhoneFrame size="sm" label="Collector profile" />
          </motion.div>

          {/* Copy — wraps around the phone */}
          <motion.div
            className="max-w-xl space-y-6 text-lg text-muted-foreground leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <p>
              Your Vitrine profile is your collection&nbsp;&mdash; organized, presented, and shareable. Other collectors encounter your showcases, your categories, and your depth before they encounter a bio.
            </p>
            <p>
              Your catalog, your showcases, your collecting history&nbsp;&mdash; visible and curated. One URL that functions as your collector identity anywhere you share it: forum signatures, social bios, DMs.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
