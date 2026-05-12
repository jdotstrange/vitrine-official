"use client"

import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker, MIcon } from "@/components/marketing/primitives"
import { Reveal } from "@/lib/marketing/Reveal"
import { VIEW_VS_GENERATE } from "@/lib/marketing/pricing-data"

/**
 * ViewVsGenerateSection — the keystone narrative beat. The single most
 * marketable insight in the pricing model: every user can SEE every AI
 * report; only paid tiers can GENERATE them.
 *
 * Reframes the upgrade decision from "pay to access" (a wall) to "pay to
 * create" (a workflow), which is much easier emotionally and is the
 * mechanism that drives upgrade desire across the marketplace.
 */
export function ViewVsGenerateSection() {
  return (
    <section
      data-marketing-section="view-vs-generate"
      style={{
        padding: "140px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
        borderBottom: `1px solid ${T.frostDiv}`,
        background:
          "linear-gradient(180deg, transparent 0%, rgba(255,236,194,0.02) 50%, transparent 100%)",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center" }}>
            <Kicker color={T.volt}>THE KEYSTONE</Kicker>
            <h2
              style={{
                fontFamily: T.fontDisplay,
                fontWeight: 400,
                fontSize: 76,
                lineHeight: 0.96,
                letterSpacing: -1.6,
                margin: "24px 0 0",
                textWrap: "balance",
              }}
            >
              Everyone{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.volt,
                }}
              >
                sees
              </em>{" "}
              the AI reports.
              <br />
              Pro+{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.volt,
                }}
              >
                generates
              </em>{" "}
              them.
            </h2>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.55,
                color: T.fg2,
                marginTop: 24,
                maxWidth: 720,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              View is free. Generate is paid. Every Vitrine user — paid or not
              — sees VAR, AAR, and Pulse on marketplace listings, on showcases
              they follow, on pieces they bought. Pay to put those reports on
              your own pieces.
            </p>
          </div>
        </Reveal>

        <div
          data-marketing-grid="view-vs-generate"
          style={{
            marginTop: 80,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            border: `1px solid ${T.frostDiv}`,
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          <ColumnHeader
            label="View"
            sub="Every Vitrine user, free or paid"
            tone={T.fg2}
            icon="eye"
          />
          <ColumnHeader
            label="Generate"
            sub="Pro and Collector"
            tone={T.volt}
            icon="sparkles"
            highlighted
          />
          {VIEW_VS_GENERATE.map((row, i) => (
            <Row
              key={row.label}
              label={row.label}
              view={row.view}
              generate={row.generate}
              isLast={i === VIEW_VS_GENERATE.length - 1}
            />
          ))}
        </div>

        <p
          style={{
            marginTop: 32,
            textAlign: "center",
            fontFamily: T.fontCaslon,
            fontStyle: "italic",
            fontSize: 18,
            color: T.fg2,
            maxWidth: 760,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Reframes the upgrade. You&rsquo;re not paying for access. You&rsquo;re
          paying for the right to put your own pieces on the wall the rest of
          the network is already looking at.
        </p>
      </div>
    </section>
  )
}

interface ColumnHeaderProps {
  label: string
  sub: string
  tone: string
  icon: string
  highlighted?: boolean
}

function ColumnHeader({
  label,
  sub,
  tone,
  icon,
  highlighted,
}: ColumnHeaderProps) {
  return (
    <div
      style={{
        gridColumn: "auto",
        padding: "24px 28px",
        background: highlighted
          ? "rgba(255,236,194,0.04)"
          : "transparent",
        borderBottom: `1px solid ${T.frostDiv}`,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <span
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          border: `1px solid ${highlighted ? T.voltBorder : T.frostBorderStrong}`,
          background: highlighted ? T.voltFill : "transparent",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: tone,
        }}
      >
        <MIcon name={icon} size={18} color={tone} />
      </span>
      <div>
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 26,
            letterSpacing: -0.5,
            color: T.fg1,
            lineHeight: 1.1,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: T.fontMono,
            fontSize: 11,
            letterSpacing: 0.4,
            color: T.fg3,
            marginTop: 2,
          }}
        >
          {sub.toUpperCase()}
        </div>
      </div>
    </div>
  )
}

interface RowProps {
  label: string
  view: string
  generate: string
  isLast: boolean
}

function Row({ label, view, generate, isLast }: RowProps) {
  return (
    <>
      <Cell text={view} label={label} isLast={isLast} side="view" />
      <Cell text={generate} label={label} isLast={isLast} side="generate" />
    </>
  )
}

interface CellProps {
  text: string
  label: string
  isLast: boolean
  side: "view" | "generate"
}

function Cell({ text, label, isLast, side }: CellProps) {
  const highlighted = side === "generate"
  return (
    <div
      style={{
        padding: "24px 28px",
        background: highlighted
          ? "rgba(255,236,194,0.025)"
          : "transparent",
        borderBottom: isLast ? "none" : `1px solid ${T.frostDiv}`,
      }}
    >
      <div
        style={{
          fontFamily: T.fontMono,
          fontSize: 10.5,
          letterSpacing: 0.4,
          color: highlighted ? T.volt : T.fg3,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 15,
          lineHeight: 1.5,
          color: T.fg1,
        }}
      >
        {text}
      </div>
    </div>
  )
}
