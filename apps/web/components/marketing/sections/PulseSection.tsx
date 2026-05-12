"use client"

import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import {
  FrostCard,
  Kicker,
  PulseRow,
} from "@/components/marketing/primitives"
import { usePulseFeed } from "@/lib/marketing/hooks"
import { SectionHeader } from "./SectionHeader"

export function PulseSection() {
  const feed = usePulseFeed(2000, 8)
  return (
    <section
      id="pulse"
      data-marketing-section="pulse"
      style={{
        padding: "140px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          num="00"
          kicker="PULSE"
          title={
            <>
              The market,{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                }}
              >
                quietly
              </em>{" "}
              watching.
            </>
          }
          sub="Per-piece subscriptions, ranked by relevance. Quiet by default — only the signals you've asked for."
        />
        <FrostCard hover={false} style={{ marginTop: 80, overflow: "hidden" }}>
          <div
            style={{
              padding: "20px 22px",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: T.volt,
                boxShadow: `0 0 8px ${T.volt}`,
                animation: "pulseGlow 1.4s ease-in-out infinite",
              }}
            />
            <Kicker color={T.volt}>LIVE</Kicker>
            <span
              style={{
                fontFamily: T.fontMono,
                fontSize: 12,
                color: T.fg2,
              }}
            >
              your collection · 12,847 pieces tracked
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontFamily: T.fontMono,
                fontSize: 11,
                color: T.fg3,
              }}
            >
              4.1M EVENTS / DAY
            </span>
          </div>
          {feed.map((e, i) => (
            <div
              key={e.id}
              style={i === 0 ? { animation: "feedFadeIn 480ms ease-out" } : {}}
            >
              <PulseRow event={e} />
            </div>
          ))}
        </FrostCard>
      </div>
    </section>
  )
}
