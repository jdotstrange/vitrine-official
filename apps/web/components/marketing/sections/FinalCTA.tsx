import * as React from "react"
import { T } from "@/lib/marketing/tokens"
import {
  AppStoreBadge,
  Kicker,
} from "@/components/marketing/primitives"

export function FinalCTA() {
  return (
    <section
      id="download"
      data-marketing-section="cta"
      style={{
        padding: "180px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -200,
          left: "50%",
          transform: "translateX(-50%)",
          width: 900,
          height: 900,
          background: `radial-gradient(circle, ${T.voltFill} 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />
      <Kicker color={T.volt} style={{ marginBottom: 28 }}>
        §09 · YOUR TURN
      </Kicker>
      <h2
        data-marketing-cta-title
        style={{
          fontFamily: T.fontDisplay,
          fontWeight: 400,
          fontSize: 124,
          lineHeight: 0.94,
          letterSpacing: -2.6,
          margin: 0,
          position: "relative",
          zIndex: 2,
        }}
      >
        Build your
        <br />
        <em
          style={{
            fontFamily: T.fontDisplay,
            fontStyle: "italic",
            color: T.volt,
          }}
        >
          vitrine.
        </em>
      </h2>
      <div
        style={{
          display: "flex",
          gap: 14,
          marginTop: 56,
          justifyContent: "center",
          position: "relative",
          zIndex: 2,
          flexWrap: "wrap",
        }}
      >
        <AppStoreBadge store="apple" />
        <AppStoreBadge store="google" />
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: T.fontMono,
          fontSize: 11,
          color: T.fg3,
          letterSpacing: 0.5,
        }}
      >
        FREE · NO ADS · iOS 16+ · ANDROID 10+
      </div>
    </section>
  )
}
