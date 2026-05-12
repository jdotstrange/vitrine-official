"use client"

import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import { MIcon } from "@/components/marketing/primitives"
import { Reveal } from "@/lib/marketing/Reveal"
import { SectionHeader } from "@/components/marketing/sections/SectionHeader"

const SIGNALS: { icon: string; label: string; sub: string }[] = [
  {
    icon: "users",
    label: "Owners of what you own",
    sub: "Find collectors who hold the same Crown Jewel category as you",
  },
  {
    icon: "git-compare",
    label: "Adjacent collectors",
    sub: "Pieces in your vault map to nearby specialties — vintage cards lead to wax, watches lead to clocks",
  },
  {
    icon: "trending-up",
    label: "On the move",
    sub: "Surface collectors actively building right now, not dormant accounts",
  },
  {
    icon: "shield-check",
    label: "Verified",
    sub: "Verified-collector badges roll out next quarter; signal layer is ready today",
  },
]

/**
 * DiscoverArea — network discovery story. Vitrine surfaces other
 * collectors based on attribute overlap with your collection rather
 * than blunt category counts. Anti-engagement-bait: discovery is for
 * meeting peers, not gaming a feed.
 */
export function DiscoverArea() {
  return (
    <section
      id="discover"
      data-marketing-section="discover"
      style={{
        padding: "140px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          num="07"
          kicker="DISCOVER"
          title={
            <>
              We find people who{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.volt,
                }}
              >
                own what you own.
              </em>
            </>
          }
          sub="The discovery algorithm reads the contents of your vault — not your follows, not your likes — and surfaces collectors with overlapping specialties. Quiet network growth, no engagement bait."
        />

        <div
          data-marketing-grid="discover-signals"
          style={{
            marginTop: 80,
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
          }}
        >
          {SIGNALS.map((s, i) => (
            <Reveal key={s.label} delay={120 + i * 80} y={16}>
              <div
                style={{
                  padding: 28,
                  borderRadius: 14,
                  border: `1px solid ${T.frostDiv}`,
                  background: "rgba(214,235,253,0.015)",
                  display: "flex",
                  gap: 18,
                  alignItems: "flex-start",
                  height: "100%",
                }}
              >
                <span
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    border: `1px solid ${T.voltBorder}`,
                    background: T.voltFill,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: T.volt,
                    flexShrink: 0,
                  }}
                >
                  <MIcon name={s.icon} size={20} color={T.volt} />
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: T.fontDisplay,
                      fontSize: 22,
                      letterSpacing: -0.3,
                      color: T.fg1,
                      lineHeight: 1.2,
                    }}
                  >
                    {s.label}
                  </div>
                  <p
                    style={{
                      marginTop: 8,
                      fontSize: 13.5,
                      lineHeight: 1.55,
                      color: T.fg2,
                    }}
                  >
                    {s.sub}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div
          style={{
            marginTop: 40,
            padding: "20px 24px",
            borderRadius: 12,
            border: `1px dashed ${T.frostBorderStrong}`,
            background: "transparent",
            textAlign: "center",
            fontFamily: T.fontCaslon,
            fontStyle: "italic",
            fontSize: 15,
            color: T.fg2,
            maxWidth: 720,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Vitrine is a vault, not a feed. Discovery is for meeting your
          peers, not for retention loops.
        </div>
      </div>
    </section>
  )
}
