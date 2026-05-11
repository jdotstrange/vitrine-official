"use client"

import { motion } from "framer-motion"
import { SectionLabel } from "@/components/section-label"

export function PricingHero() {
  return (
    <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-background to-background" />
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
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-secondary/20 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          className="flex justify-center mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <SectionLabel>Pricing</SectionLabel>
        </motion.div>

        <motion.h1
          className="text-4xl md:text-5xl lg:text-7xl font-bold mb-8 leading-tight text-balance"
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <span className="text-foreground">Free. No catch.</span>
          <br />
          <span className="text-muted-foreground">No, seriously.</span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        >
          Everything in Vitrine&nbsp;&mdash; catalog, showcases, tracking, comps, community&nbsp;&mdash; is free. No credit card. No item limits. No trial that expires in 14 days.
        </motion.p>
      </div>
    </section>
  )
}
