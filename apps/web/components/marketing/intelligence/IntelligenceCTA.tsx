"use client"

import * as React from "react"
import Link from "next/link"
import { T } from "@/lib/marketing/tokens"
import { Kicker } from "@/components/marketing/primitives"

/**
 * IntelligenceCTA — close-out for the /intelligence deep page. Two real
 * destinations: the rest of the toolkit (/product) and the download.
 */
export function IntelligenceCTA() {
  return (
    <section
      data-marketing-section="intelligence-cta"
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
          THE REST OF THE TOOLKIT
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
          Looking Glass is the engine.{" "}
          <em
            style={{
              fontFamily: T.fontDisplay,
              fontStyle: "italic",
              color: T.volt,
            }}
          >
            Vitrine is the rest.
          </em>
        </h2>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.55,
            color: T.fg2,
            marginTop: 24,
            maxWidth: 640,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          Catalog, showcase, track, share, trade. The intelligence layer is
          one of nine surfaces in the app. Tour the rest, or skip ahead and
          install.
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
            href="/product"
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
            See the full toolkit
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
