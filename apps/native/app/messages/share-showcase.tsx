import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { ShowcaseSurface } from '@/components/showcases';
import { IconButton } from '@/components/vault';
import { useStream } from '@/lib/contexts/stream-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { getUserShowcases, type UserShowcase } from '@/lib/api/showcases';
import { sendNotification } from '@/lib/api/notifications';
import { useTheme, TYPE } from '@/lib/design';
import { logger } from '@/lib/logger';

const log = logger.create('ShareShowcase');

const HEADLINE = 'SHOWCASE';

/**
 * /messages/share-showcase — full-screen showcase picker for attaching
 * a single showcase to a Stream Chat channel.
 *
 * Architecture mirrors the user-profile Showcase lens: same
 * `ShowcaseSurface` that ships search + grid/spatial/list rendering.
 * Differences:
 *   - View mode is pinned to `grid`. The toolbar's view-mode selector
 *     is hidden via `hideViewModeSelector` — there's no curatorial
 *     reason to flip view mode while picking.
 *   - Tapping a showcase card sends the attachment immediately
 *     (fire-and-forget) and `router.back()`s to the thread; no
 *     confirmation modal. Stream's per-message indicator handles
 *     in-flight + failure UI in the thread.
 *   - Featured framing is disabled (`featuredShowcaseId={null}`) so
 *     the user's featured pick doesn't get visually privileged inside
 *     a list of equal-weight choices.
 *
 * Entry point: QuickAttachBar's "Share Showcase" icon (the layout-grid
 * glyph) inside `<Channel>`.
 */
export default function ShareShowcasePage() {
  const { colors } = useTheme();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const router = useRouter();
  const { client } = useStream();
  const { user } = useAuth();

  const [showcases, setShowcases] = useState<UserShowcase[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    getUserShowcases(user.id)
      .then(setShowcases)
      .catch((err) => log.error('Failed to load showcases for picker:', err))
      .finally(() => setLoading(false));
  }, [user?.id]);

  // Fire-and-forget send. See share-collectible.tsx for the rationale —
  // same contract here: send, haptic, back. Stream owns retry UX.
  const handleSelect = useCallback(
    (showcaseId: string) => {
      if (!channelId) return;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const channel = client.channel('messaging', channelId);
      channel
        .sendMessage({
          text: '',
          attachments: [{ type: 'showcase', showcase_id: showcaseId }],
        })
        .then(() => {
          // Fan-out vitrine_attached_to_chat to the other channel
          // members. Self is filtered.
          if (!user?.id) return;
          const showcase = showcases.find((s) => s.id === showcaseId);
          const recipientIds = Object.values(channel.state.members)
            .map((m) => m.user_id)
            .filter((uid): uid is string => !!uid && uid !== user.id);
          if (recipientIds.length === 0) return;
          sendNotification({
            type: 'vitrine_attached_to_chat',
            recipientIds,
            actorId: user.id,
            data: {
              objectId: showcaseId,
              objectType: 'showcase',
              channelId,
              showcaseId,
              showcaseTitle: showcase?.title ?? null,
              showcaseImage: showcase?.images?.[0] ?? null,
            },
          }).catch(() => {});
        })
        .catch((err) => {
          log.error('Showcase attachment send failed:', err);
        });
      router.back();
    },
    [channelId, client, router, user?.id, showcases],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.void }]} edges={['top']}>
      <View style={[styles.topBar, { borderBottomColor: colors.frostDivider }]}>
        <Text style={[styles.headline, { color: colors.textPrimary }]} accessibilityRole="header">
          {HEADLINE}
        </Text>
        <View style={styles.leftSlot} pointerEvents="box-none">
          <IconButton
            icon={ArrowLeft}
            onPress={() => router.back()}
            label="Back"
            size={22}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.textPrimary} />
        </View>
      ) : (
        <ShowcaseSurface
          showcases={showcases}
          viewMode="grid"
          onViewModeChange={() => {
            /* pinned — view mode selector is hidden */
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          // No featured framing in picker mode — every pick is equal
          // weight. Crown jewel and featured-showcase haloing make
          // sense in a curatorial surface, not a quick-attach flow.
          featuredShowcaseId={null}
          onOpenShowcase={handleSelect}
          hideViewModeSelector
          searchPlaceholder="Search showcases…"
          contentPaddingTop={16}
        />
      )}
    </SafeAreaView>
  );
}

const TOP_BAR_HEIGHT = 54;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    position: 'relative',
    height: TOP_BAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
  },
  headline: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
  leftSlot: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 4,
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
