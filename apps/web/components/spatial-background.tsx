"use client"

import { useEffect, useRef, useCallback } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"

interface SpatialBackgroundProps {
  className?: string
  intensity?: number
  interactive?: boolean
}

/**
 * SpatialBackground - A living, breathing gradient mesh
 * 
 * Creates an immersive background with:
 * - Animated gradient orbs that pulse and drift
 * - Mouse reactivity (orbs respond to cursor proximity)
 * - Scroll-based color intensity shifts
 * - GPU-accelerated for 60fps performance
 */
export function SpatialBackground({ 
  className = "", 
  intensity = 1,
  interactive = true 
}: SpatialBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Mouse position with spring physics for smooth following
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  const springConfig = { damping: 25, stiffness: 150 }
  const smoothX = useSpring(mouseX, springConfig)
  const smoothY = useSpring(mouseY, springConfig)
  
  // Transform mouse position to orb offsets (subtle movement)
  const orb1X = useTransform(smoothX, [0, 1], [-20, 20])
  const orb1Y = useTransform(smoothY, [0, 1], [-20, 20])
  const orb2X = useTransform(smoothX, [0, 1], [15, -15])
  const orb2Y = useTransform(smoothY, [0, 1], [10, -10])
  const orb3X = useTransform(smoothX, [0, 1], [-10, 10])
  const orb3Y = useTransform(smoothY, [0, 1], [15, -15])
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current || !interactive) return
    
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    
    mouseX.set(x)
    mouseY.set(y)
  }, [mouseX, mouseY, interactive])
  
  useEffect(() => {
    if (!interactive) return
    
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [handleMouseMove, interactive])
  
  const baseOpacity = 0.15 * intensity
  const glowOpacity = 0.25 * intensity

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Primary cyan orb - top left, large */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(0, 212, 255, ${glowOpacity}) 0%, rgba(0, 212, 255, 0) 70%)`,
          filter: "blur(80px)",
          left: "10%",
          top: "-20%",
          x: orb1X,
          y: orb1Y,
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [baseOpacity, baseOpacity + 0.1, baseOpacity],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Secondary blue orb - bottom right */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(0, 136, 255, ${glowOpacity * 0.8}) 0%, rgba(0, 136, 255, 0) 70%)`,
          filter: "blur(100px)",
          right: "5%",
          bottom: "-10%",
          x: orb2X,
          y: orb2Y,
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [baseOpacity * 0.7, baseOpacity, baseOpacity * 0.7],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
      
      {/* Tertiary cyan orb - center, subtle */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background: `radial-gradient(circle, rgba(0, 212, 255, ${baseOpacity}) 0%, rgba(0, 212, 255, 0) 60%)`,
          filter: "blur(120px)",
          left: "40%",
          top: "30%",
          x: orb3X,
          y: orb3Y,
        }}
        animate={{
          scale: [1, 1.08, 1],
          opacity: [baseOpacity * 0.5, baseOpacity * 0.8, baseOpacity * 0.5],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />
      
      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-cyan-glow/30"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 5,
          }}
        />
      ))}
      
      {/* Noise texture overlay for depth */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
