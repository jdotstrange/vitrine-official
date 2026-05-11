import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Plus } from 'lucide-react-native';
import { ChannelList } from 'stream-chat-expo';
import type {
  ChannelFilters,
  ChannelOptions,
  ChannelSort,
  Channel as ChannelType,
} from 'stream-chat';
import type { ChannelPreviewMessengerProps } from 'stream-chat-expo';

import { useStream } from '@/lib/contexts/stream-context';
import { Brackets, Chip, SearchBar } from '@/components/vault';
import { SwipeableChannelRow } from '@/components/messaging/swipeable-channel-row';
import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';
import { logger } from '@/lib/logger';

/**
 * MessageInboxBody — V3 inbox surface usable as both a profile-hub lens
 * and a standalone screen body.
 *
 * Why this lives in `components/profile-lenses/` and not `app/messages/`:
 *   The "profile-as-hub" concept renders the inbox as a swipeable lens
 *   alongside Collection / Showcase / etc. Both consumers (the hub lens
 *   and the standalone /messages route) share the same visual + interaction
 *   contract — chip filter row, V3 search bar, Crown-Jewel-DNA channel
 *   rows with bidirectional swipe, FAB for new conversation. Extracting
 *   the body into a lens module keeps both consumers in lockstep with one
 *   source of truth.
 *
 * What this body does NOT include:
 *   - SafeAreaView (the consumer chooses its safe-area treatment)
 *   - Back navigation (lens swipe handles it; standalone uses iOS edge-back)
 *   - Profile-screen lens selector (lives in the parent for the hub case)
 *
 * What it does include:
 *   - ALL / UNREAD chip selector (replaces the legacy display-LensSelector
 *     so it doesn't compete with the parent's lens selector)
 *   - V3 SearchBar with debounced autocomplete
 *   - Stream `ChannelList` rendered with the Crown-Jewel-DNA preview row
 *   - Brand-volt FAB pinned bottom-right for the "new conversation" entry
 *
 * Bottom-tab clearance:
 *   The FAB is absolutely positioned. When this body is mounted inside the
 *   profile hub, the BottomDock overlays the bottom of the screen; pass
 *   `fabBottomOffset` to push the FAB above it. Standalone mounts (no dock)
 *   leave the prop at default 0 and the FAB sits 16pt above the safe area.
 */

const log = logger.create('MessageLens');

const sort: ChannelSort = { last_message_at: -1 };
const options: ChannelOptions = { state: true, watch: true, presence: true };

type LensKey = 'ALL' | 'UNREAD';

const GUTTER = SPACING.zoneIntra;

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

function formatRelativeTime(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function resolveHandleLabel(other: { id?: string; username?: unknown } | undefined | null): string {
  const username = (other as any)?.username as string | undefined;
  if (username && username.trim().length > 0) {
    return username.startsWith('@') ? username : `@${username}`;
  }
  const id = other?.id || '';
  if (!id) return '@member';
  return id.startsWith('@') ? id : `@${id}`;
}

function attachmentPreviewLabel(channel: ChannelType): string {
  const lastMsg = channel.state.messages[channel.state.messages.length - 1];
  if (!lastMsg?.attachments?.length) return '';
  const att = lastMsg.attachments[0];
  if (att.type === 'collectible') return 'SHARED A COLLECTIBLE';
  if (att.type === 'showcase') return 'SHARED A SHOWCASE';
  if (att.type === 'image') return 'SENT A PHOTO';
  return 'SENT AN ATTACHMENT';
}

// ════════════════════════════════════════════════════════════════
// CHANNEL PREVIEW ROW
// ════════════════════════════════════════════════════════════════

function VitrineChannelPreview({
  channel,
  latestMessagePreview,
  unread,
}: ChannelPreviewMessengerProps) {
  const { client } = useStream();
  const { colors } = useTheme();
  const router = useRouter();
  const myId = client.userID;
  const [isTyping, setIsTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(channel.muteStatus().muted);

  // Typing presence subscription.
  useEffect(() => {
    const start = channel.on('typing.start', (event) => {
      if (event.user?.id !== myId) setIsTyping(true);
    });
    const stop = channel.on('typing.stop', (event) => {
      if (event.user?.id !== myId) setIsTyping(false);
    });
    return () => {
      start.unsubscribe();
      stop.unsubscribe();
    };
  }, [channel, myId]);

  const members = Object.values(channel.state.members);
  const other = members.find((m) => m.user_id !== myId)?.user;

  const displayName = other?.name || other?.id || 'Unknown';
  const avatarUrl = (other?.image as string) || '';
  const isOnline = other?.online ?? false;

  // Preview text — prefer real text, fall back to attachment kicker.
  const rawPreview =
    latestMessagePreview?.previews?.map((p) => p.text).join('') || '';
  const isAttachmentPreview = !rawPreview.trim();
  const attachmentLabel = useMemo(
    () => (isAttachmentPreview ? attachmentPreviewLabel(channel) : ''),
    [isAttachmentPreview, channel],
  );

  const timestamp = formatRelativeTime(latestMessagePreview?.created_at);
  const hasUnread = (unread ?? 0) > 0;

  const handlePress = useCallback(() => {
    if (!channel.id) return;
    router.push(`/messages/${encodeURIComponent(channel.id)}` as Href);
  }, [channel.id, router]);

  const handleDelete = useCallback(async () => {
    try {
      await channel.delete();
    } catch (err) {
      log.error('Failed to delete channel:', (err as Error).message);
    }
  }, [channel]);

  const handleToggleMute = useCallback(async () => {
    try {
      if (isMuted) {
        await channel.unmute();
        setIsMuted(false);
      } else {
        await channel.mute();
        setIsMuted(true);
      }
    } catch (err) {
      log.error('Failed to toggle mute:', (err as Error).message);
    }
  }, [channel, isMuted]);

  const handleToggleRead = useCallback(async () => {
    try {
      if (hasUnread) {
        await channel.markRead();
      } else {
        const lastMsg = channel.state.messages[channel.state.messages.length - 1];
        if (lastMsg?.id) {
          await channel.markUnread({ message_id: lastMsg.id });
        }
      }
    } catch (err) {
      log.error('Failed to toggle read state:', (err as Error).message);
    }
  }, [channel, hasUnread]);

  return (
    <SwipeableChannelRow
      hasUnread={hasUnread}
      isMuted={isMuted}
      onPress={handlePress}
      onDelete={handleDelete}
      onToggleMute={handleToggleMute}
      onToggleRead={handleToggleRead}
    >
      <View
        style={[rowS.card, { borderColor: colors.frostBorder }]}
        accessibilityRole="button"
        accessibilityLabel={`${displayName}, ${rawPreview || attachmentLabel || 'no messages'}, ${timestamp}`}
        accessibilityHint="Opens conversation"
      >
        {/* Framed avatar — frostBorderStrong w/ 2pt inset (Crown Jewel DNA) */}
        <View style={[rowS.avatarFrame, { borderColor: colors.frostBorderStrong, backgroundColor: colors.void }]}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={rowS.avatar} contentFit="cover" />
          ) : (
            <View style={[rowS.avatar, rowS.avatarFallback, { backgroundColor: colors.sheetBg }]}>
              <Text style={[rowS.avatarInitial, { color: colors.textTertiary }]}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {isOnline ? <View style={[rowS.onlineDot, { backgroundColor: colors.semanticGreen }]} /> : null}
          {isMuted ? <View style={[rowS.mutedDot, { backgroundColor: colors.textTertiary }]} /> : null}
        </View>

        {/* Body — handle/time on top, name in middle, preview/unread on bottom */}
        <View style={rowS.body}>
          <View style={rowS.topLine}>
            <Text style={[rowS.handle, { color: colors.textSecondary }]} numberOfLines={1}>
              {resolveHandleLabel(other)}
            </Text>
            <Text style={[rowS.timestamp, { color: colors.textTertiary }]}>{timestamp}</Text>
          </View>

          <Text
            style={[rowS.name, { color: colors.textPrimary }, hasUnread && rowS.nameUnread]}
            numberOfLines={1}
          >
            {displayName}
          </Text>

          <View style={rowS.bottomLine}>
            {isTyping ? (
              <Text style={[rowS.typing, { color: colors.brandVolt }]} numberOfLines={1}>
                typing…
              </Text>
            ) : isAttachmentPreview ? (
              <Text style={[rowS.attachmentPreview, { color: colors.textSecondary }]} numberOfLines={1}>
                {attachmentLabel}
              </Text>
            ) : (
              <Text
                style={[rowS.preview, { color: colors.textSecondary }, hasUnread && [rowS.previewUnread, { color: colors.textPrimary }]]}
                numberOfLines={1}
              >
                {rawPreview}
              </Text>
            )}
            {hasUnread ? (
              <View style={[rowS.unreadChip, { backgroundColor: colors.brandVolt }]}>
                <Text style={[rowS.unreadChipText, { color: colors.textInverse }]}>
                  {(unread ?? 0) > 99 ? '99+' : unread}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </SwipeableChannelRow>
  );
}

// ════════════════════════════════════════════════════════════════
// EMPTY / LOADING STATES
// ════════════════════════════════════════════════════════════════

function InboxEmptyState({ activeLens }: { activeLens: LensKey }) {
  const { colors } = useTheme();
  const isUnread = activeLens === 'UNREAD';
  return (
    <View style={emptyS.wrap}>
      <View style={[emptyS.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
        <Brackets />
        <Text style={[emptyS.title, { color: colors.textPrimary }]}>
          {isUnread ? 'INBOX CLEAR' : 'NO MESSAGES YET'}
        </Text>
        <Text style={[emptyS.subtitle, { color: colors.textSecondary }]}>
          {isUnread
            ? 'You\u2019re all caught up.'
            : 'Tap the + to start your first conversation.'}
        </Text>
      </View>
    </View>
  );
}

function InboxLoadingState() {
  const { colors } = useTheme();
  return (
    <View style={loadingS.wrap}>
      <Text style={[loadingS.text, { color: colors.textSecondary }]}>LOADING CONVERSATIONS…</Text>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// MESSAGE INBOX BODY
// ════════════════════════════════════════════════════════════════

export interface MessageInboxBodyProps {
  /**
   * Additional bottom padding for the floating "+" FAB, used to clear
   * persistent bottom-tab chrome (e.g., the BottomDock when this body is
   * mounted inside the profile hub). Defaults to 0 for standalone mounts.
   */
  fabBottomOffset?: number;
}

export function MessageInboxBody({ fabBottomOffset = 0 }: MessageInboxBodyProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { client, isReady } = useStream();
  const { colors } = useTheme();
  const userId = client.userID;

  const [activeLens, setActiveLens] = useState<LensKey>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filters: ChannelFilters = useMemo(() => {
    const base: ChannelFilters = {
      type: 'messaging',
      members: { $in: [userId || ''] },
    };
    if (activeLens === 'UNREAD') {
      (base as any).has_unread = true;
    }
    if (searchQuery.trim()) {
      (base as any)['member.user.name'] = { $autocomplete: searchQuery.trim() };
    }
    return base;
  }, [userId, activeLens, searchQuery]);

  // FAB sits 16pt above the safe area, plus any caller-supplied bottom
  // chrome offset (BottomDock when in the hub, 0 when standalone).
  const fabBottom = Math.max(insets.bottom, 10) + 16 + fabBottomOffset;

  return (
    <View style={[styles.root, { backgroundColor: colors.void }]}>
      {/* Filter chips: ALL · UNREAD — replaces the legacy display-variant
          LensSelector so we don't double up with the parent's selector. */}
      <View style={styles.chipRow}>
        <Chip
          label="All"
          selected={activeLens === 'ALL'}
          onPress={() => setActiveLens('ALL')}
        />
        <Chip
          label="Unread"
          selected={activeLens === 'UNREAD'}
          onPress={() => setActiveLens('UNREAD')}
        />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search conversations"
        />
      </View>

      {/* Channel list */}
      {!isReady ? (
        <InboxLoadingState />
      ) : (
        <View style={[styles.listWrap, { backgroundColor: colors.void }]}>
          <ChannelList
            filters={filters}
            sort={sort}
            options={options}
            onSelect={(channel) => {
              if (channel.id) router.push(`/messages/${channel.id}` as Href);
            }}
            Preview={VitrineChannelPreview}
            EmptyStateIndicator={() => <InboxEmptyState activeLens={activeLens} />}
            additionalFlatListProps={{
              style: [styles.listFlat, { backgroundColor: colors.void }],
              contentContainerStyle: [
                styles.listContent,
                { backgroundColor: colors.void },
                { paddingBottom: fabBottom + 56 + 24 },
              ],
            }}
          />
        </View>
      )}

      {/* FAB — bottom-right + glyph for new conversation */}
      <TouchableOpacity
        style={[styles.fab, { bottom: fabBottom, backgroundColor: colors.brandVolt, borderColor: colors.brandVoltBorder }]}
        onPress={() => router.push('/messages/new' as Href)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="New conversation"
        hitSlop={8}
      >
        <Plus size={26} color={colors.textInverse} strokeWidth={2.4} />
      </TouchableOpacity>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: GUTTER,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchWrap: {
    paddingHorizontal: GUTTER,
    paddingTop: 8,
    paddingBottom: 8,
  },
  listWrap: {
    flex: 1,
  },
  listFlat: {
  },
  listContent: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    right: 18,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});

// Channel preview row — Crown Jewel-inspired elevated card (no holo, no rail).
//
// Outer card: near-black elevated surface with frostBorder definition,
// 14pt internal padding, GUTTER horizontal margin, 6pt vertical breathing
// room. Avatar lives in a frostBorderStrong frame with a 2pt inset — the
// same DNA the Crown Jewel uses for its image well, just compressed for
// list density.
const rowS = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: GUTTER,
    marginVertical: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: RADII.card,
    borderWidth: 1,
    backgroundColor: 'rgba(3, 8, 12, 0.96)',
    overflow: 'hidden',
  },
  avatarFrame: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    padding: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 7,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 22,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: 'rgba(3, 8, 12, 0.96)',
  },
  mutedDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
    borderColor: 'rgba(3, 8, 12, 0.96)',
  },
  body: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 1,
  },
  topLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  handle: {
    flex: 1,
    fontFamily: TYPE.interSemiBold,
    fontSize: 12,
    letterSpacing: 0.1,
  },
  timestamp: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily: TYPE.groteskBold,
    fontSize: 17,
    lineHeight: 21,
    letterSpacing: 0.1,
    marginTop: 4,
  },
  nameUnread: {
  },
  bottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  preview: {
    flex: 1,
    fontFamily: TYPE.inter,
    fontSize: 13,
    lineHeight: 18,
  },
  previewUnread: {
  },
  attachmentPreview: {
    flex: 1,
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.35,
    textTransform: 'uppercase',
  },
  typing: {
    flex: 1,
    fontFamily: TYPE.inter,
    fontStyle: 'italic',
    fontSize: 13,
    lineHeight: 18,
  },
  unreadChip: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: RADII.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadChipText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 0.4,
  },
});

// Empty state — bracketed card matching the showcase-detail dossier DNA.
const emptyS = StyleSheet.create({
  wrap: {
    paddingHorizontal: GUTTER,
    paddingTop: 32,
  },
  card: {
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    gap: 8,
  },
  title: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 16,
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 240,
  },
});

const loadingS = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.5,
  },
});
