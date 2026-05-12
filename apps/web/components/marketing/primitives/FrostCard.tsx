"use client"

import * as React from "react"
import { useState } from "react"
import { T } from "@/lib/marketing/tokens"

export interface FrostCardProps {
  children: React.ReactNode
  style?: React.CSSProperties
  hover?: boolean
  onClick?: () => void
}

export function FrostCard({
  children,
  style,
  hover = true,
  onClick,
}: FrostCardProps) {
  const [h, setH] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setH(true)}
      onMouseLeave={() => hover && setH(false)}
      style={{
        background: "rgba(214,235,253,0.02)",
        border: `1px solid ${h ? T.frostBorderStrong : T.frostDiv}`,
        borderRadius: 16,
        transition: "border-color 160ms, background 160ms",
        ...(h && hover ? { background: "rgba(214,235,253,0.04)" } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  )
}
