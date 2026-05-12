import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import {
  FrostCard,
  Kicker,
  MIcon,
} from "@/components/marketing/primitives"
import { LIVE_CAPABILITIES, ROADMAP_ITEMS } from "@/lib/marketing/constants"
import { SectionHeader } from "./SectionHeader"

export function LiveComingSection() {
  return (
    <section
      data-marketing-section="state"
      style={{
        padding: "160px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          num="09"
          kicker="STATE OF THE APP"
          title={
            <>
              Live today.{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.volt,
                }}
              >
                And what&apos;s next.
              </em>
            </>
          }
          sub="We don't ship vaporware. The core cataloging, presenting, and tracking jobs are live. The transactional layer comes later, deliberately."
        />

        <div
          data-marketing-grid="live-coming"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginTop: 80,
          }}
        >
          <FrostCard hover={false} style={{ padding: 36 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: T.green,
                  boxShadow: `0 0 8px ${T.green}`,
                  animation: "pulseGlow 1.4s ease-in-out infinite",
                }}
              />
              <Kicker style={{ color: T.green }}>LIVE NOW</Kicker>
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: T.fontMono,
                  fontSize: 10.5,
                  color: T.fg3,
                }}
              >
                {LIVE_CAPABILITIES.length} CAPABILITIES
              </span>
            </div>
            {LIVE_CAPABILITIES.map((l, i) => (
              <div
                key={l}
                style={{
                  padding: "14px 0",
                  borderTop: i ? `1px solid ${T.frostDiv}` : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <MIcon name="check" size={14} color={T.green} />
                <div style={{ fontSize: 14, color: T.fg1 }}>{l}</div>
              </div>
            ))}
          </FrostCard>

          <FrostCard hover={false} style={{ padding: 36 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 24,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: T.volt,
                  boxShadow: `0 0 8px ${T.volt}`,
                }}
              />
              <Kicker style={{ color: T.volt }}>ON THE ROADMAP</Kicker>
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: T.fontMono,
                  fontSize: 10.5,
                  color: T.fg3,
                }}
              >
                {ROADMAP_ITEMS.length} SHIPPING
              </span>
            </div>
            {ROADMAP_ITEMS.map(([title, when], i) => (
              <div
                key={title}
                style={{
                  padding: "14px 0",
                  borderTop: i ? `1px solid ${T.frostDiv}` : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    border: `1px dashed ${T.voltBorder}`,
                    flexShrink: 0,
                  }}
                />
                <div style={{ fontSize: 14, color: T.fg1, flex: 1 }}>
                  {title}
                </div>
                <span
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 10.5,
                    color: T.volt,
                    letterSpacing: 0.5,
                  }}
                >
                  {when}
                </span>
              </div>
            ))}
            <div
              style={{
                marginTop: 18,
                paddingTop: 18,
                borderTop: `1px solid ${T.frostDiv}`,
                fontSize: 12,
                color: T.fg3,
                lineHeight: 1.55,
                fontStyle: "italic",
                fontFamily: T.fontCaslon,
              }}
            >
              We won&apos;t ship marketplace until the cataloging foundation
              supports it cleanly. Trust comes first — transactions follow.
            </div>
          </FrostCard>
        </div>
      </div>
    </section>
  )
}
