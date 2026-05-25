"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MessageSquarePlus, MessageSquare } from "lucide-react"
import { useStreamChat } from "@/lib/contexts/stream-context"
import { useUser } from "@/lib/contexts/user-context"
import { Avatar, EmptyState } from "@/components/vault"
import type { Channel as StreamChannel } from "stream-chat"

interface ChannelPreview {
  id: string
  cid: string
  title: string
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  otherUserName?: string
  otherUserAvatar?: string
}

export default function MessagesIndexPage() {
  const { client, isReady, error } = useStreamChat()
  const { profile } = useUser()
  const [channels, setChannels] = useState<ChannelPreview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!client || !isReady || !profile?.id) return

    const filter = {
      type: "messaging",
      members: { $in: [profile.id] },
    }
    const sort = { last_message_at: -1 as const }

    client
      .queryChannels(filter, sort, { watch: true, state: true })
      .then((rawChannels: StreamChannel[]) => {
        const previews = rawChannels.map((ch) => mapChannel(ch, profile.id))
        setChannels(previews)
        setLoading(false)
      })
      .catch((err) => {
        console.warn("[Messages] queryChannels failed", err)
        setLoading(false)
      })
  }, [client, isReady, profile?.id])

  return (
    <div className="min-h-screen flex">
      {/* Inbox sidebar */}
      <aside className="w-80 border-r border-frost-border flex flex-col h-screen sticky top-0">
        <div className="p-5 border-b border-frost-border flex items-center justify-between">
          <h1
            className="text-fg1 uppercase"
            style={{
              fontFamily: "var(--font-grotesk)",
              fontSize: 18,
              letterSpacing: 1.2,
              fontWeight: 700,
            }}
          >
            Inbox
          </h1>
          <Link
            href="/v/messages/new"
            className="rounded-md border border-frost-border p-2 text-fg2 hover:text-fg1 hover:border-frost-border-strong transition-colors"
            aria-label="New message"
          >
            <MessageSquarePlus size={14} />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error ? (
            <p className="p-4 text-sm text-semantic-red">{error}</p>
          ) : loading || !isReady ? (
            <div className="p-2 space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-frost-border/10 rounded-md animate-pulse"
                />
              ))}
            </div>
          ) : channels.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={20} color="var(--fg2)" />}
              title="No conversations yet"
              subtitle="Start a new message from a profile or via the New button."
            />
          ) : (
            <ul>
              {channels.map((ch) => (
                <li key={ch.id}>
                  <Link
                    href={`/v/messages/${encodeURIComponent(ch.id)}`}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-frost-border/[0.05] border-b border-frost-divider transition-colors"
                  >
                    <Avatar src={ch.otherUserAvatar} name={ch.otherUserName} size={36} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-fg1 text-[13px] font-semibold truncate">
                          {ch.title}
                        </p>
                        <span className="text-fg3 text-[10px] font-mono shrink-0 ml-2">
                          {formatTime(ch.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-fg2 text-[12px] truncate mt-0.5">
                        {ch.lastMessage || "—"}
                      </p>
                    </div>
                    {ch.unreadCount > 0 && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-mono leading-none mt-1"
                        style={{
                          backgroundColor: "var(--brand-volt)",
                          color: "var(--text-inverse)",
                        }}
                      >
                        {ch.unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      {/* Empty pane */}
      <div className="flex-1 flex items-center justify-center">
        <EmptyState
          icon={<MessageSquare size={20} color="var(--fg2)" />}
          title="Select a conversation"
          subtitle="Choose a thread on the left or start a new one."
        />
      </div>
    </div>
  )
}

function mapChannel(ch: StreamChannel, myId: string): ChannelPreview {
  const data: any = ch.data ?? {}
  const members = (Object.values(ch.state.members) as any[]).filter(
    (m) => m.user?.id !== myId,
  )
  const other = members[0]?.user
  const last = ch.state.messages[ch.state.messages.length - 1]
  const unread = ch.countUnread()
  return {
    id: ch.id ?? "",
    cid: ch.cid,
    title: data.name || other?.name || other?.username || "Conversation",
    lastMessage: (last?.text ?? "") as string,
    lastMessageTime: last?.created_at ? new Date(last.created_at).toISOString() : "",
    unreadCount: unread,
    otherUserName: other?.name,
    otherUserAvatar: other?.image,
  }
}

function formatTime(iso: string): string {
  if (!iso) return ""
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
