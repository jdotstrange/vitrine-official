"use client"

import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker } from "@/components/marketing/primitives"
import { Reveal } from "@/lib/marketing/Reveal"

/**
 * PricingHero — top-of-page anchor framed around the keystone insight
 * from the pricing model: "view is free, generate is paid."
 */
export function PricingHero() {
  return (
    <section
      data-marketing-section="pricing-hero"
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
          maxWidth: 980,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Reveal>
          <Kicker color={T.volt} style={{ marginBottom: 24 }}>
            PRICING
          </Kicker>
        </Reveal>
        <Reveal delay={120}>
          <h1
            style={{
              fontFamily: T.fontDisplay,
              fontWeight: 400,
              fontSize: 88,
              lineHeight: 0.94,
              letterSpacing: -2,
              margin: 0,
              textWrap: "balance",
            }}
          >
            Pay nothing to{" "}
            <em
              style={{
                fontFamily: T.fontDisplay,
                fontStyle: "italic",
                color: T.volt,
              }}
            >
              see everything.
            </em>
            <br />
            Pay $9.99 to{" "}
            <em
              style={{
                fontFamily: T.fontDisplay,
                fontStyle: "italic",
                color: T.volt,
              }}
            >
              run everything.
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
            Three tiers built around how collectors actually use Vitrine.
            Generous free, accessible Pro, power-user Collector. No contracts,
            no card to start.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
