"use client"

import * as React from "react"
import Link from "next/link"
import { T } from "@/lib/marketing/tokens"
import { Kicker, MIcon, Pill } from "@/components/marketing/primitives"
import { Reveal } from "@/lib/marketing/Reveal"
import { SectionHeader } from "@/components/marketing/sections/SectionHeader"

const TRADE_RAILS: { label: string; sub: string; pill: string; tone: string }[] = [
  {
    label: "BUY",
    sub: "Open marketplace listings on every category Vitrine supports",
    pill: "FOR SALE",
    tone: T.green,
  },
  {
    label: "SELL",
    sub: "Flip a piece in your vault to a marketplace listing in two taps",
    pill: "FOR SALE",
    tone: T.green,
  },
  {
    label: "TRADE",
    sub: "Negotiate piece-for-piece deals (or piece+cash) with other collectors",
    pill: "FOR TRADE",
    tone: T.blue,
  },
  {
    label: "NFST",
    sub: "Public-facing pieces explicitly marked Not For Sale or Trade",
    pill: "NFST",
    tone: T.fg1,
  },
]

/**
 * TradeArea — marketplace narrative. Buy / Sell / Trade with the per-
 * piece status signals that already live on every collection item. Fee
 * structure summary that links out to /pricing for the full math.
 */
export function TradeArea() {
  return (
    <section
      id="trade"
      data-marketing-section="trade"
      style={{
        padding: "140px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
        background:
          "linear-gradient(180deg, transparent 0%, rgba(214,235,253,0.02) 50%, transparent 100%)",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          num="06"
          kicker="TRADE"
          title={
            <>
              Status on{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.volt,
                }}
              >
                every piece.
              </em>
            </>
          }
          sub="The marketplace lives on the same vault as the catalog. For Sale, For Trade, Sell-or-Trade, and NFST sit on every piece you own. Flip a status; the piece becomes a listing."
        />
        <div
          data-marketing-grid="trade-rails"
          style={{
            marginTop: 80,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {TRADE_RAILS.map((rail, i) => (
            <Reveal key={rail.label} delay={120 + i * 80} y={16}>
              <div
                style={{
                  padding: 28,
                  borderRadius: 14,
                  border: `1px solid ${T.frostDiv}`,
                  background: "rgba(214,235,253,0.015)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  height: "100%",
                }}
              >
                <Pill
                  style={{
                    background: "transparent",
                    color: rail.tone,
                    borderColor: rail.tone,
                    alignSelf: "flex-start",
                  }}
                >
                  {rail.pill}
                </Pill>
                <div
                  style={{
                    fontFamily: T.fontDisplay,
                    fontSize: 36,
                    letterSpacing: -0.6,
                    color: T.fg1,
                    lineHeight: 1,
                  }}
                >
                  {rail.label}
                </div>
                <p
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.55,
                    color: T.fg2,
                    margin: 0,
                  }}
                >
                  {rail.sub}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <div
          data-marketing-trade-fees
          style={{
            marginTop: 56,
            padding: "24px 28px",
            borderRadius: 14,
            border: `1px solid ${T.voltBorder}`,
            background: T.voltFill,
            display: "flex",
            alignItems: "center",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div
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
            <MIcon name="percent" size={20} color={T.void} />
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <Kicker color={T.volt}>FEE STRUCTURE</Kicker>
            <div
              style={{
                fontFamily: T.fontDisplay,
                fontSize: 22,
                color: T.fg1,
                marginTop: 6,
                letterSpacing: -0.3,
                lineHeight: 1.2,
              }}
            >
              10% on Free &amp; Pro &middot; 7% on Collector &middot; Trade is
              free on Pro &amp; Collector
            </div>
          </div>
          <Link
            href="/pricing"
            style={{
              padding: "12px 22px",
              borderRadius: 9999,
              background: T.volt,
              color: T.void,
              textDecoration: "none",
              fontFamily: T.fontInter,
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            See the full math &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
