"use client"

import * as React from "react"
import { useState } from "react"
import { T } from "@/lib/marketing/tokens"
import { Kicker, Pill } from "@/components/marketing/primitives"
import {
  EXPLORE_FILTERS,
  EXPLORE_ITEMS,
  STATUS_LABEL,
  type ExploreItem,
} from "@/lib/marketing/constants"
import { SectionHeader } from "./SectionHeader"

export function ExploreSection() {
  return (
    <section
      id="explore"
      data-marketing-section="explore"
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
          top: "20%",
          left: "-12%",
          width: 640,
          height: 640,
          borderRadius: "50%",
          pointerEvents: "none",
          background: `radial-gradient(closest-side, ${T.voltFill}, transparent 70%)`,
          opacity: 0.45,
        }}
      />
      <div
        style={{ maxWidth: 1280, margin: "0 auto", position: "relative" }}
      >
        <SectionHeader
          num="10"
          kicker="EXPLORE"
          title={
            <>
              Real pieces.{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.volt,
                }}
              >
                Live
              </em>{" "}
              on Vitrine.
            </>
          }
          sub="A slice of what collectors are cataloging right now. Tap any piece to see all five lenses."
        />

        <div
          data-marketing-grid="explore-filters"
          style={{
            display: "flex",
            gap: 8,
            marginTop: 60,
            flexWrap: "wrap",
            borderBottom: `1px solid ${T.frostDiv}`,
            paddingBottom: 16,
          }}
        >
          {EXPLORE_FILTERS.map((c, i) => (
            <span
              key={c}
              style={{
                padding: "6px 14px",
                borderRadius: 9999,
                background: i === 0 ? T.fg1 : "transparent",
                color: i === 0 ? T.void : T.fg2,
                border: `1px solid ${i === 0 ? T.fg1 : T.frostDiv}`,
                fontFamily: T.fontGrotesk,
                fontWeight: 700,
                fontSize: 10.5,
                letterSpacing: 1.2,
                cursor: "pointer",
              }}
            >
              {c}
            </span>
          ))}
        </div>

        <div
          data-marketing-grid="explore-items"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginTop: 32,
          }}
        >
          {EXPLORE_ITEMS.map((it, i) => (
            <SpatialCard
              key={i}
              item={it}
              statusLabel={STATUS_LABEL[it.status]}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

interface SpatialCardProps {
  item: ExploreItem
  statusLabel: string
}

function SpatialCard({ item, statusLabel }: SpatialCardProps) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        aspectRatio: "4/5",
        borderRadius: 14,
        overflow: "hidden",
        border: `1px solid ${hover ? T.frostBorderStrong : T.frostDiv}`,
        cursor: "pointer",
        transition:
          "transform 280ms cubic-bezier(.2,.8,.2,1), border-color 200ms",
        transform: hover ? "translateY(-3px)" : "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${item.photo})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          transform: hover ? "scale(1.06)" : "scale(1)",
          transition: "transform 600ms",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 28%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.95) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          right: 12,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Pill style={{ background: "rgba(0,0,0,0.5)" }}>{item.cat}</Pill>
        <Pill variant={item.status}>{statusLabel}</Pill>
      </div>
      <div style={{ position: "absolute", left: 14, right: 14, bottom: 14 }}>
        <div
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 16,
            color: T.fg1,
            letterSpacing: -0.2,
            lineHeight: 1.15,
          }}
        >
          {item.name}
        </div>
        <div
          style={{
            fontFamily: T.fontCaslon,
            fontStyle: "italic",
            fontSize: 11.5,
            color: "rgba(255,255,255,0.65)",
            marginTop: 4,
          }}
        >
          {item.set}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginTop: 8,
          }}
        >
          <span
            style={{
              fontFamily: T.fontMono,
              fontSize: 13,
              color: T.fg1,
            }}
          >
            {item.price}
          </span>
          <Kicker style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>
            FMV
          </Kicker>
        </div>
      </div>
    </div>
  )
}
