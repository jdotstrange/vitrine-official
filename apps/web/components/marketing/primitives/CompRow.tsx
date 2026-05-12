"use client"

import * as React from "react"
import { useState } from "react"
import { T } from "@/lib/marketing/tokens"

export interface CompRowProps {
  tier: "perfect" | "strong" | "loose"
  pct: number | string
  title: string
  price: string
  when: string
  source?: string
}

export function CompRow({ tier, pct, title, price, when, source }: CompRowProps) {
  const tone = tier === "perfect" ? T.green : tier === "strong" ? T.blue : T.fg2
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderRadius: 12,
        border: `1px solid ${hover ? T.frostBorderStrong : T.frostDiv}`,
        background: hover ? "rgba(214,235,253,0.04)" : "transparent",
        transition: "background 120ms, border-color 120ms",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          background: tone,
          boxShadow: tier === "perfect" ? `0 0 10px ${tone}` : "none",
        }}
      />
      <div
        style={{
          fontFamily: T.fontGrotesk,
          fontWeight: 700,
          fontSize: 9.5,
          letterSpacing: 1.4,
          color: tone,
          textTransform: "uppercase",
          width: 56,
        }}
      >
        {tier}
      </div>
      <div
        style={{
          fontFamily: T.fontMono,
          fontSize: 11,
          color: T.fg2,
          width: 44,
        }}
      >
        {pct}%
      </div>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 13,
          color: T.fg1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {title}
      </div>
      {source && (
        <div
          style={{
            fontFamily: T.fontCaslon,
            fontStyle: "italic",
            fontSize: 12,
            color: T.fg2,
            width: 100,
            textAlign: "right",
          }}
        >
          {source}
        </div>
      )}
      <div
        style={{
          fontFamily: T.fontMono,
          fontSize: 13,
          color: T.fg1,
          width: 80,
          textAlign: "right",
        }}
      >
        {price}
      </div>
      <div
        style={{
          fontFamily: T.fontMono,
          fontSize: 10.5,
          color: T.fg3,
          width: 64,
          textAlign: "right",
        }}
      >
        {when}
      </div>
    </div>
  )
}
