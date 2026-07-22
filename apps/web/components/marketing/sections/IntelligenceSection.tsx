"use client"

import * as React from "react"
import { useState } from "react"
import { T } from "@/lib/marketing/tokens"
import {
  Kicker,
  MIcon,
  Pill,
} from "@/components/marketing/primitives"
import {
  usePrefersReducedMotion,
  useTicker,
} from "@/lib/marketing/hooks"
import { Reveal } from "@/lib/marketing/Reveal"
import { INTEL_CYCLE_MS, INTEL_STAGES } from "@/lib/marketing/constants"
import {
  MOCK_INTEL_SHOWCASE,
  type LiveIntelShowcase,
} from "@/lib/marketing/intel-showcase"

function useIntelPhase(): number {
  const reduced = usePrefersReducedMotion()
  useTicker(80)
  if (reduced) return 1
  return (Date.now() % INTEL_CYCLE_MS) / INTEL_CYCLE_MS
}

function useActiveShowcaseIndex(count: number): number {
  const reduced = usePrefersReducedMotion()
  useTicker(80)
  if (count <= 1) return 0
  if (reduced) return 0
  return Math.floor(Date.now() / INTEL_CYCLE_MS) % count
}

interface IntelligenceSectionProps {
  showcases?: LiveIntelShowcase[]
}

export function IntelligenceSection({ showcases }: IntelligenceSectionProps) {
  const pool =
    showcases && showcases.length > 0 ? showcases : [MOCK_INTEL_SHOWCASE]
  const activeIndex = useActiveShowcaseIndex(pool.length)
  const showcase = pool[activeIndex]!
  return (
    <section
      id="intelligence"
      data-marketing-section="intelligence"
      style={{
        padding: "160px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-12%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 1100,
          height: 640,
          pointerEvents: "none",
          background: `radial-gradient(ellipse at center, ${T.voltFill} 0%, transparent 65%)`,
          opacity: 0.55,
        }}
      />

      <div
        style={{ maxWidth: 1320, margin: "0 auto", position: "relative" }}
      >
        <Reveal y={16}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "2px 8px",
                borderRadius: 9999,
                border: `1px solid ${T.oliveBorder}`,
                background: T.oliveFill,
                fontFamily: T.fontGrotesk,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1.2,
                color: T.olive,
                textTransform: "uppercase" as const,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: T.olive,
                  boxShadow: `0 0 6px ${T.olive}`,
                  animation: "pulseGlow 1.4s ease-in-out infinite",
                  flexShrink: 0,
                }}
              />
              Now Live
            </span>
            <span
              style={{
                fontFamily: T.fontInter,
                fontSize: 13,
                fontWeight: 500,
                color: T.fg1,
              }}
            >
              Looking Glass (v1)
            </span>
          </div>
          <h2
            data-marketing-section-title
            style={{
              fontFamily: T.fontDisplay,
              fontWeight: 400,
              fontSize: 76,
              lineHeight: 0.96,
              letterSpacing: -1.6,
              margin: 0,
            }}
          >
            AI powered OCR data extraction.{" "}
            <em
              style={{
                fontFamily: T.fontDisplay,
                fontStyle: "italic",
                color: T.volt,
              }}
            >
              Engineered by real collectors.
            </em>
          </h2>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.55,
              color: T.fg2,
              maxWidth: 720,
              marginTop: 24,
              marginBottom: 80,
            }}
          >
            Architected by collectors who were tired of filling
            in confusing fields by hand. One photo is all it takes &mdash;
            Looking Glass identifies your piece, pulls the cert number, detects the grade,
            identifies a signature, and crafts a full listing.
            No taxonomy guessing, no manual data entry,
            no subscription wall. Free at every level.
          </p>
        </Reveal>

        <Reveal delay={120} y={16}>
          <div
            data-marketing-grid="intel-theater"
            style={{
              display: "grid",
              gridTemplateColumns: "0.95fr 1.05fr",
              gap: 28,
              marginTop: 0,
              alignItems: "stretch",
            }}
          >
            <TheaterInputPanel key={showcase.id} showcase={showcase} />
            <ExtractionArtifact key={showcase.id} showcase={showcase} />
          </div>
        </Reveal>

        <Reveal delay={100} y={16}>
          <div style={{ marginTop: 96, maxWidth: 760 }}>
            <h3
              style={{
                fontFamily: T.fontDisplay,
                fontWeight: 400,
                fontSize: 48,
                lineHeight: 1,
                letterSpacing: -1,
                margin: 0,
                color: T.fg1,
              }}
            >
              From record to intelligence.
            </h3>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.55,
                color: T.fg2,
                marginTop: 18,
                marginBottom: 0,
              }}
            >
              Looking Glass creates the collector-grade record. VAR, AAR, and
              Market Pulse turn that record into documentation, assessment,
              and live market context.
            </p>
          </div>
        </Reveal>

        <div
          data-marketing-grid="intel-tiles"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginTop: 48,
          }}
        >
          <Reveal delay={120} y={16} style={{ height: "100%" }}>
            <CapabilityTile
              num="01"
              kicker="DOCUMENT"
              title="Vitrine Analysis Report."
              body={
                <>
                  VAR turns the confirmed record into a structured
                  documentation report: extraction data, trait evidence, gaps,
                  population context, auction references, and a unique report
                  ID. Not an appraisal. Not authentication. The cataloging
                  record, fully contextualized.
                </>
              }
            >
              <TaxonomyChip
                items={["REPORT_ID · VAR-2049", "EVIDENCE MAPPED"]}
              />
            </CapabilityTile>
          </Reveal>

          <Reveal delay={220} y={16} style={{ height: "100%" }}>
            <CapabilityTile
              num="02"
              kicker="COMPARE"
              title="Autograph Assessment Report."
              body="AAR searches trusted authenticated examples, then compares the signature across formation, flow, baseline, placement, ink, medium, and inscription patterns. The result is directional: consistent, inconclusive, or inconsistent — never a verdict."
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 6,
                }}
              >
                <Pill variant="green">CONSISTENT</Pill>
                <span
                  style={{
                    alignSelf: "center",
                    fontFamily: T.fontMono,
                    fontSize: 10,
                    color: T.fg3,
                    letterSpacing: 0.5,
                  }}
                >
                  formal auth recommended
                </span>
              </div>
            </CapabilityTile>
          </Reveal>

          <Reveal delay={320} y={16} style={{ height: "100%" }}>
            <CapabilityTile
              num="03"
              kicker="READ THE MARKET"
              title="Market Pulse."
              body="Pulse turns live market data into an analyst brief: fresh vs. stale pricing, absorption rate, seller consensus, listing tempo, scarcity, census data, auction results, and source-attributed market context."
            >
              <div
                style={{
                  marginTop: 6,
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.45)",
                  border: `1px solid ${T.frostDiv}`,
                  fontFamily: T.fontMono,
                  fontSize: 11.5,
                  color: T.fg1,
                  lineHeight: 1.9,
                }}
              >
                <div>
                  <span style={{ color: T.fg3 }}>signal</span>{" "}
                  <span style={{ color: T.volt }}>&quot;fresh pricing diverging&quot;</span>
                </div>
                <div>
                  <span style={{ color: T.fg3 }}>absorption</span>{" "}
                  <span style={{ color: T.volt }}>&quot;+6.0%&quot;</span>
                </div>
                <div>
                  <span style={{ color: T.fg3 }}>source_tier</span>{" "}
                  <span style={{ color: T.volt }}>&quot;factual&quot;</span>
                </div>
              </div>
            </CapabilityTile>
          </Reveal>
        </div>

      </div>
    </section>
  )
}

function TheaterInputPanel({ showcase }: { showcase: LiveIntelShowcase }) {
  const p = useIntelPhase()
  const stages = [
    { at: INTEL_STAGES.PHOTOS, label: "Photos loaded" },
    { at: INTEL_STAGES.SCAN, label: "Scanning · 4 images" },
    { at: INTEL_STAGES.CLASSIFY, label: "Classifying · 38 domains" },
    { at: INTEL_STAGES.TRAITS, label: "Detecting traits" },
    { at: INTEL_STAGES.FIELDS, label: "Extracting fields" },
    { at: INTEL_STAGES.TITLE, label: "Writing listing" },
  ]
  let currentStageIdx = 0
  stages.forEach((s, i) => {
    if (p >= s.at) currentStageIdx = i
  })
  const scanning = p >= INTEL_STAGES.SCAN && p < INTEL_STAGES.CLASSIFY

  return (
    <div
      data-marketing-intel-panel
      style={{
        borderRadius: 22,
        overflow: "hidden",
        position: "relative",
        border: `1px solid ${T.frostBorder}`,
        background: "linear-gradient(180deg, #0a0a0a 0%, #000 100%)",
        boxShadow:
          "0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "16px 20px 18px",
          borderBottom: `1px solid ${T.frostDiv}`,
          background: "rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Kicker style={{ fontSize: 9, color: T.fg3 }}>EXTRACTION · AI-LIVE</Kicker>
          <span
            style={{
              fontFamily: T.fontMono,
              fontSize: 10.5,
              color: T.volt,
              letterSpacing: 0.5,
            }}
          >
            {stages[currentStageIdx].label}
          </span>
        </div>
        <div
          style={{
            marginTop: 12,
            height: 4,
            borderRadius: 2,
            background: "rgba(214,235,253,0.08)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: `${p * 100}%`,
              background: `linear-gradient(90deg, rgba(232,224,212,0.40), ${T.volt})`,
              boxShadow: `0 0 12px rgba(232,224,212,0.55)`,
              transition: "width 200ms linear",
            }}
          />
        </div>
        <div
          data-marketing-intel-stages
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 10,
          }}
        >
          {["PHOTOS", "SCAN", "CLASSIFY", "TRAITS", "EXTRACT", "TITLE"].map(
            (s, i) => (
              <span
                key={s}
                style={{
                  fontFamily: T.fontGrotesk,
                  fontWeight: 700,
                  fontSize: 8.5,
                  letterSpacing: 1,
                  color: i <= currentStageIdx ? T.volt : T.fg3,
                }}
              >
                {s}
              </span>
            )
          )}
        </div>
      </div>

      <div style={{ padding: 20, position: "relative" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
            position: "relative",
          }}
        >
          {[0, 1, 2, 3].map((i) => {
            const appearAt = INTEL_STAGES.PHOTOS + i * 0.03
            const visible = p >= appearAt
            const photo = showcase.photos[i]
            return (
              <div
                key={i}
                style={{
                  aspectRatio: "4/5",
                  borderRadius: 10,
                  overflow: "hidden",
                  position: "relative",
                  border: `1px solid ${T.frostDiv}`,
                  opacity: visible ? 1 : 0.15,
                  transform: visible ? "scale(1)" : "scale(0.96)",
                  transition:
                    "opacity 260ms cubic-bezier(.2,.8,.2,1), transform 260ms cubic-bezier(.2,.8,.2,1)",
                  background: photo
                    ? `center / cover no-repeat url(${photo})`
                    : "radial-gradient(ellipse at 40% 35%, #d4a574 0%, #7a5535 45%, #2a1a10 100%)",
                }}
              >
                {!photo && (
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <defs>
                      <radialGradient id={`ballGrad-${i}`} cx="0.38" cy="0.32">
                        <stop offset="0" stopColor="#f8ecd4" />
                        <stop offset="1" stopColor="#c8a775" />
                      </radialGradient>
                    </defs>
                    <circle
                      cx="50"
                      cy="50"
                      r="32"
                      fill={`url(#ballGrad-${i})`}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="0.5"
                    />
                  </svg>
                )}
                <div
                  style={{
                    position: "absolute",
                    bottom: 6,
                    left: 8,
                    fontFamily: T.fontMono,
                    fontSize: 8.5,
                    color: "rgba(255,255,255,0.55)",
                    letterSpacing: 0.4,
                  }}
                >
                  IMG-{String(i + 1).padStart(2, "0")}
                </div>
                {scanning && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        height: 2,
                        top: `${
                          ((p - INTEL_STAGES.SCAN) /
                            (INTEL_STAGES.CLASSIFY - INTEL_STAGES.SCAN)) *
                          100
                        }%`,
                        background: `linear-gradient(90deg, transparent, ${T.volt}, transparent)`,
                        boxShadow: `0 0 16px ${T.volt}`,
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: `linear-gradient(180deg, rgba(232,224,212,0.10), transparent ${
                          ((p - INTEL_STAGES.SCAN) /
                            (INTEL_STAGES.CLASSIFY - INTEL_STAGES.SCAN)) *
                          100
                        }%)`,
                        pointerEvents: "none",
                      }}
                    />
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ExtractionArtifact({ showcase }: { showcase: LiveIntelShowcase }) {
  const p = useIntelPhase()
  const fieldCount = showcase.fields.length
  const fieldSpan = fieldCount > 1 ? (INTEL_STAGES.TITLE - INTEL_STAGES.FIELDS) / fieldCount : 0.015
  const fields = showcase.fields.map((field, i) => ({
    ...field,
    at: INTEL_STAGES.FIELDS + i * fieldSpan,
  }))
  const traitSpan =
    showcase.traits.length > 1
      ? (INTEL_STAGES.FIELDS - INTEL_STAGES.TRAITS) / showcase.traits.length
      : 0.04
  const classificationParts = showcase.classification.split(" › ")
  const classificationHead = classificationParts.slice(0, -1)
  const classificationTail = classificationParts[classificationParts.length - 1]

  return (
    <div
      data-marketing-intel-panel
      style={{
        borderRadius: 22,
        padding: 32,
        border: `1px solid ${T.frostBorder}`,
        background: "rgba(214,235,253,0.025)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <Kicker style={{ color: T.volt }}>EXTRACTION · AI-LIVE</Kicker>
          <div
            style={{
              fontFamily: T.fontMono,
              fontSize: 10,
              color: T.fg3,
              marginTop: 6,
              letterSpacing: 0.5,
            }}
          >
            STEP 03 · REVIEW
          </div>
        </div>
        <Pill variant="volt">GROUNDED</Pill>
      </div>

      <div
        style={{
          marginTop: 24,
          paddingBottom: 20,
          borderBottom: `1px solid ${T.frostDiv}`,
        }}
      >
        <Kicker style={{ fontSize: 9 }}>CLASSIFICATION</Kicker>
        <div
          style={{
            marginTop: 10,
            fontFamily: T.fontDisplay,
            fontSize: 22,
            letterSpacing: -0.3,
            opacity: p >= INTEL_STAGES.CLASSIFY ? 1 : 0.15,
            transform:
              p >= INTEL_STAGES.CLASSIFY ? "translateY(0)" : "translateY(6px)",
            transition:
              "opacity 360ms cubic-bezier(.2,.8,.2,1), transform 360ms cubic-bezier(.2,.8,.2,1)",
          }}
        >
          {classificationHead.map((part, i) => (
            <React.Fragment key={`${part}-${i}`}>
              {part}
              <span style={{ color: T.fg3 }}> › </span>
            </React.Fragment>
          ))}
          <span style={{ color: T.volt }}>{classificationTail}</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 20,
          paddingBottom: 18,
          borderBottom: `1px solid ${T.frostDiv}`,
        }}
      >
        <Kicker style={{ fontSize: 9 }}>TRAITS DETECTED</Kicker>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 12,
            flexWrap: "wrap",
          }}
        >
          {showcase.traits.map((t, i) => {
            const on = p >= INTEL_STAGES.TRAITS + i * traitSpan
            return (
              <span
                key={`${t.label}-${i}`}
                style={{
                  opacity: on ? 1 : 0.12,
                  transform: on ? "scale(1)" : "scale(0.92)",
                  transition:
                    "opacity 280ms cubic-bezier(.2,.8,.2,1), transform 280ms cubic-bezier(.2,.8,.2,1)",
                }}
              >
                <Pill variant={t.variant}>{t.label}</Pill>
              </span>
            )
          })}
        </div>
      </div>

      <div style={{ marginTop: 18, flex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <Kicker style={{ fontSize: 9 }}>
            EXTRACTED FIELDS · {fieldCount} FIELDS
          </Kicker>
          <Kicker style={{ fontSize: 9, color: T.fg3 }}>
            {Math.min(
              fieldCount,
              Math.max(0, Math.floor((p - INTEL_STAGES.FIELDS) / fieldSpan) + 1)
            )}
            /{fieldCount}
          </Kicker>
        </div>
        <div>
          {fields.map((field, i) => {
            const on = p >= field.at
            return (
              <div
                key={`${field.label}-${i}`}
                data-marketing-intel-field-row
                style={{
                  padding: "8px 0",
                  borderTop: i ? `1px solid ${T.frostDiv}` : "none",
                  display: "grid",
                  gridTemplateColumns: "150px 1fr",
                  gap: 12,
                  alignItems: "baseline",
                  opacity: on ? 1 : 0.15,
                  transform: on ? "translateY(0)" : "translateY(4px)",
                  transition:
                    "opacity 240ms cubic-bezier(.2,.8,.2,1), transform 240ms cubic-bezier(.2,.8,.2,1)",
                }}
              >
                <Kicker style={{ fontSize: 9 }}>{field.label}</Kicker>
                <div
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 11.5,
                    color: on ? T.fg1 : T.fg3,
                    letterSpacing: 0.2,
                  }}
                >
                  {on ? field.value : "— awaiting —"}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div
        style={{
          marginTop: 22,
          padding: 16,
          borderRadius: 12,
          background:
            p >= INTEL_STAGES.TITLE ? T.voltFill : "rgba(214,235,253,0.03)",
          border: `1px solid ${
            p >= INTEL_STAGES.TITLE ? T.voltBorder : T.frostDiv
          }`,
          transition: "background 400ms, border-color 400ms",
        }}
      >
        <Kicker
          style={{
            fontSize: 9,
            color: p >= INTEL_STAGES.TITLE ? T.volt : T.fg3,
          }}
        >
          LISTING TITLE · AI-GENERATED
        </Kicker>
        <div
          style={{
            marginTop: 8,
            fontFamily: T.fontDisplay,
            fontSize: 17,
            lineHeight: 1.3,
            letterSpacing: -0.2,
            color: p >= INTEL_STAGES.TITLE ? T.fg1 : T.fg3,
            opacity: p >= INTEL_STAGES.TITLE ? 1 : 0.5,
            transition: "color 300ms, opacity 300ms",
          }}
        >
          {p >= INTEL_STAGES.TITLE ? showcase.listingTitle : "— awaiting —"}
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            opacity: p >= INTEL_STAGES.TITLE ? 1 : 0.15,
            transition: "opacity 400ms",
          }}
        >
          <Pill variant="for_sale">CONFIDENCE · {showcase.confidence}</Pill>
          <span
            style={{
              fontFamily: T.fontMono,
              fontSize: 10.5,
              color: T.fg3,
              letterSpacing: 0.4,
            }}
          >
            {fieldCount} / {fieldCount} fields
          </span>
        </span>
        <span
          style={{
            fontFamily: T.fontMono,
            fontSize: 10.5,
            color: T.fg3,
            letterSpacing: 0.4,
          }}
        >
          {(p * 4.8).toFixed(1)}s
        </span>
      </div>
    </div>
  )
}

interface CapabilityTileProps {
  num: string
  kicker: string
  title: string
  body: React.ReactNode
  children: React.ReactNode
}

function CapabilityTile({ num, kicker, title, body, children }: CapabilityTileProps) {
  const [hover, setHover] = useState(false)
  return (
    <a
      href="/intelligence"
      data-marketing-intel-cap-tile
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 32,
        borderRadius: 18,
        position: "relative",
        border: `1px solid ${hover ? T.voltBorder : T.frostDiv}`,
        background: "rgba(214,235,253,0.018)",
        transition:
          "transform 280ms cubic-bezier(.2,.8,.2,1), border-color 200ms, background 200ms",
        transform: hover ? "translateY(-3px)" : "translateY(0)",
        minHeight: 360,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          width: 44,
          height: 44,
          borderRadius: 9999,
          border: `1px solid ${hover ? T.voltBorder : T.frostDiv}`,
          background: hover ? T.voltFill : "rgba(214,235,253,0.018)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: T.fontDisplay,
          fontSize: 30,
          lineHeight: 1,
          color: hover ? T.volt : T.fg3,
          transition:
            "color 200ms, transform 200ms, border-color 200ms, background 200ms",
          transform: hover ? "translate(3px, -3px) rotate(6deg)" : "translate(0, 0)",
        }}
      >
        ↗
      </span>
      <div
        style={{
          fontFamily: T.fontDisplay,
          fontSize: 56,
          lineHeight: 0.9,
          letterSpacing: -1.2,
          color: T.volt,
        }}
      >
        {num}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 14,
        }}
      >
        <Kicker style={{ color: T.fg1 }}>{kicker}</Kicker>
        <Pill variant="pro" style={{ fontSize: 9.5 }}>
          PRO+
        </Pill>
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
        {title}
      </div>
      <p
        style={{
          fontSize: 13.5,
          lineHeight: 1.55,
          color: T.fg2,
          marginTop: 12,
        }}
      >
        {body}
      </p>
      <div style={{ marginTop: "auto", paddingTop: 20 }}>{children}</div>
    </a>
  )
}

function TaxonomyChip({ items }: { items: string[] }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 10,
        background: "rgba(0,0,0,0.4)",
        border: `1px solid ${T.frostDiv}`,
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      {items.map((item, i) => (
        <React.Fragment key={item}>
          <span
            style={{
              fontFamily: T.fontGrotesk,
              fontWeight: 700,
              fontSize: 9.5,
              letterSpacing: 1.2,
              color: i === items.length - 1 ? T.volt : T.fg2,
            }}
          >
            {item}
          </span>
          {i < items.length - 1 && (
            <span style={{ color: T.fg3, fontSize: 11 }}>›</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
