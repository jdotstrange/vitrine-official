"use client"

import { useRef, type ReactNode, type MouseEvent } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

interface TiltCardProps {
  children: ReactNode
  className?: string
  glareEnabled?: boolean
  glareStrength?: number
  tiltAmount?: number
  tiltStrength?: number
  perspective?: number
}

/**
 * TiltCard - 3D perspective tilt effect
 * 
 * Features:
 * - Mouse position controls rotateX/Y
 * - Optional specular glare effect
 * - Smooth spring physics
 * - Depth shadow that responds to tilt
 */
export function TiltCard({
  children,
  className = "",
  glareEnabled = true,
  glareStrength = 0.15,
  tiltAmount,
  tiltStrength = 15,
  perspective = 1000,
}: TiltCardProps) {
  // Support both tiltAmount (legacy) and tiltStrength (preferred)
  const effectiveTilt = tiltAmount ?? tiltStrength
  const cardRef = useRef<HTMLDivElement>(null)
  
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springConfig = { damping: 20, stiffness: 300 }
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [effectiveTilt, -effectiveTilt]), springConfig)
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-effectiveTilt, effectiveTilt]), springConfig)
  
  // Glare position
  const glareX = useTransform(x, [-0.5, 0.5], [100, 0])
  const glareY = useTransform(y, [-0.5, 0.5], [100, 0])
  const glareOpacity = useSpring(0, springConfig)
  
  // Dynamic shadow
  const shadowX = useTransform(rotateY, [-effectiveTilt, effectiveTilt], [-20, 20])
  const shadowY = useTransform(rotateX, [-effectiveTilt, effectiveTilt], [20, -20])
  
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    
    const rect = cardRef.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    x.set((mouseX - centerX) / rect.width)
    y.set((mouseY - centerY) / rect.height)
  }
  
  const handleMouseEnter = () => {
    glareOpacity.set(glareStrength)
  }
  
  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    glareOpacity.set(0)
  }
  
  return (
    <motion.div
      ref={cardRef}
      className={cn("relative", className)}
      style={{
        perspective,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        className="relative w-full h-full"
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
      >
        {/* Dynamic shadow */}
        <motion.div
          className="absolute -inset-4 rounded-2xl bg-black/50 blur-xl -z-10"
          style={{
            x: shadowX,
            y: shadowY,
            opacity: 0.3,
          }}
        />
        
        {/* Card content */}
        <div className="relative w-full h-full" style={{ transform: "translateZ(0)" }}>
          {children}
        </div>
        
        {/* Glare effect */}
        {glareEnabled && (
          <motion.div
            className="absolute inset-0 rounded-[inherit] pointer-events-none overflow-hidden"
            style={{ opacity: glareOpacity }}
          >
            <motion.div
              className="absolute w-[200%] h-[200%]"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)",
                left: glareX,
                top: glareY,
                x: "-50%",
                y: "-50%",
              }}
            />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
