"use client"

import { useState } from "react"
import { useUser } from "@/lib/contexts/user-context"
import { createClient } from "@/lib/supabase/client"
import { Header, Field } from "../profile/page"

const TOPICS = ["Account", "Payments", "Bug", "Feature request", "Other"]

export default function SupportPage() {
  const { profile, user } = useUser()
  const [topic, setTopic] = useState("Account")
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async () => {
    setSubmitting(true)
    setMessage(null)
    setError(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("support_requests").insert({
        user_id: profile?.id,
        email: user?.email,
        topic,
        body,
        kind: "support",
      })
      if (error) throw new Error(error.message)
      setMessage(
        "Thanks — we got it. We'll get back to you at the email on file.",
      )
      setBody("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-xl">
      <Header
        title="Contact Support"
        subtitle="Tell us what's going on and we'll get back within 1–2 business days."
      />

      <div className="mt-8 space-y-6">
        <Field label="Topic">
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2.5 text-sm text-fg1 focus:outline-none focus:border-brand-volt/50"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Message" help="As much detail as you can share helps a lot.">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2.5 text-sm text-fg1 focus:outline-none focus:border-brand-volt/50 resize-none"
          />
        </Field>

        {error && <p className="text-status-danger text-sm">{error}</p>}
        {message && <p className="text-status-success text-sm">{message}</p>}

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || body.trim().length < 10}
          className="rounded-md bg-brand-volt px-5 py-2.5 text-sm font-semibold text-text-inverse hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {submitting ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  )
}
