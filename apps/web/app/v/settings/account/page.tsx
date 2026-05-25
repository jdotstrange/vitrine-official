"use client"

import { useState } from "react"
import { AlertCircle } from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { createClient } from "@/lib/supabase/client"
import { Header, Field } from "../profile/page"

export default function AccountSettings() {
  const { user, profile, signOut } = useUser()
  const [newEmail, setNewEmail] = useState("")
  const [emailMsg, setEmailMsg] = useState<string | null>(null)
  const [emailErr, setEmailErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [deleteErr, setDeleteErr] = useState<string | null>(null)

  const onChangeEmail = async () => {
    setBusy(true)
    setEmailMsg(null)
    setEmailErr(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) throw new Error(error.message)
      setEmailMsg(
        `Confirmation email sent to ${newEmail}. Click the link to complete the change.`,
      )
      setNewEmail("")
    } catch (err) {
      setEmailErr(err instanceof Error ? err.message : "Update failed")
    } finally {
      setBusy(false)
    }
  }

  const onDelete = async () => {
    if (confirmDelete !== "DELETE") return
    setDeleting(true)
    setDeleteErr(null)
    try {
      const supabase = createClient()
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token
      if (!token) throw new Error("Not authenticated")

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const res = await fetch(`${url}/functions/v1/delete-account`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: anon,
        },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as any).error || "Delete failed")
      }
      await signOut()
    } catch (err) {
      setDeleteErr(err instanceof Error ? err.message : "Delete failed")
      setDeleting(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-xl space-y-10">
      <Header title="Account" subtitle="Manage your sign-in and account state." />

      {/* Email */}
      <div className="space-y-3">
        <h2 className="text-[10px] text-fg3 uppercase tracking-[1.5px] font-grotesk font-bold">
          Email
        </h2>
        <p className="text-fg2 text-sm">Current: {user?.email ?? "—"}</p>

        <Field label="New email">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2.5 text-sm text-fg1 focus:outline-none focus:border-brand-volt/50"
          />
        </Field>

        {emailErr && (
          <p className="text-status-danger text-sm">{emailErr}</p>
        )}
        {emailMsg && <p className="text-status-success text-sm">{emailMsg}</p>}

        <button
          type="button"
          onClick={onChangeEmail}
          disabled={busy || !newEmail.includes("@")}
          className="rounded-md bg-brand-volt px-4 py-2 text-sm font-semibold text-text-inverse disabled:opacity-40"
        >
          {busy ? "Sending..." : "Send confirmation"}
        </button>
      </div>

      {/* Sign out */}
      <div className="space-y-3">
        <h2 className="text-[10px] text-fg3 uppercase tracking-[1.5px] font-grotesk font-bold">
          Session
        </h2>
        <button
          type="button"
          onClick={signOut}
          className="rounded-md border border-frost-border px-4 py-2 text-sm text-fg1 hover:border-brand-volt/40 transition-colors"
        >
          Sign out
        </button>
      </div>

      {/* Delete account */}
      <div className="space-y-3 rounded-lg border border-status-danger/30 bg-status-danger/[0.04] p-4">
        <div className="flex items-start gap-2">
          <AlertCircle
            size={18}
            className="text-status-danger shrink-0 mt-0.5"
          />
          <div>
            <h3 className="text-fg1 text-sm font-semibold">Delete account</h3>
            <p className="text-fg2 text-[12.5px] mt-1">
              Permanently delete your account and all collectibles, showcases, and
              activity. This cannot be undone.
            </p>
          </div>
        </div>

        <Field label='Type "DELETE" to confirm'>
          <input
            type="text"
            value={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.value)}
            className="w-full rounded-md border border-status-danger/30 bg-sheet-bg px-3 py-2.5 text-sm text-fg1 focus:outline-none focus:border-status-danger"
          />
        </Field>

        {deleteErr && (
          <p className="text-status-danger text-sm">{deleteErr}</p>
        )}

        <button
          type="button"
          onClick={onDelete}
          disabled={confirmDelete !== "DELETE" || deleting}
          className="rounded-md bg-status-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {deleting ? "Deleting..." : "Permanently delete account"}
        </button>
      </div>
    </div>
  )
}
