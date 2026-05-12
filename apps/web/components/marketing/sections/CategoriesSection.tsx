"use client"

import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import {
  useInView,
  usePrefersReducedMotion,
} from "@/lib/marketing/hooks"
import { CATS } from "@/lib/marketing/constants"
import { SectionHeader } from "./SectionHeader"

export function CategoriesSection() {
  const reduced = usePrefersReducedMotion()
  const [gridRef, gridIn] = useInView<HTMLDivElement>({ threshold: 0.15 })
  const totalRows = Math.ceil(CATS.length / 6)

  return (
    <section
      data-marketing-section="categories"
      style={{
        padding: "160px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          num="07"
          kicker="BREADTH"
          title={
            <>
              Thirty-eight ways
              <br />
              to{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.volt,
                }}
              >
                collect.
              </em>
            </>
          }
          sub="Every category gets its own field schema, its own comp logic, its own community. From PSA-graded rookies to '60s lighters — Vitrine treats each domain on its own terms."
        />

        <div
          ref={gridRef}
          data-marketing-grid="categories"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 0,
            marginTop: 80,
            border: `1px solid ${T.frostDiv}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {CATS.map((c, i) => {
            const lit = reduced || gridIn
            const delay = reduced ? 0 : i * 35
            const row = Math.floor(i / 6)
            const isLastRow = row === totalRows - 1
            return (
              <div
                key={c.name}
                style={{
                  padding: "22px 18px",
                  borderRight:
                    (i + 1) % 6 === 0 ? "none" : `1px solid ${T.frostDiv}`,
                  borderBottom: isLastRow ? "none" : `1px solid ${T.frostDiv}`,
                  minHeight: 92,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  background:
                    c.hot && lit
                      ? `linear-gradient(135deg, ${T.voltFill} 0%, transparent 70%)`
                      : "transparent",
                  cursor: "pointer",
                  opacity: lit ? 1 : 0,
                  transform: lit ? "translateY(0)" : "translateY(8px)",
                  transition: `opacity 480ms cubic-bezier(.2,.8,.2,1) ${delay}ms, transform 480ms cubic-bezier(.2,.8,.2,1) ${delay}ms, background 280ms`,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  {c.hot && (
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: 3,
                        background: T.volt,
                        boxShadow: lit ? `0 0 6px ${T.volt}` : "none",
                        transition: `box-shadow 480ms ${delay + 200}ms`,
                      }}
                    />
                  )}
                  <div
                    style={{
                      fontFamily: T.fontDisplay,
                      fontSize: 16,
                      color: T.fg1,
                      letterSpacing: -0.1,
                    }}
                  >
                    {c.name}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 10.5,
                    color: T.fg3,
                    marginTop: 8,
                  }}
                >
                  {c.count}
                </div>
              </div>
            )
          })}
        </div>

        <div
          style={{
            marginTop: 28,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: T.fontMono,
              fontSize: 11,
              color: T.fg3,
              letterSpacing: 0.4,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: 3,
                background: T.volt,
                marginRight: 8,
              }}
            />
            HIGHLIGHTED = LIVE WITH 500+ PIECES CATALOGED
          </div>
          <div
            style={{
              fontFamily: T.fontGrotesk,
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 1.4,
              color: T.fg2,
            }}
          >
            DON&apos;T SEE YOURS?{" "}
            <span style={{ color: T.volt, cursor: "pointer" }}>
              REQUEST A CATEGORY →
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
