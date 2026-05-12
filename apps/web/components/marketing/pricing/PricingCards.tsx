"use client"

import * as React from "react"
import { useState } from "react"
import Link from "next/link"
import { T } from "@/lib/marketing/tokens"
import { Kicker, MIcon, Pill } from "@/components/marketing/primitives"
import { TIERS, type PricingTier } from "@/lib/marketing/pricing-data"

const TONE_MAP: Record<PricingTier["toneKey"], string> = {
  fg2: T.fg2,
  volt: T.volt,
  blue: T.blue,
}

type Cycle = "monthly" | "annual"

/**
 * PricingCards — three-card pricing grid with monthly/annual toggle.
 * Pro is highlighted as the recommended tier; Free and Collector frame it
 * on either side. On mobile the cards stack and Pro stays first via order.
 */
export function PricingCards() {
  const [cycle, setCycle] = useState<Cycle>("annual")

  return (
    <section
      id="tiers"
      data-marketing-section="pricing-cards"
      style={{ padding: "60px 40px 100px" }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <CycleToggle cycle={cycle} onChange={setCycle} />
        <div
          data-marketing-grid="pricing-cards"
          style={{
            marginTop: 48,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            alignItems: "stretch",
          }}
        >
          {TIERS.map((tier) => (
            <PricingCard key={tier.id} tier={tier} cycle={cycle} />
          ))}
        </div>
        <p
          style={{
            marginTop: 40,
            textAlign: "center",
            fontFamily: T.fontMono,
            fontSize: 11,
            color: T.fg3,
            letterSpacing: 0.5,
          }}
        >
          NO CARD TO START · SWITCH TIERS ANYTIME · PRORATED CREDIT ON CHANGE
        </p>
      </div>
    </section>
  )
}

interface CycleToggleProps {
  cycle: Cycle
  onChange: (c: Cycle) => void
}

function CycleToggle({ cycle, onChange }: CycleToggleProps) {
  return (
    <div
      data-marketing-pricing-toggle
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        role="tablist"
        aria-label="Billing cycle"
        style={{
          display: "inline-flex",
          padding: 4,
          borderRadius: 9999,
          border: `1px solid ${T.frostDiv}`,
          background: "rgba(214,235,253,0.02)",
        }}
      >
        {(["monthly", "annual"] as Cycle[]).map((c) => {
          const active = c === cycle
          return (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(c)}
              style={{
                padding: "10px 22px",
                borderRadius: 9999,
                border: "none",
                background: active ? T.volt : "transparent",
                color: active ? T.void : T.fg2,
                fontFamily: T.fontInter,
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: 0.4,
                cursor: "pointer",
                textTransform: "capitalize",
                transition: "background 200ms, color 200ms",
              }}
            >
              {c}
              {c === "annual" && (
                <span
                  style={{
                    marginLeft: 8,
                    fontFamily: T.fontMono,
                    fontSize: 9.5,
                    letterSpacing: 0.6,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: active ? T.void : T.voltFill,
                    color: active ? T.volt : T.volt,
                  }}
                >
                  SAVE 25%
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface PricingCardProps {
  tier: PricingTier
  cycle: Cycle
}

function PricingCard({ tier, cycle }: PricingCardProps) {
  const tone = TONE_MAP[tier.toneKey]
  const isHighlighted = !!tier.highlighted
  const displayPrice = formatPrice(tier, cycle)
  const subPrice = formatSubPrice(tier, cycle)

  return (
    <div
      data-marketing-pricing-card
      data-tier={tier.id}
      data-highlighted={isHighlighted}
      style={{
        position: "relative",
        padding: "40px 32px 32px",
        borderRadius: 18,
        border: `1px solid ${isHighlighted ? T.voltBorder : T.frostDiv}`,
        background: isHighlighted
          ? "rgba(214,235,253,0.04)"
          : "rgba(214,235,253,0.01)",
        display: "flex",
        flexDirection: "column",
        gap: 24,
        boxShadow: isHighlighted
          ? `0 0 0 1px ${T.voltBorder}, 0 24px 64px -32px ${T.voltFill}`
          : "none",
      }}
    >
      {isHighlighted && (
        <div
          style={{
            position: "absolute",
            top: -12,
            left: 32,
          }}
        >
          <Pill variant="volt" style={{ fontSize: 10 }}>
            MOST POPULAR
          </Pill>
        </div>
      )}
      <div>
        <Kicker color={tone}>{tier.name.toUpperCase()}</Kicker>
        <div
          style={{
            marginTop: 12,
            fontFamily: T.fontDisplay,
            fontSize: 24,
            letterSpacing: -0.4,
            color: T.fg1,
            lineHeight: 1.15,
          }}
        >
          {tier.audience}
        </div>
      </div>
      <div data-marketing-pricing-price>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
          }}
        >
          <div
            style={{
              fontFamily: T.fontDisplay,
              fontSize: 56,
              lineHeight: 0.96,
              letterSpacing: -1.4,
              color: T.fg1,
            }}
          >
            {displayPrice}
          </div>
          {subPrice && (
            <div
              style={{
                fontFamily: T.fontMono,
                fontSize: 12,
                color: T.fg2,
              }}
            >
              {subPrice}
            </div>
          )}
        </div>
        {tier.id !== "free" && cycle === "annual" && tier.annualPrice && (
          <div
            style={{
              marginTop: 6,
              fontFamily: T.fontMono,
              fontSize: 11,
              color: T.fg3,
              letterSpacing: 0.4,
            }}
          >
            BILLED ${tier.annualPrice} / YEAR
          </div>
        )}
      </div>
      <p
        style={{
          fontSize: 13.5,
          lineHeight: 1.55,
          color: T.fg2,
          margin: 0,
          minHeight: 60,
        }}
      >
        {tier.tagline}
      </p>
      <Link
        href={tier.ctaHref}
        className={isHighlighted ? "cta-glow" : undefined}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          height: 48,
          borderRadius: 9999,
          background: isHighlighted ? T.volt : "transparent",
          color: isHighlighted ? T.void : T.fg1,
          border: isHighlighted ? "none" : `1px solid ${T.frostBorderStrong}`,
          fontFamily: T.fontInter,
          fontWeight: 600,
          fontSize: 13.5,
          textDecoration: "none",
          marginBottom: 8,
        }}
      >
        {tier.ctaLabel}
      </Link>
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: "20px 0 0",
          borderTop: `1px solid ${T.frostDiv}`,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {tier.highlights.map((h) => (
          <li
            key={h.label}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              fontSize: 13.5,
              lineHeight: 1.45,
              color: T.fg1,
            }}
          >
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: `1px solid ${T.voltBorder}`,
                background: T.voltFill,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: T.volt,
                flexShrink: 0,
                marginTop: 1,
              }}
            >
              <MIcon name={h.icon} size={12} color={T.volt} />
            </span>
            <span>{h.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatPrice(tier: PricingTier, cycle: Cycle): string {
  if (tier.monthlyPrice == null) return "Free"
  if (tier.monthlyPrice === 0) return "Free"
  if (cycle === "annual" && tier.annualMonthlyEffective != null) {
    return `$${tier.annualMonthlyEffective.toFixed(2)}`
  }
  return `$${tier.monthlyPrice.toFixed(2)}`
}

function formatSubPrice(tier: PricingTier, cycle: Cycle): string | null {
  if (tier.monthlyPrice == null || tier.monthlyPrice === 0) return null
  return cycle === "annual" ? "/ mo, billed yearly" : "/ month"
}
