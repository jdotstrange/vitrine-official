import * as React from "react"
import Link from "next/link"
import { T } from "@/lib/marketing/tokens"
import { Kicker } from "@/components/marketing/primitives"
import { SiteNav, Footer } from "@/components/marketing/sections"

export interface LegalSection {
  /** Heading for the section (e.g. "Information we collect") */
  title: string
  /** Body copy. Each item rendered as a paragraph. */
  body: string[]
}

export interface LegalPageProps {
  kicker: string
  title: React.ReactNode
  /** ISO date string (e.g. "2026-05-12") */
  effectiveDate: string
  /** Tagline rendered under the title */
  intro: React.ReactNode
  sections: LegalSection[]
}

/**
 * LegalPage — shared layout for /privacy and /terms placeholder pages.
 * Pages are flagged across the top with a "DRAFT" banner so legal review
 * isn't conflated with finalized policy.
 */
export function LegalPage({
  kicker,
  title,
  effectiveDate,
  intro,
  sections,
}: LegalPageProps) {
  return (
    <main
      style={{
        background: T.void,
        color: T.fg1,
        fontFamily: T.fontInter,
        minHeight: "100vh",
      }}
    >
      <DraftBanner />
      <SiteNav />
      <article
        style={{
          maxWidth: 820,
          margin: "0 auto",
          padding: "80px 40px 120px",
        }}
      >
        <Kicker color={T.volt} style={{ marginBottom: 24 }}>
          {kicker}
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
        <div
          style={{
            marginTop: 16,
            fontFamily: T.fontMono,
            fontSize: 11,
            letterSpacing: 0.6,
            color: T.fg3,
            textTransform: "uppercase",
          }}
        >
          Effective {effectiveDate} &middot; Draft for legal review
        </div>
        <p
          style={{
            fontSize: 17,
            lineHeight: 1.65,
            color: T.fg2,
            marginTop: 32,
          }}
        >
          {intro}
        </p>
        <div
          style={{
            marginTop: 48,
            display: "flex",
            flexDirection: "column",
            gap: 40,
          }}
        >
          {sections.map((section) => (
            <section key={section.title}>
              <h2
                style={{
                  fontFamily: T.fontDisplay,
                  fontWeight: 400,
                  fontSize: 28,
                  letterSpacing: -0.4,
                  color: T.fg1,
                  margin: 0,
                }}
              >
                {section.title}
              </h2>
              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {section.body.map((paragraph, i) => (
                  <p
                    key={i}
                    style={{
                      fontSize: 15,
                      lineHeight: 1.65,
                      color: T.fg2,
                      margin: 0,
                    }}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
        <div
          style={{
            marginTop: 64,
            paddingTop: 32,
            borderTop: `1px solid ${T.frostDiv}`,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: T.fontMono,
              fontSize: 11.5,
              color: T.fg2,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            &larr; Back to home
          </Link>
          <span
            style={{
              fontFamily: T.fontMono,
              fontSize: 11.5,
              color: T.fg3,
              letterSpacing: 0.6,
              textTransform: "uppercase",
            }}
          >
            Questions? hello@vitrine.app
          </span>
        </div>
      </article>
      <Footer />
    </main>
  )
}

function DraftBanner() {
  return (
    <div
      role="note"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 90,
        padding: "8px 16px",
        background: T.volt,
        color: T.void,
        fontFamily: T.fontMono,
        fontSize: 11,
        letterSpacing: 0.6,
        textAlign: "center",
        textTransform: "uppercase",
      }}
    >
      Draft &middot; pending legal review &middot; not legally binding until
      finalized
    </div>
  )
}

/**
 * Brief intentionally-private fallback so we don't render an empty
 * legal page if a caller forgets to pass sections.
 */
export function PlaceholderLegalSection(): LegalSection {
  return {
    title: "Coming soon",
    body: [
      "This section is being drafted with our legal team and will be published before public launch. If you have specific concerns in the meantime, contact hello@vitrine.app.",
    ],
  }
}
