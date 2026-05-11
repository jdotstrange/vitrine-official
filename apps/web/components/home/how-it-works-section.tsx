"use client"

import { useScrollReveal } from "@/hooks/use-scroll-reveal"
import { SectionLabel } from "@/components/section-label"
import { motion } from "framer-motion"

const steps = [
  {
    number: "1",
    title: "Download Vitrine.",
    description: "Free on iOS and Android. Your first collection takes under a minute.",
    colorHex: "#3A3A38",
    tintHex: "rgba(234, 239, 222, 0.18)",
  },
  {
    number: "2",
    title: "Catalog a few pieces.",
    description: "Pick the subcategory and watch the fields change. You&apos;ll know quickly if we got it right.",
    colorHex: "#8B7A5F",
    tintHex: "rgba(231, 213, 186, 0.18)",
  },
  {
    number: "3",
    title: "Build your first showcase.",
    description: "Arrange the collection the way you&apos;d actually show it. That&apos;s usually the moment it clicks.",
    colorHex: "#3A3A38",
    tintHex: "rgba(234, 239, 222, 0.18)",
  },
]

export function HowItWorksSection() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section ref={ref} className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
      <div className="pointer-events-none absolute inset-0">
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
      </div>

      <div className="container relative mx-auto px-6 max-w-5xl">
        {/* Header */}
        <div
          className={`mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="mb-4">
            <SectionLabel>Getting started</SectionLabel>
          </div>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
            Three moves.
            <br />
            <span className="text-muted-foreground">Then you know.</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="space-y-6 md:space-y-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className={`relative rounded-2xl border border-border p-6 md:p-8 bg-card transition-all duration-500 hover:shadow-[var(--shadow-md)] ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
              style={{
                transitionDelay: `${200 + index * 150}ms`,
                background: `linear-gradient(135deg, ${step.tintHex} 0%, var(--card) 40%)`,
              }}
            >
              <div className="flex items-start gap-5">
                {/* Step number */}
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold"
                  style={{
                    backgroundColor: step.tintHex,
                    color: step.colorHex,
                  }}
                >
                  {step.number}
                </div>

                <div>
                  <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
