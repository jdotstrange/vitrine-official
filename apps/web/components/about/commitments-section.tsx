"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { SectionLabel } from "@/components/section-label"

const commitments = [
  {
    title: "Field-level depth over database breadth",
    body: "Rather than indexing millions of items with generic fields, Vitrine builds dynamic documentation that changes by subcategory \u2014 because a game-worn jersey and a factory-sealed box require completely different documentation. No category gets marketed until a specialist collector validates the taxonomy. Slower expansion. Fewer categories on the marketing page. A depth standard that\u2019s publicly visible.",
  },
  {
    title: "Gallery-quality presentation as architecture",
    body: "Every surface that displays a collector\u2019s items is held to the standard of a curated exhibition. A spreadsheet row is a form of disrespect to a piece someone spent years finding. The visual standard runs through every surface \u2014 catalog, showcases, sharing, profile.",
  },
  {
    title: "Radical, verifiable honesty",
    body: "Real metrics or no metrics. Planned features described as planned \u2014 in marketing, in investor conversations, on this page. In a category where every startup inflates to survive, this commitment costs real credibility in fundraising rooms. We made it anyway \u2014 because the alternative is joining the graveyard of platforms that lied their way in.",
  },
]

export function CommitmentsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.15 })

  return (
    <section ref={sectionRef} className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-secondary/10 via-background to-background" />
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
            <SectionLabel>What we built &mdash; and how</SectionLabel>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-16">
            <span className="text-foreground">Three commitments no competitor would make.</span>
          </h2>
        </motion.div>

        <div className="space-y-12">
          {commitments.map((item, index) => (
            <motion.div
              key={item.title}
              className="p-6 md:p-8 rounded-2xl border border-border bg-card"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 + index * 0.15 }}
            >
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-sm font-medium text-primary shrink-0">{String(index + 1).padStart(2, "0")}</span>
                <h3 className="text-xl md:text-2xl font-bold text-foreground">{item.title}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg">{item.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
