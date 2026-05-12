"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker, MIcon } from "@/components/marketing/primitives"
import { Reveal } from "@/lib/marketing/Reveal"
import { TIERS } from "@/lib/marketing/pricing-data"

const PRO_TIER = TIERS.find((t) => t.id === "pro")!
const COLLECTOR_TIER = TIERS.find((t) => t.id === "collector")!

const PRO_FEE = 0.1
const COLLECTOR_FEE = 0.07
const PRO_ANNUAL_COST = PRO_TIER.annualPrice ?? 89
const COLLECTOR_ANNUAL_COST = COLLECTOR_TIER.annualPrice ?? 249
const ANNUAL_COST_DELTA = COLLECTOR_ANNUAL_COST - PRO_ANNUAL_COST
const FEE_GAP = PRO_FEE - COLLECTOR_FEE
/** Annual GMV at which the fee discount equals the tier upgrade cost */
const BREAKEVEN_GMV = ANNUAL_COST_DELTA / FEE_GAP

/**
 * MarketplaceFeeMath — visual fee comparison plus a "what tier is right
 * for me?" calculator. The breakeven math is real (per pricing-model.md):
 * Collector pays for itself at roughly $1k/mo GMV for any seller.
 */
export function MarketplaceFeeMath() {
  const [monthlyGmv, setMonthlyGmv] = useState(1500)
  const annualGmv = monthlyGmv * 12

  const proAnnualFees = annualGmv * PRO_FEE
  const collectorAnnualFees = annualGmv * COLLECTOR_FEE
  const annualSavingsAtCollector = proAnnualFees - collectorAnnualFees
  const netDeltaCollectorVsPro = annualSavingsAtCollector - ANNUAL_COST_DELTA

  const recommendation = useMemo(() => {
    if (monthlyGmv === 0) return "free"
    if (annualGmv * 12 < BREAKEVEN_GMV * 0.6) return "pro"
    if (netDeltaCollectorVsPro >= 0) return "collector"
    return "pro"
  }, [monthlyGmv, annualGmv, netDeltaCollectorVsPro])

  return (
    <section
      data-marketing-section="fee-math"
      style={{
        padding: "140px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Reveal>
          <div style={{ textAlign: "center" }}>
            <Kicker color={T.volt}>FEE MATH</Kicker>
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
              Collector{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.volt,
                }}
              >
                pays for itself
              </em>{" "}
              at modest GMV.
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
              The 3% gap between Pro&rsquo;s 10% marketplace fee and Collector&rsquo;s
              7% covers the tier upgrade for any seller doing roughly $1,000/mo
              or more. Move the slider to see your number.
            </p>
          </div>
        </Reveal>

        <div
          data-marketing-grid="fee-math"
          style={{
            marginTop: 64,
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: 40,
            alignItems: "start",
          }}
        >
          <div
            data-marketing-fee-calculator
            style={{
              padding: 32,
              border: `1px solid ${T.frostBorderStrong}`,
              borderRadius: 18,
              background: "rgba(214,235,253,0.02)",
            }}
          >
            <Kicker color={T.volt}>YOUR MARKETPLACE</Kicker>
            <div
              style={{
                marginTop: 16,
                fontFamily: T.fontDisplay,
                fontSize: 56,
                lineHeight: 0.96,
                letterSpacing: -1.4,
                color: T.fg1,
              }}
            >
              ${monthlyGmv.toLocaleString()}
              <span
                style={{
                  fontFamily: T.fontMono,
                  fontSize: 14,
                  color: T.fg2,
                  marginLeft: 10,
                }}
              >
                / month
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={20000}
              step={250}
              value={monthlyGmv}
              onChange={(e) => setMonthlyGmv(Number(e.target.value))}
              aria-label="Monthly GMV"
              style={{
                width: "100%",
                marginTop: 28,
                accentColor: T.volt,
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: T.fontMono,
                fontSize: 11,
                color: T.fg3,
                letterSpacing: 0.4,
                marginTop: 6,
              }}
            >
              <span>$0</span>
              <span>$10K</span>
              <span>$20K</span>
            </div>

            <div
              style={{
                marginTop: 32,
                paddingTop: 24,
                borderTop: `1px solid ${T.frostDiv}`,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <FeeStat
                label="Pro · 10% fee"
                value={`$${proAnnualFees.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                sub={`+ $${PRO_ANNUAL_COST}/yr subscription`}
                tone={T.fg2}
              />
              <FeeStat
                label="Collector · 7% fee"
                value={`$${collectorAnnualFees.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                sub={`+ $${COLLECTOR_ANNUAL_COST}/yr subscription`}
                tone={T.volt}
                highlighted
              />
            </div>
          </div>

          <div
            data-marketing-fee-recommend
            style={{
              padding: 32,
              border: `1px solid ${T.voltBorder}`,
              borderRadius: 18,
              background: T.voltFill,
            }}
          >
            <Kicker color={T.volt}>RECOMMENDED</Kicker>
            <div
              style={{
                marginTop: 12,
                fontFamily: T.fontDisplay,
                fontSize: 44,
                lineHeight: 1,
                letterSpacing: -0.8,
                color: T.fg1,
              }}
            >
              {recommendation === "free" && "Free"}
              {recommendation === "pro" && "Pro"}
              {recommendation === "collector" && "Collector"}
            </div>
            <p
              style={{
                marginTop: 16,
                fontSize: 14.5,
                lineHeight: 1.55,
                color: T.fg1,
              }}
            >
              {recommendation === "free" && (
                <>
                  At $0 GMV the marketplace math is moot. Start free, see how
                  Vitrine fits before paying.
                </>
              )}
              {recommendation === "pro" && (
                <>
                  At ${monthlyGmv.toLocaleString()}/mo, Pro is the right call.
                  Trade unlocks, AI generations open up, fees stay at 10%. The
                  Collector fee discount doesn&rsquo;t cover the upgrade cost yet.
                </>
              )}
              {recommendation === "collector" && (
                <>
                  At ${monthlyGmv.toLocaleString()}/mo, Collector pays for
                  itself. The 3% fee discount saves you $
                  {annualSavingsAtCollector.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}{" "}
                  per year vs Pro &mdash; net of the $
                  {ANNUAL_COST_DELTA.toLocaleString()} subscription delta you&rsquo;re
                  ahead by $
                  {netDeltaCollectorVsPro.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                  .
                </>
              )}
            </p>
            <div
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: `1px solid ${T.voltBorder}`,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontFamily: T.fontMono,
                fontSize: 11,
                color: T.fg2,
                letterSpacing: 0.4,
              }}
            >
              <MIcon name="info" size={12} color={T.fg3} />
              BREAKEVEN &asymp; ${(BREAKEVEN_GMV / 12).toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{" "}
              / MONTH GMV
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

interface FeeStatProps {
  label: string
  value: string
  sub: string
  tone: string
  highlighted?: boolean
}

function FeeStat({ label, value, sub, tone, highlighted }: FeeStatProps) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        background: highlighted ? T.voltFill : "transparent",
        border: highlighted
          ? `1px solid ${T.voltBorder}`
          : `1px solid ${T.frostDiv}`,
      }}
    >
      <div
        style={{
          fontFamily: T.fontMono,
          fontSize: 10.5,
          color: tone,
          letterSpacing: 0.4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: T.fontDisplay,
          fontSize: 28,
          color: T.fg1,
          marginTop: 6,
          letterSpacing: -0.4,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: T.fontMono,
          fontSize: 10.5,
          color: T.fg3,
          marginTop: 4,
          letterSpacing: 0.4,
        }}
      >
        {sub.toUpperCase()}
      </div>
    </div>
  )
}
