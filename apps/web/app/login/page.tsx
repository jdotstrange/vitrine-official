import type { Metadata } from "next"
import Link from "next/link"
import { T } from "@/lib/marketing/tokens"
import {
  AppStoreBadge,
  Kicker,
} from "@/components/marketing/primitives"
import { VitrineLogo } from "@/components/marketing/VitrineLogo"

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Web app coming soon. For now, your collection lives on iPhone or Android.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function LoginPage() {
  return (
    <main
      style={{
        background: T.void,
        color: T.fg1,
        fontFamily: T.fontInter,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
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
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 720,
          height: 720,
          borderRadius: "50%",
          pointerEvents: "none",
          background: `radial-gradient(closest-side, ${T.voltFill}, transparent 70%)`,
          opacity: 0.5,
        }}
      />
      <header
        style={{
          padding: "24px 40px",
          position: "relative",
          zIndex: 2,
        }}
      >
        <Link
          href="/"
          aria-label="Vitrine home"
          style={{
            color: T.fg1,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <VitrineLogo size={108} />
        </Link>
      </header>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px 120px",
          textAlign: "center",
          position: "relative",
          zIndex: 2,
          maxWidth: 760,
          margin: "0 auto",
        }}
      >
        <Kicker color={T.volt} style={{ marginBottom: 28 }}>
          WEB APP &middot; COMING SOON
        </Kicker>
        <h1
          style={{
            fontFamily: T.fontDisplay,
            fontWeight: 400,
            fontSize: 76,
            lineHeight: 0.94,
            letterSpacing: -1.8,
            margin: 0,
            textWrap: "balance",
          }}
        >
          Your collection lives{" "}
          <em
            style={{
              fontFamily: T.fontDisplay,
              fontStyle: "italic",
              color: T.volt,
            }}
          >
            in your pocket.
          </em>
        </h1>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.6,
            color: T.fg2,
            marginTop: 24,
            maxWidth: 520,
          }}
        >
          The Vitrine web app arrives in a later release. For now, sign in by
          installing the app on iPhone or Android &mdash; same vault, slightly
          smaller screen.
        </p>
        <div
          data-marketing-login-badges
          style={{
            marginTop: 48,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <AppStoreBadge store="apple" />
          <AppStoreBadge store="google" />
        </div>
        <Link
          href="/"
          style={{
            marginTop: 36,
            fontFamily: T.fontMono,
            fontSize: 11.5,
            color: T.fg3,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            textDecoration: "none",
            borderBottom: `1px solid ${T.frostDiv}`,
            paddingBottom: 2,
          }}
        >
          &larr; Back to home
        </Link>
      </div>
    </main>
  )
}
