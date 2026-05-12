"use client"

import * as React from "react"
import { useMemo } from "react"
import { T } from "@/lib/marketing/tokens"
import {
  FrostCard,
  Kicker,
  MIcon,
  Pill,
} from "@/components/marketing/primitives"
import { useTicker } from "@/lib/marketing/hooks"

/**
 * TrackArea — migrated from sections/TrackingSection.tsx for /product.
 * Live FMV, volatility band, and event flag narrative anchored on the
 * 365-day chart of a single piece.
 */
export function TrackArea() {
  const tick = useTicker(1100)
  const series = useMemo(() => {
    const out: number[] = []
    let v = 80000
    for (let i = 0; i < 60; i++) {
      v +=
        Math.sin((i + tick) * 0.4) * 1800 +
        Math.cos(tick * 0.3 + i * 0.21) * 1200
      out.push(Math.max(64000, v))
    }
    return out
  }, [tick])
  const min = Math.min(...series)
  const max = Math.max(...series)
  const W = 700
  const H = 280
  const pts = series.map(
    (v, i) =>
      `${(i / (series.length - 1)) * W},${
        H - ((v - min) / (max - min || 1)) * H
      }`
  )
  const linePath = `M${pts.join(" L")}`
  const areaPath = `M0,${H} L${pts.join(" L")} L${W},${H} Z`
  const last = series[series.length - 1]
  const first = series[0]
  const trendUp = last >= first

  return (
    <section
      id="track"
      data-marketing-section="track"
      style={{
        padding: "140px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
        background: `linear-gradient(180deg, transparent 0%, ${T.voltFill} 50%, transparent 100%)`,
      }}
    >
      <div
        data-marketing-grid="tracking-split"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: 80,
          alignItems: "center",
        }}
      >
        <div>
          <Kicker color={T.volt}>§03 &middot; TRACK</Kicker>
          <h2
            style={{
              fontFamily: T.fontDisplay,
              fontWeight: 400,
              fontSize: 64,
              lineHeight: 0.96,
              letterSpacing: -1.4,
              margin: "20px 0 0",
            }}
          >
            Watch every piece{" "}
            <em
              style={{
                fontFamily: T.fontDisplay,
                fontStyle: "italic",
                color: T.volt,
              }}
            >
              move.
            </em>
          </h2>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.55,
              color: T.fg2,
              marginTop: 24,
              maxWidth: 460,
            }}
          >
            Volatility, demand, condition spread, event-driven shocks &mdash;
            modeled, not guessed. 30-day, 90-day, and 365-day windows on every
            piece in your Vitrine.
          </p>
          <ul style={{ marginTop: 32, padding: 0, listStyle: "none" }}>
            {[
              ["Live FMV", "Refreshed every 4 seconds against weighted comps."],
              [
                "Volatility band",
                "\u00B1\u03C3 overlay so you know when prints are noise vs. signal.",
              ],
              [
                "Event flags",
                "Auction results, grade pops, and reseller drops marked on the curve.",
              ],
            ].map(([t, s]) => (
              <li
                key={t}
                style={{
                  padding: "16px 0",
                  borderTop: `1px solid ${T.frostDiv}`,
                  display: "flex",
                  gap: 14,
                }}
              >
                <MIcon
                  name="check"
                  size={14}
                  color={T.volt}
                  style={{ marginTop: 4 }}
                />
                <div>
                  <div
                    style={{ fontSize: 14, color: T.fg1, fontWeight: 500 }}
                  >
                    {t}
                  </div>
                  <div
                    style={{
                      fontSize: 12.5,
                      color: T.fg2,
                      marginTop: 4,
                      lineHeight: 1.5,
                    }}
                  >
                    {s}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <FrostCard hover={false} style={{ padding: 32 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 20,
            }}
          >
            <div>
              <Kicker>365-DAY TRACK &middot; 1986 FLEER JORDAN #57</Kicker>
              <div
                style={{
                  fontFamily: T.fontDisplay,
                  fontSize: 44,
                  marginTop: 8,
                  letterSpacing: -0.6,
                }}
              >
                ${(last / 1000).toFixed(1)}k
              </div>
              <div
                style={{
                  fontFamily: T.fontMono,
                  fontSize: 12,
                  color: trendUp ? T.green : T.red,
                  marginTop: 4,
                }}
              >
                {trendUp ? "\u2197" : "\u2198"}{" "}
                {(((last - first) / first) * 100).toFixed(2)}% YoY &middot; &sigma; &plusmn;4.2%
              </div>
            </div>
            <Pill variant="volt">DEMAND &middot; HIGH</Pill>
          </div>
          <svg
            width="100%"
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ display: "block" }}
          >
            <defs>
              <linearGradient id="trkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.volt} stopOpacity="0.32" />
                <stop offset="100%" stopColor={T.volt} stopOpacity="0" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((p) => (
              <line
                key={p}
                x1="0"
                x2={W}
                y1={H * p}
                y2={H * p}
                stroke={T.frostDiv}
                strokeDasharray="2 4"
              />
            ))}
            <path
              d={areaPath}
              fill="url(#trkFill)"
              style={{ transition: "d 1s cubic-bezier(.2,.8,.2,1)" }}
            />
            <path
              d={linePath}
              fill="none"
              stroke={T.volt}
              strokeWidth="1.8"
              style={{
                transition: "d 1s cubic-bezier(.2,.8,.2,1)",
                filter: `drop-shadow(0 0 4px ${T.volt})`,
              }}
            />
            <circle
              cx={W}
              cy={H - ((last - min) / (max - min || 1)) * H}
              r="5"
              fill={T.volt}
              style={{ filter: `drop-shadow(0 0 8px ${T.volt})` }}
            />
          </svg>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: 16,
              marginTop: 24,
              paddingTop: 20,
              borderTop: `1px solid ${T.frostDiv}`,
            }}
          >
            {(
              [
                ["30D", "+2.4%", T.green],
                ["90D", "+8.1%", T.green],
                ["1Y", "+24.6%", T.green],
                ["\u03C3", "\u00B14.2%", T.fg1],
              ] as const
            ).map(([k, v, c]) => (
              <div key={k}>
                <Kicker style={{ fontSize: 9.5, color: T.fg3 }}>{k}</Kicker>
                <div
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 13,
                    marginTop: 4,
                    color: c,
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
        </FrostCard>
      </div>
    </section>
  )
}
