"use client"

import * as React from "react"
import { useState } from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker, Pill } from "@/components/marketing/primitives"
import { Parallax } from "@/lib/marketing/Parallax"
import { SHOWCASES, type ShowcaseEntry } from "@/lib/marketing/constants"
import { SectionHeader } from "@/components/marketing/sections/SectionHeader"

const TONE_MAP: Record<ShowcaseEntry["tone"], string> = {
  blue: T.blue,
  cyan: T.cyan,
  orange: T.orange,
  red: T.red,
  olive: T.olive,
  volt: T.volt,
}

/**
 * ShowcaseArea — migrated from sections/ShowcasesSection.tsx for /product.
 * Crown Jewel narrative — every showcase is anchored by its defining piece.
 */
export function ShowcaseArea() {
  return (
    <section
      id="showcase"
      data-marketing-section="showcase"
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
          top: "-10%",
          right: "-15%",
          width: 720,
          height: 720,
          borderRadius: "50%",
          pointerEvents: "none",
          background: `radial-gradient(closest-side, ${T.voltFill}, transparent 70%)`,
          opacity: 0.55,
        }}
      />
      <div
        style={{ maxWidth: 1280, margin: "0 auto", position: "relative" }}
      >
        <SectionHeader
          num="02"
          kicker="SHOWCASE"
          title={
            <>
              Curate a{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.volt,
                }}
              >
                Crown Jewel.
              </em>
            </>
          }
          sub="Every Showcase is anchored by a Crown Jewel — the piece that defines the collection. The supporting cast frames it. Build as many as you want, public or private, share-by-link or sealed in your vault."
        />
        <div
          data-marketing-grid="showcases"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginTop: 80,
          }}
        >
          {SHOWCASES.map((s, i) => {
            const amount = [50, 18, 50][i] ?? 30
            const { key: _key, tone, ...rest } = s
            return (
              <Parallax key={s.key} amount={amount}>
                <ShowcaseCard {...rest} tone={TONE_MAP[tone]} />
              </Parallax>
            )
          })}
        </div>
      </div>
    </section>
  )
}

interface ShowcaseCardProps {
  photo: string
  title: string
  count: number
  jewel: string
  tag: string
  tone: string
}

function ShowcaseCard({ photo, title, count, jewel, tag, tone }: ShowcaseCardProps) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        height: 360,
        borderRadius: 14,
        overflow: "hidden",
        border: `1px solid ${hover ? T.frostBorderStrong : T.frostDiv}`,
        cursor: "pointer",
        transition:
          "transform 380ms cubic-bezier(.2,.8,.2,1), border-color 380ms",
        transform: hover ? "translateY(-4px)" : "translateY(0)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${photo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: hover ? "scale(1.04)" : "scale(1)",
          transition: "transform 700ms cubic-bezier(.2,.8,.2,1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.9) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 18,
          top: 18,
          display: "flex",
          gap: 6,
        }}
      >
        <Pill
          style={{
            borderColor: tone,
            color: tone,
            background: "rgba(0,0,0,0.4)",
          }}
        >
          {tag}
        </Pill>
      </div>
      <div style={{ position: "absolute", left: 18, right: 18, bottom: 18 }}>
        <Kicker style={{ fontSize: 9.5, color: tone, marginBottom: 8 }}>
          CROWN JEWEL &middot; {jewel.toUpperCase()}
        </Kicker>
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 24,
            letterSpacing: -0.3,
            color: T.fg1,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: T.fontMono,
            fontSize: 11,
            color: T.fg2,
            marginTop: 4,
          }}
        >
          {count} pieces &middot; last updated 2d
        </div>
      </div>
    </div>
  )
}
