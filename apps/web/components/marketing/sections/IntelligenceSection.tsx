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
function useIntelPhase(): number {
  const reduced = usePrefersReducedMotion()
  useTicker(80)
  if (reduced) return 1
  return (Date.now() % INTEL_CYCLE_MS) / INTEL_CYCLE_MS
}

export function IntelligenceSection() {
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
          <Kicker style={{ marginBottom: 24, color: T.fg3 }}>
            INTRODUCING:{" "}
            <span
              style={{
                color: T.volt,
                letterSpacing: 2.4,
                fontStyle: "italic",
              }}
            >
              LOOKING GLASS
            </span>
          </Kicker>
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
            Tell us nothing.{" "}
            <em
              style={{
                fontFamily: T.fontDisplay,
                fontStyle: "italic",
                color: T.volt,
              }}
            >
              We read the piece.
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
            Drop in the photo &mdash; not the brand, not the year, not the
            cert number, not what corner of what taxonomy you think it
            belongs in. Vitrine&rsquo;s Looking Glass classifies the
            category, detects every trait overlay, extracts cert numbers
            verbatim off the label, and writes the listing in the time
            it takes to slide the piece back into the case. Every free
            user gets this on day one.
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
            <TheaterInputPanel />
            <ExtractionArtifact />
          </div>
        </Reveal>

        <div
          data-marketing-intel-stat
          style={{
            marginTop: 28,
            padding: "16px 22px",
            borderTop: `1px solid ${T.frostDiv}`,
            borderBottom: `1px solid ${T.frostDiv}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 14,
          }}
        >
          <div
            style={{
              fontFamily: T.fontCaslon,
              fontStyle: "italic",
              fontSize: 15,
              color: T.fg2,
            }}
          >
            The hardest thing about cataloging your collection just became the easiest.
          </div>
          <div
            style={{
              fontFamily: T.fontMono,
              fontSize: 10.5,
              color: T.fg3,
              letterSpacing: 0.5,
            }}
          >
            AVG EXTRACTION · 30.0s · AVG CONFIDENCE · 94%
          </div>
        </div>

        <div
          data-marketing-grid="intel-tiles"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginTop: 80,
          }}
        >
          <Reveal delay={120} y={16}>
            <CapabilityTile
              num="01"
              kicker="CLASSIFY"
              title="Thirty-eight domains. Deep."
              body={
                <>
                  Not just &ldquo;trading card.&rdquo; Trading Card → Sports →
                  Single Card → Graded. Comic → Silver Age → Key Issue. Watch →
                  Sports Chronograph → Vintage. The AI locates your piece in the
                  right corner of the whole taxonomy.
                </>
              }
            >
              <TaxonomyChip
                items={["COLLECTIBLE", "SIGNED MEMORABILIA", "BASEBALL", "OBL · AUTO"]}
              />
            </CapabilityTile>
          </Reveal>

          <Reveal delay={220} y={16}>
            <CapabilityTile
              num="02"
              kicker="DETECT TRAITS"
              title="Five overlays, category-aware."
              body="Graded, autographed, game-used, framed, sealed. Each trait the AI detects unlocks a dedicated field schema — subgrades for graded pieces, signer + ink + placement for autographs, LOA presence for game-used — in a single pass."
            >
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginTop: 6,
                }}
              >
                <Pill variant="graded">GRADED</Pill>
                <Pill variant="signed">AUTOGRAPHED</Pill>
                <Pill variant="game_used">GAME-USED</Pill>
                <Pill variant="rookie">ROOKIE</Pill>
              </div>
            </CapabilityTile>
          </Reveal>

          <Reveal delay={320} y={16}>
            <CapabilityTile
              num="03"
              kicker="EXTRACT"
              title="Verbatim off the label."
              body="Cert numbers, grades, grade qualifiers, subgrades, inscriptions, ink color, signature placement, auth companies — pulled as written. When the AI isn't sure, it flags the field for your review instead of guessing."
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
                  <span style={{ color: T.fg3 }}>cert_number</span>{" "}
                  <span style={{ color: T.volt }}>&quot;AZ58051&quot;</span>
                </div>
                <div>
                  <span style={{ color: T.fg3 }}>grade</span>{" "}
                  <span style={{ color: T.volt }}>&quot;PSA 10&quot;</span>
                </div>
                <div>
                  <span style={{ color: T.fg3 }}>inscription</span>{" "}
                  <span style={{ color: T.volt }}>&quot;24&quot;</span>
                </div>
              </div>
            </CapabilityTile>
          </Reveal>
        </div>

      </div>
    </section>
  )
}

function TheaterInputPanel() {
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
                  background:
                    "radial-gradient(ellipse at 40% 35%, #d4a574 0%, #7a5535 45%, #2a1a10 100%)",
                }}
              >
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
                  <path
                    d="M 30 42 Q 50 30, 70 42"
                    fill="none"
                    stroke="#a84a2a"
                    strokeWidth="0.6"
                  />
                  <path
                    d="M 30 58 Q 50 70, 70 58"
                    fill="none"
                    stroke="#a84a2a"
                    strokeWidth="0.6"
                  />
                  {[36, 40, 44, 48, 52, 56, 60, 64].map((x) => (
                    <line
                      key={`t${x}`}
                      x1={x - 1}
                      y1="42"
                      x2={x + 1}
                      y2="40"
                      stroke="#a84a2a"
                      strokeWidth="0.3"
                    />
                  ))}
                  {[36, 40, 44, 48, 52, 56, 60, 64].map((x) => (
                    <line
                      key={`b${x}`}
                      x1={x - 1}
                      y1="58"
                      x2={x + 1}
                      y2="60"
                      stroke="#a84a2a"
                      strokeWidth="0.3"
                    />
                  ))}
                  <path
                    d="M 38 54 Q 43 48, 48 53 T 58 52 Q 62 50, 65 55"
                    fill="none"
                    stroke="rgba(30,45,80,0.7)"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                  />
                </svg>
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

function ExtractionArtifact() {
  const p = useIntelPhase()
  const fields: [string, string, number][] = [
    ["Subject", "Luis Robert", INTEL_STAGES.FIELDS + 0.0],
    ["Signer", "Luis Robert Jr.", INTEL_STAGES.FIELDS + 0.015],
    ["Signature count", "1", INTEL_STAGES.FIELDS + 0.03],
    ["Ink color", "Blue ballpoint", INTEL_STAGES.FIELDS + 0.045],
    ["Placement", "Sweet spot", INTEL_STAGES.FIELDS + 0.06],
    ["Inscription", '"24"', INTEL_STAGES.FIELDS + 0.075],
    ["Auth company", "PSA/DNA", INTEL_STAGES.FIELDS + 0.09],
    ["Cert #", "AZ58051", INTEL_STAGES.FIELDS + 0.105],
    ["Ball type", "Official Carolina League", INTEL_STAGES.FIELDS + 0.12],
    ["Physical COA", "Yes · visible", INTEL_STAGES.FIELDS + 0.135],
  ]

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
          Signed Memorabilia <span style={{ color: T.fg3 }}>›</span> Baseball{" "}
          <span style={{ color: T.fg3 }}>›</span>{" "}
          <span style={{ color: T.volt }}>OBL · Auto</span>
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
          {[
            { label: "AUTOGRAPHED", at: INTEL_STAGES.TRAITS + 0.0, variant: "signed" as const },
            { label: "AUTHENTICATED", at: INTEL_STAGES.TRAITS + 0.04, variant: "graded" as const },
            { label: "ROOKIE-ERA", at: INTEL_STAGES.TRAITS + 0.08, variant: "rookie" as const },
          ].map((t) => {
            const on = p >= t.at
            return (
              <span
                key={t.label}
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
          <Kicker style={{ fontSize: 9 }}>AUTOGRAPH OVERLAY · 10 FIELDS</Kicker>
          <Kicker style={{ fontSize: 9, color: T.fg3 }}>
            {Math.min(
              10,
              Math.max(0, Math.floor((p - INTEL_STAGES.FIELDS) / 0.015) + 1)
            )}
            /10
          </Kicker>
        </div>
        <div>
          {fields.map(([k, v, at], i) => {
            const on = p >= at
            return (
              <div
                key={k}
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
                <Kicker style={{ fontSize: 9 }}>{k}</Kicker>
                <div
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 11.5,
                    color: on ? T.fg1 : T.fg3,
                    letterSpacing: 0.2,
                  }}
                >
                  {on ? v : "— awaiting —"}
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
          {p >= INTEL_STAGES.TITLE
            ? "Luis Robert Signed Official Carolina League Baseball (PSA/DNA)"
            : "— awaiting —"}
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
          <Pill variant="for_sale">CONFIDENCE · HIGH</Pill>
          <span
            style={{
              fontFamily: T.fontMono,
              fontSize: 10.5,
              color: T.fg3,
              letterSpacing: 0.4,
            }}
          >
            10 / 10 fields
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
    <div
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
          "transform 280ms cubic-bezier(.2,.8,.2,1), border-color 200ms",
        minHeight: 360,
        display: "flex",
        flexDirection: "column",
      }}
    >
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
      <Kicker style={{ marginTop: 14, color: T.fg1 }}>{kicker}</Kicker>
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
    </div>
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
