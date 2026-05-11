"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { PhoneFrame } from "@/components/app-ui/phone-frame"
import { User, Layers, Package } from "lucide-react"

const sharingLevels = [
  {
    icon: User,
    title: "Profile",
    description:
      "Your full collector identity in one URL. Bio, forum signature, email — one link.",
  },
  {
    icon: Layers,
    title: "Showcase",
    description:
      "A curated view of a specific slice. Shareable anywhere. No account required to view.",
  },
  {
    icon: Package,
    title: "Individual item",
    description:
      "The piece itself — photos, details, status. When someone asks for a closer look, this is the link.",
  },
]

export function SharingSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-24 md:py-32"
    >
      <div className="absolute inset-0 bg-background" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] rounded-full bg-secondary/30 blur-[150px] pointer-events-none" />

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
                <SectionLabel>Sharing</SectionLabel>
              </div>
              <h2 className="text-3xl font-bold text-foreground md:text-5xl lg:text-6xl leading-tight mb-8">
                One link to your collection.
                <br />
                <span className="text-muted-foreground">One link to any piece in it.</span>
              </h2>
            </motion.div>

            <motion.p
              className="max-w-2xl text-lg text-muted-foreground leading-relaxed mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              Every level of your Vitrine presence has a shareable URL. Drop it in a forum post, a Facebook Group reply, or a DM. Your collection travels as a link, not a screenshot.
            </motion.p>

            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {sharingLevels.map((level) => (
                <div
                  key={level.title}
                  className="flex items-start gap-4 p-5 rounded-2xl border border-border bg-card hover:border-muted-foreground/20 transition-colors"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                    <level.icon className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">{level.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{level.description}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right column — single phone */}
          <motion.div
            className="hidden md:flex items-center justify-center flex-shrink-0"
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <PhoneFrame size="md" label="Share preview" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
