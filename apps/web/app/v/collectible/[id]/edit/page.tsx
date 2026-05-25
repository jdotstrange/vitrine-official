"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/contexts/user-context"
import { useCollectible } from "@/lib/hooks/use-collectible"
import { EmptyState, StatusPill } from "@/components/vault"
import { deriveStatus, type ListingStatus } from "@/lib/design"

export default function EditCollectiblePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { profile } = useUser()
  const { collectible, loading } = useCollectible(id, {
    viewerUserId: profile?.id,
  })

  const [title, setTitle] = useState("")
  const [listingTitle, setListingTitle] = useState("")
  const [listingDescription, setListingDescription] = useState("")
  const [value, setValue] = useState("")
  const [status, setStatus] = useState<ListingStatus>("NFST")
  const [visibility, setVisibility] = useState("public")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!collectible) return
    setTitle(collectible.title)
    setListingTitle(collectible.listingTitle ?? "")
    setListingDescription(collectible.listingDescription ?? "")
    setValue(collectible.value > 0 ? String(collectible.value) : "")
    setStatus(collectible.status)
    setVisibility(collectible.visibility ?? "public")
  }, [collectible])

  if (loading) {
    return <div className="px-8 py-12 text-fg2 text-sm">Loading...</div>
  }

  if (!collectible || (profile && collectible.userId !== profile.id)) {
    return (
      <div className="px-8 py-24">
        <EmptyState
          title="You can't edit this collectible"
          subtitle="Only the owner can edit a collectible."
        />
      </div>
    )
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const supabase = createClient()
      const availableForSale = status === "FOR_SALE" || status === "SELL_TRADE"
      const availableForTrade = status === "FOR_TRADE" || status === "SELL_TRADE"

      const { error: updateError } = await supabase
        .from("collectibles")
        .update({
          title,
          listing_title: listingTitle || null,
          listing_description: listingDescription || null,
          value: value ? parseFloat(value) : null,
          available_for_sale: availableForSale,
          available_for_trade: availableForTrade,
          privacy: visibility,
          visibility,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("user_id", profile!.id)

      if (updateError) throw updateError
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <div className="border-b border-frost-border px-8 py-4 flex items-center justify-between">
        <Link
          href={`/v/collectible/${id}`}
          className="flex items-center gap-2 text-fg2 hover:text-fg1 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
        <h1 className="text-fg1 font-grotesk font-bold uppercase tracking-wider text-sm">
          Edit Collectible
        </h1>
        <div className="w-16" />
      </div>

      <form onSubmit={save} className="max-w-3xl mx-auto px-8 py-8 space-y-6">
        {/* Photos preview */}
        {collectible.photos.length > 0 && (
          <div>
            <Label>Photos</Label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {collectible.photos.map((p, i) => (
                <div
                  key={i}
                  className="shrink-0 rounded border border-frost-border overflow-hidden"
                  style={{ width: 96, height: 96 }}
                >
                  <img
                    src={p}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <p className="text-fg3 text-[11px] mt-1">
              Photo management coming soon. Use the native app to add or remove photos.
            </p>
          </div>
        )}

        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div>
          <Label>Listing title (optional)</Label>
          <Input
            value={listingTitle}
            onChange={(e) => setListingTitle(e.target.value)}
            placeholder="Polished name for marketplaces"
          />
        </div>

        <div>
          <Label>Description</Label>
          <textarea
            value={listingDescription}
            onChange={(e) => setListingDescription(e.target.value)}
            rows={5}
            className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2 text-sm text-fg1 placeholder:text-fg3 focus:outline-none focus:border-brand-volt/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Value (USD)</Label>
            <Input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <div>
            <Label>Privacy</Label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2 text-sm text-fg1"
            >
              <option value="public">Public</option>
              <option value="followers">Followers</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>

        <div>
          <Label>Listing Status</Label>
          <div className="flex gap-2 flex-wrap">
            {(["NFST", "FOR_SALE", "FOR_TRADE", "SELL_TRADE"] as ListingStatus[]).map(
              (s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`rounded-md border px-3 py-2 text-[11px] uppercase font-semibold tracking-wider transition-all ${
                    status === s
                      ? "border-brand-volt bg-brand-volt/10"
                      : "border-frost-border hover:border-frost-border-strong"
                  }`}
                >
                  <StatusPill status={s} />
                </button>
              ),
            )}
          </div>
        </div>

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

        <div className="flex items-center gap-3 border-t border-frost-divider pt-6">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-md bg-brand-volt text-text-inverse px-5 py-2.5 text-[12px] uppercase font-semibold tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? "Saving..." : "Save"}
          </button>
          <Link
            href={`/v/collectible/${id}`}
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
