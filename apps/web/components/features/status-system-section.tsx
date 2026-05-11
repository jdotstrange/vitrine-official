"use client"

import { motion } from "framer-motion"
import { SectionLabel } from "@/components/section-label"

const statuses = [
  {
    status: "NFST",
    meaning: "Not for sale or trade. Displaying only.",
    color: "bg-muted-foreground/10 text-muted-foreground border-border",
  },
  {
    status: "FOR SALE",
    meaning: "Actively selling.",
    color: "bg-attention/10 text-attention border-attention/20",
  },
  {
    status: "FOR TRADE",
    meaning: "Open to trade offers.",
    color: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  },
  {
    status: "SELL + TRADE",
    meaning: "Open to selling or trading.",
    color: "bg-secondary text-foreground border-border",
  },
]

export function StatusSystemSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
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
            <SectionLabel>Status</SectionLabel>
          </div>
          <h2 className="text-3xl font-bold text-foreground md:text-5xl lg:text-6xl leading-tight mb-8">
            What your collection says
            <br />
            <span className="text-muted-foreground">when you&apos;re not in the conversation.</span>
          </h2>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          className="max-w-3xl text-lg md:text-xl text-muted-foreground leading-relaxed mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Every item in your catalog carries a visible status. No ambiguity about what&apos;s available and what isn&apos;t.
        </motion.p>

        {/* Status grid */}
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          {statuses.map((item) => (
            <div
              key={item.status}
              className="p-5 rounded-2xl border bg-card text-center"
            >
              <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 border ${item.color}`}>
                {item.status}
              </div>
              <p className="text-sm text-muted-foreground">{item.meaning}</p>
            </div>
          ))}
        </motion.div>

        {/* Body */}
        <motion.p
          className="max-w-3xl text-lg text-muted-foreground leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Status removes the guesswork. A collector viewing your showcase knows what&apos;s available before the message ever starts.
        </motion.p>
      </div>
    </section>
  )
}
