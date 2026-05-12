"use client"

import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import {
  FrostCard,
  Kicker,
  MIcon,
  Pill,
} from "@/components/marketing/primitives"
import { Reveal } from "@/lib/marketing/Reveal"
import { SectionHeader } from "@/components/marketing/sections/SectionHeader"

const SHARE_FEATURES: { icon: string; label: string; sub: string }[] = [
  {
    icon: "link",
    label: "Permanent share URLs",
    sub: "Every showcase, collection, and piece has its own /s/ resolver",
  },
  {
    icon: "image",
    label: "Beautiful link previews",
    sub: "Open Graph + Twitter card rendering, optimized for iMessage / DM",
  },
  {
    icon: "lock",
    label: "Public, private, or link-only",
    sub: "You choose who can see what — including unlisted by-link visibility",
  },
  {
    icon: "smartphone",
    label: "Recipient doesn't need the app",
    sub: "Resolver pages render the showcase directly in any browser",
  },
]

/**
 * ShareArea — frictionless sharing story. The /s/c/, /s/s/, /s/p/
 * resolvers are real production code; this section is the marketing
 * narrative that explains them.
 */
export function ShareArea() {
  return (
    <section
      id="share"
      data-marketing-section="share"
      style={{
        padding: "140px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          num="05"
          kicker="SHARE"
          title={
            <>
              Drop the link.{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.volt,
                }}
              >
                They see it.
              </em>
            </>
          }
          sub="A showcase URL pasted into iMessage renders as a full preview card. Open it on any phone or desktop and you get the showcase — without the app, without an account, without friction."
        />
        <div
          data-marketing-grid="share-split"
          style={{
            marginTop: 80,
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: 48,
            alignItems: "center",
          }}
        >
          <Reveal y={20}>
            <FrostCard hover={false} style={{ padding: 28 }}>
              <Kicker color={T.volt}>
                IMESSAGE PREVIEW &middot; vitrine.app/s/s/blue-note-ogs
              </Kicker>
              <div
                data-marketing-share-preview
                style={{
                  marginTop: 18,
                  borderRadius: 14,
                  overflow: "hidden",
                  border: `1px solid ${T.frostBorderStrong}`,
                  background: "rgba(0,0,0,0.4)",
                }}
              >
                <div
                  style={{
                    aspectRatio: "1.91 / 1",
                    backgroundImage:
                      "linear-gradient(135deg, rgba(214,235,253,0.08) 0%, rgba(214,235,253,0.02) 100%)",
                    position: "relative",
                  }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundImage: `linear-gradient(${T.frostDiv} 1px, transparent 1px), linear-gradient(90deg, ${T.frostDiv} 1px, transparent 1px)`,
                      backgroundSize: "44px 44px",
                      opacity: 0.4,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 18,
                      left: 18,
                      right: 18,
                    }}
                  >
                    <Pill variant="volt">SHOWCASE &middot; ON VITRINE</Pill>
                    <div
                      style={{
                        marginTop: 10,
                        fontFamily: T.fontDisplay,
                        fontSize: 28,
                        letterSpacing: -0.4,
                        color: T.fg1,
                        lineHeight: 1.1,
                      }}
                    >
                      Blue Note OGs
                    </div>
                    <div
                      style={{
                        fontFamily: T.fontMono,
                        fontSize: 11,
                        color: T.fg2,
                        marginTop: 4,
                        letterSpacing: 0.4,
                      }}
                    >
                      22 PIECES &middot; CROWN: COLTRANE &middot; BLUE TRAIN
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    padding: "12px 14px",
                    borderTop: `1px solid ${T.frostDiv}`,
                    fontFamily: T.fontMono,
                    fontSize: 10.5,
                    color: T.fg3,
                    letterSpacing: 0.4,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>VITRINE.APP</span>
                  <span>OPEN IN VITRINE &rarr;</span>
                </div>
              </div>
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: `1px solid ${T.frostDiv}`,
                  fontFamily: T.fontCaslon,
                  fontStyle: "italic",
                  fontSize: 14,
                  color: T.fg2,
                }}
              >
                Recipient sees the preview natively. No install, no signup,
                no &ldquo;tap to download&rdquo; wall.
              </div>
            </FrostCard>
          </Reveal>
          <Reveal delay={120} y={20}>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {SHARE_FEATURES.map((f) => (
                <li
                  key={f.label}
                  style={{
                    padding: "20px 0",
                    borderBottom: `1px solid ${T.frostDiv}`,
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      height: 36,
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
                    <MIcon name={f.icon} size={16} color={T.volt} />
                  </span>
                  <div>
                    <div
                      style={{
                        fontFamily: T.fontInter,
                        fontSize: 15,
                        fontWeight: 600,
                        color: T.fg1,
                      }}
                    >
                      {f.label}
                    </div>
                    <div
                      style={{
                        fontSize: 13.5,
                        lineHeight: 1.55,
                        color: T.fg2,
                        marginTop: 2,
                      }}
                    >
                      {f.sub}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
