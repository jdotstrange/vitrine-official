"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { LensSelector, type LensItem } from "@/components/vault"

type LensKey = "tracked" | "activity" | "comps"

const LENSES: LensItem<LensKey>[] = [
  { key: "tracked", label: "Tracked" },
  { key: "activity", label: "Activity" },
  { key: "comps", label: "Comps" },
]

export default function TrackingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const active = (pathname.split("/")[3] ?? "tracked") as LensKey

  return (
    <div className="min-h-screen">
      <div className="border-b border-frost-border px-8 py-6">
        <h1
          className="text-fg1 uppercase"
          style={{
            fontFamily: "var(--font-grotesk)",
            fontSize: 28,
            letterSpacing: 1.5,
            fontWeight: 700,
          }}
        >
          Tracking Hub
        </h1>
        <p className="text-fg2 text-sm mt-1">
          Your watchlist, telemetry, and comp matches.
        </p>
      </div>
      <LensSelector
        items={LENSES}
        activeKey={active}
        onChange={(k) => router.push(`/v/tracking/${k}`)}
      />
      <div className="max-w-6xl mx-auto px-8 py-6">{children}</div>
    </div>
  )
}
