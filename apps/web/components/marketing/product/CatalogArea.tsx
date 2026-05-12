"use client"

import * as React from "react"
import { useState } from "react"
import { T } from "@/lib/marketing/tokens"
import {
  FrostCard,
  Kicker,
  Pill,
} from "@/components/marketing/primitives"
import { SCHEMAS, type SchemaKey } from "@/lib/marketing/constants"
import { SectionHeader } from "@/components/marketing/sections/SectionHeader"

const TABS: SchemaKey[] = ["CARD", "WATCH", "COMIC", "SNEAKER", "COIN"]

/**
 * CatalogArea — migrated from sections/CatalogingSection.tsx for /product.
 * Demonstrates per-category attribute schemas. The fields change with the
 * piece — a Fleer rookie and a Speedmaster reference are not the same
 * kind of object.
 */
export function CatalogArea() {
  const [active, setActive] = useState<SchemaKey>("CARD")
  const s = SCHEMAS[active]
  return (
    <section
      id="catalog"
      data-marketing-section="catalog"
      style={{
        padding: "160px 40px",
        borderTop: `1px solid ${T.frostDiv}`,
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <SectionHeader
          num="01"
          kicker="CATALOG"
          title={
            <>
              The fields{" "}
              <em
                style={{
                  fontFamily: T.fontDisplay,
                  fontStyle: "italic",
                  color: T.volt,
                }}
              >
                change
              </em>{" "}
              with the piece.
            </>
          }
          sub="Generic apps give you a name and a price. Vitrine knows that a Fleer rookie and a Speedmaster reference are not the same kind of object — and gives each its own schema."
        />

        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 60,
            flexWrap: "wrap",
          }}
        >
          {TABS.map((c) => (
            <span
              key={c}
              onClick={() => setActive(c)}
              style={{
                padding: "8px 18px",
                borderRadius: 9999,
                cursor: "pointer",
                background: active === c ? T.fg1 : "transparent",
                color: active === c ? T.void : T.fg2,
                border: `1px solid ${active === c ? T.fg1 : T.frostDiv}`,
                fontFamily: T.fontGrotesk,
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: 1.4,
                transition: "all 200ms",
              }}
            >
              {c}
            </span>
          ))}
        </div>

        <div
          data-marketing-grid="cataloging-split"
          style={{
            display: "grid",
            gridTemplateColumns: "0.9fr 1.1fr",
            gap: 32,
            marginTop: 32,
          }}
        >
          <div
            style={{
              position: "relative",
              borderRadius: 16,
              overflow: "hidden",
              border: `1px solid ${T.frostBorderStrong}`,
              minHeight: 520,
              backgroundImage: `url(${s.photo})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.95) 100%)",
              }}
            />
            <div style={{ position: "absolute", top: 16, left: 16 }}>
              <Pill style={{ background: "rgba(0,0,0,0.55)" }}>{active}</Pill>
            </div>
            <div
              style={{
                position: "absolute",
                left: 20,
                right: 20,
                bottom: 20,
              }}
            >
              <div
                style={{
                  fontFamily: T.fontDisplay,
                  fontSize: 28,
                  color: T.fg1,
                  letterSpacing: -0.4,
                  lineHeight: 1.1,
                }}
              >
                {s.name}
              </div>
              <div
                style={{
                  fontFamily: T.fontCaslon,
                  fontStyle: "italic",
                  fontSize: 14,
                  color: "rgba(255,255,255,0.7)",
                  marginTop: 4,
                }}
              >
                {s.sub}
              </div>
            </div>
          </div>

          <FrostCard hover={false} style={{ padding: 36 }}>
            <Kicker color={T.volt}>SCHEMA &middot; {active}</Kicker>
            <div key={active} style={{ marginTop: 24 }}>
              {s.fields.map(([k, v], i) => (
                <div
                  key={k}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "160px 1fr",
                    padding: "14px 0",
                    borderTop: i ? `1px solid ${T.frostDiv}` : "none",
                    alignItems: "baseline",
                    opacity: 0,
                    transform: "translateY(6px)",
                    animation: `printoutIn 480ms cubic-bezier(.2,.8,.2,1) ${
                      i * 70
                    }ms forwards`,
                  }}
                >
                  <Kicker style={{ fontSize: 9.5 }}>{k}</Kicker>
                  <div
                    style={{
                      fontFamily: T.fontMono,
                      fontSize: 13,
                      color: T.fg1,
                      letterSpacing: 0.3,
                    }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: `1px solid ${T.frostDiv}`,
                fontSize: 12.5,
                color: T.fg3,
                lineHeight: 1.55,
              }}
            >
              + 12 more fields specific to {active.toLowerCase()}s &mdash;
              language, edition flags, authenticator IDs, condition deltas.
              Vitrine learns the vocabulary of each thing you collect.
            </div>
          </FrostCard>
        </div>
      </div>
    </section>
  )
}
