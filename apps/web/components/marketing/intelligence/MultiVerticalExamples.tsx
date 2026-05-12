"use client"

import * as React from "react"
import { useState } from "react"
import Image from "next/image"
import { T } from "@/lib/marketing/tokens"
import { Kicker, Pill } from "@/components/marketing/primitives"
import { EXTRACTION_EXAMPLES } from "@/lib/marketing/intelligence-data"

/**
 * MultiVerticalExamples — proves the "any category" claim with six
 * concrete extraction examples. The user can flip between verticals to
 * see the same engine apply to wildly different domain languages.
 */
export function MultiVerticalExamples() {
  const [active, setActive] = useState(0)
  const example = EXTRACTION_EXAMPLES[active]

  return (
    <section
      id="multi-vertical"
      data-marketing-section="multi-vertical"
      style={{
        padding: "140px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ textAlign: "center" }}>
          <Kicker color={T.volt}>EXTRACTION EXAMPLES</Kicker>
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
            One photo.{" "}
            <em
              style={{
                fontFamily: T.fontDisplay,
                fontStyle: "italic",
                color: T.volt,
              }}
            >
              Six categories.
            </em>{" "}
            Same engine.
          </h2>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.55,
              color: T.fg2,
              marginTop: 20,
              maxWidth: 640,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Each panel below is what Looking Glass produces from a single
            photograph. No typing. No category selection. The engine reads
            the piece and fills its category&rsquo;s schema.
          </p>
        </div>

        <div
          data-marketing-vertical-tabs
          role="tablist"
          aria-label="Vertical examples"
          style={{
            marginTop: 56,
            display: "flex",
            justifyContent: "center",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {EXTRACTION_EXAMPLES.map((ex, i) => {
            const isActive = i === active
            return (
              <button
                key={ex.vertical}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(i)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 9999,
                  border: `1px solid ${isActive ? T.voltBorder : T.frostDiv}`,
                  background: isActive ? T.voltFill : "transparent",
                  color: isActive ? T.volt : T.fg2,
                  fontFamily: T.fontGrotesk,
                  fontWeight: 600,
                  fontSize: 12.5,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "background 200ms, color 200ms, border-color 200ms",
                }}
              >
                {ex.vertical}
              </button>
            )
          })}
        </div>

        <div
          data-marketing-grid="extraction"
          style={{
            marginTop: 48,
            display: "grid",
            gridTemplateColumns: "0.95fr 1.05fr",
            gap: 24,
            alignItems: "stretch",
            animation: "feedFadeIn 320ms ease-out",
          }}
          key={example.vertical}
        >
          <div
            data-marketing-extract-photo
            style={{
              position: "relative",
              minHeight: 480,
              borderRadius: 18,
              overflow: "hidden",
              border: `1px solid ${T.frostBorderStrong}`,
              background: "rgba(214,235,253,0.02)",
            }}
          >
            <Image
              src={example.photo}
              alt={example.title}
              fill
              sizes="(max-width: 1024px) 100vw, 600px"
              style={{ objectFit: "cover" }}
              unoptimized
            />
            <div
              style={{
                position: "absolute",
                top: 16,
                left: 16,
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <Pill variant="volt" style={{ fontSize: 9.5 }}>
                CLASSIFIED &middot; {example.category}
              </Pill>
              <Pill variant="for_sale" style={{ fontSize: 9.5 }}>
                {example.classifyConfidence}% CONFIDENCE
              </Pill>
            </div>
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "32px 24px 20px",
                background:
                  "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.85) 100%)",
              }}
            >
              <div
                style={{
                  fontFamily: T.fontDisplay,
                  fontSize: 24,
                  letterSpacing: -0.4,
                  color: T.fg1,
                  lineHeight: 1.15,
                }}
              >
                {example.title}
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
                {example.sub.toUpperCase()}
              </div>
            </div>
          </div>

          <div
            data-marketing-extract-fields
            style={{
              padding: 32,
              borderRadius: 18,
              border: `1px solid ${T.frostBorderStrong}`,
              background: "rgba(214,235,253,0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <Kicker color={T.volt}>EXTRACTED FIELDS</Kicker>
              <div
                style={{
                  fontFamily: T.fontMono,
                  fontSize: 10.5,
                  color: T.fg3,
                  letterSpacing: 0.4,
                }}
              >
                {example.fields.length} ATTRIBUTES &middot; SINGLE PHOTO
              </div>
            </div>
            <div
              style={{
                marginTop: 24,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 4,
                borderTop: `1px solid ${T.frostDiv}`,
              }}
            >
              {example.fields.map((f) => (
                <FieldRow
                  key={f.label}
                  label={f.label}
                  value={f.value}
                  confidence={f.confidence ?? 0}
                />
              ))}
            </div>
            <div
              style={{
                marginTop: 24,
                paddingTop: 16,
                borderTop: `1px solid ${T.frostDiv}`,
                fontFamily: T.fontCaslon,
                fontStyle: "italic",
                fontSize: 14.5,
                color: T.fg2,
                lineHeight: 1.55,
              }}
            >
              You typed nothing. The engine produced this in roughly 3.8
              seconds.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

interface FieldRowProps {
  label: string
  value: string
  confidence: number
}

function FieldRow({ label, value, confidence }: FieldRowProps) {
  const tone =
    confidence >= 95 ? T.volt : confidence >= 88 ? T.fg1 : T.fg2
  return (
    <div
      style={{
        padding: "12px 14px",
        borderBottom: `1px solid ${T.frostDiv}`,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          fontFamily: T.fontMono,
          fontSize: 9.5,
          letterSpacing: 0.4,
          color: T.fg3,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: T.fontInter,
          fontSize: 13.5,
          color: T.fg1,
          fontWeight: 500,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: T.fontMono,
          fontSize: 9.5,
          color: tone,
          letterSpacing: 0.4,
        }}
      >
        {confidence}%
      </div>
    </div>
  )
}
