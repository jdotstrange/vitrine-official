"use client"

import * as React from "react"
import { useState } from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker } from "@/components/marketing/primitives"
import { SectionHeader } from "./SectionHeader"

export function CompsSection() {
  return (
    <section
      id="comps"
      data-marketing-section="comps"
      style={{
        padding: "140px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
        background: `linear-gradient(180deg, transparent 0%, ${T.voltFill} 50%, transparent 100%)`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          num="05B"
          kicker="COMPS ENGINE"
          title={
            <>
              Three tiers.{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.fg2,
                }}
              >
                Zero ambiguity.
              </em>
            </>
          }
          sub="Every comparable sale tagged on six attributes, dated, source-weighted, and tiered. Perfect = all six match. Strong = most. Loose = direction only."
        />
        <div
          data-marketing-grid="comps-tiers"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            marginTop: 80,
          }}
        >
          <CompTier
            tier="PERFECT"
            pct="92–100%"
            tone={T.green}
            desc="Set, year, parallel, grade, condition, and provenance — all six aligned."
            count={2}
          />
          <CompTier
            tier="STRONG"
            pct="70–91%"
            tone={T.blue}
            desc="Same set + year, with one or two attribute deltas. The closest non-perfect peers."
            count={2}
          />
          <CompTier
            tier="LOOSE"
            pct="40–69%"
            tone={T.fg2}
            desc="Cross-set or cross-grade comparables. Useful context, not direct comps."
            count={2}
          />
        </div>
      </div>
    </section>
  )
}

interface CompTierProps {
  tier: string
  pct: string
  tone: string
  desc: string
  count: number
}

function CompTier({ tier, pct, tone, desc, count }: CompTierProps) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 36,
        borderRadius: 18,
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${hover ? tone : T.frostDiv}`,
        background:
          tier === "PERFECT"
            ? "rgba(17,255,153,0.04)"
            : "rgba(214,235,253,0.02)",
        cursor: "pointer",
        transition: "border-color 200ms, transform 280ms cubic-bezier(.2,.8,.2,1)",
        transform: hover ? "translateY(-3px)" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            background: tone,
            boxShadow: tier === "PERFECT" ? `0 0 12px ${tone}` : "none",
          }}
        />
        <div
          style={{
            fontFamily: T.fontGrotesk,
            fontWeight: 700,
            fontSize: 11,
            letterSpacing: 1.6,
            color: tone,
          }}
        >
          {tier}
        </div>
        <div
          style={{
            marginLeft: "auto",
            fontFamily: T.fontMono,
            fontSize: 11,
            color: T.fg3,
          }}
        >
          {count}/47
        </div>
      </div>
      <div
        style={{
          fontFamily: T.fontDisplay,
          fontSize: 56,
          letterSpacing: -1,
          lineHeight: 1,
          color: T.fg1,
        }}
      >
        {pct}
      </div>
      <Kicker style={{ marginTop: 8, color: T.fg3 }}>MATCH RANGE</Kicker>
      <p style={{ marginTop: 28, fontSize: 13.5, lineHeight: 1.6, color: T.fg2 }}>
        {desc}
      </p>
    </div>
  )
}
