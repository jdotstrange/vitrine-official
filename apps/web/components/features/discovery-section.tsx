"use client"

import { motion } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { PhoneFrame } from "@/components/app-ui/phone-frame"
import { BarChart3, Eye, Bell } from "lucide-react"

const commandCenterFeatures = [
  {
    icon: BarChart3,
    title: "Your collection at a glance",
    description:
      "Total value, movement this week, items cataloged, items listed — one view.",
    phoneLabel: "Collection overview",
  },
  {
    icon: Eye,
    title: "Tracking",
    description:
      "Items you're watching, with the only signals that matter: price drops, status changes, availability.",
    phoneLabel: "Tracking dashboard",
  },
  {
    icon: Bell,
    title: "Action items",
    description:
      "Offers on your listed items. Alerts you set. Surfaced, not buried in a notification you already swiped past.",
    phoneLabel: "Action items",
  },
]

export function DiscoverySection() {
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
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full bg-secondary/20 blur-[150px] pointer-events-none" />

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
            <SectionLabel>Command Center</SectionLabel>
          </div>
          <h2 className="text-3xl font-bold text-foreground md:text-5xl lg:text-6xl leading-tight mb-8 text-balance">
            <span className="text-foreground">Not a feed. </span>
            <span className="text-muted-foreground">A command center for what you collect.</span>
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
          Your home screen shows what matters now: collection status, tracked items, and action items that need a decision. No scrolling for relevance.
        </motion.p>

        {/* Feature cards */}
        <motion.div
          className="grid md:grid-cols-3 gap-5 mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          {commandCenterFeatures.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-6">
                <PhoneFrame size="sm" label={feature.phoneLabel} />
              </div>
              <div className="p-6 rounded-2xl border border-border bg-card hover:border-muted-foreground/20 transition-colors w-full">
                <feature.icon className="w-5 h-5 text-muted-foreground mb-4 mx-auto" />
                <h3 className="text-base font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Closing line */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <p className="max-w-3xl text-lg text-foreground font-medium leading-relaxed">
            <span className="bg-primary/20 decoration-clone box-decoration-clone px-1 py-0.5">A feed shows you what the platform wants you to see. A command center shows you what your collection needs you to know.</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
