"use client"

import { useState } from "react"
import { useUser } from "@/lib/contexts/user-context"
import { createClient } from "@/lib/supabase/client"
import { Header, Field } from "../profile/page"

export default function BugReportPage() {
  const { profile, user } = useUser()
  const [whatHappened, setWhatHappened] = useState("")
  const [whatExpected, setWhatExpected] = useState("")
  const [steps, setSteps] = useState("")
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
        topic: "Bug report",
        body: JSON.stringify({
          whatHappened,
          whatExpected,
          steps,
          ua: typeof navigator !== "undefined" ? navigator.userAgent : "",
        }),
        kind: "bug",
      })
      if (error) throw new Error(error.message)
      setMessage("Bug report submitted — thanks for the heads up.")
      setWhatHappened("")
      setWhatExpected("")
      setSteps("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-xl">
      <Header
        title="Report a Bug"
        subtitle="Help us fix it faster by including what you tried."
      />

      <div className="mt-8 space-y-5">
        <Field label="What happened?">
          <textarea
            value={whatHappened}
            onChange={(e) => setWhatHappened(e.target.value)}
            rows={4}
            placeholder="Describe what went wrong..."
            className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2.5 text-sm text-fg1 focus:outline-none focus:border-brand-volt/50 resize-none"
          />
        </Field>

        <Field label="What did you expect?">
          <textarea
            value={whatExpected}
            onChange={(e) => setWhatExpected(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2.5 text-sm text-fg1 focus:outline-none focus:border-brand-volt/50 resize-none"
          />
        </Field>

        <Field label="Steps to reproduce" help="Optional but helpful.">
          <textarea
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            rows={4}
            placeholder="1. Open ...&#10;2. Click ...&#10;3. ..."
            className="w-full rounded-md border border-frost-border bg-sheet-bg px-3 py-2.5 text-sm text-fg1 focus:outline-none focus:border-brand-volt/50 resize-none"
          />
        </Field>

        {error && <p className="text-status-danger text-sm">{error}</p>}
        {message && <p className="text-status-success text-sm">{message}</p>}

        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting || whatHappened.trim().length < 10}
          className="rounded-md bg-brand-volt px-5 py-2.5 text-sm font-semibold text-text-inverse hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {submitting ? "Sending..." : "Submit bug report"}
        </button>
      </div>
    </div>
  )
}
