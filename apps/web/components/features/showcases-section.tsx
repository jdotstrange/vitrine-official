"use client"

import { motion } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { PhoneFrame } from "@/components/app-ui/phone-frame"
import { Settings, Layers, Link2, ArrowUpRight } from "lucide-react"

const features = [
  {
    icon: Settings,
    title: "Manual or smart",
    description: "Hand-curated or auto-filtered. Both hold up.",
  },
  {
    icon: Layers,
    title: "Public or private",
    description: "Your call on every showcase",
  },
  {
    icon: Link2,
    title: "Shareable links",
    description: "Anyone can view, no account required",
  },
  {
    icon: ArrowUpRight,
    title: "Custom ordering",
    description: "Arrange pieces in the order that tells the story",
  },
]

export function ShowcasesSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-secondary/30 blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:gap-16 md:items-start">
          {/* Left column — copy + features */}
          <div className="flex-1 min-w-0">
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-4">
                <SectionLabel>Showcases</SectionLabel>
              </div>
              <h2 className="text-3xl font-bold text-foreground md:text-5xl lg:text-6xl leading-tight mb-8">
                Your pieces, the way
                <br />
                <span className="text-muted-foreground">they look in your head.</span>
              </h2>
            </motion.div>

            <motion.p
              className="max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              A thumbnail grid misses the point of a serious collection. Showcases present your pieces the way you&apos;d actually walk someone through them.
            </motion.p>

            <motion.p
              className="max-w-2xl text-lg text-muted-foreground leading-relaxed mb-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              Build as many as you want. Organize by category, era, or story. Set them public or private. Share one link that shows your curation instead of a marketplace thumbnail. Manual showcases let you hand-pick every piece. Smart showcases update as the catalog grows.
            </motion.p>

            {/* Feature details grid */}
            <motion.div
              className="grid sm:grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="p-5 rounded-2xl border border-border bg-card hover:border-muted-foreground/20 transition-colors"
                >
                  <feature.icon className="w-5 h-5 text-muted-foreground mb-3" />
                  <h4 className="text-sm font-medium text-foreground mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right column — overlapping phone pair */}
          <motion.div
            className="hidden md:block relative flex-shrink-0"
            style={{ width: 340, height: 520 }}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <motion.div
              className="absolute"
              style={{ left: 0, top: 50, zIndex: 1 }}
              initial={{ opacity: 0, x: -20, y: 20 }}
              whileInView={{ opacity: 0.85, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              <PhoneFrame size="sm" label="Showcase gallery" />
            </motion.div>

            <motion.div
              className="absolute"
              style={{ left: 100, top: 0, zIndex: 2 }}
              initial={{ opacity: 0, x: 20, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <PhoneFrame size="sm" label="Showcase detail" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
