"use client"

import { useRef } from "react"
import { motion, useInView } from "framer-motion"
import { SectionLabel } from "@/components/section-label"
import { PhoneFrame } from "@/components/app-ui/phone-frame"

export function MessagingSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-24 md:py-32"
    >
      <div className="absolute inset-0 bg-background" />
      <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-secondary/30 blur-[150px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="flex flex-col md:flex-row md:gap-16 md:items-center">
          {/* Left column — overlapping phone pair */}
          <motion.div
            className="hidden md:block relative flex-shrink-0"
            style={{ width: 340, height: 520 }}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <motion.div
              className="absolute"
              style={{ left: 0, top: 50, zIndex: 1 }}
              initial={{ opacity: 0, x: -20, y: 20 }}
              animate={isInView ? { opacity: 0.85, x: 0, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              <PhoneFrame size="sm" label="Conversation" />
            </motion.div>

            <motion.div
              className="absolute"
              style={{ left: 100, top: 0, zIndex: 2 }}
              initial={{ opacity: 0, x: 20, y: 20 }}
              animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              <PhoneFrame size="sm" label="Item attachment" />
            </motion.div>
          </motion.div>

          {/* Right column — copy */}
          <div className="flex-1 min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="mb-10"
            >
              <div className="mb-4">
                <SectionLabel>Messaging</SectionLabel>
              </div>
              <h2 className="text-3xl font-bold text-foreground md:text-5xl lg:text-6xl leading-tight mb-8 text-balance">
                Conversations with the collection{" "}
                <span className="text-muted-foreground">already in the room.</span>
              </h2>
            </motion.div>

            <motion.div
              className="max-w-2xl space-y-6 text-lg text-muted-foreground leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <p>
                When you message another collector on Vitrine, the collection is already the context. Attach any item or showcase directly to the message — the actual catalog entry, not a screenshot. See something in a showcase, message the owner directly.
              </p>
              <p>
                Conversations live beside the items they&apos;re about. The piece you&apos;re discussing renders inline with the full details, because the conversation and the catalog live in the same environment.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
