"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Save, Check } from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { useCollectibles } from "@/lib/hooks/use-collectibles"
import { getClientApi } from "@/lib/api-client"
import { CollectibleCard, EmptyState } from "@/components/vault"
import type { ShowcaseDetail, ManagedRules } from "@vitrine/api"

export default function EditShowcasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { profile } = useUser()
  const { collectibles } = useCollectibles({ userId: profile?.id })
  const [showcase, setShowcase] = useState<ShowcaseDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private">("public")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [rulesJson, setRulesJson] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const api = getClientApi()
    api.showcases
      .getShowcaseById(id, profile?.id)
      .then((s) => {
        if (!s) return
        setShowcase(s)
        setTitle(s.title)
        setDescription(s.description ?? "")
        setVisibility(s.visibility as "public" | "private")
        setSelectedIds(new Set(s.items.map((i) => i.id)))
        if (s.rules) {
          setRulesJson(JSON.stringify(s.rules, null, 2))
        }
      })
      .finally(() => setLoading(false))
  }, [id, profile?.id])

  if (loading) {
    return <div className="px-8 py-12 text-fg2 text-sm">Loading...</div>
  }

  if (!showcase || !profile || profile.id !== showcase.owner.id) {
    return (
      <div className="px-8 py-24">
        <EmptyState
          title="Can't edit"
          subtitle="Only the owner can edit a showcase."
        />
      </div>
    )
  }

  const isManaged = showcase.showcaseType === "managed" || showcase.showcaseType === "auto"

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const api = getClientApi()
      if (isManaged) {
        let rules: ManagedRules
        try {
          rules = JSON.parse(rulesJson)
        } catch {
          throw new Error("Rules JSON is invalid")
        }
        await api.showcases.updateShowcaseRules({
          showcaseId: id,
          title,
          description: description || undefined,
          visibility,
          rules,
        })
      } else {
        await api.showcases.updateShowcase({
          showcaseId: id,
          title,
          description: description || undefined,
          visibility,
          collectibleIds: Array.from(selectedIds),
        })
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this showcase? This cannot be undone.")) return
    setDeleting(true)
    try {
      const api = getClientApi()
      await api.showcases.deleteShowcase(id)
      router.push("/v/showcases")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed")
      setDeleting(false)
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-frost-border px-8 py-4 flex items-center justify-between">
        <Link
          href={`/v/showcase/${id}`}
          className="flex items-center gap-2 text-fg2 hover:text-fg1 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
        <h1 className="text-fg1 font-grotesk font-bold uppercase tracking-wider text-sm">
          Edit · {showcase.showcaseType}
        </h1>
        <div className="w-16" />
      </div>

      <form onSubmit={save} className="max-w-5xl mx-auto px-8 py-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label>Visibility</Label>
            <select
              value={visibility}
              onChange={(e) =>
                setVisibility(e.target.value as "public" | "private")
              }
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

        {isManaged ? (
          <div>
            <Label>Rules (JSON)</Label>
            <textarea
              value={rulesJson}
              onChange={(e) => setRulesJson(e.target.value)}
              rows={14}
              className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2 text-[11px] text-fg1 font-mono focus:outline-none focus:border-brand-volt/50"
            />
            <p className="text-fg3 text-[11px] mt-2">
              Saving will re-evaluate the rules and update which collectibles
              the showcase includes.
            </p>
          </div>
        ) : (
          <div>
            <Label>Collectibles ({selectedIds.size} selected)</Label>
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
          </div>
        )}

        {error && (
          <div className="rounded-md border border-semantic-red/40 bg-semantic-red/10 px-4 py-3 text-sm text-semantic-red">
            {error}
          </div>
        )}
        {saved && (
          <div className="rounded-md border border-semantic-green/40 bg-semantic-green/10 px-4 py-3 text-sm text-semantic-green">
            Saved successfully.
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-frost-divider pt-6">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-md bg-brand-volt text-text-inverse px-5 py-2.5 text-[12px] uppercase font-semibold tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save size={14} />
              {saving ? "Saving..." : "Save"}
            </button>
            <Link
              href={`/v/showcase/${id}`}
              className="rounded-md border border-frost-border px-5 py-2.5 text-[12px] uppercase font-semibold tracking-wider text-fg2 hover:text-fg1 hover:border-frost-border-strong transition-colors"
            >
              Cancel
            </Link>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 rounded-md border border-semantic-red/40 px-4 py-2 text-[11px] uppercase font-semibold tracking-wider text-semantic-red hover:bg-semantic-red/10 transition-colors disabled:opacity-50"
          >
            <Trash2 size={12} />
            {deleting ? "Deleting..." : "Delete"}
          </button>
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
