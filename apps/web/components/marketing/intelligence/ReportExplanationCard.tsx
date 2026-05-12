"use client"

import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker, MIcon, Pill } from "@/components/marketing/primitives"
import { Reveal } from "@/lib/marketing/Reveal"
import type { ReportExplanation } from "@/lib/marketing/intelligence-data"

const TONE_MAP: Record<ReportExplanation["toneKey"], string> = {
  volt: T.volt,
  blue: T.blue,
  cyan: T.cyan,
}

const FILL_MAP: Record<ReportExplanation["toneKey"], string> = {
  volt: T.voltFill,
  blue: T.blueFill,
  cyan: T.cyanFill,
}

const BORDER_MAP: Record<ReportExplanation["toneKey"], string> = {
  volt: T.voltBorder,
  blue: T.blueBorder,
  cyan: T.cyanBorder,
}

interface ReportExplanationCardProps {
  /** Section number kicker (e.g. "VAR", "AAR", "PULSE") */
  numberLabel: string
  /** Whether to render PRO pill on the section */
  pro?: boolean
  /** The explanation data */
  data: ReportExplanation
  /** Whether to render image-on-left or right (rotates per section) */
  reverse?: boolean
}

/**
 * ReportExplanationCard — shared layout used by the VAR / AAR / Pulse
 * explanation sections. Each section owns the data; the card owns the
 * presentation (kicker + title + body + bullets + sample output mock).
 */
export function ReportExplanationCard({
  numberLabel,
  pro = true,
  data,
  reverse = false,
}: ReportExplanationCardProps) {
  const tone = TONE_MAP[data.toneKey]
  const fill = FILL_MAP[data.toneKey]
  const border = BORDER_MAP[data.toneKey]

  return (
    <section
      data-marketing-section={`report-${data.name.toLowerCase()}`}
      style={{
        padding: "120px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          data-marketing-grid="report-explanation"
          data-reverse={reverse}
          style={{
            display: "grid",
            gridTemplateColumns: reverse ? "1fr 1fr" : "1fr 1fr",
            gap: 56,
            alignItems: "center",
          }}
        >
          <Reveal y={20} style={{ order: reverse ? 2 : 1 }}>
            <div data-marketing-report-copy>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <Kicker color={tone}>{numberLabel} &middot; {data.name}</Kicker>
                {pro && (
                  <Pill variant="volt" style={{ fontSize: 9.5 }}>
                    PRO
                  </Pill>
                )}
              </div>
              <h2
                style={{
                  fontFamily: T.fontDisplay,
                  fontWeight: 400,
                  fontSize: 56,
                  lineHeight: 0.98,
                  letterSpacing: -1.2,
                  margin: 0,
                  textWrap: "balance",
                }}
              >
                {data.tagline}
              </h2>
              <div
                style={{
                  marginTop: 14,
                  fontFamily: T.fontMono,
                  fontSize: 11,
                  letterSpacing: 0.5,
                  color: T.fg3,
                  textTransform: "uppercase",
                }}
              >
                {data.longName}
              </div>
              <p
                style={{
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: T.fg2,
                  marginTop: 28,
                  maxWidth: 540,
                }}
              >
                {data.body}
              </p>
              <ul
                style={{
                  listStyle: "none",
                  margin: "32px 0 0",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                {data.bullets.map((b) => (
                  <li
                    key={b.label}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                    }}
                  >
                    <span
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: `1px solid ${border}`,
                        background: fill,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: tone,
                        flexShrink: 0,
                      }}
                    >
                      <MIcon name={b.icon} size={16} color={tone} />
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
                        {b.label}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: T.fg2,
                          marginTop: 2,
                          lineHeight: 1.5,
                        }}
                      >
                        {b.sub}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120} y={20} style={{ order: reverse ? 1 : 2 }}>
            <SampleOutputMock data={data} tone={tone} fill={fill} border={border} />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

interface SampleMockProps {
  data: ReportExplanation
  tone: string
  fill: string
  border: string
}

function SampleOutputMock({ data, tone, fill, border }: SampleMockProps) {
  return (
    <div
      data-marketing-report-mock
      style={{
        padding: 28,
        borderRadius: 18,
        border: `1px solid ${border}`,
        background: "rgba(214,235,253,0.02)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          paddingBottom: 16,
          borderBottom: `1px solid ${T.frostDiv}`,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            background: tone,
            boxShadow: `0 0 8px ${tone}`,
            animation: "pulseGlow 1.4s ease-in-out infinite",
          }}
        />
        <Kicker color={tone}>{data.sampleTitle}</Kicker>
      </div>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {data.sampleRows.map((row, i) => (
          <li
            key={row.label}
            style={{
              padding: "16px 0",
              borderBottom:
                i === data.sampleRows.length - 1
                  ? "none"
                  : `1px solid ${T.frostDiv}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span
              style={{
                fontFamily: T.fontMono,
                fontSize: 11,
                color: T.fg3,
                letterSpacing: 0.4,
                textTransform: "uppercase",
              }}
            >
              {row.label}
            </span>
            <span
              style={{
                fontFamily: T.fontInter,
                fontSize: 14,
                color: T.fg1,
                fontWeight: 500,
                textAlign: "right",
              }}
            >
              {row.value}
            </span>
          </li>
        ))}
      </ul>
      <div
        style={{
          marginTop: 16,
          padding: "10px 14px",
          borderRadius: 8,
          background: fill,
          border: `1px solid ${border}`,
          fontFamily: T.fontMono,
          fontSize: 10.5,
          color: tone,
          letterSpacing: 0.4,
          textAlign: "center",
        }}
      >
        SAMPLE OUTPUT &middot; ILLUSTRATIVE
      </div>
    </div>
  )
}
