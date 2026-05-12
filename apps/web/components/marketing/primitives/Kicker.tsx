import * as React from "react"
import { T } from "@/lib/marketing/tokens"

export interface KickerProps {
  children: React.ReactNode
  color?: string
  style?: React.CSSProperties
}

export function Kicker({ children, color, style }: KickerProps) {
  return (
    <div
      style={{
        fontFamily: T.fontGrotesk,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.6,
        textTransform: "uppercase",
        color: color || T.fg2,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
