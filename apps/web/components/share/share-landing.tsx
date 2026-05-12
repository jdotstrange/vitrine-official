import Link from "next/link"
import Image from "next/image"
import { APP_STORE_URL, PLAY_STORE_URL } from "@vitrine/constants"
import { T } from "@/lib/marketing/tokens"
import { Kicker } from "@/components/marketing/primitives"
import { VitrineLogo } from "@/components/marketing/VitrineLogo"

interface ShareLandingProps {
  type: "collectible" | "showcase" | "profile"
  title: string
  subtitle?: string
  description?: string | null
  imageUrl?: string | null
  stats?: { label: string; value: string }[]
}

const TYPE_LABELS = {
  collectible: "Collectible",
  showcase: "Showcase",
  profile: "Collector",
} as const

/**
 * ShareLanding — V3 frost-on-void resolver page.
 *
 * Visited when a non-app user opens a share URL (`/s/c/[id]`, `/s/p/[id]`,
 * `/s/s/[id]`). Goal: read the piece in 3 seconds, drive App Store install.
 *
 * Layout: header bar with wordmark · single-column max-width=600 stack
 * (kicker → image card → display title → italic subtitle → optional
 * description → stats row → ivory CTA pill → fine-print). Frost-on-void
 * matches the marketing site so the brand reads as one app from first
 * impression through download.
 */
export function ShareLanding({
  type,
  title,
  subtitle,
  description,
  imageUrl,
  stats,
}: ShareLandingProps) {
  return (
    <main
      data-share-page
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
      {/* Faint grid + warm halo behind the content for V3 atmosphere */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage: `linear-gradient(${T.frostDiv} 1px, transparent 1px), linear-gradient(90deg, ${T.frostDiv} 1px, transparent 1px)`,
          backgroundSize: "88px 88px",
          maskImage:
            "radial-gradient(ellipse at 50% 25%, #000 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 25%, #000 0%, transparent 75%)",
          opacity: 0.5,
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

      <ShareHeader />

      <div
        data-share-stack
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 600,
          margin: "0 auto",
          padding: "40px 24px 80px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          flex: 1,
        }}
      >
        <Kicker style={{ color: T.volt, marginBottom: 24 }}>
          {TYPE_LABELS[type]} · ON VITRINE
        </Kicker>

        {imageUrl && (
          <div
            data-share-image
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 360,
              aspectRatio: "1 / 1",
              marginBottom: 36,
              borderRadius: 20,
              overflow: "hidden",
              background: T.sheetBg,
              border: `1px solid ${T.frostBorder}`,
              boxShadow: `0 24px 60px rgba(0,0,0,0.5)`,
            }}
          >
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 600px) 90vw, 360px"
              style={{ objectFit: "cover" }}
              unoptimized
            />
          </div>
        )}

        <h1
          data-share-title
          style={{
            fontFamily: T.fontDisplay,
            fontWeight: 400,
            fontSize: 44,
            lineHeight: 1.05,
            letterSpacing: -0.8,
            margin: 0,
            color: T.fg1,
            textWrap: "balance",
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            style={{
              fontFamily: T.fontCaslon,
              fontStyle: "italic",
              fontSize: 19,
              lineHeight: 1.4,
              color: T.fg2,
              margin: "14px 0 0",
            }}
          >
            {subtitle}
          </p>
        )}

        {description && (
          <p
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              color: T.fg2,
              margin: "20px 0 0",
              maxWidth: 480,
            }}
          >
            {description}
          </p>
        )}

        {stats && stats.length > 0 && (
          <div
            data-share-stats
            style={{
              display: "flex",
              gap: 32,
              marginTop: 36,
              paddingTop: 28,
              borderTop: `1px solid ${T.frostDiv}`,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {stats.map((stat) => (
              <div key={stat.label}>
                <Kicker style={{ fontSize: 9.5, marginBottom: 6 }}>
                  {stat.label}
                </Kicker>
                <div
                  style={{
                    fontFamily: T.fontMono,
                    fontSize: 22,
                    color: T.fg1,
                    letterSpacing: -0.3,
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 14,
            marginTop: 44,
            width: "100%",
          }}
        >
          <Link
            href={APP_STORE_URL}
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
              minWidth: 220,
            }}
          >
            Open in Vitrine
          </Link>
          <Link
            href={PLAY_STORE_URL}
            style={{
              fontFamily: T.fontGrotesk,
              fontSize: 11.5,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              color: T.fg3,
              textDecoration: "none",
              borderBottom: `1px solid ${T.frostDiv}`,
              paddingBottom: 2,
            }}
          >
            Get it on Google Play
          </Link>
        </div>

        <p
          style={{
            marginTop: 56,
            maxWidth: 320,
            fontSize: 12.5,
            lineHeight: 1.55,
            color: T.fg3,
          }}
        >
          Vitrine — everything serious collectors deserve. Catalog, present,
          track, and transact your collection in one place.
        </p>
      </div>
    </main>
  )
}

export function ShareNotFound({
  type,
}: {
  type: "collectible" | "showcase" | "profile"
}) {
  return (
    <main
      data-share-page
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

      <ShareHeader />

      <div
        data-share-stack
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
          padding: "80px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          flex: 1,
          justifyContent: "center",
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
        <Kicker style={{ marginBottom: 20 }}>{TYPE_LABELS[type]} unavailable</Kicker>
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
          This {type} can't be found.
        </h1>
        <p
          style={{
            fontFamily: T.fontCaslon,
            fontStyle: "italic",
            fontSize: 17,
            lineHeight: 1.5,
            color: T.fg2,
            margin: "16px 0 36px",
          }}
        >
          It may have been removed, set to private, or the link is mistyped.
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
          Go to Vitrine
        </Link>
      </div>
    </main>
  )
}

/**
 * Minimal header bar shared by ShareLanding + ShareNotFound. Wordmark goes
 * home; second slot left empty so the page is product-content first, not
 * marketing chrome.
 */
function ShareHeader() {
  return (
    <header
      data-share-header
      style={{
        position: "relative",
        zIndex: 5,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
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
      <Link
        href={APP_STORE_URL}
        data-share-header-cta
        style={{
          fontFamily: T.fontGrotesk,
          fontSize: 11.5,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color: T.fg2,
          textDecoration: "none",
          padding: "8px 14px",
          borderRadius: 9999,
          border: `1px solid ${T.frostBorder}`,
          transition: "color 200ms, border-color 200ms",
        }}
      >
        Get the app
      </Link>
    </header>
  )
}
