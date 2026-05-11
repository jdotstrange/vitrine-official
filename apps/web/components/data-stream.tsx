"use client"

import { useEffect, useState, memo } from "react"
import { motion } from "framer-motion"

interface Particle {
  id: number
  y: number
  speed: number
  char: string
  opacity: number
}

interface DataStreamProps {
  side: "left" | "right"
  className?: string
  density?: number
}

// Characters used in the stream - mix of binary, hex, Japanese, and symbols
const STREAM_CHARS = "01アイウエオカキクケコ◆◇○●□■△▲▽▼∞≡≈×÷±"

/**
 * DataStream - Matrix-style ambient data effect
 * 
 * Creates a cascading stream of characters that flows down the side of the screen.
 * Inspired by the consumer app's data-stream.tsx component.
 */
function DataStreamComponent({ side, className = "", density = 15 }: DataStreamProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    // Initialize particles with random positions and properties
    const newParticles: Particle[] = Array.from({ length: density }, (_, i) => ({
      id: i,
      y: Math.random() * 100,
      speed: 0.3 + Math.random() * 0.8,
      char: STREAM_CHARS[Math.floor(Math.random() * STREAM_CHARS.length)],
      opacity: 0.2 + Math.random() * 0.4,
    }))
    setParticles(newParticles)

    // Animation interval
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          y: (p.y + p.speed) % 100,
          // Occasionally change the character for a "data refresh" effect
          char: Math.random() > 0.92 
            ? STREAM_CHARS[Math.floor(Math.random() * STREAM_CHARS.length)] 
            : p.char,
          // Subtle opacity variation
          opacity: Math.random() > 0.95 
            ? 0.2 + Math.random() * 0.4 
            : p.opacity,
        }))
      )
    }, 80)

    return () => clearInterval(interval)
  }, [density])

  return (
    <div
      className={`fixed top-0 bottom-0 w-6 z-10 pointer-events-none overflow-hidden ${
        side === "left" ? "left-0" : "right-0"
      } ${className}`}
      aria-hidden="true"
    >
      {/* Gradient fade at top and bottom */}
      <div className="absolute inset-0 bg-gradient-to-b from-void-deep via-transparent to-void-deep z-10" />
      
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute font-mono text-[10px] text-cyan-glow select-none"
          style={{
            top: `${p.y}%`,
            [side === "left" ? "left" : "right"]: "4px",
            opacity: p.opacity,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: p.opacity }}
          transition={{ duration: 0.3 }}
        >
          {p.char}
        </motion.span>
      ))}
    </div>
  )
}

export const DataStream = memo(DataStreamComponent)
