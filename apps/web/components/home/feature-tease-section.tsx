"use client"

import { useScrollReveal } from "@/hooks/use-scroll-reveal"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { SectionLabel } from "@/components/section-label"

export function FeatureTeaseSection() {
  const { ref, isVisible } = useScrollReveal()

  const features = [
    {
      title: "Tracking",
      description:
        "Tag your intent. Want it? Watching it? Just admiring? Track any item and get alerts when something changes.",
      accent: "primary",
      preview: (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-white/40 tracking-wide">// RECENT ACTIVITY</span>
              <span className="px-1.5 py-0.5 rounded bg-primary/20 text-[8px] text-primary">3 new</span>
            </div>
          </div>
          {[
            { name: "Rolex Submariner Date...", status: "Now For Sale", color: "text-primary" },
            { name: "1986 Fleer Michael Jordan...", change: "-7.2%", color: "text-red-400" },
            { name: "Air Jordan 1 Retro High...", change: "+5.6%", color: "text-green-400" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-void-base px-3 py-2">
              <div className="w-6 h-6 rounded-full bg-white/10" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-white truncate">{item.name}</p>
                <p className={`text-[9px] ${item.color}`}>{item.status || item.change}</p>
              </div>
              <svg className="w-3 h-3 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Communities",
      description:
        "Talk shop. Share pieces. Skip the noise. Real groups for real collectors—cards, watches, memorabilia, vinyl. Find your people.",
      accent: "secondary",
      preview: (
        <div className="mt-4 rounded-xl border border-border bg-void-base p-3">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[9px] font-medium text-amber-400 flex items-center gap-1">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              OFFICIAL
            </span>
            <span className="flex items-center gap-1 text-[9px] text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <div
            className="w-full h-20 rounded-lg mb-3 bg-void-elevated"
            style={{
              backgroundImage: `url(/placeholder.svg?height=80&width=200&query=baseball cards collection display)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <p className="text-sm font-medium text-foreground">Baseball Cards HQ</p>
          <p className="text-[10px] text-muted-foreground mb-2">The ultimate hub for baseball card collect...</p>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
            <div className="flex -space-x-1.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-5 h-5 rounded-full bg-void-elevated border border-void-base" />
              ))}
            </div>
            <span>+231</span>
            <span>💬 1.8k/24h</span>
          </div>
          <button className="w-full py-2 rounded-lg bg-transparent border border-primary text-primary text-xs font-medium">
            Join
          </button>
        </div>
      ),
    },
    {
      title: "Profiles",
      description: "Reputation, stats, verification. Your credibility as a collector, visible and earned.",
      accent: "primary",
      preview: (
        <div className="mt-4 space-y-3">
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-2">
              <div
                className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary"
                style={{
                  backgroundImage: `url(/placeholder.svg?height=64&width=64&query=collector avatar cartoon style)`,
                  backgroundSize: "cover",
                }}
              />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-amber-500 text-[8px] font-bold text-black">
                ELITE
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-1">
              Alex Rivera
              <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </p>
            <p className="text-[10px] text-muted-foreground">@alexcollects</p>
          </div>
          <div className="flex justify-center gap-4 text-center">
            <div>
              <p className="text-sm font-bold text-foreground">127</p>
              <p className="text-[9px] text-muted-foreground">ITEMS</p>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">8</p>
              <p className="text-[9px] text-muted-foreground">SHOWCASES</p>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">12.4K</p>
              <p className="text-[9px] text-muted-foreground">TRACKS</p>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">$48.2K</p>
              <p className="text-[9px] text-muted-foreground">VALUE</p>
            </div>
          </div>
          <div className="relative h-2 bg-void-elevated rounded-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-[94%] bg-gradient-to-r from-primary to-green-400 rounded-full" />
          </div>
          <div className="flex justify-between text-[9px]">
            <span className="text-muted-foreground">Rank #847</span>
            <span className="text-green-400">94% REP</span>
          </div>
        </div>
      ),
    },
  ]

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-b from-void-deep via-void-base to-void-deep px-6 py-24 md:py-32"
    >
      {/* Background texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--neutral-50) 1px, transparent 1px), 
                            linear-gradient(90deg, var(--neutral-50) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div
          className={`transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          {/* Header */}
          <div className="mb-16">
            <div className="mb-4">
              <SectionLabel>And More</SectionLabel>
            </div>
            <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Everything collectors actually need.
              <span className="block text-muted-foreground">Nothing they don't.</span>
            </h2>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-border bg-void-light/50 p-6 transition-all duration-300 hover:border-primary/30 hover:bg-void-light"
                style={{
                  transitionDelay: `${i * 100}ms`,
                }}
              >
                <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                {feature.preview}
              </div>
            ))}
          </div>

          {/* CTA Link */}
          <div className="mt-12 text-center">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-lg font-medium text-primary transition-colors hover:text-primary/80"
            >
              See all features
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
