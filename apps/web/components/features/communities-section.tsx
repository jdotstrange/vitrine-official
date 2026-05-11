"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { PhoneFrame } from "@/components/app-ui/phone-frame"

export function CommunitiesSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-24 md:py-32"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-line-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line-color) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[400px] rounded-full bg-secondary/20 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="mb-16 md:mb-20 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4 flex justify-center">
            <SectionLabel>Community</SectionLabel>
          </div>
          <h2 className="text-3xl font-bold md:text-5xl lg:text-6xl leading-tight mb-8 text-balance">
            <span className="text-foreground">Your collection is your identity here. </span>
            <span className="text-muted-foreground">Not your comment history. Not a social feed.</span>
          </h2>
        </motion.div>

        {/* Triple fan phone arrangement */}
        <motion.div
          className="relative mb-20 flex items-end justify-center"
          style={{ height: 520, width: "100%" }}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.7 }}
        >
          {/* Left phone — tilted */}
          <motion.div
            className="absolute hidden sm:block"
            style={{ left: "calc(50% - 260px)", bottom: 0, zIndex: 1 }}
            initial={{ opacity: 0, y: 40, rotate: -8 }}
            animate={isInView ? { opacity: 1, y: 0, rotate: -8 } : {}}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <PhoneFrame size="sm" label="Group chat" />
          </motion.div>

          {/* Center phone */}
          <motion.div
            className="relative"
            style={{ zIndex: 3 }}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <PhoneFrame size="md" label="Community feed" />
          </motion.div>

          {/* Right phone — tilted */}
          <motion.div
            className="absolute hidden sm:block"
            style={{ right: "calc(50% - 260px)", bottom: 0, zIndex: 2 }}
            initial={{ opacity: 0, y: 40, rotate: 8 }}
            animate={isInView ? { opacity: 1, y: 0, rotate: 8 } : {}}
            transition={{ delay: 0.4, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <PhoneFrame size="sm" label="Browse groups" />
          </motion.div>
        </motion.div>

        {/* Body — consolidated community + profiles */}
        <motion.div
          className="max-w-3xl mx-auto space-y-6 text-lg text-muted-foreground leading-relaxed text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <p>
            In most collecting communities, you&apos;re known by your posts. In Vitrine, you&apos;re known by your collection — your showcases, your categories, your depth. That&apos;s the profile.
          </p>
          <p>
            Join groups organized around what you collect. Browse by category or interest. Attach items and showcases directly into the conversation. Public groups are open. Private groups stay tighter.
          </p>
          <p>
            It complements the places you already participate by adding one thing they don&apos;t: the collection itself in every interaction.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
