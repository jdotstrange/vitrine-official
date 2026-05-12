"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import { T } from "@/lib/marketing/tokens"
import {
  AppStoreBadge,
  Kicker,
  MIcon,
  Pill,
} from "@/components/marketing/primitives"
import {
  usePrefersReducedMotion,
  useTicker,
} from "@/lib/marketing/hooks"
import { Parallax } from "@/lib/marketing/Parallax"
import { KICKER_CYCLE } from "@/lib/marketing/constants"

export function Hero() {
  const tick = useTicker(2200)
  const pieces = 12847 + Math.floor(Math.sin(tick / 4) * 40 + tick * 0.7)
  const events = (4.12 + Math.sin(tick / 3) * 0.12).toFixed(2)

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
        padding: "80px 40px 120px",
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
        data-marketing-hero-grid
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          position: "relative",
          zIndex: 2,
          display: "grid",
          gridTemplateColumns: "1.3fr 0.9fr",
          gap: 60,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 14px",
              borderRadius: 9999,
              border: `1px solid ${T.voltBorder}`,
              background: T.voltFill,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: T.volt,
                boxShadow: `0 0 8px ${T.volt}`,
                animation: "pulseGlow 1.4s ease-in-out infinite",
              }}
            />
            <Kicker color={T.volt}>VITRINE · INTELLIGENCE FOR COLLECTORS</Kicker>
          </div>

          <h1
            data-marketing-hero-title
            style={{
              fontFamily: T.fontDisplay,
              fontWeight: 400,
              fontSize: 92,
              lineHeight: 0.94,
              letterSpacing: -2,
              margin: "36px 0 0",
              textWrap: "balance",
            }}
          >
            Everything
            <br />
            serious{" "}
            <span
              style={{
                position: "relative",
                display: "inline-block",
                minWidth: 240,
              }}
            >
              <span
                key={kIdx}
                style={{
                  fontFamily: T.fontCaslon,
                  fontStyle: "italic",
                  color: T.volt,
                  animation: "feedFadeIn 380ms ease-out",
                }}
              >
                {KICKER_CYCLE[kIdx].toLowerCase()}
              </span>
            </span>
            <br />
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
            One photo. Every field, extracted. The market, watched. The
            comp, found. The piece, valued. The crowd you actually want to
            show — already inside. Your collection, finally, given the
            apparatus it deserved.
          </p>

          <div
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

          <div
            data-marketing-hero-stats
            style={{
              display: "flex",
              gap: 32,
              marginTop: 56,
              paddingTop: 28,
              borderTop: `1px solid ${T.frostDiv}`,
              flexWrap: "wrap",
            }}
          >
            <LiveStat
              label="PIECES CATALOGED"
              value={pieces.toLocaleString()}
              live
            />
            <LiveStat label="PULSE EVENTS / DAY" value={`${events}M`} live />
            <LiveStat label="AVG PERFECT MATCH" value="94%" />
            <LiveStat label="CATEGORIES" value="38" />
          </div>
        </div>

        <div data-marketing-hero-phone>
          <HeroPhone />
        </div>
      </div>
    </section>
  )
}

interface LiveStatProps {
  label: string
  value: string
  live?: boolean
}

function LiveStat({ label, value, live }: LiveStatProps) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        {live && (
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: 3,
              background: T.volt,
              boxShadow: `0 0 6px ${T.volt}`,
              animation: "pulseGlow 1.4s ease-in-out infinite",
            }}
          />
        )}
        <Kicker style={{ fontSize: 9.5 }}>{label}</Kicker>
      </div>
      <div
        style={{
          fontFamily: T.fontDisplay,
          fontSize: 38,
          lineHeight: 1,
          letterSpacing: -0.6,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function HeroPhone() {
  const reduced = usePrefersReducedMotion()
  const [screenIdx, setScreenIdx] = useState(0)
  useEffect(() => {
    if (reduced) return
    const t = setInterval(() => setScreenIdx((i) => (i + 1) % 3), 4200)
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
            <PhoneScreen visible={screenIdx === 0}>
              <PhoneAppHome />
            </PhoneScreen>
            <PhoneScreen visible={screenIdx === 1}>
              <PhoneAppLens />
            </PhoneScreen>
            <PhoneScreen visible={screenIdx === 2}>
              <PhoneAppPulse />
            </PhoneScreen>
            <ScreenIndicator idx={screenIdx} />
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

function ScreenIndicator({ idx }: { idx: number }) {
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
      {[0, 1, 2].map((i) => (
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
      </div>
    </div>
  )
}

function PhoneAppHome() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: T.fontInter,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "14px 28px 0",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <span>9:41</span>
        <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <MIcon name="signal" size={12} />
          <MIcon name="wifi" size={12} />
          <MIcon name="battery-full" size={14} />
        </span>
      </div>

      <div
        style={{
          padding: "40px 20px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Kicker style={{ fontSize: 9 }}>YOUR VITRINE</Kicker>
          <div
            style={{
              fontFamily: T.fontDisplay,
              fontSize: 22,
              marginTop: 4,
              letterSpacing: -0.2,
            }}
          >
            The Vintage Files
          </div>
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            border: `1px solid ${T.frostBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MIcon name="search" size={14} color={T.fg2} />
        </div>
      </div>

      <div style={{ padding: "0 20px" }}>
        <div
          style={{
            height: 220,
            borderRadius: 16,
            overflow: "hidden",
            position: "relative",
            background:
              "radial-gradient(ellipse at 50% 35%, #c41a1a 0%, #5a0a0a 60%, #1a0606 100%)",
            border: `1px solid ${T.frostDiv}`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, transparent 35%, rgba(255,255,255,0.08) 50%, transparent 65%)",
            }}
          />
          <div style={{ position: "absolute", top: 12, left: 12 }}>
            <Pill variant="volt">CROWN JEWEL</Pill>
          </div>
          <div style={{ position: "absolute", top: 12, right: 12 }}>
            <Pill variant="graded">PSA 10</Pill>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              right: 12,
            }}
          >
            <div
              style={{
                fontFamily: T.fontDisplay,
                fontSize: 18,
                color: "#fff",
                letterSpacing: -0.2,
              }}
            >
              1986 Fleer Jordan #57
            </div>
            <div
              style={{
                fontFamily: T.fontMono,
                fontSize: 10,
                color: "rgba(255,255,255,0.7)",
                marginTop: 2,
              }}
            >
              FMV $84,500 · ↗ +4.2%
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          margin: "16px 20px 0",
          display: "flex",
          justifyContent: "space-between",
          borderTop: `1px solid ${T.frostDiv}`,
          borderBottom: `1px solid ${T.frostDiv}`,
          padding: "10px 0",
        }}
      >
        {["SPECS", "PULSE", "AAR", "VAR", "COMPS"].map((l, i) => (
          <span
            key={l}
            style={{
              fontFamily: T.fontGrotesk,
              fontWeight: 700,
              fontSize: 9.5,
              letterSpacing: 1.2,
              color: i === 1 ? T.volt : T.fg3,
              paddingBottom: 4,
              borderBottom: i === 1 ? `2px solid ${T.volt}` : "2px solid transparent",
            }}
          >
            {l}
          </span>
        ))}
      </div>

      <div
        style={{
          padding: "12px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          flex: 1,
          overflow: "hidden",
        }}
      >
        {[
          {
            dot: T.green,
            t: "Perfect comp · $1,420",
            s: "Topps Chrome Trout · 12s",
          },
          {
            dot: T.blue,
            t: "Trade pinged · @grailcave",
            s: "Chicago AJ1 · 1m",
          },
          {
            dot: T.volt,
            t: "VAR refreshed · ±4.2%",
            s: "Speedmaster · 2m",
          },
          {
            dot: T.green,
            t: "Strong comp · $58,200",
            s: "Jordan #57 PSA 8 · 3m",
          },
        ].map((e, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 0",
              borderTop: i ? `1px solid ${T.frostDiv}` : "none",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: e.dot,
                boxShadow: `0 0 8px ${e.dot}`,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11.5,
                  color: T.fg1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {e.t}
              </div>
              <div
                style={{
                  fontFamily: T.fontMono,
                  fontSize: 9,
                  color: T.fg3,
                  marginTop: 2,
                }}
              >
                {e.s}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          margin: "0 20px 20px",
          padding: "8px 12px",
          display: "flex",
          justifyContent: "space-between",
          borderRadius: 16,
          background: T.sheetBg,
          border: `1px solid ${T.frostDiv}`,
        }}
      >
        {["home", "compass", "plus", "target", "user"].map((ic, i) => (
          <span
            key={ic}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: i === 0 ? T.voltFill : "transparent",
              color: i === 0 ? T.volt : T.fg2,
            }}
          >
            <MIcon name={ic} size={16} />
          </span>
        ))}
      </div>
    </div>
  )
}

function PhoneAppLens() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: T.fontInter,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "14px 28px 0",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <span>9:41</span>
        <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <MIcon name="signal" size={12} />
          <MIcon name="wifi" size={12} />
          <MIcon name="battery-full" size={14} />
        </span>
      </div>
      <div
        style={{
          padding: "28px 20px 12px",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <MIcon name="arrow-left" size={16} color={T.fg2} />
        <Kicker style={{ fontSize: 9 }}>JORDAN · #57 · PSA 10</Kicker>
        <span style={{ marginLeft: "auto" }}>
          <MIcon name="more-horizontal" size={16} color={T.fg2} />
        </span>
      </div>
      <div style={{ padding: "0 20px" }}>
        <div
          style={{
            height: 200,
            borderRadius: 16,
            overflow: "hidden",
            background:
              "radial-gradient(ellipse at 50% 35%, #c41a1a 0%, #5a0a0a 60%, #1a0606 100%)",
            border: `1px solid ${T.frostDiv}`,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, transparent 35%, rgba(255,255,255,0.1) 50%, transparent 65%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 14,
              right: 14,
            }}
          >
            <div
              style={{
                fontFamily: T.fontDisplay,
                fontSize: 16,
                color: "#fff",
                letterSpacing: -0.2,
              }}
            >
              1986 Fleer #57
            </div>
            <div
              style={{
                fontFamily: T.fontMono,
                fontSize: 10,
                color: "rgba(255,255,255,0.7)",
                marginTop: 2,
              }}
            >
              FMV $84,500
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          margin: "14px 20px 0",
          display: "flex",
          justifyContent: "space-between",
          borderTop: `1px solid ${T.frostDiv}`,
          borderBottom: `1px solid ${T.frostDiv}`,
          padding: "10px 0",
        }}
      >
        {["SPECS", "PULSE", "AAR", "VAR", "COMPS"].map((l, i) => (
          <span
            key={l}
            style={{
              fontFamily: T.fontGrotesk,
              fontWeight: 700,
              fontSize: 9.5,
              letterSpacing: 1.2,
              color: i === 0 ? T.volt : T.fg3,
              paddingBottom: 4,
              borderBottom: i === 0 ? `2px solid ${T.volt}` : "2px solid transparent",
            }}
          >
            {l}
          </span>
        ))}
      </div>
      <div style={{ padding: "14px 20px", flex: 1, overflow: "hidden" }}>
        {[
          ["Set", "Fleer · 1986\u201387"],
          ["Card #", "57"],
          ["Grade", "PSA 10 GEM MT"],
          ["Cert", "24890132"],
          ["Pop", "317"],
          ["Subject", "Michael Jordan · RC"],
          ["Provenance", "Goldin · 2023"],
        ].map(([k, v], i) => (
          <div
            key={k}
            style={{
              display: "grid",
              gridTemplateColumns: "90px 1fr",
              padding: "7px 0",
              borderTop: i ? `1px solid ${T.frostDiv}` : "none",
              alignItems: "baseline",
            }}
          >
            <span
              style={{
                fontFamily: T.fontGrotesk,
                fontWeight: 700,
                fontSize: 9,
                letterSpacing: 1.2,
                color: T.fg3,
                textTransform: "uppercase",
              }}
            >
              {k}
            </span>
            <span
              style={{
                fontFamily: T.fontMono,
                fontSize: 11.5,
                color: T.fg1,
              }}
            >
              {v}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PhoneAppPulse() {
  const events = [
    { dot: T.green, t: "Perfect comp · $1,420", s: "Topps Chrome Trout · 12s" },
    { dot: T.blue, t: "Trade pinged · @grailcave", s: "Chicago AJ1 · 1m" },
    { dot: T.volt, t: "VAR refreshed · ±4.2%", s: "Speedmaster · 2m" },
    { dot: T.green, t: "Strong comp · $58,200", s: "Jordan #57 PSA 8 · 3m" },
    { dot: T.orange, t: "Sell+Trade · 1969 Speedy", s: "WatchCollective · 4m" },
    { dot: T.green, t: "Perfect comp · $11,850", s: "Blue Train mono · 6m" },
  ]
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: T.fontInter,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "14px 28px 0",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <span>9:41</span>
        <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <MIcon name="signal" size={12} />
          <MIcon name="wifi" size={12} />
          <MIcon name="battery-full" size={14} />
        </span>
      </div>
      <div
        style={{
          padding: "36px 20px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Kicker style={{ fontSize: 9 }}>PULSE</Kicker>
          <div
            style={{
              fontFamily: T.fontDisplay,
              fontSize: 22,
              marginTop: 4,
              letterSpacing: -0.2,
            }}
          >
            Today
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: T.volt,
              boxShadow: `0 0 6px ${T.volt}`,
              animation: "pulseGlow 1.4s ease-in-out infinite",
            }}
          />
          <span
            style={{
              fontFamily: T.fontMono,
              fontSize: 9.5,
              color: T.volt,
              letterSpacing: 1,
            }}
          >
            LIVE
          </span>
        </div>
      </div>
      <div style={{ flex: 1, overflow: "hidden", padding: "0 20px" }}>
        {events.map((e, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "12px 0",
              borderTop: i ? `1px solid ${T.frostDiv}` : "none",
              opacity: i === 0 ? 1 : 1 - i * 0.06,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: e.dot,
                boxShadow: `0 0 8px ${e.dot}`,
                marginTop: 6,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11.5,
                  color: T.fg1,
                  lineHeight: 1.35,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {e.t}
              </div>
              <div
                style={{
                  fontFamily: T.fontMono,
                  fontSize: 9,
                  color: T.fg3,
                  marginTop: 3,
                }}
              >
                {e.s}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          margin: "0 20px 20px",
          padding: "8px 12px",
          display: "flex",
          justifyContent: "space-between",
          borderRadius: 16,
          background: T.sheetBg,
          border: `1px solid ${T.frostDiv}`,
        }}
      >
        {["home", "compass", "plus", "target", "user"].map((ic, i) => (
          <span
            key={ic}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: i === 3 ? T.voltFill : "transparent",
              color: i === 3 ? T.volt : T.fg2,
            }}
          >
            <MIcon name={ic} size={16} />
          </span>
        ))}
      </div>
    </div>
  )
}
