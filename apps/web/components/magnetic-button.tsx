"use client"

import { useRef, useState, type ReactNode, type MouseEvent } from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

interface MagneticButtonProps {
  children: ReactNode
  className?: string
  magneticStrength?: number
  onClick?: () => void
  disabled?: boolean
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
  href?: string
  target?: string
  rel?: string
}

/**
 * MagneticButton - Elite micro-interaction button
 * 
 * Features:
 * - Magnetic pull effect (button moves toward cursor)
 * - Ripple effect on click
 * - Glow burst animation
 * - 3D press depth effect
 */
export function MagneticButton({
  children,
  className = "",
  magneticStrength = 0.3,
  onClick,
  disabled = false,
  variant = "primary",
  size = "md",
  href,
  target,
  rel,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([])
  
  // Magnetic effect motion values
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  
  const springConfig = { damping: 15, stiffness: 300 }
  const springX = useSpring(x, springConfig)
  const springY = useSpring(y, springConfig)
  
  // Scale for hover effect
  const scale = useSpring(1, springConfig)
  
  // Glow intensity
  const glowOpacity = useTransform(scale, [1, 1.05], [0.3, 0.6])
  
  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    if (!buttonRef.current || disabled) return
    
    const rect = buttonRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const deltaX = (e.clientX - centerX) * magneticStrength
    const deltaY = (e.clientY - centerY) * magneticStrength
    
    x.set(deltaX)
    y.set(deltaY)
  }
  
  const handleMouseEnter = () => {
    if (disabled) return
    setIsHovered(true)
    scale.set(1.05)
  }
  
  const handleMouseLeave = () => {
    setIsHovered(false)
    x.set(0)
    y.set(0)
    scale.set(1)
  }
  
  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if (disabled) return
    
    // Create ripple
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      const rippleX = e.clientX - rect.left
      const rippleY = e.clientY - rect.top
      const id = Date.now()
      
      setRipples(prev => [...prev, { x: rippleX, y: rippleY, id }])
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id))
      }, 600)
    }
    
    // Press effect
    scale.set(0.95)
    setTimeout(() => scale.set(1.05), 100)
    
    onClick?.()
  }
  
  const variantStyles = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary border border-border text-foreground",
    ghost: "bg-transparent text-foreground hover:bg-foreground/5",
  }
  
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  }
  
  const Tag = href ? motion.a : motion.button

  const sharedProps = {
    ref: buttonRef as any,
    className: cn(
      "relative overflow-hidden rounded-full font-medium transition-colors inline-block",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
      variantStyles[variant],
      sizes[size],
      disabled && "opacity-50 cursor-not-allowed",
      className
    ),
    style: { x: springX, y: springY, scale },
    onMouseMove: handleMouseMove,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onClick: handleClick,
    whileTap: { scale: 0.95 } as any,
    ...(href ? { href, target, rel } : { disabled }),
  }

  return (
    <Tag {...sharedProps}>
      {/* Glow effect */}
      {variant === "primary" && (
        <motion.div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: "0 0 40px rgba(211, 255, 195, 0.35), 0 0 80px rgba(211, 255, 195, 0.15)",
            opacity: glowOpacity,
          }}
        />
      )}
      
      {/* Shine sweep effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ x: "-100%", opacity: 0 }}
        animate={isHovered ? { x: "100%", opacity: 1 } : { x: "-100%", opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
        }}
      />
      
      {/* Ripples */}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full bg-white/30 pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
          }}
          initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.5 }}
          animate={{ 
            width: 400, 
            height: 400, 
            x: -200, 
            y: -200, 
            opacity: 0 
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </Tag>
  )
}
