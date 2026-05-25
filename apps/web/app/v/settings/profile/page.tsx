"use client"

import { useEffect, useRef, useState } from "react"
import { ImagePlus, Loader2 } from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { createClient } from "@/lib/supabase/client"
import { uploadImageWithVariants } from "@/lib/upload/image"
import { Avatar } from "@/components/vault"

export default function ProfileSettings() {
  const { profile, user } = useUser()
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [avatar, setAvatar] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!profile?.id) return
    const supabase = createClient()
    supabase
      .from("users")
      .select("display_name, username, bio, avatar")
      .eq("id", profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name ?? "")
          setUsername(data.username ?? "")
          setBio(data.bio ?? "")
          setAvatar(data.avatar ?? null)
        }
        setLoading(false)
      })
  }, [profile?.id])

  const onAvatarUpload = async (file: File) => {
    if (!profile?.id) return
    setUploadingAvatar(true)
    setError(null)
    try {
      const supabase = createClient()
      const result = await uploadImageWithVariants(file, supabase, {
        bucket: "avatars",
        pathPrefix: profile.id,
      })
      setAvatar(result.originalUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const onSave = async () => {
    if (!profile?.id) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("users")
        .update({
          display_name: displayName.trim() || null,
          username: username.trim() || null,
          bio: bio.trim() || null,
          avatar,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id)
      if (error) throw new Error(error.message)
      setMessage("Profile updated")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Skeleton />

  return (
    <div className="px-8 py-8">
      <div className="max-w-xl space-y-8">
        <Header title="Edit Profile" subtitle="Customize how you appear to others." />

        <div className="flex items-center gap-4">
          <Avatar src={avatar ?? undefined} name={displayName || "U"} size={80} />
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="inline-flex items-center gap-2 rounded-md border border-frost-border px-3 py-2 text-sm text-fg1 hover:border-brand-volt/40 transition-colors disabled:opacity-50"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              Change avatar
            </button>
            <p className="text-fg3 text-[11px] mt-1.5">PNG or JPG, square crops best.</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onAvatarUpload(f)
                e.target.value = ""
              }}
            />
          </div>
        </div>

        <Field label="Display name">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2.5 text-sm text-fg1 focus:outline-none focus:border-brand-volt/50"
          />
        </Field>

        <Field
          label="Username"
          help="Your unique handle. Only letters, numbers, and underscores."
        >
          <input
            type="text"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
            className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2.5 text-sm text-fg1 focus:outline-none focus:border-brand-volt/50"
          />
        </Field>

        <Field label="Bio" help="Tell collectors a bit about yourself.">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={250}
            className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2.5 text-sm text-fg1 focus:outline-none focus:border-brand-volt/50 resize-none"
          />
          <p className="text-fg3 text-[11px] mt-1 text-right font-mono">
            {bio.length} / 250
          </p>
        </Field>

        <Field label="Email" help="Managed via your account settings.">
          <input
            type="email"
            value={user?.email ?? ""}
            disabled
            className="w-full rounded-md border border-frost-border bg-frost-border/[0.04] px-3 py-2.5 text-sm text-fg3"
          />
        </Field>

        {error && (
          <div className="rounded-md border border-status-danger/30 bg-status-danger/[0.06] px-3 py-2 text-sm text-status-danger">
            {error}
          </div>
        )}
        {message && (
          <div className="rounded-md border border-status-success/30 bg-status-success/[0.06] px-3 py-2 text-sm text-status-success">
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="w-full rounded-md bg-brand-volt px-5 py-3 text-sm font-semibold text-text-inverse hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  )
}

export function Header({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div>
      <h1
        className="text-fg1 uppercase mb-1"
        style={{
          fontFamily: "var(--font-grotesk)",
          fontSize: 22,
          letterSpacing: 1.5,
          fontWeight: 700,
        }}
      >
        {title}
      </h1>
      {subtitle && <p className="text-fg2 text-sm">{subtitle}</p>}
    </div>
  )
}

export function Field({
  label,
  help,
  children,
}: {
  label: string
  help?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-[10px] text-fg3 uppercase tracking-wider mb-2 font-grotesk font-bold">
        {label}
      </label>
      {children}
      {help && <p className="text-fg3 text-[11px] mt-1.5">{help}</p>}
    </div>
  )
}

function Skeleton() {
  return (
    <div className="px-8 py-8 max-w-xl space-y-4">
      <div className="h-8 bg-frost-border/20 rounded w-1/3 animate-pulse" />
      <div className="h-20 bg-frost-border/20 rounded animate-pulse" />
      <div className="h-12 bg-frost-border/20 rounded animate-pulse" />
      <div className="h-12 bg-frost-border/20 rounded animate-pulse" />
    </div>
  )
}
