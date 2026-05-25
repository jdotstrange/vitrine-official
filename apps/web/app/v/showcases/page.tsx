"use client"

import Link from "next/link"
import { Plus, Layers } from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { useShowcases } from "@/lib/hooks/use-showcases"
import { EmptyState, ShowcaseCard } from "@/components/vault"

export default function ShowcasesPage() {
  const { profile } = useUser()
  const { showcases, loading } = useShowcases({ userId: profile?.id })

  return (
    <div className="min-h-screen">
      <div className="border-b border-frost-border px-8 py-6 flex items-center justify-between">
        <div>
          <h1
            className="text-fg1 uppercase"
            style={{
              fontFamily: "var(--font-grotesk)",
              fontSize: 28,
              letterSpacing: 1.5,
              fontWeight: 700,
            }}
          >
            Showcases
          </h1>
          <p className="text-fg2 text-sm mt-1">
            {showcases.length} showcase{showcases.length === 1 ? "" : "s"}
          </p>
        </div>
        <Link
          href="/v/showcases/new"
          className="flex items-center gap-2 rounded-md bg-brand-volt text-text-inverse px-4 py-2 text-[12px] uppercase font-semibold tracking-wider hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          New
        </Link>
      </div>

      <div className="px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-frost-border/10 rounded-2xl animate-pulse"
                style={{ aspectRatio: "1 / 1.4" }}
              />
            ))}
          </div>
        ) : showcases.length === 0 ? (
          <EmptyState
            icon={<Layers size={20} color="var(--fg2)" />}
            title="No showcases yet"
            subtitle="Showcases are curated subsets of your collection. Create your first one."
            action={
              <Link
                href="/v/showcases/new"
                className="rounded-md bg-brand-volt text-text-inverse px-4 py-2 text-[12px] uppercase font-semibold tracking-wider hover:opacity-90 transition-opacity"
              >
                Create showcase
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {showcases.map((s) => (
              <ShowcaseCard
                key={s.id}
                showcase={{
                  id: s.id,
                  title: s.title,
                  itemCount: s.items,
                  totalValue: s.totalValue,
                  showcaseType: s.showcaseType,
                  previewImages: s.images ?? [],
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
