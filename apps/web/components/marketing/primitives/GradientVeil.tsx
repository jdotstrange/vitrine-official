import * as React from "react"

export interface GradientVeilProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export function GradientVeil({ children, style }: GradientVeilProps) {
  return (
    <div style={{ position: "relative", ...style }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.95) 100%)",
        }}
      />
      {children}
    </div>
  )
}
