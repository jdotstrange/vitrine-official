import * as React from "react"
import Link from "next/link"
import { T } from "@/lib/marketing/tokens"
import { Kicker } from "@/components/marketing/primitives"
import { VitrineLogo } from "@/components/marketing/VitrineLogo"

export interface ComingSoonPageProps {
  /** Short kicker label (e.g. "PRICING", "LOOKING GLASS") */
  kicker: string
  /** Title of the section that's coming */
  title: React.ReactNode
  /** One- or two-sentence description of what will be here */
  description: React.ReactNode
  /** Optional CTA href + label rendered as the primary button */
  cta?: { href: string; label: string }
}

/**
 * ComingSoonPage — a minimal frost-on-void placeholder rendered at routes
 * whose real content lands in a later phase of the marketing-site build.
 * Prevents 404s when the SiteNav links to a deep page that hasn't shipped
 * yet.
 *
 * Each page sets `metadata.robots = noindex` to keep these placeholders
 * out of search results.
 */
export function ComingSoonPage({
  kicker,
  title,
  description,
  cta,
}: ComingSoonPageProps) {
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
          opacity: 0.55,
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
          maxWidth: 720,
          margin: "0 auto",
        }}
      >
        <Kicker color={T.volt} style={{ marginBottom: 24 }}>
          {kicker} · IN PROGRESS
        </Kicker>
        <h1
          style={{
            fontFamily: T.fontDisplay,
            fontWeight: 400,
            fontSize: 64,
            lineHeight: 0.96,
            letterSpacing: -1.4,
            margin: 0,
            textWrap: "balance",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.55,
            color: T.fg2,
            marginTop: 24,
            maxWidth: 520,
          }}
        >
          {description}
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
          {cta && (
            <Link
              href={cta.href}
              className="cta-glow"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                height: 48,
                padding: "0 28px",
                borderRadius: 9999,
                background: T.volt,
                color: T.void,
                fontFamily: T.fontInter,
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              {cta.label}
            </Link>
          )}
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: 48,
              padding: "0 28px",
              borderRadius: 9999,
              border: `1px solid ${T.frostBorder}`,
              color: T.fg1,
              fontFamily: T.fontInter,
              fontWeight: 500,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  )
}
