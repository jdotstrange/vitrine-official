"use client"

import * as React from "react"
import { useState } from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker, MIcon } from "@/components/marketing/primitives"
import { COMPARISON_ROWS, TIERS } from "@/lib/marketing/pricing-data"

/**
 * ComparisonTable — collapsible "see full comparison" feature matrix.
 * Closed by default so the cards remain the primary surface; opens on
 * demand for users who want every row.
 */
export function ComparisonTable() {
  const [open, setOpen] = useState(false)

  return (
    <section
      data-marketing-section="comparison"
      style={{
        padding: "60px 40px 100px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "24px 0",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: T.fg1,
          }}
        >
          <div>
            <Kicker color={T.volt}>FULL FEATURE MATRIX</Kicker>
            <div
              style={{
                marginTop: 8,
                fontFamily: T.fontDisplay,
                fontSize: 32,
                letterSpacing: -0.6,
                color: T.fg1,
              }}
            >
              See everything that ships at every tier
            </div>
          </div>
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              border: `1px solid ${T.frostBorderStrong}`,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: open ? T.volt : T.fg2,
              transform: open ? "rotate(45deg)" : "rotate(0)",
              transition: "transform 280ms, color 200ms",
              flexShrink: 0,
            }}
          >
            <MIcon name="plus" size={18} />
          </span>
        </button>

        {open && (
          <div
            data-marketing-comparison-table
            style={{
              marginTop: 32,
              border: `1px solid ${T.frostDiv}`,
              borderRadius: 14,
              overflow: "hidden",
              animation: "feedFadeIn 320ms ease-out",
            }}
          >
            <ComparisonHeader />
            {COMPARISON_ROWS.map((row, i) => {
              if (row.group) {
                return <GroupHeader key={`g-${i}`} label={row.group} />
              }
              return <DataRow key={`r-${i}`} row={row} />
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function ComparisonHeader() {
  return (
    <div
      data-marketing-comparison-header
      style={{
        display: "grid",
        gridTemplateColumns: "1.6fr repeat(3, 1fr)",
        gap: 0,
        background: "rgba(214,235,253,0.03)",
        borderBottom: `1px solid ${T.frostDiv}`,
        position: "sticky",
        top: 0,
        zIndex: 1,
      }}
    >
      <div
        style={{
          padding: "20px 24px",
          fontFamily: T.fontMono,
          fontSize: 11,
          letterSpacing: 0.6,
          color: T.fg3,
          textTransform: "uppercase",
        }}
      >
        Capability
      </div>
      {TIERS.map((tier) => (
        <div
          key={tier.id}
          style={{
            padding: "20px 16px",
            textAlign: "center",
            borderLeft: `1px solid ${T.frostDiv}`,
            background:
              tier.id === "pro" ? "rgba(255,236,194,0.03)" : "transparent",
          }}
        >
          <div
            style={{
              fontFamily: T.fontDisplay,
              fontSize: 18,
              color: T.fg1,
              letterSpacing: -0.3,
            }}
          >
            {tier.name}
          </div>
          <div
            style={{
              fontFamily: T.fontMono,
              fontSize: 11,
              color: tier.id === "pro" ? T.volt : T.fg3,
              marginTop: 4,
              letterSpacing: 0.4,
            }}
          >
            {tier.monthlyPrice == null || tier.monthlyPrice === 0
              ? "FREE"
              : `$${tier.monthlyPrice.toFixed(2)}/mo`}
          </div>
        </div>
      ))}
    </div>
  )
}

function GroupHeader({ label }: { label: string }) {
  return (
    <div
      data-marketing-comparison-group
      style={{
        gridColumn: "1 / -1",
        padding: "20px 24px",
        background: "rgba(214,235,253,0.015)",
        borderBottom: `1px solid ${T.frostDiv}`,
        fontFamily: T.fontMono,
        fontSize: 10.5,
        letterSpacing: 0.6,
        color: T.volt,
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>
  )
}

interface DataRowProps {
  row: (typeof COMPARISON_ROWS)[number]
}

function DataRow({ row }: DataRowProps) {
  return (
    <div
      data-marketing-comparison-row
      style={{
        display: "grid",
        gridTemplateColumns: "1.6fr repeat(3, 1fr)",
        gap: 0,
        borderBottom: `1px solid ${T.frostDiv}`,
      }}
    >
      <div
        style={{
          padding: "16px 24px",
          fontSize: 14,
          color: T.fg1,
          lineHeight: 1.4,
        }}
      >
        {row.label}
      </div>
      {(["free", "pro", "collector"] as const).map((tier) => {
        const v = row.values[tier]
        const isDash = v === "—" || v === ""
        return (
          <div
            key={tier}
            style={{
              padding: "16px 12px",
              textAlign: "center",
              borderLeft: `1px solid ${T.frostDiv}`,
              fontSize: 13,
              color: isDash ? T.fg3 : T.fg1,
              background:
                tier === "pro" ? "rgba(255,236,194,0.025)" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {v === "Yes" ? (
              <MIcon name="check" size={16} color={T.volt} />
            ) : (
              v || "—"
            )}
          </div>
        )
      })}
    </div>
  )
}
