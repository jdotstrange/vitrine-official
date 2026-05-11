"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"

interface TickerItem {
  name: string
  price: string
  change: string
  up: boolean
}

const tickerItems: TickerItem[] = [
  { name: "PSA 10 Charizard", price: "$42,500", change: "+12.4%", up: true },
  { name: "Jordan 1 Chicago", price: "$2,850", change: "-3.2%", up: false },
  { name: "Rolex Daytona", price: "$38,200", change: "+5.8%", up: true },
  { name: "Black Lotus MTG", price: "$125,000", change: "+2.1%", up: true },
  { name: "Kobe Rookie RC", price: "$8,400", change: "-1.5%", up: false },
  { name: "Supreme Box Logo", price: "$1,200", change: "+8.9%", up: true },
  { name: "AP Royal Oak", price: "$45,000", change: "+3.2%", up: true },
  { name: "Pikachu 1st Ed", price: "$6,800", change: "+15.3%", up: true },
]

interface LiveTickerProps {
  className?: string
}

/**
 * LiveTicker - Auto-scrolling market data ticker
 * 
 * Creates a horizontal scrolling ticker showing collectible market data.
 * Matches the consumer app's live-ticker.tsx aesthetic.
 */
export function LiveTicker({ className = "" }: LiveTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollX, setScrollX] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setScrollX((prev) => {
        // Reset when scrolled far enough for seamless loop
        if (prev > 2000) return 0
        return prev + 1
      })
    }, 30)

    return () => clearInterval(interval)
  }, [])

  // Double items for seamless loop
  const doubledItems = [...tickerItems, ...tickerItems]

  return (
    <div className={`relative h-10 overflow-hidden ${className}`}>
      {/* Glass background with dark overlay - matching consumer app */}
      <div className="absolute inset-0 bg-void-deep/60 backdrop-blur-xl border-y border-white/5" />
      
      {/* Scrolling content */}
      <motion.div
        className="absolute top-0 left-0 h-full flex items-center whitespace-nowrap"
        animate={{ x: -scrollX }}
        transition={{ duration: 0, ease: "linear" }}
      >
        {doubledItems.map((item, i) => (
          <div 
            key={i} 
            className="flex items-center gap-3 px-6 h-full border-r border-white/5"
          >
            <span className="font-mono text-xs text-muted-foreground">
              {item.name}
            </span>
            <span className="font-mono text-xs font-semibold text-foreground">
              {item.price}
            </span>
            <div className="flex items-center gap-1">
              {item.up ? (
                <TrendingUp className="w-3 h-3 text-success" />
              ) : (
                <TrendingDown className="w-3 h-3 text-secondary" />
              )}
              <span 
                className={`font-mono text-xs ${
                  item.up ? "text-success" : "text-secondary"
                }`}
              >
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Edge fades */}
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-void-deep to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-void-deep to-transparent z-10 pointer-events-none" />
    </div>
  )
}
