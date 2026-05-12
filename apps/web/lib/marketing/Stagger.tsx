"use client"

import * as React from "react"
import { Reveal } from "./Reveal"

export interface StaggerProps {
  children: React.ReactNode
  step?: number
  initialDelay?: number
  y?: number
  threshold?: number
  style?: React.CSSProperties
}

export function Stagger({
  children,
  step = 80,
  initialDelay = 0,
  y = 12,
  threshold = 0.12,
  style,
}: StaggerProps) {
  const arr = React.Children.toArray(children)
  return (
    <>
      {arr.map((c, i) => (
        <Reveal
          key={i}
          delay={initialDelay + i * step}
          y={y}
          threshold={threshold}
          style={style}
        >
          {c}
        </Reveal>
      ))}
    </>
  )
}
