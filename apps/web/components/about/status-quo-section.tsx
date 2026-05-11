"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { SectionLabel } from "@/components/section-label"

export function StatusQuoSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/10 to-background" />
      <div
        className="absolute inset-0 opacity-[0.3] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(var(--grid-line-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line-color) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-4">
            <SectionLabel>Origin</SectionLabel>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-12 text-balance">
            <span className="text-foreground">Every tool in collectibles was built from the wrong starting point.</span>{" "}
            <span className="text-muted-foreground">Not the wrong technology. The wrong understanding.</span>
          </h2>
        </motion.div>

        <div className="space-y-8 text-lg md:text-xl text-muted-foreground leading-relaxed">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Some started with a database and bolted collecting onto it. Some started with a marketplace and treated the collection as transaction history. Some started with a portfolio model and saw every piece as a ticker symbol. Each competent in their domain. None started from how a serious collector actually thinks, documents, values, and presents what they own.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            The result is a collector base managing their most significant pursuit across jury-rigged systems&nbsp;&mdash; spreadsheets with custom formulas, camera rolls that are half archive and half chaos, Facebook Groups where half the posts are scam accounts, and an average of two or three abandoned apps that each promised everything and delivered a generic database.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Vitrine was created to be the first platform that started from the collector&apos;s actual workflow&nbsp;&mdash; the Sunday comp check, the subcategory-specific documentation, the desire to present pieces the way they exist in the collector&apos;s head&nbsp;&mdash; and built every layer of architecture to serve it. Not a database with a collecting skin. Not a marketplace bolting on inventory. A collector-native environment from the data model up.
          </motion.p>
        </div>
      </div>
    </section>
  )
}
