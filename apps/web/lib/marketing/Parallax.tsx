"use client"

import * as React from "react"
import { useRef } from "react"
import { usePrefersReducedMotion, useScrollProgress } from "./hooks"

export interface ParallaxProps {
  amount?: number
  children: React.ReactNode
  style?: React.CSSProperties
}

export function Parallax({ amount = 60, children, style }: ParallaxProps) {
  const reduced = usePrefersReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const p = useScrollProgress<HTMLDivElement>(ref)
  const offset = reduced ? 0 : (p - 0.5) * amount * 2
  return (
    <div
      ref={ref}
      style={{
        transform: `translate3d(0, ${offset}px, 0)`,
        willChange: "transform",
        ...style,
      }}
    >
      {children}
    </div>
  )
}
