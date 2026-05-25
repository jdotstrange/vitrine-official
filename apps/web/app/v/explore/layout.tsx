"use client"

import type { ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { LensSelector, type LensItem } from "@/components/vault"

type LensKey = "hot" | "new" | "browse"

const LENSES: LensItem<LensKey>[] = [
  { key: "hot", label: "Hot" },
  { key: "new", label: "New" },
  { key: "browse", label: "Browse" },
]

export default function ExploreLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const active = (pathname.split("/")[3] ?? "hot") as LensKey

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
          Explore
        </h1>
        <p className="text-fg2 text-sm mt-1">
          What's hot, what's new, what's listed.
        </p>
      </div>
      <LensSelector
        items={LENSES}
        activeKey={active}
        onChange={(k) => router.push(`/v/explore/${k}`)}
      />
      <div className="max-w-7xl mx-auto px-8 py-6">{children}</div>
    </div>
  )
}
