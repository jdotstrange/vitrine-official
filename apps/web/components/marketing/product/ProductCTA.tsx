"use client"

import * as React from "react"
import Link from "next/link"
import { T } from "@/lib/marketing/tokens"
import { Kicker } from "@/components/marketing/primitives"

/**
 * ProductCTA — close-out for the /product deep page. Two destinations:
 * the pricing page (next logical step for someone who scrolled this far)
 * and the download.
 */
export function ProductCTA() {
  return (
    <section
      data-marketing-section="product-cta"
      style={{
        padding: "140px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 720,
          height: 720,
          borderRadius: "50%",
          pointerEvents: "none",
          background: `radial-gradient(closest-side, ${T.voltFill}, transparent 70%)`,
          opacity: 0.4,
        }}
      />
      <div
        style={{
          maxWidth: 880,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Kicker color={T.volt} style={{ marginBottom: 24 }}>
          NOW PICK YOUR TIER
        </Kicker>
        <h2
          style={{
            fontFamily: T.fontDisplay,
            fontWeight: 400,
            fontSize: 72,
            lineHeight: 0.96,
            letterSpacing: -1.6,
            margin: 0,
            textWrap: "balance",
          }}
        >
          You&rsquo;ve seen the toolkit.{" "}
          <em
            style={{
              fontFamily: T.fontDisplay,
              fontStyle: "italic",
              color: T.volt,
            }}
          >
            See the price.
          </em>
        </h2>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.55,
            color: T.fg2,
            marginTop: 24,
            maxWidth: 560,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Free is generous. Pro is $9.99. Collector is $24.99 and pays for
          itself if you sell. Compare them.
        </p>
        <div
          style={{
            marginTop: 40,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link
            href="/pricing"
            className="cta-glow"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 52,
              padding: "0 32px",
              borderRadius: 9999,
              background: T.volt,
              color: T.void,
              fontFamily: T.fontInter,
              fontWeight: 600,
              fontSize: 14.5,
              textDecoration: "none",
            }}
          >
            See pricing
          </Link>
          <Link
            href="/#download"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 52,
              padding: "0 32px",
              borderRadius: 9999,
              background: "transparent",
              color: T.fg1,
              border: `1px solid ${T.frostBorderStrong}`,
              fontFamily: T.fontInter,
              fontWeight: 600,
              fontSize: 14.5,
              textDecoration: "none",
            }}
          >
            Get the app
          </Link>
        </div>
      </div>
    </section>
  )
}
