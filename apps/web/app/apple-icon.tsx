import { ImageResponse } from "next/og"
import { VITRINE_MARK_PATHS, VITRINE_MARK_VIEWBOX } from "@/lib/marketing/brand-paths"

/**
 * Apple touch icon — same mark as `icon.tsx` rendered at 180px so iOS
 * gets a sharp asset for the home-screen / Safari shortcuts.
 */

export const runtime = "edge"
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
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
          width={size.width * 0.62}
          height={size.height * 0.62}
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
