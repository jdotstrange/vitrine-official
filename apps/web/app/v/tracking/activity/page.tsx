"use client"

import { useMemo } from "react"
import { Bell } from "lucide-react"
import { useFeeds } from "@/lib/contexts/feeds-context"
import { ActivityRow, EmptyState } from "@/components/vault"
import { getTrackingCategory } from "@/lib/design"

/**
 * Tracking activity lens — surfaces the same notification stream
 * as /v/activity but pre-filtered to verbs that have a tracking
 * category (status_change, value_change, comp_alert, etc.).
 *
 * Mirrors apps/native/components/tracking-lenses/activity-lens.tsx.
 */
export default function TrackingActivityLensPage() {
  const { notifications, isLoading, markGroupRead } = useFeeds()

  const items = useMemo(() => {
    return notifications
      .filter((g) => getTrackingCategory(g.verb) !== null)
      .map((g) => {
        const first = g.activities[0] ?? {}
        return {
          id: g.id,
          verb: g.verb,
          time: g.updated_at,
          context: {
            actorId: first.actor,
            actorName: first.actorName,
            collectibleId: first.collectibleId,
            collectibleTitle: first.collectibleTitle,
            collectibleImage: first.collectibleImage,
            newStatus: first.newStatus,
            compMatchPercent: first.compMatchPercent,
            compTitle: first.compTitle,
            compImage: first.compImage,
            actorCount: g.actor_count,
          },
          unread: !g.is_read,
        }
      })
  }, [notifications])

  if (isLoading) {
    return (
      <div className="space-y-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-16 bg-frost-border/10 rounded-md animate-pulse"
          />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Bell size={20} color="var(--fg2)" />}
        title="No tracking activity yet"
        subtitle="Status changes, value updates, and comp alerts on items you track will appear here."
      />
    )
  }

  return (
    <div className="divide-y divide-frost-divider">
      {items.map((item) => (
        <ActivityRow
          key={item.id}
          activity={item as any}
          onClick={() => markGroupRead(item.id)}
        />
      ))}
    </div>
  )
}
