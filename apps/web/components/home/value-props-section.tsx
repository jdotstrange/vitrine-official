"use client"

import type React from "react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { TiltCard } from "@/components/tilt-card"
import { SpatialBackground } from "@/components/spatial-background"
import { SectionLabel } from "@/components/section-label"
import { DataStream } from "@/components/data-stream"

// Phone frame wrapper component with enhanced glass effect
function PhoneHalfMock({ children, accentColor }: { children: React.ReactNode; accentColor: "cyan" | "magenta" }) {
  const isCyan = accentColor === "cyan"
  return (
    <div className="relative mx-auto w-full max-w-[280px] md:max-w-[300px]">
      {/* Phone frame - clipped to show only top half */}
      <div className="relative overflow-hidden rounded-t-[2.5rem] border-[3px] border-b-0 border-white/20 bg-void-base p-1 pb-0 glass-premium">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-void-base rounded-full z-10" />

        {/* Screen content - fixed height for consistent sizing */}
        <div className="relative rounded-t-[2rem] overflow-hidden bg-void-deep h-[320px] md:h-[360px]">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 pb-1">
            <span className="text-[10px] font-medium text-white/60">9:41</span>
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                <div className="w-1 h-1 rounded-full bg-white/40" />
                <div className="w-1 h-1 rounded-full bg-white/40" />
                <div className="w-1 h-1 rounded-full bg-white/40" />
                <div className="w-1 h-1 rounded-full bg-white/20" />
              </div>
              <div className="w-4 h-2 rounded-sm border border-white/40 relative ml-1">
                <div className="absolute inset-0.5 right-1 bg-white/60 rounded-sm" />
              </div>
            </div>
          </div>

          {children}
        </div>
      </div>

      {/* Fade out at bottom to suggest continuation */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, transparent, hsl(var(--void-base)))`,
        }}
      />

      {/* Ambient glow beneath phone */}
      <motion.div
        className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-12 rounded-full blur-2xl
          ${isCyan ? "bg-cyan-glow/25" : "bg-magenta-glow/25"}
        `}
        animate={{
          opacity: [0.25, 0.4, 0.25],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  )
}

function DisplayMock() {
  const items = [
    { image: "jordan 1 chicago red sneaker", name: "Jordan 1 Chicago", price: "$2,850", tracks: "2.8K tracks" },
    { image: "charizard pokemon card holographic", name: "Charizard 1st Ed", price: "$8,200", tracks: "5.6K tracks" },
    { image: "rolex daytona gold watch", name: "Rolex Daytona", price: "$12,500", tracks: "3.9K tracks" },
    { image: "michael jordan rookie card", name: "MJ Rookie PSA 10", price: "$15,000", tracks: "4.2K tracks" },
  ]

  return (
    <PhoneHalfMock accentColor="cyan">
      {/* App header */}
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo-icon.svg" alt="Vitrine" className="w-5 h-5" />
          <span className="text-sm font-semibold text-white">vitrine</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Collection grid */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {items.map((item, i) => (
          <motion.div 
            key={i} 
            className="relative rounded-xl overflow-hidden bg-void-elevated border border-white/5"
            whileHover={{ scale: 1.03, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            {/* Item image */}
            <div
              className="aspect-square"
              style={{
                backgroundImage: `url(/placeholder.svg?height=120&width=120&query=${item.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            {/* Item info */}
            <div className="p-2">
              <p className="text-[11px] font-medium text-white truncate">{item.name}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] font-mono font-semibold text-primary">{item.price}</span>
                <span className="text-[9px] font-mono text-white/40">{item.tracks}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </PhoneHalfMock>
  )
}

function DiscoverMock() {
  const categories = [
    { name: "Cards", color: "from-cyan-500/30 to-teal-600/30" },
    { name: "Kicks", color: "from-rose-500/30 to-pink-600/30" },
    { name: "Watches", color: "from-emerald-500/30 to-green-600/30" },
    { name: "Sports", color: "from-amber-500/30 to-orange-600/30" },
  ]

  const trending = [
    { rank: 1, name: "Pokemon 151 Booster", change: "+284%", hot: true },
    { rank: 2, name: "Travis Scott Jordan L...", change: "+156%", hot: true },
  ]

  return (
    <PhoneHalfMock accentColor="cyan">
      {/* Search header */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-void-elevated border border-white/10">
          <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="text-xs text-white/40">Search Vitrine database...</span>
          <svg className="w-4 h-4 text-white/40 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
      </div>

      {/* Recent searches */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Recent
          </div>
          <span className="text-[10px] text-primary">Clear</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {["PSA 10 Charizard", "Jordan 1 Retro"].map((term, i) => (
            <span key={i} className="px-2 py-1 rounded-lg bg-void-elevated text-[10px] text-white/60">
              {term}
            </span>
          ))}
        </div>
      </div>

      {/* Explore categories */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-white/40">Explore</span>
          <span className="text-[10px] text-primary">See All</span>
        </div>
        <div className="flex gap-2 overflow-hidden">
          {categories.map((cat, i) => (
            <motion.div
              key={i}
              className={`flex-shrink-0 w-16 rounded-xl bg-gradient-to-br ${cat.color} p-3 flex flex-col items-center gap-2`}
              whileHover={{ scale: 1.05, y: -2 }}
            >
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <span className="text-[9px] text-white/80">{cat.name}</span>
            </motion.div>
          ))}
        </div>
      </div>

        {/* Trending */}
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-3 h-3 text-smart-amber" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-[10px] text-white/60 font-medium uppercase tracking-wider">Trending</span>
            <motion.span 
              className="px-1.5 py-0.5 rounded bg-plasma-orange/20 text-[8px] font-mono text-plasma-orange font-medium"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              LIVE
            </motion.span>
          </div>
          {trending.map((item, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-[10px] font-mono font-bold text-primary">{item.rank}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-white truncate">{item.name}</p>
                <p className="text-[9px] font-mono text-white/40">12.4K searches</p>
              </div>
              {item.hot && <span className="text-[10px] text-plasma-orange">🔥</span>}
              <span className="text-[10px] font-mono text-holo-green font-medium">{item.change}</span>
            </div>
          ))}
        </div>
    </PhoneHalfMock>
  )
}

function TrackMock() {
  const recentActivity = [
    { name: "Rolex Submariner Date 116610...", status: "Now For Sale", time: "1h ago", statusColor: "text-primary" },
    { name: "1986 Fleer Michael Jordan Roo...", change: "-7.2%", time: "2h ago", changeColor: "text-red-400" },
    { name: "Air Jordan 1 Retro High OG Chi...", change: "+5.6%", time: "5h ago", changeColor: "text-green-400" },
  ]

  const byType = [
    { name: "Basketball", items: 2, newCount: 1 },
    { name: "Sneakers", items: 2, newCount: 1 },
    { name: "Watches", items: 1, newCount: 1 },
  ]

  return (
    <PhoneHalfMock accentColor="cyan">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">Tracking</h3>
          <p className="text-[10px] text-primary">8 items</p>
        </div>
        <div className="w-7 h-7 rounded-lg bg-void-elevated flex items-center justify-center">
          <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37 2.37a1.724 1.724 0 00-1.065 2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-void-elevated border border-white/5">
          <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="text-[10px] text-white/40">Search tracked items...</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/40 tracking-wide">// RECENT ACTIVITY</span>
            <motion.span 
              className="px-1.5 py-0.5 rounded bg-primary/20 text-[8px] text-primary font-medium"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              3 new
            </motion.span>
          </div>
          <span className="text-[10px] text-white/40">View all &gt;</span>
        </div>
        <div className="space-y-2">
          {recentActivity.map((item, i) => (
            <motion.div 
              key={i} 
              className="flex items-center gap-3 p-2 rounded-xl bg-void-elevated/50"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="w-8 h-8 rounded-full bg-white/10" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-white truncate">{item.name}</p>
                <div className="flex items-center gap-1">
                  {item.status ? (
                    <span className={`text-[9px] ${item.statusColor}`}>⏱ {item.status}</span>
                  ) : (
                    <span className={`text-[9px] ${item.changeColor}`}>↗ {item.change}</span>
                  )}
                  <span className="text-[9px] text-white/30">{item.time}</span>
                </div>
              </div>
              <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.div>
          ))}
        </div>
      </div>

      {/* By Type */}
      <div className="px-4 py-2">
        <p className="text-[10px] text-white/40 tracking-wide mb-2">// BY TYPE</p>
        {byType.slice(0, 2).map((type, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5">
            <div className="w-8 h-8 rounded-full bg-void-elevated flex items-center justify-center">
              <svg className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-medium text-white">{type.name}</p>
              <p className="text-[9px] text-white/40">{type.items} items</p>
            </div>
            <span className="px-2 py-0.5 rounded bg-primary/20 text-[9px] text-primary">{type.newCount} new</span>
            <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>
    </PhoneHalfMock>
  )
}

const pillars = [
  {
    title: "Display",
    description: "Your pieces, presented properly. Not thumbnail hell.",
    accent: "cyan" as const,
    Mock: DisplayMock,
  },
  {
    title: "Discover",
    description: "A feed that actually understands what you collect.",
    accent: "cyan" as const,
    Mock: DiscoverMock,
  },
  {
    title: "Track",
    description: "Watch anything. Know when it moves.",
    accent: "cyan" as const,
    Mock: TrackMock,
  },
]

export function ValuePropsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 })

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 60,
      filter: "blur(8px)",
    },
    visible: { 
      opacity: 1, 
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-24 md:py-40 px-4 md:px-6"
    >
      {/* Data streams */}
      <DataStream side="left" density={12} className="opacity-30" />
      <DataStream side="right" density={12} className="opacity-30" />

      {/* Living spatial background */}
      <SpatialBackground intensity={0.5} interactive={false} />

      {/* Background gradient */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, 
            var(--void-deep) 0%, 
            var(--void-base) 50%,
            var(--void-deep) 100%
          )`,
        }}
      />

      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 212, 255, 0.2) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 212, 255, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-20 md:mb-28 text-center"
        >
          <div className="flex justify-center mb-6">
            <SectionLabel>The Three Pillars</SectionLabel>
          </div>
          <h2 className="text-4xl font-bold text-foreground md:text-5xl lg:text-7xl hero-text-shadow">
            <span className="text-gradient-animated">Three pillars.</span>
            <span className="block text-muted-foreground mt-2">Zero compromises.</span>
          </h2>
        </motion.div>

        {/* Phone Mock Cards with TiltCard */}
        <motion.div 
          className="grid gap-16 md:grid-cols-3 md:gap-8 lg:gap-12"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {pillars.map((pillar, index) => {
            const isCyan = pillar.accent === "cyan"
            const Mock = pillar.Mock

            return (
              <motion.div
                key={pillar.title}
                variants={itemVariants}
                className="group relative"
              >
                {/* TiltCard wrapper for 3D effect */}
                <TiltCard 
                  className="w-full"
                  tiltAmount={8}
                  glareEnabled={true}
                >
                  <Mock />
                </TiltCard>

                {/* Title & Description below phone */}
                <motion.div 
                  className="mt-8 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.5 + index * 0.15 }}
                >
                  <h3
                    className={`text-2xl md:text-3xl font-bold mb-3 ${isCyan ? "text-cyan-glow text-glow-animate" : "text-magenta-glow"}`}
                  >
                    {pillar.title}
                  </h3>
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-[300px] mx-auto">
                    {pillar.description}
                  </p>
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
