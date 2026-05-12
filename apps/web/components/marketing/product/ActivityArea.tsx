"use client"

import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import {
  FrostCard,
  Kicker,
  PulseRow,
} from "@/components/marketing/primitives"
import { usePulseFeed } from "@/lib/marketing/hooks"
import { SectionHeader } from "@/components/marketing/sections/SectionHeader"

/**
 * ActivityArea — migrated from sections/PulseSection.tsx for /product
 * with the marketing-side rename "Pulse" -> "Activity". This eliminates
 * the in-app naming collision where Pulse is the per-piece market intel
 * lens (covered on /intelligence as PulseLensExplanation). Activity is
 * the network-level signal layer: followers, status changes, comp alerts,
 * showcase additions.
 *
 * The underlying PulseRow primitive name is retained for now — it ships
 * the row UI and is shared with the lens; renaming the primitive is a
 * separate refactor.
 */
export function ActivityArea() {
  const feed = usePulseFeed(2000, 8)
  return (
    <section
      id="activity"
      data-marketing-section="activity"
      style={{
        padding: "140px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          num="04"
          kicker="ACTIVITY"
          title={
            <>
              The signal layer{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                }}
              >
                of your network.
              </em>
            </>
          }
          sub="Followers move pieces. Comps land. Status flips from NFST to For Sale. Activity surfaces the changes that matter to you, ranked by relevance, quiet by default."
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
              your network &middot; 12,847 pieces tracked
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
