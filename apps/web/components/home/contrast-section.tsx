"use client"

import { useScrollReveal } from "@/hooks/use-scroll-reveal"
import { SectionLabel } from "@/components/section-label"

const beforeItems = [
  "A spreadsheet built because nothing else had the right fields",
  "A camera roll full of collection photos, parking spots, and no clean way to show what you've built",
]

const afterItems = [
  "Dynamic fields per subcategory — a game-worn jersey needs different documentation than a sealed box",
  "Showcases that present your pieces the way you'd actually show them — shareable with a link",
]

export function ContrastSection() {
  const { ref, isVisible } = useScrollReveal({ threshold: 0.2 })

  return (
    <section
      ref={ref}
      className="relative overflow-hidden px-4 md:px-6 py-20 md:py-32 bg-gradient-to-b from-background via-secondary/20 to-background"
    >
      {/* Background effects */}
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full bg-secondary/30 blur-[150px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Header */}
        <div
          className={`mb-12 md:mb-16 transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="mb-4">
            <SectionLabel>The status quo</SectionLabel>
          </div>
          <h2 className="text-3xl font-bold text-foreground md:text-5xl lg:text-6xl leading-tight mb-8">
            You already built the system.
            <br />
            <span className="text-muted-foreground">It just isn&apos;t one.</span>
          </h2>
          <div className="max-w-3xl space-y-4 text-lg text-muted-foreground leading-relaxed">
            <p>
              A spreadsheet with too many tabs. Three apps you stopped opening. A camera roll where grails sit next to parking photos. A Sunday-night comp check across browser tabs.
            </p>
            <p>
              It works. Until you want one place that actually does the whole job.
            </p>
          </div>
        </div>

        {/* Comparison labels */}
        <div
          className={`flex flex-col sm:flex-row gap-4 sm:gap-8 mb-10 md:mb-12 transition-all duration-700 delay-100 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border w-fit">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/60" />
            <span className="text-sm text-muted-foreground">What you built to cope</span>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-secondary w-fit">
            <span className="w-2 h-2 rounded-full bg-foreground" />
            <span className="text-sm text-foreground font-medium">What it looks like when the tool is right</span>
          </div>
        </div>

        {/* Comparison grid */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {beforeItems.map((item, index) => (
            <div key={`before-${index}`} className="contents">
              <div
                className={`px-5 py-4 rounded-2xl bg-muted/30 border border-border transition-all duration-500 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${200 + index * 100}ms` }}
              >
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">{item}</p>
              </div>
              <div
                className={`px-5 py-4 rounded-2xl bg-secondary transition-all duration-500 ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${250 + index * 100}ms` }}
              >
                <p className="text-base md:text-lg text-foreground leading-relaxed">{afterItems[index]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
