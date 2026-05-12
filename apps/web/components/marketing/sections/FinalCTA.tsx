"use client"

import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import {
  AppStoreBadge,
  Kicker,
  MIcon,
} from "@/components/marketing/primitives"
import {
  useInView,
  usePrefersReducedMotion,
} from "@/lib/marketing/hooks"
import { Reveal } from "@/lib/marketing/Reveal"
import { HOW_STEPS } from "@/lib/marketing/constants"

export function FinalCTA() {
  const reduced = usePrefersReducedMotion()
  const [lineRef, lineIn] = useInView<HTMLDivElement>({ threshold: 0.3 })

  return (
    <section
      id="download"
      data-marketing-section="cta"
      style={{
        padding: "160px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -200,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 900,
          background: `radial-gradient(circle, ${T.voltFill} 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 2 }}>
        <Reveal y={16}>
          <div style={{ textAlign: "center" }}>
            <Kicker color={T.volt} style={{ marginBottom: 24 }}>
              GET STARTED FOR FREE
            </Kicker>
            <h2
              data-marketing-cta-title
              style={{
                fontFamily: T.fontDisplay,
                fontWeight: 400,
                fontSize: 76,
                lineHeight: 0.96,
                letterSpacing: -1.6,
                margin: 0,
              }}
            >
              One piece
              <br />
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.volt,
                }}
              >
                gets you started.
              </em>
            </h2>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.55,
                color: T.fg2,
                maxWidth: 720,
                marginTop: 24,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              No bulk import. No spreadsheet migration. No setup wizard. Catalog one piece and the rest follows.
            </p>
          </div>
        </Reveal>

        <div
          ref={lineRef}
          data-marketing-grid="how-steps"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 0,
            marginTop: 80,
            position: "relative",
          }}
        >
          <svg
            data-marketing-cta-line
            style={{
              position: "absolute",
              top: 60,
              left: "16%",
              width: "68%",
              height: 2,
              pointerEvents: "none",
              overflow: "visible",
            }}
            viewBox="0 0 1000 2"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="ctaLine" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor={T.frostDiv} />
                <stop offset="0.5" stopColor={T.volt} />
                <stop offset="1" stopColor={T.frostDiv} />
              </linearGradient>
            </defs>
            <line
              x1="0"
              y1="1"
              x2="1000"
              y2="1"
              stroke="url(#ctaLine)"
              strokeWidth="1"
              strokeDasharray="1000"
              strokeDashoffset={reduced || lineIn ? 0 : 1000}
              style={{
                transition: "stroke-dashoffset 1400ms cubic-bezier(.2,.8,.2,1)",
              }}
            />
          </svg>
          {HOW_STEPS.map((s, i) => (
            <Reveal key={s.n} delay={300 + i * 220} y={20}>
              <div
                data-marketing-cta-step
                style={{
                  padding: "0 28px",
                  position: "relative",
                  borderLeft: i === 0 ? "none" : `1px solid ${T.frostDiv}`,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    border: `1px solid ${T.voltBorder}`,
                    background: T.void,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: T.fontDisplay,
                    fontSize: 22,
                    color: T.volt,
                    position: "relative",
                    zIndex: 2,
                    boxShadow: `0 0 0 6px ${T.void}, 0 0 24px ${T.voltFill}`,
                  }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    fontFamily: T.fontDisplay,
                    fontSize: 36,
                    letterSpacing: -0.6,
                    marginTop: 28,
                    color: T.fg1,
                  }}
                >
                  {s.title}
                </div>
                <p
                  style={{
                    fontSize: 14.5,
                    lineHeight: 1.6,
                    color: T.fg2,
                    marginTop: 14,
                    maxWidth: 320,
                  }}
                >
                  {s.body}
                </p>
                <div
                  style={{
                    marginTop: 20,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    borderRadius: 9999,
                    border: `1px solid ${T.frostDiv}`,
                    background: "rgba(214,235,253,0.02)",
                    fontFamily: T.fontMono,
                    fontSize: 10.5,
                    color: T.fg2,
                    letterSpacing: 0.4,
                  }}
                >
                  <MIcon name="clock" size={11} color={T.fg3} />
                  {s.hint}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <div
          data-marketing-cta-actions
          style={{
            display: "flex",
            gap: 14,
            marginTop: 72,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <AppStoreBadge store="apple" />
          <AppStoreBadge store="google" />
        </div>
      </div>
    </section>
  )
}
