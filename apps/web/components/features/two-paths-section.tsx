"use client"

import { motion } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { PhoneFrame } from "@/components/app-ui/phone-frame"

export function TwoPathsSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-secondary/30 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="mb-16 md:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4">
            <SectionLabel>Two paths in</SectionLabel>
          </div>
          <h2 className="text-3xl font-bold text-foreground md:text-5xl lg:text-6xl leading-tight mb-8">
            Two paths in.
            <br />
            <span className="text-muted-foreground">Same depth out.</span>
          </h2>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          className="max-w-3xl text-lg md:text-xl text-muted-foreground leading-relaxed mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Trading cards and one-of-a-kind memorabilia enter differently. Both end in the same place: field-level documentation and presentation that actually holds up.
        </motion.p>

        {/* Two-path grid */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 mb-20">
          {/* Trading Cards */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="flex justify-center">
              <PhoneFrame size="sm" label="Card scanning" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-3">Trading Cards</h3>
              <p className="text-muted-foreground leading-relaxed">
                Point your camera at a card. Vitrine identifies the set, year, player, and variant, then fills the fields. Grading info and comps map in from there.
              </p>
            </div>
          </motion.div>

          {/* Memorabilia */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.25 }}
          >
            <div className="flex justify-center">
              <PhoneFrame size="sm" label="Memorabilia cataloging" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-3">Memorabilia and one-of-a-kind items</h3>
              <p className="text-muted-foreground leading-relaxed">
                Start with title, photos, and status. The subcategory-specific fields surface from there: provenance, authentication, wear documentation, game attribution, and condition specifics. As deep as the piece requires.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Closing line */}
        <motion.p
          className="max-w-3xl text-lg text-foreground font-medium leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span className="bg-primary/20 decoration-clone box-decoration-clone px-1 py-0.5">Two entry points. One documentation standard. The faster path gets you in. The manual path goes deeper. The output quality stays the same.</span>
        </motion.p>
      </div>
    </section>
  )
}
