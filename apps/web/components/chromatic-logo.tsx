"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, useAnimatedValue, useAnimation, AnimatePresence } from "framer-motion"
import Image from "next/image"

interface ChromaticLogoProps {
  className?: string
  width?: number
  height?: number
  glitchIntensity?: number
}

/**
 * ChromaticLogo - Logo with RGB chromatic aberration/glitch effect
 * 
 * Creates the signature Vitrine logo with cyan/magenta color split
 * that glitches periodically, matching the consumer app's animated-vitrine-logo.tsx
 */
export function ChromaticLogo({ 
  className = "", 
  width = 120, 
  height = 24,
  glitchIntensity = 2 
}: ChromaticLogoProps) {
  const [isGlitching, setIsGlitching] = useState(false)

  // Trigger random glitches
  useEffect(() => {
    const triggerGlitch = () => {
      setIsGlitching(true)
      setTimeout(() => setIsGlitching(false), 150)
    }

    // Initial glitch after mount
    const initialTimeout = setTimeout(triggerGlitch, 800)
    
    // Random glitches
    const interval = setInterval(() => {
      if (Math.random() > 0.4) {
        triggerGlitch()
      }
    }, 2500 + Math.random() * 2000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [])

  const glitchOffset = isGlitching ? glitchIntensity : 0

  return (
    <div 
      className={`relative ${className}`}
      style={{ width, height }}
    >
      {/* Cyan layer (left offset) */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          x: isGlitching ? -glitchOffset : 0,
          y: isGlitching ? glitchOffset * 0.5 : 0,
        }}
        transition={{ duration: 0.05 }}
        style={{ 
          filter: "url(#cyan-filter)",
          opacity: 0.7,
          mixBlendMode: "screen",
        }}
      >
        <Image
          src="/logo.svg"
          alt=""
          width={width}
          height={height}
          className="w-full h-auto"
          aria-hidden="true"
        />
      </motion.div>

      {/* Magenta layer (right offset) */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          x: isGlitching ? glitchOffset : 0,
          y: isGlitching ? -glitchOffset * 0.5 : 0,
        }}
        transition={{ duration: 0.05 }}
        style={{ 
          filter: "url(#magenta-filter)",
          opacity: 0.7,
          mixBlendMode: "screen",
        }}
      >
        <Image
          src="/logo.svg"
          alt=""
          width={width}
          height={height}
          className="w-full h-auto"
          aria-hidden="true"
        />
      </motion.div>

      {/* White base layer */}
      <div className="relative z-10">
        <Image
          src="/logo.svg"
          alt="Vitrine"
          width={width}
          height={height}
          className="w-full h-auto"
          priority
        />
      </div>

      {/* SVG Filters for color channels */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          {/* Cyan filter - keeps only cyan channel */}
          <filter id="cyan-filter">
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0.83
                      0 0 1 0 1
                      0 0 0 1 0"
            />
          </filter>
          {/* Magenta filter - keeps only magenta channel */}
          <filter id="magenta-filter">
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 1
                      0 0 0 0 0
                      0 0 1 0 0.67
                      0 0 0 1 0"
            />
          </filter>
        </defs>
      </svg>

      {/* Glitch scanlines effect */}
      <AnimatePresence>
        {isGlitching && (
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
          >
            {/* Horizontal glitch lines */}
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-full h-px bg-cyan-glow/40"
                style={{ top: `${20 + i * 30 + Math.random() * 10}%` }}
                initial={{ scaleX: 0, x: "-50%" }}
                animate={{ scaleX: 1, x: "0%" }}
                transition={{ duration: 0.1 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
