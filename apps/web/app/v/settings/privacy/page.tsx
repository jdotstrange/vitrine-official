"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { getClientApi } from "@/lib/api-client"
import { createClient } from "@/lib/supabase/client"
import type { FollowListsVisibility } from "@vitrine/api"
import { Header } from "../profile/page"

const OPTIONS: { value: FollowListsVisibility; label: string; description: string }[] = [
  {
    value: "public",
    label: "Public",
    description: "Anyone can see your followers and following.",
  },
  {
    value: "private",
    label: "Private",
    description: "Only you can see your followers and following.",
  },
]

export default function PrivacySettings() {
  const { profile } = useUser()
  const [followLists, setFollowLists] =
    useState<FollowListsVisibility>("public")
  const [showcaseVisibility, setShowcaseVisibility] = useState<
    "public" | "followers_only" | "private"
  >("public")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.id) return
    const supabase = createClient()
    Promise.all([
      getClientApi().network.getFollowListsVisibility(profile.id),
      supabase
        .from("users")
        .select("showcase_visibility")
        .eq("id", profile.id)
        .maybeSingle(),
    ])
      .then(([listVis, scRes]) => {
        setFollowLists(listVis ?? "public")
        const sv = (scRes.data as any)?.showcase_visibility
        if (sv === "public" || sv === "followers_only" || sv === "private") {
          setShowcaseVisibility(sv)
        }
      })
      .catch((err) => console.warn("[PrivacySettings] load failed", err))
      .finally(() => setLoading(false))
  }, [profile?.id])

  const onSave = async () => {
    if (!profile?.id) return
    setSaving(true)
    setMessage(null)
    try {
      const supabase = createClient()
      await getClientApi().network.setFollowListsVisibility(
        profile.id,
        followLists,
      )
      await supabase
        .from("users")
        .update({
          showcase_visibility: showcaseVisibility,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)
      setMessage("Privacy preferences saved")
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="px-8 py-8 flex items-center gap-2 text-fg2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading privacy settings...
      </div>
    )
  }

  return (
    <div className="px-8 py-8 max-w-xl space-y-8">
      <Header
        title="Privacy"
        subtitle="Control who can see your followers, following, and showcases."
      />

      <Section title="Followers & Following lists">
        {OPTIONS.map((opt) => (
          <Radio
            key={opt.value}
            name="followLists"
            label={opt.label}
            description={opt.description}
            checked={followLists === opt.value}
            onChange={() => setFollowLists(opt.value)}
          />
        ))}
      </Section>

      <Section title="Showcases">
        <Radio
          name="showcases"
          label="Public"
          description="Anyone can see your showcases."
          checked={showcaseVisibility === "public"}
          onChange={() => setShowcaseVisibility("public")}
        />
        <Radio
          name="showcases"
          label="Followers only"
          description="Only people who follow you can see your showcases."
          checked={showcaseVisibility === "followers_only"}
          onChange={() => setShowcaseVisibility("followers_only")}
        />
        <Radio
          name="showcases"
          label="Private"
          description="Only you can see your showcases."
          checked={showcaseVisibility === "private"}
          onChange={() => setShowcaseVisibility("private")}
        />
      </Section>

      {message && (
        <div className="rounded-md border border-status-success/30 bg-status-success/[0.06] px-3 py-2 text-sm text-status-success">
          {message}
        </div>
      )}

      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="rounded-md bg-brand-volt px-5 py-2.5 text-sm font-semibold text-text-inverse hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-[10px] text-fg3 uppercase tracking-[1.5px] font-grotesk font-bold">
        {title}
      </h2>
      <div className="rounded-lg border border-frost-border divide-y divide-frost-border/60">
        {children}
      </div>
    </div>
  )
}

function Radio({
  name,
  label,
  description,
  checked,
  onChange,
}: {
  name: string
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-frost-border/[0.04] transition-colors">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="accent-[var(--brand-volt)]"
      />
      <div className="flex-1 min-w-0">
        <p className="text-fg1 text-sm">{label}</p>
        <p className="text-fg3 text-[12px]">{description}</p>
      </div>
    </label>
  )
}
