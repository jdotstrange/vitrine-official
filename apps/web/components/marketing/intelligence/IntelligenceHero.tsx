"use client"

import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker } from "@/components/marketing/primitives"
import { Reveal } from "@/lib/marketing/Reveal"

/**
 * IntelligenceHero — manifesto-tone headline for the Looking Glass deep
 * page. Anchors the entire page on the "tell us nothing" thesis so the
 * reader finishes the hero already understanding the differentiator.
 */
export function IntelligenceHero() {
  return (
    <section
      data-marketing-section="intelligence-hero"
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
          top: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 820,
          height: 820,
          borderRadius: "50%",
          pointerEvents: "none",
          background: `radial-gradient(closest-side, ${T.voltFill}, transparent 70%)`,
          opacity: 0.5,
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
            LOOKING GLASS &middot; INTELLIGENCE LAYER
          </Kicker>
        </Reveal>
        <Reveal delay={120}>
          <h1
            style={{
              fontFamily: T.fontDisplay,
              fontWeight: 400,
              fontSize: 100,
              lineHeight: 0.92,
              letterSpacing: -2.4,
              margin: 0,
              textWrap: "balance",
            }}
          >
            Tell us{" "}
            <em
              style={{
                fontFamily: T.fontDisplay,
                fontStyle: "italic",
                color: T.volt,
              }}
            >
              nothing.
            </em>
            <br />
            We read the piece.
          </h1>
        </Reveal>
        <Reveal delay={240}>
          <p
            style={{
              fontSize: 19,
              lineHeight: 1.55,
              color: T.fg2,
              marginTop: 32,
              maxWidth: 720,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Every other cataloging app makes you fill out the form. Looking
            Glass watches the photo &mdash; reads the slab, parses the dial,
            decodes the matrix &mdash; and writes the entry for you. Across 38
            categories. Free for everyone.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
