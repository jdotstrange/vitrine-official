"use client"

import { useRef, useEffect, type ReactNode } from "react"
import { motion, useInView, useAnimation, type Variant } from "framer-motion"

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  direction?: "up" | "down" | "left" | "right" | "none"
  distance?: number
  once?: boolean
  threshold?: number
  blur?: boolean
}

/**
 * ScrollReveal - Elite scroll-triggered reveal animation
 * 
 * Features:
 * - Staggered reveal with configurable delay
 * - Direction-aware entrance
 * - Intersection Observer for performance
 * - Configurable animation parameters
 */
export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  duration = 0.6,
  direction = "up",
  distance = 40,
  once = true,
  threshold = 0.2,
  blur = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once, amount: threshold })
  const controls = useAnimation()
  
  const directions: Record<string, { x: number; y: number }> = {
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  }
  
  const hidden: Variant = {
    opacity: 0,
    x: directions[direction].x,
    y: directions[direction].y,
    filter: blur ? "blur(4px)" : "blur(0px)",
  }
  
  const visible: Variant = {
    opacity: 1,
    x: 0,
    y: 0,
    filter: "blur(0px)",
  }
  
  useEffect(() => {
    if (isInView) {
      controls.start("visible")
    } else if (!once) {
      controls.start("hidden")
    }
  }, [isInView, controls, once])
  
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={controls}
      variants={{
        hidden,
        visible,
      }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // Custom easing
      }}
    >
      {children}
    </motion.div>
  )
}

/**
 * ScrollRevealGroup - Stagger children reveals
 */
interface ScrollRevealGroupProps {
  children: ReactNode
  className?: string
  stagger?: number
  direction?: "up" | "down" | "left" | "right" | "none"
}

export function ScrollRevealGroup({
  children,
  className = "",
  stagger = 0.1,
  direction = "up",
}: ScrollRevealGroupProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.2 })
  
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
      },
    },
  }
  
  const distance = 40
  const directions: Record<string, { x: number; y: number }> = {
    up: { x: 0, y: distance },
    down: { x: 0, y: -distance },
    left: { x: distance, y: 0 },
    right: { x: -distance, y: 0 },
    none: { x: 0, y: 0 },
  }
  
  const itemVariants = {
    hidden: {
      opacity: 0,
      x: directions[direction].x,
      y: directions[direction].y,
      filter: "blur(4px)",
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
  }
  
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={containerVariants}
    >
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <motion.div key={index} variants={itemVariants}>
            {child}
          </motion.div>
        ))
      ) : (
        <motion.div variants={itemVariants}>{children}</motion.div>
      )}
    </motion.div>
  )
}
