"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { getClientApi } from "@/lib/api-client"
import type { NotificationPreference, PreferenceSection } from "@vitrine/api"
import { Header } from "../profile/page"

const SECTION_LABELS: Record<PreferenceSection, string> = {
  INBOX: "Inbox",
  SIGNALS: "Signals",
  JOURNAL: "Journal",
}

export default function NotificationsSettings() {
  const { profile } = useUser()
  const [prefs, setPrefs] = useState<NotificationPreference[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!profile?.id) return
    getClientApi()
      .notifications.getNotificationPreferences(profile.id)
      .then(setPrefs)
      .catch((err) =>
        console.warn("[NotificationsSettings] load failed", err),
      )
      .finally(() => setLoading(false))
  }, [profile?.id])

  const togglePref = (key: string) => {
    setPrefs((prev) =>
      prev.map((p) => (p.key === key ? { ...p, enabled: !p.enabled } : p)),
    )
  }

  const onSave = async () => {
    if (!profile?.id) return
    setSaving(true)
    setMessage(null)
    try {
      await getClientApi().notifications.saveNotificationPreferences(
        profile.id,
        prefs,
      )
      setMessage("Preferences saved")
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
        Loading preferences...
      </div>
    )
  }

  const sections: PreferenceSection[] = ["INBOX", "SIGNALS", "JOURNAL"]

  return (
    <div className="px-8 py-8 max-w-xl space-y-8">
      <Header
        title="Notifications"
        subtitle="Pick which events should reach you."
      />

      {sections.map((section) => {
        const items = prefs.filter((p) => p.section === section)
        if (items.length === 0) return null
        return (
          <div key={section}>
            <h2 className="text-[10px] text-fg3 uppercase tracking-[1.5px] mb-3 font-grotesk font-bold">
              {SECTION_LABELS[section]}
            </h2>
            <div className="rounded-lg border border-frost-border divide-y divide-frost-border/60">
              {items.map((p) => (
                <label
                  key={p.key}
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-frost-border/[0.04] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-fg1 text-sm">{p.label}</p>
                    <p className="text-fg3 text-[12px]">{p.description}</p>
                  </div>
                  <Toggle checked={p.enabled} onChange={() => togglePref(p.key)} />
                </label>
              ))}
            </div>
          </div>
        )
      })}

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

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        onChange()
      }}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        checked ? "bg-brand-volt" : "bg-frost-border/40"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  )
}
