/**
 * FeedsProvider — wraps the app in a Stream Feeds (Activity) context.
 *
 * Mirrors apps/native/lib/contexts/feeds-context.tsx but uses
 * `@stream-io/feeds-react-sdk` instead of the native variant.
 *
 * Same shape: aggregated NotificationGroup[] + unseenCount + unreadCount,
 * subscriptions to feed updates, optimistic mark-as-read.
 */

"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useCreateFeedsClient } from "@stream-io/feeds-react-sdk"
import type {
  Feed,
  AggregatedActivityResponse,
} from "@stream-io/feeds-react-sdk"
import { useUser } from "@/lib/contexts/user-context"
import { useStreamChat } from "@/lib/contexts/stream-context"
import { createClient } from "@/lib/supabase/client"

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY || ""
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export interface FeedActivity {
  id: string
  actor?: string
  verb?: string
  object?: string
  time?: string
  foreign_id?: string
  actorName?: string
  actorUsername?: string
  actorAvatar?: string
  collectibleId?: string
  collectibleTitle?: string
  collectibleImage?: string
  showcaseId?: string
  showcaseTitle?: string
  showcaseImage?: string
  newStatus?: string
  prevValue?: unknown
  newValue?: unknown
  changedFields?: string[]
  compId?: string
  compTitle?: string
  compImage?: string
  compMatchPercent?: number
  viewCount?: number
  viewWindow?: string
  viewMilestone?: number
  channelId?: string
  objectType?: "collectible" | "showcase" | "profile"
  [key: string]: unknown
}

export interface NotificationGroup {
  id: string
  group: string
  verb: string
  activities: FeedActivity[]
  activity_count: number
  actor_count: number
  is_read: boolean
  is_seen: boolean
  created_at: string
  updated_at: string
}

interface FeedsContextValue {
  notifications: NotificationGroup[]
  unseenCount: number
  unreadCount: number
  isLoading: boolean
  refresh: () => Promise<void>
  markAllSeen: () => Promise<void>
  markAllRead: () => Promise<void>
  markGroupRead: (groupId: string) => Promise<void>
  feedsReady: boolean
}

const FeedsContext = createContext<FeedsContextValue>({
  notifications: [],
  unseenCount: 0,
  unreadCount: 0,
  isLoading: false,
  refresh: async () => {},
  markAllSeen: async () => {},
  markAllRead: async () => {},
  markGroupRead: async () => {},
  feedsReady: false,
})

async function fetchStreamToken(): Promise<string> {
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const jwt = data.session?.access_token
  if (!jwt) throw new Error("No Supabase session for token refresh")

  const res = await fetch(`${SUPABASE_URL}/functions/v1/stream-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
      apikey: SUPABASE_ANON_KEY,
    },
  })
  if (!res.ok) throw new Error(`stream-token returned ${res.status}`)
  const { token } = await res.json()
  return token
}

function mapActivity(raw: any): FeedActivity {
  const custom = raw.custom ?? {}
  return {
    id: raw.id ?? "",
    actor: custom.actorId ?? raw.actor ?? raw.user?.id ?? "",
    verb: custom.verb ?? raw.verb ?? raw.type ?? "",
    object: custom.objectId ?? raw.object ?? "",
    time: raw.created_at ? String(raw.created_at) : raw.time ?? "",
    foreign_id: raw.foreign_id ?? "",
    actorName: custom.actorName ?? "",
    actorUsername: custom.actorUsername ?? "",
    actorAvatar: custom.actorAvatar ?? "",
    collectibleId: custom.collectibleId ?? "",
    collectibleTitle: custom.collectibleTitle ?? "",
    collectibleImage: custom.collectibleImage ?? "",
    showcaseId: custom.showcaseId ?? "",
    showcaseTitle: custom.showcaseTitle ?? "",
    showcaseImage: custom.showcaseImage ?? "",
    newStatus: custom.newStatus ?? "",
    prevValue: custom.prevValue,
    newValue: custom.newValue,
    changedFields: custom.changedFields,
    compId: custom.compId ?? "",
    compTitle: custom.compTitle ?? "",
    compImage: custom.compImage ?? "",
    compMatchPercent:
      typeof custom.compMatchPercent === "number"
        ? custom.compMatchPercent
        : undefined,
    viewCount:
      typeof custom.viewCount === "number" ? custom.viewCount : undefined,
    viewWindow: custom.viewWindow ?? "",
    viewMilestone:
      typeof custom.viewMilestone === "number"
        ? custom.viewMilestone
        : undefined,
    channelId: custom.channelId ?? "",
    objectType: custom.objectType ?? undefined,
  }
}

function mapAggregated(agg: AggregatedActivityResponse): NotificationGroup {
  const rawActivities = (agg as any).activities ?? []
  const activities = rawActivities.map(mapActivity)
  const firstActivity = activities[0] as FeedActivity | undefined
  const actorIds = new Set(
    activities.map((a: FeedActivity) => a.actor || a.actorName),
  )

  return {
    id: (agg as any).id ?? agg.group,
    group: agg.group,
    verb: firstActivity?.verb ?? "",
    activities,
    activity_count: agg.activity_count,
    actor_count: actorIds.size,
    is_read: (agg as any).is_read ?? false,
    is_seen: (agg as any).is_seen ?? false,
    created_at: String(agg.created_at),
    updated_at: String(agg.updated_at),
  }
}

function FeedsConnected({
  children,
  userId,
  userName,
  userImage,
}: {
  children: ReactNode
  userId: string
  userName: string
  userImage?: string
}) {
  const [notifications, setNotifications] = useState<NotificationGroup[]>([])
  const [unseenCount, setUnseenCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [feedsReady, setFeedsReady] = useState(false)
  const feedRef = useRef<Feed | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)

  const tokenProvider = useCallback(async () => fetchStreamToken(), [])

  const feedsClient = useCreateFeedsClient({
    apiKey: STREAM_API_KEY,
    userData: { id: userId, name: userName, image: userImage },
    tokenOrProvider: tokenProvider,
  })

  const loadNotifications = useCallback(async () => {
    if (!feedsClient) return
    try {
      const feed = feedsClient.feed("notification", userId)
      feedRef.current = feed
      const response = await feed.getOrCreate({ watch: true })
      const groups = (response.aggregated_activities ?? []).map(mapAggregated)
      setNotifications(groups)
      const status = response.notification_status
      setUnseenCount(status?.unseen ?? 0)
      setUnreadCount(status?.unread ?? 0)
      setIsLoading(false)
      setFeedsReady(true)
    } catch (err) {
      console.warn("[Feeds] load failed:", err)
      setIsLoading(false)
    }
  }, [feedsClient, userId])

  useEffect(() => {
    if (!feedsClient) return
    loadNotifications()
    return () => {
      if (unsubRef.current) {
        unsubRef.current()
        unsubRef.current = null
      }
    }
  }, [feedsClient, loadNotifications])

  useEffect(() => {
    if (!feedRef.current || !feedsReady) return
    const unsub = feedRef.current.on("feeds.notification_feed.updated", () => {
      loadNotifications()
    })
    unsubRef.current = unsub as () => void
    return () => {
      ;(unsub as () => void)?.()
      unsubRef.current = null
    }
  }, [feedsReady, loadNotifications])

  const markAllSeen = useCallback(async () => {
    if (!feedRef.current) return
    try {
      await feedRef.current.markActivity({ mark_all_seen: true })
      setUnseenCount(0)
      setNotifications((prev) => prev.map((g) => ({ ...g, is_seen: true })))
    } catch (err) {
      console.warn("[Feeds] markAllSeen failed", err)
    }
  }, [])

  const markAllRead = useCallback(async () => {
    if (!feedRef.current) return
    try {
      await feedRef.current.markActivity({ mark_all_read: true })
      setUnreadCount(0)
      setNotifications((prev) => prev.map((g) => ({ ...g, is_read: true })))
    } catch (err) {
      console.warn("[Feeds] markAllRead failed", err)
    }
  }, [])

  const markGroupRead = useCallback(async (groupId: string) => {
    if (!feedRef.current) return
    setNotifications((prev) =>
      prev.map((g) => (g.id === groupId && !g.is_read ? { ...g, is_read: true } : g)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
    try {
      await feedRef.current.markActivity({ mark_read: [groupId] })
    } catch (err) {
      console.warn("[Feeds] markGroupRead failed", err)
    }
  }, [])

  return (
    <FeedsContext.Provider
      value={{
        notifications,
        unseenCount,
        unreadCount,
        isLoading,
        refresh: loadNotifications,
        markAllSeen,
        markAllRead,
        markGroupRead,
        feedsReady,
      }}
    >
      {children}
    </FeedsContext.Provider>
  )
}

export function FeedsProvider({ children }: { children: ReactNode }) {
  const { profile, user } = useUser()
  const { isReady: streamReady } = useStreamChat()

  const shouldConnect = !!user?.id && !!profile?.id && streamReady && !!STREAM_API_KEY

  if (shouldConnect && profile) {
    return (
      <FeedsConnected
        userId={profile.id}
        userName={profile.display_name || profile.username || "User"}
        userImage={profile.avatar || undefined}
      >
        {children}
      </FeedsConnected>
    )
  }

  return (
    <FeedsContext.Provider
      value={{
        notifications: [],
        unseenCount: 0,
        unreadCount: 0,
        isLoading: false,
        refresh: async () => {},
        markAllSeen: async () => {},
        markAllRead: async () => {},
        markGroupRead: async () => {},
        feedsReady: false,
      }}
    >
      {children}
    </FeedsContext.Provider>
  )
}

export function useFeeds() {
  return useContext(FeedsContext)
}
