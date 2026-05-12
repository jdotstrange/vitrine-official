import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker } from "@/components/marketing/primitives"

export interface SectionHeaderProps {
  num: string
  kicker: string
  title: React.ReactNode
  sub?: React.ReactNode
}

export function SectionHeader({ num, kicker, title, sub }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        gap: 40,
        alignItems: "flex-start",
      }}
    >
      <div>
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 64,
            lineHeight: 0.9,
            letterSpacing: -1.4,
            color: T.fg1,
          }}
        >
          §{num}
        </div>
        <Kicker style={{ marginTop: 8, color: T.volt }}>{kicker}</Kicker>
      </div>
      <div>
        <h2
          style={{
            fontFamily: T.fontDisplay,
            fontWeight: 400,
            fontSize: 76,
            lineHeight: 0.96,
            letterSpacing: -1.6,
            margin: 0,
          }}
        >
          {title}
        </h2>
        {sub && (
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.55,
              color: T.fg2,
              maxWidth: 720,
              marginTop: 24,
            }}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}
