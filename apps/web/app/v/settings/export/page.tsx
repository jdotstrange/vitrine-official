"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { createClient } from "@/lib/supabase/client"
import { Header } from "../profile/page"

export default function ExportPage() {
  const { profile } = useUser()
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  const onExport = async () => {
    if (!profile?.id) return
    setExporting(true)
    setError(null)
    setDownloadUrl(null)
    try {
      const supabase = createClient()

      const [profileRes, collectiblesRes, showcasesRes, followsRes] =
        await Promise.all([
          supabase.from("users").select("*").eq("id", profile.id).single(),
          supabase.from("collectibles").select("*").eq("user_id", profile.id),
          supabase.from("showcases").select("*").eq("user_id", profile.id),
          supabase.from("follows").select("*").eq("follower_id", profile.id),
        ])

      const payload = {
        exportedAt: new Date().toISOString(),
        profile: profileRes.data,
        collectibles: collectiblesRes.data ?? [],
        showcases: showcasesRes.data ?? [],
        follows: followsRes.data ?? [],
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="px-8 py-8 max-w-xl">
      <Header
        title="Export Data"
        subtitle="Download a snapshot of your profile, collection, showcases, and network."
      />

      <div className="mt-8 space-y-5">
        <div className="rounded-lg border border-frost-border p-4">
          <p className="text-fg1 text-sm font-medium">Full account export</p>
          <p className="text-fg2 text-[12.5px] mt-1">
            Includes your profile, all collectibles (with photos and metadata),
            showcases, and follow lists. Excludes other users' content and chat
            messages.
          </p>

          {error && <p className="mt-3 text-status-danger text-sm">{error}</p>}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={onExport}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-md bg-brand-volt px-4 py-2 text-sm font-semibold text-text-inverse disabled:opacity-40"
            >
              <Download size={14} />
              {exporting ? "Preparing..." : "Generate export"}
            </button>

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={`vitrine-export-${new Date().toISOString().slice(0, 10)}.json`}
                className="rounded-md border border-frost-border px-4 py-2 text-sm text-fg1 hover:border-brand-volt/40 transition-colors"
              >
                Download JSON
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
