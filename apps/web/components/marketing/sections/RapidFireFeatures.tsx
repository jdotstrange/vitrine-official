"use client"

import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker, MIcon, Pill } from "@/components/marketing/primitives"
import { RAPID_FIRE_TILES } from "@/lib/marketing/constants"
import { Reveal } from "@/lib/marketing/Reveal"

/**
 * RapidFireFeatures — the "we have features for days" wall.
 *
 * Twelve compact tiles laid out as a 4x3 grid on desktop, reflowing to 2x6
 * on tablet and 1x12 on phone. Each tile carries an icon, a 2-line claim,
 * and a single-line qualifier. Optional flag pills mark tier-gated features.
 *
 * Sits between How It Works and Explore on the new home IA. Replaces the
 * narrative texture lost when Pulse / Cataloging / Showcases / Tracking /
 * Comps / Categories migrated off the home page.
 */
export function RapidFireFeatures() {
  return (
    <section
      id="features"
      data-marketing-section="rapid-fire"
      style={{
        padding: "160px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
        position: "relative",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <Reveal y={16}>
          <Kicker color={T.volt} style={{ marginBottom: 24 }}>HOW IT WORKS</Kicker>
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
            Built for the full{" "}
            <em
              style={{
                fontFamily: T.fontDisplay,
                fontStyle: "italic",
                color: T.volt,
              }}
            >
              collector loop.
            </em>
          </h2>
          <p
            style={{
              fontSize: 17,
              lineHeight: 1.55,
              color: T.fg2,
              maxWidth: 720,
              marginTop: 24,
            }}
          >
            From capture to context, from value to visibility, every surface
            in Vitrine exists to help you understand what you own and decide
            what happens next.
          </p>
        </Reveal>

        <div
          data-marketing-grid="rapid-fire-tiles"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginTop: 80,
          }}
        >
          {RAPID_FIRE_TILES.map((tile, i) => (
            <Reveal
              key={tile.headline}
              delay={120 + i * 60}
              y={16}
              style={{ height: "100%" }}
            >
              <RapidFireTileCard
                icon={tile.icon}
                headline={tile.headline}
                sub={tile.sub}
                flag={tile.flag}
              />
            </Reveal>
          ))}
        </div>

        <p
          data-marketing-rapid-fire-footer
          style={{
            marginTop: 56,
            textAlign: "center",
            fontFamily: T.fontMono,
            fontSize: 12,
            color: T.fg3,
            letterSpacing: 0.5,
          }}
        >
          EVERY SURFACE HAS A JOB.{" "}
          <a
            href="/product"
            style={{
              color: T.volt,
              textDecoration: "none",
              borderBottom: `1px solid ${T.voltBorder}`,
              paddingBottom: 1,
            }}
          >
            Explore the full product &rarr;
          </a>
        </p>
      </div>
    </section>
  )
}

interface RapidFireTileCardProps {
  icon: string
  headline: string
  sub: string
  flag?: string
}

function RapidFireTileCard({
  icon,
  headline,
  sub,
  flag,
}: RapidFireTileCardProps) {
  const [hover, setHover] = React.useState(false)
  return (
    <div
      data-marketing-rapid-tile
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        padding: 24,
        borderRadius: 14,
        border: `1px solid ${hover ? T.frostBorderStrong : T.frostDiv}`,
        background: hover
          ? "rgba(214,235,253,0.025)"
          : "rgba(214,235,253,0.01)",
        transition: "border-color 280ms, background 280ms, transform 280ms",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        minHeight: 196,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          border: `1px solid ${T.voltBorder}`,
          background: T.voltFill,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: T.volt,
        }}
      >
        <MIcon name={icon} size={20} color={T.volt} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 22,
            lineHeight: 1.1,
            letterSpacing: -0.3,
            color: T.fg1,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: T.fg2,
          }}
        >
          {sub}
        </div>
      </div>
      {flag && (
        <div>
          <Pill variant="volt" style={{ fontSize: 9.5 }}>
            {flag}
          </Pill>
        </div>
      )}
    </div>
  )
}
