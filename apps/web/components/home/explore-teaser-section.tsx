"use client"

import { useScrollReveal } from "@/hooks/use-scroll-reveal"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { SectionLabel } from "@/components/section-label"

// Mock collectible data styled after grid_view screenshot
const collectibles = [
  { id: 1, name: "Jordan 1 Chicago", price: "$2,850", tracks: "2.8K", image: "/placeholder.svg?height=200&width=200" },
  { id: 2, name: "Charizard 1st Ed", price: "$8,200", tracks: "5.6K", image: "/placeholder.svg?height=200&width=200" },
  { id: 3, name: "Rolex Daytona", price: "$12,500", tracks: "3.9K", image: "/placeholder.svg?height=200&width=200" },
  { id: 4, name: "MJ Rookie PSA 10", price: "$15,000", tracks: "4.2K", image: "/placeholder.svg?height=200&width=200" },
  { id: 5, name: "Travis Scott Lows", price: "$1,450", tracks: "1.8K", image: "/placeholder.svg?height=200&width=200" },
  { id: 6, name: "Pikachu Gold Star", price: "$4,800", tracks: "2.1K", image: "/placeholder.svg?height=200&width=200" },
]

function CollectibleCard({ item, index }: { item: (typeof collectibles)[0]; index: number }) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-void-light/50 border border-white/5 transition-all duration-300 hover:border-primary/30 hover:shadow-glow-sm"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Image */}
      <div className="aspect-square p-4">
        <img
          src={item.image || "/placeholder.svg"}
          alt={item.name}
          className="w-full h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Info */}
      <div className="px-4 pb-4">
        <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
        <div className="flex items-center justify-between mt-1">
          <span className="text-primary font-semibold">{item.price}</span>
          <span className="text-xs text-muted-foreground">{item.tracks} tracks</span>
        </div>
      </div>
    </div>
  )
}

export function ExploreTeaseSection() {
  const { ref, isVisible } = useScrollReveal()

  return (
    <section ref={ref} className="relative py-24 md:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-void-deep via-void-base to-void-deep" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />

      <div className="container relative mx-auto px-6">
        <div
          className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          {/* Header */}
          <div className="max-w-2xl mb-12">
            <div className="mb-4">
              <SectionLabel>Live Preview</SectionLabel>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">See what's already inside.</h2>
            <p className="text-lg text-muted-foreground">
              Thousands of collectibles. Uploaded by real collectors. Browse before you download—then add yours.
            </p>
          </div>

          {/* Collectibles grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {collectibles.map((item, index) => (
              <CollectibleCard key={item.id} item={item} index={index} />
            ))}
          </div>

          {/* CTA */}
          <div className="flex justify-center">
            <Link
              href="/explore"
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold transition-all hover:shadow-glow"
            >
              Explore the collection
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
