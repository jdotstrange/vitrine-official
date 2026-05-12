"use client"

import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker, MIcon } from "@/components/marketing/primitives"
import { Reveal } from "@/lib/marketing/Reveal"
import { BEFORE_AFTER_FIELDS } from "@/lib/marketing/intelligence-data"

/**
 * BeforeAfterComparison — the rhetorical "before / after" beat. Side-by-
 * side: what every other cataloging app makes you fill in by hand vs the
 * exact same set of fields produced by Looking Glass from one photo.
 */
export function BeforeAfterComparison() {
  return (
    <section
      id="before-after"
      data-marketing-section="before-after"
      style={{
        padding: "140px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
        background:
          "linear-gradient(180deg, transparent 0%, rgba(255,236,194,0.02) 50%, transparent 100%)",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center" }}>
            <Kicker color={T.volt}>BEFORE / AFTER</Kicker>
            <h2
              style={{
                fontFamily: T.fontDisplay,
                fontWeight: 400,
                fontSize: 64,
                lineHeight: 0.96,
                letterSpacing: -1.4,
                margin: "20px 0 0",
                textWrap: "balance",
              }}
            >
              The same fields,{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.volt,
                }}
              >
                done two ways.
              </em>
            </h2>
          </div>
        </Reveal>

        <div
          data-marketing-grid="before-after"
          style={{
            marginTop: 64,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 24,
          }}
        >
          <Side
            kicker="EVERY OTHER APP"
            title="What you type, by hand"
            tone={T.fg2}
            highlighted={false}
            footnote="Eight to twelve minutes per piece. Multiplied by your collection size."
          >
            <ol
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 0,
                borderTop: `1px solid ${T.frostDiv}`,
              }}
            >
              {BEFORE_AFTER_FIELDS.map((f, i) => (
                <li
                  key={f.field}
                  style={{
                    padding: "14px 0",
                    borderBottom: `1px solid ${T.frostDiv}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    color: T.fg2,
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      border: `1px dashed ${T.frostBorderStrong}`,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontFamily: T.fontMono,
                      fontSize: 10,
                      color: T.fg3,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: 14.5 }}>{f.field}</span>
                  <span style={{ marginLeft: "auto" }}>
                    <MIcon name="pencil" size={13} color={T.fg3} />
                  </span>
                </li>
              ))}
            </ol>
          </Side>

          <Side
            kicker="VITRINE"
            title="What the engine produced"
            tone={T.volt}
            highlighted
            footnote="Roughly four seconds per piece. The schema fits the photo, automatically."
          >
            <ol
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 0,
                borderTop: `1px solid ${T.voltBorder}`,
              }}
            >
              {BEFORE_AFTER_FIELDS.map((f) => (
                <li
                  key={f.field}
                  style={{
                    padding: "14px 0",
                    borderBottom: `1px solid ${T.voltBorder}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    color: T.fg1,
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 4,
                      background: T.voltFill,
                      border: `1px solid ${T.voltBorder}`,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: T.volt,
                      flexShrink: 0,
                    }}
                  >
                    <MIcon name="check" size={12} color={T.volt} />
                  </span>
                  <span style={{ fontSize: 14.5 }}>{f.field}</span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: T.fontMono,
                      fontSize: 12,
                      color: T.fg2,
                    }}
                  >
                    {f.extracted}
                  </span>
                </li>
              ))}
            </ol>
          </Side>
        </div>
      </div>
    </section>
  )
}

interface SideProps {
  kicker: string
  title: string
  tone: string
  highlighted: boolean
  footnote: string
  children: React.ReactNode
}

function Side({
  kicker,
  title,
  tone,
  highlighted,
  footnote,
  children,
}: SideProps) {
  return (
    <div
      data-marketing-before-after-side
      data-side={highlighted ? "after" : "before"}
      style={{
        padding: 32,
        borderRadius: 18,
        border: `1px solid ${highlighted ? T.voltBorder : T.frostDiv}`,
        background: highlighted
          ? "rgba(255,236,194,0.04)"
          : "rgba(214,235,253,0.01)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Kicker color={tone}>{kicker}</Kicker>
      <h3
        style={{
          fontFamily: T.fontDisplay,
          fontSize: 32,
          letterSpacing: -0.6,
          color: T.fg1,
          margin: "12px 0 24px",
        }}
      >
        {title}
      </h3>
      <div style={{ flex: 1 }}>{children}</div>
      <p
        style={{
          marginTop: 24,
          fontFamily: T.fontCaslon,
          fontStyle: "italic",
          fontSize: 14.5,
          color: T.fg2,
          lineHeight: 1.55,
        }}
      >
        {footnote}
      </p>
    </div>
  )
}
