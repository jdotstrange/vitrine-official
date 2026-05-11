"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface SectionLabelProps {
  children: React.ReactNode
  className?: string
  color?: "cyan" | "magenta" | "amber" | "green"
  animate?: boolean
}

const colorMap = {
  cyan: "text-attention",
  magenta: "text-attention", 
  amber: "text-attention",
  green: "text-attention",
}

const dotColorMap = {
  cyan: "bg-attention",
  magenta: "bg-attention",
  amber: "bg-attention", 
  green: "bg-attention",
}

/**
 * SectionLabel - Uppercase, spaced section labels
 * 
 * Matches the consumer app's section header style:
 * - 10px font size
 * - Letter spacing of 2px
 * - Uppercase
 * - Cyan/accent color
 * - Optional pulsing dot indicator
 */
export function SectionLabel({ 
  children, 
  className,
  color = "cyan",
  animate = true,
}: SectionLabelProps) {
  return (
    <motion.div 
      className={cn(
        "flex items-center gap-2",
        className
      )}
      initial={animate ? { opacity: 0, y: 10 } : undefined}
      whileInView={animate ? { opacity: 1, y: 0 } : undefined}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Pulsing dot indicator */}
      <span className="relative flex h-2 w-2">
        <span 
          className={cn(
            "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
            dotColorMap[color]
          )}
        />
        <span 
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full",
            dotColorMap[color]
          )}
        />
      </span>
      
      {/* Label text */}
      <span 
        className={cn(
          "label-caps text-[10px]",
          colorMap[color]
        )}
      >
        {children}
      </span>
    </motion.div>
  )
}

/**
 * SectionHeader - Full section header with label and title
 */
interface SectionHeaderProps {
  label: string
  title: React.ReactNode
  description?: string
  labelColor?: "cyan" | "magenta" | "amber" | "green"
  align?: "left" | "center"
  className?: string
}

export function SectionHeader({
  label,
  title,
  description,
  labelColor = "cyan",
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div 
      className={cn(
        "space-y-4",
        align === "center" && "text-center flex flex-col items-center",
        className
      )}
    >
      <SectionLabel color={labelColor}>{label}</SectionLabel>
      
      <motion.h2
        className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {title}
      </motion.h2>
      
      {description && (
        <motion.p
          className="text-muted-foreground text-base md:text-lg max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {description}
        </motion.p>
      )}
    </div>
  )
}
