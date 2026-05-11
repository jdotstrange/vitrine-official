"use client"

import { useScrollReveal } from "@/hooks/use-scroll-reveal"
import { useState } from "react"

// Spatial View - Single large card (matches spatial_view.png)
function SpatialView() {
  return (
    <div className="mx-auto max-w-[280px]">
      <div className="overflow-hidden rounded-2xl border border-border bg-void-light">
        {/* Card Image */}
        <div className="relative aspect-square">
          <img src="/images/spatial-view.png" alt="Charizard 1st Ed" className="h-full w-full object-cover" />
          <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-void-base/80 text-neutral-50">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
          </button>
        </div>
        {/* Card Info */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-semibold text-foreground">Charizard 1st Ed</h4>
              <p className="text-sm text-muted-foreground">2w ago</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-foreground">$8,200</p>
              <p className="text-sm text-green-400">+12.5%</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-void-base" />
              <span>Alex Rivera</span>
            </div>
            <span>5.6K tracking</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Grid View - 2x2 grid (matches grid_view.png)
function GridView() {
  const items = [
    {
      name: "Jordan 1 Chicago",
      price: "$2,850",
      tracks: "2.8K tracks",
      image: "/placeholder.svg?height=120&width=120",
    },
    {
      name: "Charizard 1st Ed",
      price: "$8,200",
      tracks: "5.6K tracks",
      image: "/placeholder.svg?height=120&width=120",
    },
    { name: "Rolex Daytona", price: "$12,500", tracks: "3.9K tracks", image: "/placeholder.svg?height=120&width=120" },
    {
      name: "MJ Rookie PSA 10",
      price: "$15,000",
      tracks: "4.2K tracks",
      image: "/placeholder.svg?height=120&width=120",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-border bg-void-light">
          <div className="relative aspect-square bg-void-base">
            <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
            <button className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-void-base/80 text-neutral-50">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          </div>
          <div className="p-3">
            <h4 className="text-sm font-medium text-foreground">{item.name}</h4>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">{item.price}</span>
              <span className="text-xs text-muted-foreground">{item.tracks}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// List View - Horizontal rows (matches list_view.png)
function ListView() {
  const items = [
    {
      name: "Jordan 1 Chicago",
      price: "$2,850",
      tracks: "2.8K tracks",
      status: "FOR SALE",
      statusColor: "text-primary",
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Charizard 1st Ed",
      price: "$8,200",
      tracks: "5.6K tracks",
      status: "FOR TRADE",
      statusColor: "text-secondary",
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "Rolex Daytona",
      price: "$12,500",
      tracks: "3.9K tracks",
      status: "FOR SALE",
      statusColor: "text-primary",
      image: "/placeholder.svg?height=60&width=60",
    },
    {
      name: "MJ Rookie PSA 10",
      price: "$15,000",
      tracks: "4.2K tracks",
      status: "SELL + TRADE",
      statusColor: "text-primary",
      image: "/placeholder.svg?height=60&width=60",
    },
  ]

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-void-light p-3">
          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-void-base">
            <img src={item.image || "/placeholder.svg"} alt={item.name} className="h-full w-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground">{item.name}</h4>
            <span className={`text-xs font-medium ${item.statusColor} bg-void-base px-2 py-0.5 rounded`}>
              {item.status}
            </span>
            <p className="mt-1 font-semibold text-primary">{item.price}</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{item.tracks}</span>
            <button className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-void-base">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProductPreviewSection() {
  const { ref, isVisible } = useScrollReveal()
  const [activeView, setActiveView] = useState<"spatial" | "grid" | "list">("spatial")

  const views = [
    { id: "spatial" as const, label: "Spatial" },
    { id: "grid" as const, label: "Grid" },
    { id: "list" as const, label: "List" },
  ]

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-gradient-to-b from-void-deep via-void-base to-void-deep px-6 py-24 md:py-32"
    >
      {/* Background texture */}
      <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div
          className={`transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          {/* Header */}
          <div className="mb-12 text-center">
            <p className="mb-4 font-mono text-sm uppercase tracking-widest text-primary">Display Options</p>
            <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
              See it how you want.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Spatial view for the immersive scroll. Grid view for the glance. List view for the deep dive. Your
              collection, your call.
            </p>
          </div>

          {/* View Switcher */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex rounded-full border border-border bg-void-light p-1">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`rounded-full px-6 py-2 text-sm font-medium transition-all ${
                    activeView === view.id ? "bg-primary text-void-deep" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>

          {/* View Display */}
          <div className="mx-auto max-w-md">
            <div className="rounded-3xl border border-border bg-void-base p-6 shadow-2xl">
              {activeView === "spatial" && <SpatialView />}
              {activeView === "grid" && <GridView />}
              {activeView === "list" && <ListView />}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
