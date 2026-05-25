"use client"

import { useMemo, useState, useEffect } from "react"
import { Bell, CheckCheck } from "lucide-react"
import { useFeeds } from "@/lib/contexts/feeds-context"
import { useUser } from "@/lib/contexts/user-context"
import { getClientApi } from "@/lib/api-client"
import {
  ActivityRow,
  EmptyState,
  LensSelector,
  type LensItem,
} from "@/components/vault"
import type { JournalEntry } from "@vitrine/api"

type Tab = "INBOX" | "SIGNALS" | "JOURNAL"

const TABS: LensItem<Tab>[] = [
  { key: "INBOX", label: "Inbox" },
  { key: "SIGNALS", label: "Signals" },
  { key: "JOURNAL", label: "Journal" },
]

export default function ActivityPage() {
  const { profile } = useUser()
  const {
    notifications,
    unseenCount,
    unreadCount,
    isLoading,
    refresh,
    markAllSeen,
    markAllRead,
    markGroupRead,
  } = useFeeds()
  const [tab, setTab] = useState<Tab>("INBOX")
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [journalLoading, setJournalLoading] = useState(false)

  // Mark all seen on mount (entering Activity surface counts as "seen")
  useEffect(() => {
    if (unseenCount > 0) {
      markAllSeen().catch(() => {})
    }
  }, [unseenCount, markAllSeen])

  // Load journal on tab switch
  useEffect(() => {
    if (tab !== "JOURNAL" || !profile?.id) return
    setJournalLoading(true)
    getClientApi()
      .activity.getJournalEntries(profile.id, { limit: 50 })
      .then(setJournal)
      .catch((err) => console.warn("[Activity] journal load failed", err))
      .finally(() => setJournalLoading(false))
  }, [tab, profile?.id])

  const inboxItems = useMemo(() => {
    return notifications
      .filter((g) => {
        const verb = g.verb
        if (!verb) return false
        const config = getVerbCategory(verb)
        return config === "INBOX"
      })
      .map((g) => mapGroupToRow(g))
  }, [notifications])

  const signalItems = useMemo(() => {
    return notifications
      .filter((g) => getVerbCategory(g.verb) === "SIGNALS")
      .map((g) => mapGroupToRow(g))
  }, [notifications])

  return (
    <div className="min-h-screen">
      <div className="border-b border-frost-border px-8 py-6 flex items-center justify-between">
        <div>
          <h1
            className="text-fg1 uppercase"
            style={{
              fontFamily: "var(--font-grotesk)",
              fontSize: 28,
              letterSpacing: 1.5,
              fontWeight: 700,
            }}
          >
            Activity
          </h1>
          <p className="text-fg2 text-sm mt-1">
            {unreadCount} unread · {notifications.length} total
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-2 rounded-md border border-frost-border px-3 py-1.5 text-fg2 hover:text-fg1 hover:border-frost-border-strong transition-colors text-[11px] uppercase font-semibold tracking-wider"
          >
            <CheckCheck size={12} />
            Mark all read
          </button>
        )}
      </div>

      <LensSelector items={TABS} activeKey={tab} onChange={(k) => setTab(k)} />

      <div className="max-w-3xl mx-auto py-2">
        {tab === "INBOX" && (
          <ActivityList
            items={inboxItems}
            loading={isLoading}
            emptyTitle="No activity yet"
            emptySubtitle="When others follow, track, or share your items, you'll see it here."
            onRowClick={(groupId) => markGroupRead(groupId)}
          />
        )}

        {tab === "SIGNALS" && (
          <ActivityList
            items={signalItems}
            loading={isLoading}
            emptyTitle="No signals yet"
            emptySubtitle="Comp matches, view milestones, and other system signals will surface here."
            onRowClick={(groupId) => markGroupRead(groupId)}
          />
        )}

        {tab === "JOURNAL" && (
          <ActivityList
            items={journal.map(mapJournalToRow)}
            loading={journalLoading}
            emptyTitle="No journal entries yet"
            emptySubtitle="Your own actions — adding items, creating showcases — will be logged here."
          />
        )}
      </div>
    </div>
  )
}

function ActivityList({
  items,
  loading,
  emptyTitle,
  emptySubtitle,
  onRowClick,
}: {
  items: ActivityRowItem[]
  loading: boolean
  emptyTitle: string
  emptySubtitle: string
  onRowClick?: (id: string) => void
}) {
  if (loading) {
    return (
      <div className="space-y-1 px-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-16 bg-frost-border/10 rounded-md animate-pulse mx-2"
          />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Bell size={20} color="var(--fg2)" />}
        title={emptyTitle}
        subtitle={emptySubtitle}
      />
    )
  }

  return (
    <div className="divide-y divide-frost-divider">
      {items.map((item) => (
        <ActivityRow
          key={item.id}
          activity={item}
          onClick={() => onRowClick?.(item.id)}
        />
      ))}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────

interface ActivityRowItem {
  id: string
  verb: string
  time: string
  context: any
  unread?: boolean
}

function mapGroupToRow(g: any): ActivityRowItem {
  const first = g.activities[0] ?? {}
  return {
    id: g.id,
    verb: g.verb,
    time: g.updated_at ?? first.time ?? new Date().toISOString(),
    context: {
      actorId: first.actor,
      actorName: first.actorName,
      actorUsername: first.actorUsername,
      actorAvatar: first.actorAvatar,
      collectibleId: first.collectibleId,
      collectibleTitle: first.collectibleTitle,
      collectibleImage: first.collectibleImage,
      showcaseId: first.showcaseId,
      showcaseTitle: first.showcaseTitle,
      showcaseImage: first.showcaseImage,
      newStatus: first.newStatus,
      compMatchPercent: first.compMatchPercent,
      compTitle: first.compTitle,
      compImage: first.compImage,
      viewMilestone: first.viewMilestone,
      viewCount: first.viewCount,
      objectType: first.objectType,
      actorCount: g.actor_count,
      channelId: first.channelId,
    },
    unread: !g.is_read,
  }
}

function mapJournalToRow(entry: JournalEntry): ActivityRowItem {
  return {
    id: entry.id,
    verb: entry.verb,
    time: entry.time,
    context: {
      collectibleId: entry.collectibleId ?? undefined,
      collectibleTitle: entry.collectibleTitle ?? undefined,
      collectibleImage: entry.collectibleImage ?? undefined,
      showcaseId: entry.showcaseId ?? undefined,
      showcaseTitle: entry.showcaseTitle ?? undefined,
    },
    unread: false,
  }
}

function getVerbCategory(verb: string | undefined): "INBOX" | "SIGNALS" | "JOURNAL" {
  if (!verb) return "INBOX"
  if (
    verb === "comp_alert" ||
    verb === "view_milestone" ||
    verb === "weekly_view_digest"
  )
    return "SIGNALS"
  if (verb.startsWith("you_")) return "JOURNAL"
  return "INBOX"
}
