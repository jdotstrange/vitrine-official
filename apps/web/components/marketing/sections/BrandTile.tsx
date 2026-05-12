import * as React from "react"
import type { ArtifactSlot } from "@/lib/marketing/constants"

/**
 * BrandTile renders an iOS-style rounded-square approximation of a popular
 * collector workflow tool — Excel, Apple Photos, Apple Notes, eBay.
 *
 * These are intentionally approximations (drawn in SVG, no licensed marks)
 * so the ProblemSection can show the user the *fragmented* world they live
 * in today: a spreadsheet, a camera roll, a notes file, fourteen eBay tabs.
 *
 * Full color and present-tense recognizable — disruptive on purpose.
 */

interface BrandTileProps {
  slot: ArtifactSlot
  size?: number
  title?: string
}

export function BrandTile({ slot, size = 30, title }: BrandTileProps) {
  switch (slot) {
    case "excel":
      return <ExcelTile size={size} title={title ?? "Spreadsheet"} />
    case "photos":
      return <PhotosTile size={size} title={title ?? "Camera Roll"} />
    case "notes":
      return <NotesTile size={size} title={title ?? "Notes"} />
    case "ebay":
      return <EbayTile size={size} title={title ?? "eBay"} />
  }
}

// ───────── Common chrome ─────────

function tileFrame(size: number): React.CSSProperties {
  return {
    width: size,
    height: size,
    borderRadius: Math.round(size * 0.235), // iOS app-icon radius ratio
    overflow: "hidden",
    display: "inline-block",
    position: "relative",
    boxShadow:
      "0 0 0 0.5px rgba(255,255,255,0.06), 0 1px 2px rgba(0,0,0,0.45)",
    flexShrink: 0,
  }
}

// ───────── Excel ─────────
// Green gradient with stylized white "X".

function ExcelTile({ size, title }: { size: number; title: string }) {
  const left = "#1d6f42"
  const right = "#21a366"
  return (
    <span style={tileFrame(size)} aria-label={title} role="img">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="excelBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={left} />
            <stop offset="100%" stopColor={right} />
          </linearGradient>
        </defs>
        <rect width="32" height="32" fill="url(#excelBg)" />
        {/* subtle inner sheet hint on the right side */}
        <rect
          x="18"
          y="6"
          width="10"
          height="20"
          rx="1.2"
          fill="rgba(255,255,255,0.08)"
        />
        {/* stylized X — two crossed slabs */}
        <g fill="#ffffff">
          <polygon points="6,8 11,8 16,15.2 21,8 26,8 18.8,16 26,24 21,24 16,16.8 11,24 6,24 13.2,16" />
        </g>
      </svg>
    </span>
  )
}

// ───────── Apple Photos ─────────
// Six-petal rainbow pinwheel on white.

function PhotosTile({ size, title }: { size: number; title: string }) {
  const petals = [
    "#fc3d39", // red
    "#fcb73a", // orange
    "#fffd54", // yellow
    "#3ad963", // green
    "#5ac8fa", // blue
    "#cc73e1", // purple
  ]
  // Petal: a teardrop/flame shape pointing up, tip near center.
  // We rotate one path 6 times around (16,16).
  const petalPath = "M16 4 C 13.2 9.5, 13.2 14, 16 16 C 18.8 14, 18.8 9.5, 16 4 Z"
  return (
    <span style={tileFrame(size)} aria-label={title} role="img">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" fill="#ffffff" />
        <g style={{ mixBlendMode: "multiply" }}>
          {petals.map((color, i) => (
            <path
              key={i}
              d={petalPath}
              fill={color}
              transform={`rotate(${i * 60} 16 16)`}
              opacity={0.92}
            />
          ))}
        </g>
      </svg>
    </span>
  )
}

// ───────── Apple Notes ─────────
// Yellow paper with a tan top stripe and ruled lines.

function NotesTile({ size, title }: { size: number; title: string }) {
  return (
    <span style={tileFrame(size)} aria-label={title} role="img">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="notesBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fff5b3" />
            <stop offset="100%" stopColor="#fbe26a" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" fill="url(#notesBg)" />
        {/* tan top stripe */}
        <rect width="32" height="6.5" fill="#d8a96a" />
        {/* ruled lines */}
        <g stroke="#caa944" strokeWidth="0.9" strokeLinecap="round">
          <line x1="5" y1="13" x2="27" y2="13" />
          <line x1="5" y1="18" x2="27" y2="18" />
          <line x1="5" y1="23" x2="27" y2="23" />
          <line x1="5" y1="28" x2="20" y2="28" />
        </g>
      </svg>
    </span>
  )
}

// ───────── eBay ─────────
// White tile with multi-color "ebay" wordmark.

function EbayTile({ size, title }: { size: number; title: string }) {
  return (
    <span style={tileFrame(size)} aria-label={title} role="img">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="32" height="32" fill="#ffffff" />
        <text
          x="16"
          y="22"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif"
          fontWeight={800}
          fontSize="13"
          fontStyle="italic"
          letterSpacing="-0.4"
        >
          <tspan fill="#e53238">e</tspan>
          <tspan fill="#0064d3">b</tspan>
          <tspan fill="#f5af02">a</tspan>
          <tspan fill="#86b817">y</tspan>
        </text>
      </svg>
    </span>
  )
}
