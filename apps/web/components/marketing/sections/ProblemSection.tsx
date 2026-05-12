import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker } from "@/components/marketing/primitives"
import { PROBLEM_ARTIFACTS } from "@/lib/marketing/constants"
import { Reveal } from "@/lib/marketing/Reveal"
import { BrandTile } from "./BrandTile"

export function ProblemSection() {
  return (
    <section
      data-marketing-section="problem"
      style={{
        padding: "140px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          data-marketing-grid="problem-split"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 80,
            alignItems: "center",
          }}
        >
          <Reveal y={16}>
            <Kicker color={T.volt} style={{ marginBottom: 24 }}>THE PROBLEM IT SOLVES</Kicker>
            <h2
              data-marketing-section-title
              style={{
                fontFamily: T.fontDisplay,
                fontWeight: 400,
                fontSize: 72,
                lineHeight: 0.96,
                letterSpacing: -1.6,
                margin: 0,
              }}
            >
              You already have a system.
              <br />
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.volt,
                }}
              >
                It's just everywhere.
              </em>
            </h2>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.55,
                color: T.fg2,
                marginTop: 28,
                maxWidth: 480,
              }}
            >
              A spreadsheet from 2019. Four thousand camera-roll photos. A
              wishlist in Notes. Fourteen eBay tabs cross-referencing comps by
              hand. You're not unorganized — you're{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                }}
              >
                fragmented.
              </em>
            </p>
            <div
              style={{
                marginTop: 32,
                padding: "16px 20px",
                borderLeft: `2px solid ${T.volt}`,
                fontFamily: T.fontCaslon,
                fontStyle: "italic",
                fontSize: 18,
                color: T.fg1,
                lineHeight: 1.4,
              }}
            >
              "I've been meaning to put this all in one place for six years."
              <div
                style={{
                  fontFamily: T.fontGrotesk,
                  fontStyle: "normal",
                  fontSize: 10,
                  letterSpacing: 1.4,
                  color: T.fg3,
                  marginTop: 10,
                }}
              >
                EVERY COLLECTOR · EVENTUALLY
              </div>
            </div>
          </Reveal>

          <div
            data-marketing-grid="problem-artifacts"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            {PROBLEM_ARTIFACTS.map((a, i) => (
              <Reveal key={a.slot} delay={120 + i * 100} y={16}>
                <div
                  data-marketing-problem-card
                  style={{
                    padding: 22,
                    borderRadius: 12,
                    border: `1px solid ${T.frostDiv}`,
                    background: "rgba(214,235,253,0.015)",
                    transform: i % 2 ? "rotate(0.6deg)" : "rotate(-0.4deg)",
                    minHeight: 150,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <BrandTile slot={a.slot} size={32} />
                    <Kicker style={{ fontSize: 9 }}>{a.kicker}</Kicker>
                  </div>
                  <div
                    style={{
                      fontFamily: T.fontMono,
                      fontSize: 13,
                      color: T.fg1,
                      marginTop: 16,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {a.body}
                  </div>
                  <div
                    style={{
                      fontFamily: T.fontMono,
                      fontSize: 10.5,
                      color: T.fg3,
                      marginTop: 8,
                      whiteSpace: "pre-line",
                      lineHeight: 1.5,
                    }}
                  >
                    {a.sub}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
