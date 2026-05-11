"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { useScrollReveal } from "@/hooks/use-scroll-reveal"
import { SectionLabel } from "@/components/section-label"
import { PhoneFrame } from "@/components/app-ui/phone-frame"
import { Check } from "lucide-react"

const featureDetails = [
  "Unlimited showcases — public or private",
  "Arrange by category, era, or story",
  "Share one link that actually looks like your collection",
]

export function ShowcaseSection() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section className="relative overflow-hidden bg-background py-24 md:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
        <div
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `
              linear-gradient(var(--grid-line-color) 1px, transparent 1px), 
              linear-gradient(90deg, var(--grid-line-color) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/20 blur-[120px]" />
      </div>

      <div
        ref={ref}
        className={`relative z-10 mx-auto max-w-5xl px-6 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="flex flex-col md:flex-row md:gap-16 md:items-center">
          {/* Left column — copy + features */}
          <div className="flex-1 min-w-0">
            <motion.div
              className="mb-10"
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
            >
              <SectionLabel className="mb-4">Showcases</SectionLabel>
              <h2 className="mb-8 text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl leading-tight text-balance">
                <span className="text-foreground">Your pieces, presented the way</span>
                <br />
                <span className="text-muted-foreground">they look in your head.</span>
              </h2>
              <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
                Most tools can store a collection. Very few can present one. Showcases let you arrange, group, and share your pieces the way you&apos;d actually walk someone through them.
              </p>
            </motion.div>

            {/* Feature details */}
            <div className="space-y-3 mb-8">
              {featureDetails.map((detail, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-foreground/10 hover:shadow-[var(--shadow-md)]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isVisible ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </span>
                  <span className="text-base text-muted-foreground leading-relaxed">{detail}</span>
                </motion.div>
              ))}
            </div>

            {/* Feature bridge */}
            <Link href="/features" className="group inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <span>See what a showcase looks like</span>
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Right column — phone mockup */}
          <motion.div
            className="hidden md:flex flex-shrink-0 items-center justify-center"
            style={{ width: 280 }}
            initial={{ opacity: 0, x: 30 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <PhoneFrame src="/screens/showcase-view.png" size="md" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
