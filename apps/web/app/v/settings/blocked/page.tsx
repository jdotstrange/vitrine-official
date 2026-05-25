"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { getClientApi } from "@/lib/api-client"
import type { BlockedUser } from "@vitrine/api"
import { Avatar, EmptyState } from "@/components/vault"
import { Header } from "../profile/page"

interface BlockedRow extends BlockedUser {
  user?: {
    id: string
    display_name: string | null
    username: string | null
    avatar_url: string | null
  }
}

export default function BlockedSettings() {
  const { profile } = useUser()
  const [rows, setRows] = useState<BlockedRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!profile?.id) return
    setLoading(true)
    try {
      const result = await getClientApi().blocked.getBlockedUsers(profile.id)
      setRows(result as BlockedRow[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  const onUnblock = async (blockedId: string) => {
    if (!profile?.id) return
    try {
      await getClientApi().blocked.unblockUser(profile.id, blockedId)
      setRows((prev) => prev.filter((r) => r.blocked_id !== blockedId))
    } catch (err) {
      console.warn("[Blocked] unblock failed", err)
    }
  }

  return (
    <div className="px-8 py-8 max-w-xl">
      <Header
        title="Blocked Users"
        subtitle="Blocked users can't follow you, message you, or see your collection."
      />

      <div className="mt-8">
        {loading ? (
          <div className="flex items-center gap-2 text-fg2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : error ? (
          <p className="text-status-danger text-sm">{error}</p>
        ) : rows.length === 0 ? (
          <EmptyState
            title="No blocked users"
            subtitle="You haven't blocked anyone yet."
          />
        ) : (
          <div className="rounded-lg border border-frost-border divide-y divide-frost-border/60">
            {rows.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Avatar
                  src={r.user?.avatar_url ?? undefined}
                  name={r.user?.display_name ?? r.user?.username ?? "U"}
                  size={36}
                />
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/v/profile/${r.blocked_id}`}
                    className="text-fg1 text-sm hover:underline truncate block"
                  >
                    {r.user?.display_name ?? "Collector"}
                  </Link>
                  <p className="text-fg3 text-[11px] truncate">
                    @{r.user?.username ?? "user"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUnblock(r.blocked_id)}
                  className="text-[12px] text-fg3 hover:text-fg1 transition-colors"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
