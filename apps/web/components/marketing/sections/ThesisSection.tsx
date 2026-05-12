import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker } from "@/components/marketing/primitives"
import { PILLARS } from "@/lib/marketing/constants"
import { Reveal } from "@/lib/marketing/Reveal"

export function ThesisSection() {
  return (
    <section
      data-marketing-section="thesis"
      style={{
        padding: "160px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <Reveal y={16}>
          <Kicker color={T.volt} style={{ marginBottom: 24 }}>VITRINE IS</Kicker>
          <h2
            data-marketing-section-title
            style={{
              fontFamily: T.fontDisplay,
              fontWeight: 400,
              fontSize: 88,
              lineHeight: 0.94,
              letterSpacing: -2,
              margin: 0,
              maxWidth: 1100,
            }}
          >
            Not a tracker. Not a feed.
            <br />
            Not a marketplace.{" "}
            <em
              style={{
                fontFamily: T.fontDisplay,
                fontStyle: "italic",
                color: T.volt,
              }}
            >
              A vitrine.
            </em>
          </h2>
          <p
            style={{
              fontSize: 19,
              lineHeight: 1.55,
              color: T.fg2,
              marginTop: 32,
              maxWidth: 760,
            }}
          >
            Vitrine is the home for everything you collect — built around four
            jobs the existing tools handle in pieces and never together.
          </p>
        </Reveal>

        <div
          data-marketing-grid="thesis-pillars"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginTop: 80,
          }}
        >
          {PILLARS.map((p, i) => (
            <Reveal key={p.kicker} delay={120 + i * 100} y={16}>
              <div
                data-marketing-thesis-pillar
                style={{
                  padding: 28,
                  borderRadius: 16,
                  position: "relative",
                  border: `1px solid ${
                    p.state === "soon" ? T.frostDiv : T.frostBorderStrong
                  }`,
                  background:
                    p.state === "soon"
                      ? "rgba(214,235,253,0.01)"
                      : "rgba(214,235,253,0.025)",
                  opacity: p.state === "soon" ? 0.62 : 1,
                  minHeight: 320,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  data-marketing-thesis-num
                  style={{
                    fontFamily: T.fontDisplay,
                    fontSize: 56,
                    lineHeight: 0.9,
                    letterSpacing: -1.2,
                    color: p.state === "soon" ? T.fg3 : T.volt,
                  }}
                >
                  0{i + 1}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 16,
                  }}
                >
                  <Kicker style={{ color: p.state === "soon" ? T.fg3 : T.fg1 }}>
                    {p.kicker}
                  </Kicker>
                  {p.state === "soon" && (
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 9999,
                        border: `1px solid ${T.frostDiv}`,
                        fontFamily: T.fontGrotesk,
                        fontWeight: 700,
                        fontSize: 8.5,
                        letterSpacing: 1.2,
                        color: T.fg3,
                      }}
                    >
                      SOON
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: T.fontDisplay,
                    fontSize: 22,
                    letterSpacing: -0.3,
                    marginTop: 12,
                    color: T.fg1,
                  }}
                >
                  {p.title}
                </div>
                <p
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    color: T.fg2,
                    marginTop: 14,
                  }}
                >
                  {p.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
