import Link from "next/link"
import { T } from "@/lib/marketing/tokens"
import { Kicker } from "@/components/marketing/primitives"
import { VitrineLogo } from "@/components/marketing/VitrineLogo"

export default function NotFound() {
  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        background: T.void,
        color: T.fg1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `linear-gradient(${T.frostDiv} 1px, transparent 1px), linear-gradient(90deg, ${T.frostDiv} 1px, transparent 1px)`,
          backgroundSize: "88px 88px",
          maskImage:
            "radial-gradient(ellipse at 50% 30%, #000 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 30%, #000 0%, transparent 75%)",
          opacity: 0.4,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -200,
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 700,
          pointerEvents: "none",
          background: `radial-gradient(circle, ${T.voltFill} 0%, transparent 60%)`,
        }}
      />

      <header
        style={{
          position: "relative",
          zIndex: 5,
          display: "flex",
          alignItems: "center",
          padding: "20px 32px",
          borderBottom: `1px solid ${T.frostDiv}`,
        }}
      >
        <Link
          href="/"
          style={{
            color: T.fg1,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
          aria-label="Vitrine home"
        >
          <VitrineLogo size={92} />
        </Link>
      </header>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          flex: 1,
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
          padding: "80px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 96,
            lineHeight: 0.9,
            letterSpacing: -2,
            color: T.volt,
            marginBottom: 16,
          }}
        >
          404
        </div>
        <Kicker style={{ marginBottom: 20 }}>Off the map</Kicker>
        <h1
          style={{
            fontFamily: T.fontDisplay,
            fontWeight: 400,
            fontSize: 36,
            lineHeight: 1.05,
            letterSpacing: -0.6,
            margin: 0,
            color: T.fg1,
          }}
        >
          This page doesn't exist.
        </h1>
        <p
          style={{
            fontFamily: T.fontCaslon,
            fontStyle: "italic",
            fontSize: 17,
            lineHeight: 1.5,
            color: T.fg2,
            margin: "16px 0 36px",
            maxWidth: 360,
          }}
        >
          But your collection should. Let's get you back on track.
        </p>
        <Link
          href="/"
          className="cta-glow"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 52,
            padding: "0 32px",
            borderRadius: 9999,
            background: T.volt,
            color: T.void,
            fontFamily: T.fontInter,
            fontWeight: 600,
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}
