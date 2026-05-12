"use client"

import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker, MIcon } from "@/components/marketing/primitives"
import { Reveal } from "@/lib/marketing/Reveal"
import { TECH_CREDIBILITY } from "@/lib/marketing/intelligence-data"

/**
 * TechnicalCredibility — engineering bona fides for the technical reader.
 * Rendered as a four-card grid below the user-facing report explanations
 * so the page closes its narrative with proof rather than just claim.
 */
export function TechnicalCredibility() {
  return (
    <section
      id="under-the-hood"
      data-marketing-section="tech-credibility"
      style={{
        padding: "140px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center" }}>
            <Kicker color={T.volt}>UNDER THE HOOD</Kicker>
            <h2
              style={{
                fontFamily: T.fontDisplay,
                fontWeight: 400,
                fontSize: 56,
                lineHeight: 0.98,
                letterSpacing: -1.2,
                margin: "20px 0 0",
                textWrap: "balance",
              }}
            >
              Why the engine&rsquo;s outputs{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.volt,
                }}
              >
                hold up.
              </em>
            </h2>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.55,
                color: T.fg2,
                marginTop: 20,
                maxWidth: 660,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Looking Glass is a multi-pass extraction pipeline backed by
              Gemini Flash, OCR on grader holders, and per-attribute
              confidence scoring. Built so the answer is defensible, not
              just confident.
            </p>
          </div>
        </Reveal>
        <div
          data-marketing-grid="tech-cards"
          style={{
            marginTop: 64,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {TECH_CREDIBILITY.map((card, i) => (
            <Reveal key={card.title} delay={120 + i * 80} y={16}>
              <div
                style={{
                  padding: 24,
                  borderRadius: 14,
                  border: `1px solid ${T.frostDiv}`,
                  background: "rgba(214,235,253,0.015)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  height: "100%",
                }}
              >
                <span
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    border: `1px solid ${T.voltBorder}`,
                    background: T.voltFill,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: T.volt,
                  }}
                >
                  <MIcon name={card.icon} size={20} color={T.volt} />
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: T.fontDisplay,
                      fontSize: 20,
                      letterSpacing: -0.3,
                      color: T.fg1,
                      lineHeight: 1.15,
                    }}
                  >
                    {card.title}
                  </div>
                  <p
                    style={{
                      marginTop: 10,
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: T.fg2,
                    }}
                  >
                    {card.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
