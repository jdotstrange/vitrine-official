import { ImageResponse } from "next/og"
import { VITRINE_MARK_PATHS, VITRINE_MARK_VIEWBOX } from "@/lib/marketing/brand-paths"

/**
 * Dynamic favicon — crown-in-vitrine mark in V3 ivory on void.
 * Generated at request time via `next/og` so the icon stays in sync with
 * the brand palette without shipping multiple raster sizes.
 */

export const runtime = "edge"
export const size = { width: 64, height: 64 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000000",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width={size.width * 0.78}
          height={size.height * 0.78}
          viewBox={VITRINE_MARK_VIEWBOX}
          xmlns="http://www.w3.org/2000/svg"
        >
          {VITRINE_MARK_PATHS.map((d, i) => (
            <path key={i} d={d} fill="#E8E0D4" />
          ))}
        </svg>
      </div>
    ),
    size
  )
}
