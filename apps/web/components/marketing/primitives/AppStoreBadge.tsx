"use client"

import * as React from "react"
import { useState } from "react"
import { APP_STORE_URL, PLAY_STORE_URL } from "@vitrine/constants"
import { T } from "@/lib/marketing/tokens"

export interface AppStoreBadgeProps {
  store?: "apple" | "google"
  style?: React.CSSProperties
}

export function AppStoreBadge({ store = "apple", style }: AppStoreBadgeProps) {
  const isApple = store === "apple"
  const [hover, setHover] = useState(false)
  const href = isApple ? APP_STORE_URL : PLAY_STORE_URL
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        height: 52,
        padding: "0 20px",
        borderRadius: 12,
        background: T.fg1,
        color: T.void,
        textDecoration: "none",
        opacity: hover ? 0.9 : 1,
        transition: "opacity 120ms",
        ...style,
      }}
    >
      {isApple ? (
        <svg width="22" height="26" viewBox="0 0 24 28" fill="currentColor">
          <path d="M19.665 14.78c-.013-2.59 2.114-3.832 2.211-3.892-1.205-1.762-3.082-2.003-3.751-2.03-1.598-.16-3.117.943-3.928.943-.81 0-2.06-.917-3.385-.892-1.741.026-3.348 1.012-4.243 2.572-1.81 3.137-.462 7.778 1.302 10.323.86 1.246 1.886 2.645 3.234 2.595 1.298-.052 1.79-.838 3.357-.838s2.01.838 3.388.812c1.398-.026 2.284-1.27 3.139-2.522.99-1.448 1.398-2.852 1.422-2.926-.031-.013-2.731-1.05-2.746-4.165zM17.13 6.91c.717-.87 1.2-2.077 1.069-3.282-1.034.042-2.286.689-3.027 1.557-.665.768-1.247 1.998-1.09 3.18 1.153.09 2.331-.586 3.048-1.455z" />
        </svg>
      ) : (
        <svg width="22" height="26" viewBox="0 0 24 28" fill="none">
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#00a0ff" />
              <stop offset="1" stopColor="#00e0ff" />
            </linearGradient>
            <linearGradient id="g2" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#ffe000" />
              <stop offset="1" stopColor="#ff8a00" />
            </linearGradient>
            <linearGradient id="g3" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ff3a44" />
              <stop offset="1" stopColor="#c31162" />
            </linearGradient>
            <linearGradient id="g4" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#32a071" />
              <stop offset="1" stopColor="#2da771" />
            </linearGradient>
          </defs>
          <path d="M2 2.5l11 11.5L2 25.5z" fill="url(#g1)" />
          <path d="M16 11l5 3-5 3-3.5-3z" fill="url(#g2)" />
          <path d="M2 25.5L16 11l-3.5-2.5L2 2.5z" fill="url(#g3)" />
          <path d="M2 2.5L13 14l-1 1.5L2 25.5z" fill="url(#g4)" opacity=".75" />
        </svg>
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          lineHeight: 1.1,
        }}
      >
        <span
          style={{
            fontSize: 9.5,
            letterSpacing: 0.4,
            fontWeight: 500,
            opacity: 0.8,
          }}
        >
          {isApple ? "Download on the" : "Get it on"}
        </span>
        <span
          style={{
            fontFamily: T.fontDisplay,
            fontSize: 16.5,
            letterSpacing: 0.3,
          }}
        >
          {isApple ? "App Store" : "Google Play"}
        </span>
      </div>
    </a>
  )
}
