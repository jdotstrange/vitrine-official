"use client"

import type React from "react"

import { useState } from "react"
import { useScrollReveal } from "@/hooks/use-scroll-reveal"
import { SectionLabel } from "@/components/section-label"

// Phone mock component for this section
function PhoneMock({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto w-full max-w-[280px] ${className}`}>
      {/* Phone frame */}
      <div className="relative overflow-hidden rounded-[2.5rem] border-[3px] border-neutral-40/60 bg-void-base">
        {/* Dynamic Island */}
        <div className="absolute left-1/2 top-3 z-20 h-7 w-24 -translate-x-1/2 rounded-full bg-black" />

        {/* Status bar */}
        <div className="relative z-10 flex items-center justify-between px-8 pb-2 pt-12">
          <span className="font-mono text-xs text-muted-foreground">9:41</span>
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
            <div className="h-2 w-4 rounded-sm bg-muted-foreground/50" />
          </div>
        </div>

        {/* Screen content */}
        <div className="relative bg-void-deep px-4 pb-8">{children}</div>

        {/* Home indicator */}
        <div className="flex justify-center pb-2 pt-4">
          <div className="h-1 w-32 rounded-full bg-neutral-50" />
        </div>
      </div>
    </div>
  )
}

// Cards flow UI mock
function CardsFlowMock() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Add Card</h3>
        <div className="h-6 w-6 rounded-full bg-primary/20" />
      </div>

      {/* Scan prompt */}
      <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
          <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-xs text-primary">Scan your card</p>
        <p className="mt-1 text-xs text-muted-foreground">Auto-detect set & variant</p>
      </div>

      {/* Recent scans */}
      <div>
        <p className="mb-2 text-xs text-muted-foreground">Recently Added</p>
        <div className="space-y-2">
          {[
            { name: "Pikachu VMAX", set: "Vivid Voltage", grade: "PSA 10" },
            { name: "Jordan Rookie", set: "1986 Fleer", grade: "BGS 9.5" },
          ].map((card, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg bg-void-elevated p-2">
              <div className="h-10 w-8 rounded bg-gradient-to-br from-primary/20 to-secondary/20" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-foreground">{card.name}</p>
                <p className="text-xs text-muted-foreground">{card.set}</p>
              </div>
              <span className="rounded bg-primary/20 px-2 py-0.5 text-xs text-primary">{card.grade}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Memorabilia flow UI mock
function MemoFlowMock() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Add Item</h3>
        <div className="h-6 w-6 rounded-full bg-secondary/20" />
      </div>

      {/* Photo upload */}
      <div className="grid grid-cols-3 gap-2">
        <div className="aspect-square rounded-lg bg-gradient-to-br from-secondary/20 to-primary/10" />
        <div className="aspect-square rounded-lg bg-gradient-to-br from-secondary/15 to-primary/5" />
        <div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-neutral-40">
          <svg className="h-5 w-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </div>

      {/* Custom fields */}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Item Description</label>
          <div className="rounded-lg bg-void-elevated px-3 py-2">
            <span className="text-xs text-foreground">Michael Jordan Signed Jersey</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Authentication</label>
            <div className="rounded-lg bg-void-elevated px-3 py-2">
              <span className="text-xs text-foreground">JSA</span>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Year</label>
            <div className="rounded-lg bg-void-elevated px-3 py-2">
              <span className="text-xs text-foreground">1996</span>
            </div>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Provenance Notes</label>
          <div className="rounded-lg bg-void-elevated px-3 py-2">
            <span className="text-xs text-muted-foreground">Add history & documentation...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function TwoBranchesSection() {
  const { ref, isVisible } = useScrollReveal()
  const [activeTab, setActiveTab] = useState<"cards" | "memo">("cards")

  return (
    <section className="relative overflow-hidden bg-void-deep py-24 md:py-32">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-void-deep via-void-base to-void-deep" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--neutral-50) 1px, transparent 1px), 
                              linear-gradient(90deg, var(--neutral-50) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Split glow - dual cyan */}
        <div className="absolute left-1/4 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-glow/5 blur-[100px]" />
        <div className="absolute right-1/4 top-1/2 h-[400px] w-[400px] -translate-y-1/2 translate-x-1/2 rounded-full bg-cyan-bright/5 blur-[100px]" />
      </div>

      <div
        ref={ref}
        className={`relative z-10 mx-auto max-w-6xl px-6 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Header */}
        <div className="mb-12 text-center md:mb-16">
          <div className="flex justify-center mb-4">
            <SectionLabel>Purpose Built</SectionLabel>
          </div>
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Two branches.
            <br />
            <span className="text-muted-foreground">One ecosystem.</span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Cards and memorabilia need different things. We built for both.
          </p>
        </div>

        {/* Tab toggle - mobile */}
        <div className="mb-8 flex justify-center md:hidden">
          <div className="inline-flex rounded-full border border-neutral-40 bg-void-elevated p-1">
            <button
              onClick={() => setActiveTab("cards")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                activeTab === "cards"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setActiveTab("memo")}
              className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                activeTab === "memo"
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Memorabilia
            </button>
          </div>
        </div>

        {/* Phone mocks - side by side on desktop, tabbed on mobile */}
        <div className="relative">
          {/* Desktop: both visible */}
          <div className="hidden gap-8 md:grid md:grid-cols-2 lg:gap-16">
            {/* Cards branch */}
            <div className="space-y-6">
              <PhoneMock>
                <CardsFlowMock />
              </PhoneMock>
              <div className="text-center">
                <h3 className="mb-2 text-xl font-semibold text-primary">Trading Cards</h3>
                <p className="text-sm text-muted-foreground">
                  Scan, auto-identify, and catalog with set data, variants, and grading info built in.
                </p>
              </div>
            </div>

            {/* Memorabilia branch */}
            <div className="space-y-6">
              <PhoneMock>
                <MemoFlowMock />
              </PhoneMock>
              <div className="text-center">
                <h3 className="mb-2 text-xl font-semibold text-primary">Memorabilia</h3>
                <p className="text-sm text-muted-foreground">
                  Fully custom fields for one-of-a-kind items. Photos, provenance, and authentication.
                </p>
              </div>
            </div>
          </div>

          {/* Mobile: tabbed view */}
          <div className="md:hidden">
            <div className={activeTab === "cards" ? "block" : "hidden"}>
              <PhoneMock>
                <CardsFlowMock />
              </PhoneMock>
              <div className="mt-6 text-center">
                <h3 className="mb-2 text-xl font-semibold text-primary">Trading Cards</h3>
                <p className="text-sm text-muted-foreground">
                  Scan, auto-identify, and catalog with set data, variants, and grading info built in.
                </p>
              </div>
            </div>
            <div className={activeTab === "memo" ? "block" : "hidden"}>
              <PhoneMock>
                <MemoFlowMock />
              </PhoneMock>
              <div className="mt-6 text-center">
                <h3 className="mb-2 text-xl font-semibold text-primary">Memorabilia</h3>
                <p className="text-sm text-muted-foreground">
                  Fully custom fields for one-of-a-kind items. Photos, provenance, and authentication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
