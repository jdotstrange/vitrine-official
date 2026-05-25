"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import { useStreamChat } from "@/lib/contexts/stream-context"
import { useUser } from "@/lib/contexts/user-context"
import { getClientApi } from "@/lib/api-client"
import { Avatar, EmptyState } from "@/components/vault"
import type { SearchUserResult } from "@vitrine/api"

export default function NewMessagePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { client, isReady } = useStreamChat()
  const { profile } = useUser()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchUserResult[]>([])
  const [pendingId, setPendingId] = useState<string | null>(null)

  // If `to` query param is set, jump straight to creating a channel
  useEffect(() => {
    const to = searchParams.get("to")
    if (to && profile?.id && client && isReady) {
      createChannel(to).catch(() => {})
    }
  }, [searchParams, profile?.id, client, isReady])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      getClientApi()
        .search.searchUsers(query, { limit: 10 })
        .then(setResults)
        .catch(() => setResults([]))
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  async function createChannel(targetUserId: string) {
    if (!client || !profile?.id || pendingId) return
    setPendingId(targetUserId)
    try {
      const ids = [profile.id, targetUserId].sort()
      const channelId = `dm-${ids.join("-")}`
      const channel = client.channel("messaging", channelId, {
        members: ids,
      } as any)
      await channel.watch()
      router.push(`/v/messages/${encodeURIComponent(channel.id ?? channelId)}`)
    } catch (err) {
      console.warn("[NewMessage] create failed", err)
      setPendingId(null)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-frost-border px-8 py-4 flex items-center justify-between">
        <Link
          href="/v/messages"
          className="flex items-center gap-2 text-fg2 hover:text-fg1 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Back
        </Link>
        <h1 className="text-fg1 font-grotesk font-bold uppercase tracking-wider text-sm">
          New Message
        </h1>
        <div className="w-16" />
      </div>

      <div className="max-w-2xl mx-auto px-8 py-8">
        <div className="relative mb-6">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-fg3"
          />
          <input
            type="search"
            placeholder="Search collectors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full rounded-md border border-frost-border bg-sheet-bg pl-10 pr-3 py-3 text-sm text-fg1 placeholder:text-fg3 focus:outline-none focus:border-brand-volt/50"
          />
        </div>

        {!query.trim() ? (
          <p className="text-fg2 text-sm text-center py-12">
            Search for a collector to start a conversation.
          </p>
        ) : results.length === 0 ? (
          <EmptyState title="No results" subtitle="Try a different search." />
        ) : (
          <div className="space-y-1">
            {results
              .filter((r) => r.id !== profile?.id)
              .map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => createChannel(r.id)}
                  disabled={pendingId === r.id}
                  className="w-full flex items-center gap-3 rounded-md border border-frost-border bg-sheet-bg px-4 py-3 hover:border-frost-border-strong transition-colors text-left disabled:opacity-50"
                >
                  <Avatar src={r.avatar} name={r.displayName ?? r.username} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-fg1 text-sm font-semibold truncate">
                      {r.displayName ?? r.username}
                    </p>
                    {r.username && (
                      <p className="text-fg2 text-[12px] truncate">@{r.username}</p>
                    )}
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
