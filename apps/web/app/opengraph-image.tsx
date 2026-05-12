import { ImageResponse } from "next/og"
import { VITRINE_MARK_PATHS, VITRINE_MARK_VIEWBOX } from "@/lib/marketing/brand-paths"

/**
 * OpenGraph share card — 1200×630 dark canvas with the crown mark on the
 * left, wordmark + tagline on the right. Generated dynamically so swapping
 * the brand palette in design tokens propagates here on the next build.
 *
 * Used by Twitter, iMessage, Discord, Slack — any context that surfaces
 * an unfurled link preview for `vitrine.app`.
 */

export const runtime = "edge"
export const alt = "Vitrine — Everything serious collectors deserve"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000000",
          color: "#E8E0D4",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 100px",
          gap: 80,
          position: "relative",
        }}
      >
        {/* Faint warm halo behind the mark for depth */}
        <div
          style={{
            position: "absolute",
            top: -200,
            left: 200,
            width: 700,
            height: 700,
            background:
              "radial-gradient(circle, rgba(232,224,212,0.12) 0%, transparent 60%)",
            display: "flex",
          }}
        />

        <svg
          width={300}
          height={300}
          viewBox={VITRINE_MARK_VIEWBOX}
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: "relative" }}
        >
          {VITRINE_MARK_PATHS.map((d, i) => (
            <path key={i} d={d} fill="#E8E0D4" />
          ))}
        </svg>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
            maxWidth: 620,
          }}
        >
          <div
            style={{
              fontSize: 28,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#E8E0D4",
              opacity: 0.7,
              marginBottom: 24,
            }}
          >
            Vitrine
          </div>
          <div
            style={{
              fontSize: 72,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              color: "#F5EFE5",
              fontWeight: 400,
            }}
          >
            Everything serious collectors deserve.
          </div>
          <div
            style={{
              fontSize: 22,
              lineHeight: 1.4,
              color: "#A8A39A",
              marginTop: 32,
              maxWidth: 560,
            }}
          >
            Catalog, present, track, and transact your collection.
          </div>
        </div>
      </div>
    ),
    size
  )
}
