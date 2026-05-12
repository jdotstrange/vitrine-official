"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { T } from "@/lib/marketing/tokens"
import { AppStoreBadge } from "@/components/marketing/primitives"
import { usePrefersReducedMotion } from "@/lib/marketing/hooks"
import { Parallax } from "@/lib/marketing/Parallax"
import { KICKER_CYCLE } from "@/lib/marketing/constants"

// Real screen captures from production iOS build. Each PNG includes the iOS
// status bar at the top; masked by the black bar inside PhoneFrame so only
// the in-app chrome reads through.
const HERO_SCREENS = [
  { src: "/marketing/screens/hero-profile.png", alt: "Vitrine profile hub" },
  { src: "/marketing/screens/hero-detail.png", alt: "Vitrine collectible detail" },
  { src: "/marketing/screens/hero-radar.png", alt: "Vitrine tracking radar" },
  { src: "/marketing/screens/hero-looking-glass.png", alt: "Vitrine Looking Glass extraction" },
] as const

export function Hero() {
  const [kIdx, setKIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(
      () => setKIdx((i) => (i + 1) % KICKER_CYCLE.length),
      1800
    )
    return () => clearInterval(t)
  }, [])

  return (
    <section
      id="top"
      data-marketing-hero
      style={{
        position: "relative",
        padding: "40px 40px 120px",
        overflow: "hidden",
      }}
    >
      <div
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
          opacity: 0.6,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -200,
          left: "20%",
          width: 700,
          height: 700,
          pointerEvents: "none",
          background: `radial-gradient(circle, ${T.voltFill} 0%, transparent 60%)`,
        }}
      />

      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 48,
        }}
      >
        <Link
          href="/intelligence"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "6px 16px",
            borderRadius: 9999,
            border: `1px solid ${T.frostBorderStrong}`,
            background: "rgba(214,235,253,0.03)",
            textDecoration: "none",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "2px 8px",
                borderRadius: 9999,
                border: `1px solid ${T.oliveBorder}`,
                background: T.oliveFill,
                fontFamily: T.fontGrotesk,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: 1.2,
                color: T.olive,
                textTransform: "uppercase" as const,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: T.olive,
                  boxShadow: `0 0 6px ${T.olive}`,
                  animation: "pulseGlow 1.4s ease-in-out infinite",
                  flexShrink: 0,
                }}
              />
              Now Live
            </span>
            <span
              style={{
                fontFamily: T.fontInter,
                fontSize: 13,
                fontWeight: 500,
                color: T.fg1,
                whiteSpace: "nowrap",
              }}
            >
              Looking Glass AI (v1)
            </span>
          </span>
          <span
            style={{
              fontFamily: T.fontInter,
              fontSize: 13,
              color: T.fg2,
              textAlign: "center",
            }}
          >
            One photo. Identified, extracted, and validated. <span style={{ textDecoration: "underline" }}>No manual entry required.</span>
          </span>
          <span
            style={{
              fontFamily: T.fontGrotesk,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.8,
              color: T.volt,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Learn more →
          </span>
        </Link>

        <div
          data-marketing-hero-grid
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1.3fr 0.9fr",
            gap: 60,
            alignItems: "center",
          }}
        >
        <div>
          <h1
            data-marketing-hero-title
            style={{
              fontFamily: T.fontDisplay,
              fontWeight: 400,
              fontSize: 92,
              lineHeight: 0.94,
              letterSpacing: -2,
              margin: 0,
              textWrap: "balance",
            }}
          >
            Everything
            <br />
            <span
              key={kIdx}
              style={{
                fontFamily: T.fontCaslon,
                fontStyle: "italic",
                color: T.volt,
                animation: "feedFadeIn 380ms ease-out",
                display: "block",
              }}
            >
              {KICKER_CYCLE[kIdx].toLowerCase()}
            </span>
            collectors deserve.
          </h1>

          <p
            style={{
              maxWidth: 580,
              margin: "32px 0 0",
              fontSize: 18,
              lineHeight: 1.55,
              color: T.fg2,
            }}
          >
            The first collectibles platform that starts with the
            collector. Catalog from a photo. Value against real comps.
            Showcase what you&rsquo;ve built. Move pieces when
            you&rsquo;re ready.
          </p>

          <div
            data-marketing-hero-actions
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              marginTop: 36,
              flexWrap: "wrap",
            }}
          >
            <AppStoreBadge store="apple" />
            <AppStoreBadge store="google" />
          </div>

        </div>

        <div data-marketing-hero-phone>
          <HeroPhone />
        </div>
        </div>
      </div>
    </section>
  )
}

function HeroPhone() {
  const reduced = usePrefersReducedMotion()
  const [screenIdx, setScreenIdx] = useState(0)
  useEffect(() => {
    if (reduced) return
    const t = setInterval(
      () => setScreenIdx((i) => (i + 1) % HERO_SCREENS.length),
      4200
    )
    return () => clearInterval(t)
  }, [reduced])
  return (
    <Parallax amount={reduced ? 0 : 80}>
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-40px -20px",
            borderRadius: 60,
            background: `radial-gradient(ellipse at 50% 50%, ${T.voltFill} 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
        <PhoneFrame>
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {HERO_SCREENS.map((screen, i) => (
              <PhoneScreen key={screen.src} visible={screenIdx === i}>
                <Image
                  src={screen.src}
                  alt={screen.alt}
                  fill
                  sizes="320px"
                  priority={i === 0}
                  style={{ objectFit: "cover", objectPosition: "center top" }}
                />
              </PhoneScreen>
            ))}
            <ScreenIndicator idx={screenIdx} total={HERO_SCREENS.length} />
          </div>
        </PhoneFrame>
      </div>
    </Parallax>
  )
}

function PhoneScreen({
  visible,
  children,
}: {
  visible: boolean
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(20px)",
        transition:
          "opacity 600ms cubic-bezier(.2,.8,.2,1), transform 600ms cubic-bezier(.2,.8,.2,1)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {children}
    </div>
  )
}

function ScreenIndicator({ idx, total }: { idx: number; total: number }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: -28,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 6,
        zIndex: 10,
      }}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          style={{
            width: i === idx ? 18 : 5,
            height: 5,
            borderRadius: 3,
            background: i === idx ? T.volt : "rgba(214,235,253,0.25)",
            transition: "all 380ms cubic-bezier(.2,.8,.2,1)",
            boxShadow: i === idx ? `0 0 6px ${T.volt}` : "none",
          }}
        />
      ))}
    </div>
  )
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-marketing-phone-frame
      style={{
        position: "relative",
        width: 340,
        height: 700,
        borderRadius: 48,
        padding: 10,
        background: "linear-gradient(160deg, #2a2a2a 0%, #0a0a0a 60%)",
        boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px ${T.frostBorderStrong}, inset 0 0 0 2px rgba(255,255,255,0.04)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 18,
          left: "50%",
          transform: "translateX(-50%)",
          width: 110,
          height: 30,
          borderRadius: 20,
          background: "#000",
          zIndex: 5,
        }}
      />
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 40,
          background: T.void,
          overflow: "hidden",
          position: "relative",
          border: `1px solid ${T.frostDiv}`,
        }}
      >
        {children}
        {/* Status-bar mask: covers the iOS time/cellular/wifi/battery
            chrome baked into the screen captures so only the in-app UI
            reads through. ~7% of the 680px inner height matches the iOS
            status-bar ratio (59pt / 852pt on iPhone 14 Pro). The fake
            notch from the outer frame sits in front of this mask. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 56,
            background: T.void,
            zIndex: 4,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  )
}
