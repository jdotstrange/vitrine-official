import * as React from "react"
import { T } from "@/lib/marketing/tokens"

export interface HolographicFrameProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

/**
 * HolographicFrame — used for Crown Jewel callouts. Single-color sheen
 * (cool frost) replaces the original two-color cyan/volt gradient since
 * V3 monochrome reserves the chromatic accent slot for ivory only.
 */
export function HolographicFrame({ children, style }: HolographicFrameProps) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 18,
        padding: 1,
        background:
          "linear-gradient(135deg, rgba(214,235,253,0.45) 0%, rgba(214,235,253,0.05) 50%, rgba(232,224,212,0.40) 100%)",
        boxShadow: "0 8px 32px rgba(214,235,253,0.12)",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 18,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background:
              "linear-gradient(115deg, transparent 40%, rgba(214,235,253,0.16) 50%, transparent 60%)",
            animation: "holoSheen 7.2s ease-in-out infinite",
          }}
        />
      </div>
      <div
        style={{
          borderRadius: 17,
          background: T.void,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  )
}
