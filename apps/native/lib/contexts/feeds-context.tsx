import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useCreateFeedsClient } from '@stream-io/feeds-react-native-sdk';
import type { Feed } from '@stream-io/feeds-react-native-sdk';
import type { AggregatedActivityResponse } from '@stream-io/feeds-react-native-sdk';
import { useAuth } from '@/lib/contexts/auth-context';
import { useStream } from '@/lib/contexts/stream-context';
import { getAccessToken } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const log = logger.create('Feeds');

const STREAM_API_KEY = process.env.EXPO_PUBLIC_STREAM_API_KEY || '';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export interface FeedActivity {
  id: string;
  actor?: string;
  verb?: string;
  object?: string;
  time?: string;
  foreign_id?: string;
  actorName?: string;
  actorUsername?: string;
  actorAvatar?: string;
  collectibleId?: string;
  collectibleTitle?: string;
  collectibleImage?: string;
  showcaseId?: string;
  showcaseTitle?: string;
  showcaseImage?: string;
  newStatus?: string;
  prevValue?: unknown;
  newValue?: unknown;
  changedFields?: string[];
  compId?: string;
  compTitle?: string;
  compImage?: string;
  compMatchPercent?: number;
  viewCount?: number;
  viewWindow?: string;
  viewMilestone?: number;
  channelId?: string;
  objectType?: 'collectible' | 'showcase' | 'profile';
  [key: string]: unknown;
}

export interface NotificationGroup {
  id: string;
  group: string;
  verb: string;
  activities: FeedActivity[];
  activity_count: number;
  actor_count: number;
  is_read: boolean;
  is_seen: boolean;
  created_at: string;
  updated_at: string;
}

interface FeedsContextType {
  notifications: NotificationGroup[];
  unseenCount: number;
  unreadCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  markAllSeen: () => Promise<void>;
  markAllRead: () => Promise<void>;
  /**
   * Mark a single aggregated activity group as read. Used by row taps
   * inside the Activity lens so the brandVolt unread rail clears
   * immediately.
   */
  markGroupRead: (groupId: string) => Promise<void>;
  feedsReady: boolean;
}

const FeedsContext = createContext<FeedsContextType>({
  notifications: [],
  unseenCount: 0,
  unreadCount: 0,
  isLoading: false,
  refresh: async () => {},
  markAllSeen: async () => {},
  markAllRead: async () => {},
  markGroupRead: async () => {},
  feedsReady: false,
});

async function fetchStreamToken(): Promise<string> {
  const jwt = await getAccessToken();
  if (!jwt) throw new Error('No Supabase session for token refresh');
  const res = await fetch(`${SUPABASE_URL}/functions/v1/stream-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${jwt}`,
      apikey: SUPABASE_ANON_KEY,
    },
  });
  if (!res.ok) throw new Error(`stream-token returned ${res.status}`);
  const { token } = await res.json();
  return token;
}

function mapActivity(raw: any): FeedActivity {
  const custom = raw.custom ?? {};
  return {
    id: raw.id ?? '',
    actor: custom.actorId ?? raw.actor ?? raw.user?.id ?? '',
    verb: custom.verb ?? raw.verb ?? raw.type ?? '',
    object: custom.objectId ?? raw.object ?? '',
    time: raw.created_at ? String(raw.created_at) : raw.time ?? '',
    foreign_id: raw.foreign_id ?? '',
    actorName: custom.actorName ?? '',
    actorUsername: custom.actorUsername ?? '',
    actorAvatar: custom.actorAvatar ?? '',
    collectibleId: custom.collectibleId ?? '',
    collectibleTitle: custom.collectibleTitle ?? '',
    collectibleImage: custom.collectibleImage ?? '',
    showcaseId: custom.showcaseId ?? '',
    showcaseTitle: custom.showcaseTitle ?? '',
    showcaseImage: custom.showcaseImage ?? '',
    newStatus: custom.newStatus ?? '',
    prevValue: custom.prevValue,
    newValue: custom.newValue,
    changedFields: custom.changedFields,
    compId: custom.compId ?? '',
    compTitle: custom.compTitle ?? '',
    compImage: custom.compImage ?? '',
    compMatchPercent: typeof custom.compMatchPercent === 'number' ? custom.compMatchPercent : undefined,
    viewCount: typeof custom.viewCount === 'number' ? custom.viewCount : undefined,
    viewWindow: custom.viewWindow ?? '',
    viewMilestone: typeof custom.viewMilestone === 'number' ? custom.viewMilestone : undefined,
    channelId: custom.channelId ?? '',
    objectType: custom.objectType ?? undefined,
  };
}

function mapAggregated(agg: AggregatedActivityResponse): NotificationGroup {
  const rawActivities = (agg as any).activities ?? [];
  const activities = rawActivities.map(mapActivity);
  const firstActivity = activities[0] as FeedActivity | undefined;
  const actorIds = new Set(activities.map((a: FeedActivity) => a.actor || a.actorName));

  return {
    id: (agg as any).id ?? agg.group,
    group: agg.group,
    verb: firstActivity?.verb ?? '',
    activities,
    activity_count: agg.activity_count,
    actor_count: actorIds.size,
    is_read: (agg as any).is_read ?? false,
    is_seen: (agg as any).is_seen ?? false,
    created_at: String(agg.created_at),
    updated_at: String(agg.updated_at),
  };
}

/**
 * Inner component that only mounts when auth + Stream are ready.
 * This is necessary because useCreateFeedsClient eagerly connects —
 * it cannot receive a placeholder token without crashing.
 */
function FeedsConnected({
  children,
  userId,
  userName,
  userImage,
}: {
  children: ReactNode;
  userId: string;
  userName: string;
  userImage?: string;
}) {
  const [notifications, setNotifications] = useState<NotificationGroup[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [feedsReady, setFeedsReady] = useState(false);
  const feedRef = useRef<Feed | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const tokenProvider = useCallback(async () => {
    return fetchStreamToken();
  }, []);

  const feedsClient = useCreateFeedsClient({
    apiKey: STREAM_API_KEY,
    userData: { id: userId, name: userName, image: userImage },
    tokenOrProvider: tokenProvider,
  });

  const loadNotifications = useCallback(async () => {
    if (!feedsClient) return;
    try {
      const feed = feedsClient.feed('notification', userId);
      feedRef.current = feed;

      const response = await feed.getOrCreate({ watch: true });

      const groups = (response.aggregated_activities ?? []).map(mapAggregated);
      setNotifications(groups);

      const status = response.notification_status;
      setUnseenCount(status?.unseen ?? 0);
      setUnreadCount(status?.unread ?? 0);
      setIsLoading(false);
      setFeedsReady(true);
    } catch (err) {
      log.error('Failed to load notifications:', err);
      setIsLoading(false);
    }
  }, [feedsClient, userId]);

  useEffect(() => {
    if (!feedsClient) return;
    loadNotifications();

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [feedsClient, loadNotifications]);

  useEffect(() => {
    if (!feedRef.current || !feedsReady) return;

    const unsub = feedRef.current.on('feeds.notification_feed.updated', () => {
      log.info('Real-time notification update');
      loadNotifications();
    });
    unsubRef.current = unsub;

    return () => {
      unsub();
      unsubRef.current = null;
    };
  }, [feedsReady, loadNotifications]);

  const markAllSeen = useCallback(async () => {
    if (!feedRef.current) return;
    try {
      await feedRef.current.markActivity({ mark_all_seen: true });
      setUnseenCount(0);
      setNotifications((prev) =>
        prev.map((g) => ({ ...g, is_seen: true })),
      );
    } catch (err) {
      log.error('Failed to mark all seen:', err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    if (!feedRef.current) return;
    try {
      await feedRef.current.markActivity({ mark_all_read: true });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((g) => ({ ...g, is_read: true })),
      );
    } catch (err) {
      log.error('Failed to mark all read:', err);
    }
  }, []);

  const markGroupRead = useCallback(async (groupId: string) => {
    if (!feedRef.current) return;
    // Optimistic local update — flip the group flag and decrement the
    // unread badge before the network round-trip so the row's brandVolt
    // rail clears immediately on tap.
    setNotifications((prev) =>
      prev.map((g) =>
        g.id === groupId && !g.is_read ? { ...g, is_read: true } : g,
      ),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      // Stream's notification feed accepts mark_read with an array of
      // group ids — see https://getstream.io/activity-feeds/docs/.
      await feedRef.current.markActivity({ mark_read: [groupId] });
    } catch (err) {
      log.error('Failed to mark group read:', err);
    }
  }, []);

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
  );
}

/**
 * Outer shell that provides the context default when not authenticated.
 * Only mounts FeedsConnected once auth + Stream are fully ready.
 */
export function FeedsProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, profileStatus } = useAuth();
  const { isReady: streamReady } = useStream();

  const shouldConnect =
    isAuthenticated && !!user?.id && !!profileStatus?.isComplete && streamReady;

  if (shouldConnect && user) {
    return (
      <FeedsConnected
        userId={user.id}
        userName={user.displayName || user.username || 'User'}
        userImage={user.avatarUrl || undefined}
      >
        {children}
      </FeedsConnected>
    );
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
  );
}

export function useFeeds() {
  return useContext(FeedsContext);
}
