"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Check } from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { useCollectibles } from "@/lib/hooks/use-collectibles"
import { getClientApi } from "@/lib/api-client"
import {
  CollectibleCard,
  EmptyState,
  LensSelector,
  type LensItem,
} from "@/components/vault"
import type { ManagedRules } from "@vitrine/api"

type ShowcaseType = "manual" | "managed"

const TYPE_LENSES: LensItem<ShowcaseType>[] = [
  { key: "manual", label: "Curated" },
  { key: "managed", label: "Managed" },
]

export default function NewShowcasePage() {
  const router = useRouter()
  const { profile } = useUser()
  const { collectibles } = useCollectibles({ userId: profile?.id })

  const [type, setType] = useState<ShowcaseType>("manual")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private">("public")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [rulesJson, setRulesJson] = useState<string>(
    JSON.stringify({ matchMode: "ALL", conditions: [] }, null, 2),
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSubmitting(true)
    setError(null)
    try {
      const api = getClientApi()
      let showcaseId: string
      if (type === "manual") {
        if (selectedIds.size === 0) {
          throw new Error("Select at least one collectible")
        }
        showcaseId = await api.showcases.createShowcase({
          type: "manual",
          userId: profile.id,
          title,
          description: description || undefined,
          visibility,
          collectibleIds: Array.from(selectedIds),
        })
      } else {
        let rules: ManagedRules
        try {
          rules = JSON.parse(rulesJson)
        } catch {
          throw new Error("Rules JSON is invalid")
        }
        showcaseId = await api.showcases.createShowcase({
          type: "managed",
          userId: profile.id,
          title,
          description: description || undefined,
          visibility,
          rules,
        })
      }
      router.push(`/v/showcase/${showcaseId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create showcase")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-frost-border px-8 py-4 flex items-center justify-between">
        <Link
          href="/v/showcases"
          className="flex items-center gap-2 text-fg2 hover:text-fg1 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Showcases
        </Link>
        <h1 className="text-fg1 font-grotesk font-bold uppercase tracking-wider text-sm">
          New Showcase
        </h1>
        <div className="w-16" />
      </div>

      <LensSelector items={TYPE_LENSES} activeKey={type} onChange={setType} />

      <form onSubmit={submit} className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label>Visibility</Label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as "public" | "private")}
              className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2 text-sm text-fg1"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        <div>
          <Label>Description (optional)</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2 text-sm text-fg1 placeholder:text-fg3 focus:outline-none focus:border-brand-volt/50"
          />
        </div>

        {type === "manual" ? (
          <div>
            <Label>Select collectibles ({selectedIds.size} selected)</Label>
            {collectibles.length === 0 ? (
              <EmptyState
                title="No collectibles available"
                subtitle="Add items to your collection first."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {collectibles.map((item) => {
                  const isSelected = selectedIds.has(item.id)
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleSelect(item.id)}
                      className="block w-full text-left relative"
                    >
                      <CollectibleCard
                        item={{
                          id: item.id,
                          title: item.title,
                          photoUrl: item.photoUrl,
                          status: item.status,
                        }}
                        selected={isSelected}
                      />
                      {isSelected && (
                        <div
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: "var(--brand-volt)",
                            color: "var(--text-inverse)",
                          }}
                        >
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            <Label>Rules (JSON)</Label>
            <textarea
              value={rulesJson}
              onChange={(e) => setRulesJson(e.target.value)}
              rows={12}
              className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2 text-[11px] text-fg1 font-mono focus:outline-none focus:border-brand-volt/50"
            />
            <p className="text-fg3 text-[11px] mt-2">
              Define <code>matchMode</code> ("ALL" | "ANY") and{" "}
              <code>conditions</code>. The visual rule builder ships in a
              future iteration; for now you can hand-edit JSON or use the
              native app.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-md border border-semantic-red/40 bg-semantic-red/10 px-4 py-3 text-sm text-semantic-red">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-frost-divider pt-6">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-brand-volt text-text-inverse px-5 py-2.5 text-[12px] uppercase font-semibold tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create showcase"}
          </button>
          <Link
            href="/v/showcases"
            className="rounded-md border border-frost-border px-5 py-2.5 text-[12px] uppercase font-semibold tracking-wider text-fg2 hover:text-fg1 hover:border-frost-border-strong transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-fg3 uppercase text-[10px] font-grotesk font-bold tracking-[1.5px] mb-2">
      {children}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2 text-sm text-fg1 placeholder:text-fg3 focus:outline-none focus:border-brand-volt/50"
    />
  )
}
