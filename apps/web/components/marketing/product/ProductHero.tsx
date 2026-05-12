"use client"

import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker, MIcon } from "@/components/marketing/primitives"
import { Reveal } from "@/lib/marketing/Reveal"

const SURFACES: { icon: string; label: string }[] = [
  { icon: "scan-line", label: "Catalog" },
  { icon: "frame", label: "Showcase" },
  { icon: "trending-up", label: "Track" },
  { icon: "radio-tower", label: "Activity" },
  { icon: "share-2", label: "Share" },
  { icon: "repeat", label: "Trade" },
  { icon: "users", label: "Discover" },
  { icon: "layout-grid", label: "Categories" },
]

/**
 * ProductHero — top-of-page anchor for /product. Frames Vitrine as a
 * full toolkit rather than a single feature; lists the surfaces below
 * the headline so the reader knows what they're scrolling into.
 */
export function ProductHero() {
  return (
    <section
      data-marketing-section="product-hero"
      style={{
        position: "relative",
        padding: "120px 40px 80px",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `linear-gradient(${T.frostDiv} 1px, transparent 1px), linear-gradient(90deg, ${T.frostDiv} 1px, transparent 1px)`,
          backgroundSize: "88px 88px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 30%, black 30%, transparent 80%)",
          opacity: 0.5,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 720,
          height: 720,
          borderRadius: "50%",
          pointerEvents: "none",
          background: `radial-gradient(closest-side, ${T.voltFill}, transparent 70%)`,
          opacity: 0.45,
        }}
      />
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Reveal>
          <Kicker color={T.volt} style={{ marginBottom: 24 }}>
            THE TOOLKIT
          </Kicker>
        </Reveal>
        <Reveal delay={120}>
          <h1
            style={{
              fontFamily: T.fontDisplay,
              fontWeight: 400,
              fontSize: 96,
              lineHeight: 0.94,
              letterSpacing: -2.2,
              margin: 0,
              textWrap: "balance",
            }}
          >
            Everything serious{" "}
            <em
              style={{
                fontFamily: T.fontDisplay,
                fontStyle: "italic",
                color: T.volt,
              }}
            >
              collectors deserve.
            </em>
          </h1>
        </Reveal>
        <Reveal delay={240}>
          <p
            style={{
              fontSize: 19,
              lineHeight: 1.55,
              color: T.fg2,
              marginTop: 32,
              maxWidth: 680,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Eight working surfaces, one app. Catalog the piece. Curate the
            showcase. Track the value. Surface the signal. Share the link.
            Run the trade. All on the same vault.
          </p>
        </Reveal>
        <Reveal delay={360}>
          <div
            data-marketing-product-surfaces
            style={{
              marginTop: 56,
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {SURFACES.map((s) => (
              <span
                key={s.label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 16px",
                  borderRadius: 9999,
                  border: `1px solid ${T.frostDiv}`,
                  background: "rgba(214,235,253,0.02)",
                  color: T.fg2,
                  fontFamily: T.fontGrotesk,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                <MIcon name={s.icon} size={13} color={T.volt} />
                {s.label}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
