"use client"

import * as React from "react"
import { useInView, usePrefersReducedMotion } from "./hooks"

export interface RevealProps {
  children: React.ReactNode
  delay?: number
  y?: number
  duration?: number
  threshold?: number
  style?: React.CSSProperties
}

export function Reveal({
  children,
  delay = 0,
  y = 16,
  duration = 600,
  threshold = 0.15,
  style,
}: RevealProps) {
  const reduced = usePrefersReducedMotion()
  const [ref, inView] = useInView<HTMLDivElement>({ threshold })
  const animated = inView && !reduced
  return (
    <div
      ref={ref}
      style={{
        opacity: animated ? 1 : reduced ? 1 : 0,
        transform: animated
          ? "translate3d(0,0,0)"
          : reduced
            ? "none"
            : `translate3d(0,${y}px,0)`,
        transition: `opacity ${duration}ms cubic-bezier(.2,.8,.2,1) ${delay}ms, transform ${duration}ms cubic-bezier(.2,.8,.2,1) ${delay}ms`,
        willChange: "opacity, transform",
        ...style,
      }}
    >
      {children}
    </div>
  )
}
