"use client"

import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import { MIcon } from "@/components/marketing/primitives"
import { FOUNDERS_PRICING } from "@/lib/marketing/pricing-data"

/**
 * FoundersPricingBanner — scarcity hook for the first-10K-Pro-users
 * lifetime price lock. Uses the cohort framing from the pricing model
 * so the urgency reads as honest math rather than marketing pressure.
 */
export function FoundersPricingBanner() {
  return (
    <section
      data-marketing-section="founders-pricing"
      style={{ padding: "0 40px", marginBottom: 40 }}
    >
      <div
        data-marketing-founders-banner
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "20px 28px",
          display: "flex",
          alignItems: "center",
          gap: 20,
          borderRadius: 14,
          border: `1px solid ${T.voltBorder}`,
          background: T.voltFill,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            background: T.volt,
            color: T.void,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <MIcon name="key" size={22} color={T.void} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: T.fontDisplay,
              fontSize: 22,
              letterSpacing: -0.4,
              color: T.fg1,
              lineHeight: 1.15,
            }}
          >
            {FOUNDERS_PRICING.headline}
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.5,
              color: T.fg2,
              marginTop: 6,
              maxWidth: 760,
            }}
          >
            {FOUNDERS_PRICING.body}
          </div>
        </div>
        <div
          data-marketing-founders-stat
          style={{
            textAlign: "right",
            paddingLeft: 20,
            borderLeft: `1px solid ${T.voltBorder}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: T.fontMono,
              fontSize: 10.5,
              color: T.volt,
              letterSpacing: 0.6,
            }}
          >
            FOUNDERS COHORT
          </div>
          <div
            style={{
              fontFamily: T.fontDisplay,
              fontSize: 26,
              color: T.fg1,
              marginTop: 4,
              letterSpacing: -0.4,
            }}
          >
            {FOUNDERS_PRICING.cohortSize.toLocaleString()} seats
          </div>
        </div>
      </div>
    </section>
  )
}
