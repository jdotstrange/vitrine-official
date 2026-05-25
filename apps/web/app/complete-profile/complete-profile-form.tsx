"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { VitrineMark } from "@/components/marketing/VitrineMark"

interface Props {
  authUserId: string
  email: string
  initialDisplayName: string | null
  initialUsername: string | null
  profileId: string | null
  redirectTo: string
}

export function CompleteProfileForm({
  authUserId,
  email,
  initialDisplayName,
  initialUsername,
  profileId,
  redirectTo,
}: Props) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(
    initialDisplayName ?? deriveDisplayName(email),
  )
  const [username, setUsername] = useState(
    initialUsername ?? deriveUsername(email),
  )
  const [bio, setBio] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const isValid =
    displayName.trim().length >= 2 && /^[a-z0-9_]{3,30}$/.test(username)

  const onSubmit = () => {
    setError(null)
    startTransition(async () => {
      const supabase = createClient()
      const now = new Date().toISOString()

      // Check username availability
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .maybeSingle()

      if (existing && existing.id !== profileId) {
        setError("That username is taken — try another.")
        return
      }

      try {
        if (profileId) {
          const { error } = await supabase
            .from("users")
            .update({
              display_name: displayName.trim(),
              username,
              bio: bio.trim() || null,
              onboarding_completed_at: now,
              updated_at: now,
            })
            .eq("id", profileId)
          if (error) throw new Error(error.message)
        } else {
          const newId = crypto.randomUUID()
          const { error } = await supabase.from("users").insert({
            id: newId,
            supabase_auth_id: authUserId,
            email,
            display_name: displayName.trim(),
            username,
            bio: bio.trim() || null,
            onboarding_completed_at: now,
            created_at: now,
            updated_at: now,
          })
          if (error) throw new Error(error.message)
        }
        router.push(redirectTo)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed")
      }
    })
  }

  return (
    <main className="min-h-screen bg-void flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-[440px] flex flex-col items-center">
        <div className="mb-5 text-fg1">
          <VitrineMark size={48} />
        </div>

        <p className="text-xs uppercase tracking-[0.15em] text-fg1 mb-2">
          Complete your profile
        </p>
        <p className="text-xs text-fg3 mb-10 text-center max-w-sm">
          Pick a display name and username so other collectors can find you.
        </p>

        <div className="w-full space-y-5">
          <div>
            <label className="block text-[10px] text-fg3 uppercase tracking-wider mb-2 font-grotesk font-bold">
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-frost-border bg-sheet-bg px-4 py-3 text-base text-fg1 outline-none focus:border-brand-volt/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] text-fg3 uppercase tracking-wider mb-2 font-grotesk font-bold">
              Username
            </label>
            <div className="flex items-center rounded-xl border border-frost-border bg-sheet-bg pr-4">
              <span className="pl-4 pr-1 text-fg3 text-base">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                  )
                }
                className="flex-1 bg-transparent py-3 text-base text-fg1 outline-none"
              />
            </div>
            <p className="text-fg3 text-[10.5px] mt-1.5">
              3–30 characters, lowercase letters, numbers, and underscores.
            </p>
          </div>

          <div>
            <label className="block text-[10px] text-fg3 uppercase tracking-wider mb-2 font-grotesk font-bold">
              Bio (optional)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={250}
              placeholder="Tell collectors a bit about yourself..."
              className="w-full rounded-xl border border-frost-border bg-sheet-bg px-4 py-3 text-base text-fg1 outline-none focus:border-brand-volt/50 transition-colors resize-none"
            />
          </div>

          {error && (
            <p className="text-status-danger text-sm text-center">{error}</p>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={!isValid || isPending}
            className="w-full rounded-full bg-brand-volt py-3.5 px-6 text-sm font-medium uppercase tracking-wider text-void shadow-[0_4px_12px_rgba(232,224,212,0.3)] transition-all hover:opacity-90 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Creating profile..." : "Continue"}
          </button>
        </div>
      </div>
    </main>
  )
}

function deriveDisplayName(email: string): string {
  const local = email.split("@")[0] ?? ""
  return local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function deriveUsername(email: string): string {
  const local = email.split("@")[0] ?? ""
  return local.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30)
}
