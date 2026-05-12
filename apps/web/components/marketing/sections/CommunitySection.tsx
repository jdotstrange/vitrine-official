import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker } from "@/components/marketing/primitives"
import { COLLECTORS, type CollectorCard } from "@/lib/marketing/constants"
import { SectionHeader } from "./SectionHeader"

const HUE_MAP: Record<CollectorCard["hueKey"], string> = {
  cyan: T.cyan,
  orange: T.orange,
  volt: T.volt,
}

export function CommunitySection() {
  return (
    <section
      data-marketing-section="community"
      style={{
        padding: "160px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          num="07"
          kicker="COMMUNITY"
          title={
            <>
              Discovered through{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.volt,
                }}
              >
                pieces.
              </em>
            </>
          }
          sub="No engagement bait. No reposts. You follow collectors because of what they own and how they curate. Identity, here, is the collection itself."
        />

        <div
          data-marketing-grid="community"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginTop: 80,
          }}
        >
          {COLLECTORS.map((c) => {
            const hue = HUE_MAP[c.hueKey]
            return (
              <div
                key={c.name}
                style={{
                  padding: 28,
                  borderRadius: 16,
                  border: `1px solid ${T.frostDiv}`,
                  background: "rgba(214,235,253,0.015)",
                  transition:
                    "transform 280ms cubic-bezier(.2,.8,.2,1), border-color 280ms",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      background: `linear-gradient(135deg, ${hue}33, ${hue}08)`,
                      border: `1px solid ${hue}66`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: T.fontDisplay,
                      fontSize: 18,
                      color: hue,
                    }}
                  >
                    {c.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: T.fontDisplay,
                        fontSize: 18,
                        color: T.fg1,
                        letterSpacing: -0.2,
                      }}
                    >
                      @{c.name}
                    </div>
                    <div
                      style={{
                        fontFamily: T.fontMono,
                        fontSize: 10.5,
                        color: T.fg3,
                        marginTop: 2,
                      }}
                    >
                      {c.followers} following
                    </div>
                  </div>
                  <span
                    style={{
                      padding: "5px 11px",
                      borderRadius: 9999,
                      border: `1px solid ${T.voltBorder}`,
                      background: T.voltFill,
                      color: T.volt,
                      fontFamily: T.fontGrotesk,
                      fontWeight: 700,
                      fontSize: 10,
                      letterSpacing: 1.2,
                    }}
                  >
                    FOLLOW
                  </span>
                </div>
                <Kicker style={{ marginTop: 24, color: hue }}>
                  {c.tag} · {c.count}
                </Kicker>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 8,
                    marginTop: 14,
                  }}
                >
                  {c.jewels.map((j, i) => (
                    <div
                      key={i}
                      style={{
                        aspectRatio: "4/5",
                        borderRadius: 8,
                        backgroundImage: `url(${j})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        border: `1px solid ${T.frostDiv}`,
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: `1px solid ${T.frostDiv}`,
                    fontSize: 12,
                    color: T.fg2,
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ color: T.fg3 }}>Followed because of: </span>
                  <em style={{ fontFamily: T.fontCaslon, color: T.fg1 }}>
                    &quot;the only complete first-pressing run I&apos;ve ever seen&quot;
                  </em>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
