import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  MoreHorizontal,
  Send,
} from 'lucide-react-native';
import {
  Channel,
  MessageList,
  MessageInput,
  MessageAvatar as StreamMessageAvatar,
  ThemeProvider,
  useMessageInputContext,
  useMessageContext,
  useTypingString,
} from 'stream-chat-expo';
import type { DeepPartial, Theme } from 'stream-chat-expo';
import type { Channel as ChannelType, Attachment } from 'stream-chat';

import { useStream } from '@/lib/contexts/stream-context';
import {
  ActionSheet,
  Brackets,
  IconButton,
} from '@/components/vault';
import {
  VitrineAttachment,
  isVitrineAttachment,
} from '@/components/messaging/vitrine-attachment';
import {
  QuickAttachBar,
  QuickAttachProvider,
  type QuickAttachActions,
} from '@/components/messaging/quick-attach-bar';
import { useTheme, COLORS, RADII, TYPE } from '@/lib/design';
import { logger } from '@/lib/logger';

const log = logger.create('ConversationPage');

const GUTTER = 16;

// ThreadHeader intrinsic height: 8pt vertical padding × 2 + 44pt IconButton
// + hairline bottom border. Used to compute Stream's keyboardVerticalOffset
// so the composer parks flush against the keyboard top instead of floating
// behind it or above it.
const HEADER_HEIGHT = 60;

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

function formatMessageTime(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatMemberSinceLabel(value: unknown): string {
  if (!value) return 'MEMBER SINCE RECENTLY';
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return 'MEMBER SINCE RECENTLY';
  return `MEMBER SINCE ${date.getFullYear()}`;
}

function resolveHandleLabel(otherUser: { id?: string; username?: unknown } | null | undefined): string {
  const username = (otherUser as any)?.username as string | undefined;
  if (username && username.trim().length > 0) {
    return username.startsWith('@') ? username : `@${username}`;
  }
  const id = otherUser?.id || '';
  if (!id) return '@member';
  return id.startsWith('@') ? id : `@${id}`;
}

function isImageAttachment(a: Attachment): boolean {
  return a.type === 'image' && !!(a.image_url || a.thumb_url);
}

function useOtherMember(channel: ChannelType | null, myId: string | undefined) {
  if (!channel || !myId) return null;
  const members = Object.values(channel.state.members);
  const other = members.find((m) => m.user_id !== myId);
  return other?.user ?? null;
}

// ════════════════════════════════════════════════════════════════
// MESSAGE BUBBLE
// ════════════════════════════════════════════════════════════════

function VitrineMessageBubble() {
  const { colors } = useTheme();
  const { message, alignment, isMyMessage, groupStyles, readBy } = useMessageContext();

  const vitrineAttachments = (message.attachments || []).filter(isVitrineAttachment);
  const imageAttachments = (message.attachments || []).filter(isImageAttachment);
  const hasText = !!message.text?.trim();

  if (!hasText && vitrineAttachments.length === 0 && imageAttachments.length === 0) {
    return null;
  }

  const isLeft = alignment === 'left';
  const groupPos = groupStyles?.[0] || 'single';
  const isBottom = groupPos === 'single' || groupPos === 'bottom';
  const isTop = groupPos === 'single' || groupPos === 'top';
  const isRead = isMyMessage && (readBy?.length ?? 0) > 1;

  // Bubble corner geometry — full radius on outer edges, tighter on grouped seams,
  // tail (4pt) on the canonical "bottom inside" corner of the LAST grouped bubble.
  const FULL = 18;
  const SEAM = 6;
  const TAIL = 4;
  const myRadii = {
    borderTopLeftRadius: FULL,
    borderTopRightRadius: isTop ? FULL : SEAM,
    borderBottomLeftRadius: FULL,
    borderBottomRightRadius: isBottom ? TAIL : SEAM,
  };
  const theirRadii = {
    borderTopLeftRadius: isTop ? FULL : SEAM,
    borderTopRightRadius: FULL,
    borderBottomLeftRadius: isBottom ? TAIL : SEAM,
    borderBottomRightRadius: FULL,
  };

  return (
    <View style={[bubbleS.container, isBottom ? bubbleS.spacingBottom : bubbleS.spacingTop]}>
      <View style={[bubbleS.row, { justifyContent: isLeft ? 'flex-start' : 'flex-end' }]}>
        {/* Avatar slot — reserved on theirs side, only filled on the last grouped bubble */}
        {isLeft ? (
          <View style={bubbleS.avatarSlot}>{isBottom ? <ThreadMessageAvatar /> : null}</View>
        ) : null}

        <View style={[bubbleS.content, isLeft ? bubbleS.contentLeft : bubbleS.contentRight]}>
          {imageAttachments.map((a, i) => {
            const uri = (a.image_url || a.thumb_url) as string;
            return (
            <View
                key={`img-${i}`}
              style={[
                  bubbleS.imageBubble,
                  isMyMessage ? myRadii : theirRadii,
                  isMyMessage ? { borderWidth: 1, borderColor: colors.frostBorder } : { borderWidth: 1, borderColor: colors.brandVoltBorder },
                ]}
              >
                <Image source={{ uri }} style={bubbleS.image} contentFit="cover" />
              </View>
            );
          })}

          {vitrineAttachments.map((a, i) => (
            <VitrineAttachment key={`v-${i}`} {...a} />
          ))}

          {hasText ? (
            <View
              style={[
                bubbleS.textBubble,
                isMyMessage
                  ? [bubbleS.textBubbleMine, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]
                  : [bubbleS.textBubbleTheirs, { backgroundColor: colors.brandVolt, borderColor: colors.brandVoltBorder }],
                isMyMessage ? myRadii : theirRadii,
              ]}
            >
              <Text
                style={[
                  bubbleS.textContent,
                  isMyMessage ? { color: colors.textPrimary } : { color: colors.textInverse },
                ]}
              >
                {message.text}
              </Text>
            </View>
          ) : null}

          {/* Footer — time + read receipt under MY last grouped bubble only */}
          {isMyMessage && isBottom ? (
            <View style={bubbleS.footer}>
              <Text style={[bubbleS.footerTime, { color: colors.textTertiary }]}>{formatMessageTime(message.created_at)}</Text>
              {isRead ? (
                <CheckCheck size={13} color={colors.brandVolt} strokeWidth={2} />
              ) : (
                <Check size={13} color={colors.textTertiary} strokeWidth={2} />
              )}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const bubbleS = StyleSheet.create({
  container: {},
  spacingBottom: { marginBottom: 10 },
  spacingTop: { marginBottom: 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
  },
  avatarSlot: {
    width: 32,
    marginRight: 8,
  },
    content: {
    maxWidth: '80%',
  },
  contentLeft: {
    alignItems: 'flex-start',
  },
  contentRight: {
    alignItems: 'flex-end',
  },
  textBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 2,
  },
  // Bubble treatment is "loud-them" — my own messages sit on the subtle
  // sheetBg surface so they recede; the other party's messages get the
  // brandVolt fill so what's *coming in* draws the eye. Inverts the
  // iMessage convention and keeps long self-monologues from glowing the
  // whole thread yellow.
  textBubbleMine: {
    borderWidth: 1,
  },
  textBubbleTheirs: {
    borderWidth: 1,
  },
  textContent: {
    fontFamily: TYPE.inter,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: 0.05,
  },
  textContentMine: {
  },
  textContentTheirs: {
  },
  imageBubble: {
    overflow: 'hidden',
    width: 220,
    height: 220,
    marginBottom: 2,
  },
  imageBubbleMine: {
  },
  imageBubbleTheirs: {
  },
  image: {
    width: '100%',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingRight: 2,
  },
  footerTime: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    letterSpacing: 0.5,
  },
});

// Composer placeholder — Stream's default is `t('Send a message')`, which
// reads as instructional. We want the lower-friction iMessage-style label
// so the composer feels like a tap-and-type field, not a form prompt.
// AutoCompleteInput spreads `additionalTextInputProps` AFTER its default
// `placeholder` prop, so this overrides cleanly without touching Stream's
// i18n instance. Module-level constant keeps the prop reference stable
// across renders so `<Channel>` doesn't see it as a changed prop.
const threadInputProps = { placeholder: 'Message...' };

// Stream theme — V3 chrome injected via ThemeProvider above the Channel.
//
// We override theme.colors at the palette level (white_snow, white, etc.)
// because MANY Stream components reach into colors directly rather than the
// per-component theme keys — e.g. MessageList's FlatList background inherits
// from `colors.white_snow`, and the default Card surface uses `colors.white`.
// Touching the per-component keys alone leaves white surfaces leaking through.
const threadTheme: DeepPartial<Theme> = {
  colors: {
    accent_blue: COLORS.brandVolt,
    accent_green: COLORS.semanticGreen,
    accent_red: COLORS.semanticRed,
    bg_gradient_end: COLORS.void,
    bg_gradient_start: COLORS.void,
    black: COLORS.textPrimary,
    border: COLORS.frostBorder,
    grey: COLORS.textTertiary,
    grey_dark: COLORS.textSecondary,
    grey_gainsboro: COLORS.sheetBg,
    grey_whisper: COLORS.sheetBg,
    icon_background: COLORS.sheetBg,
    white: COLORS.void,
    white_smoke: COLORS.sheetBg,
    white_snow: COLORS.void,
    text_high_emphasis: COLORS.textPrimary,
    text_low_emphasis: COLORS.textSecondary,
    overlay: 'rgba(0, 0, 0, 0.7)',
    transparent: 'transparent',
  },
  messageList: {
      container: {
      backgroundColor: COLORS.void,
    },
    contentContainer: {
      backgroundColor: COLORS.void,
    },
    typingIndicatorContainer: {
      backgroundColor: COLORS.void,
    },
  },
  messageSimple: {
    content: {
      container: { borderWidth: 0 },
      containerInner: { borderWidth: 0, borderRadius: 18 },
      senderMessageBackgroundColor: 'transparent',
      receiverMessageBackgroundColor: 'transparent',
      markdown: {
        text: {
          color: COLORS.textPrimary,
        },
      },
      metaText: {
        color: COLORS.textTertiary,
      },
    },
  },
  messageInput: {
    container: {
      backgroundColor: COLORS.void,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: COLORS.frostDivider,
      paddingTop: 10,
      paddingBottom: 12,
      paddingHorizontal: 12,
    },
    composerContainer: {
      alignItems: 'center',
    },
    inputBoxContainer: {
      backgroundColor: COLORS.sheetBg,
      borderColor: COLORS.frostBorder,
      borderRadius: 22,
      borderWidth: 1,
      paddingHorizontal: 14,
      minHeight: 44,
    },
    inputBox: {
      color: COLORS.textPrimary,
      fontFamily: TYPE.inter,
      fontSize: 15,
      lineHeight: 22,
      paddingTop: 10,
      paddingBottom: 10,
    },
    sendButtonContainer: {
      marginLeft: 0,
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
  },
  dateHeader: {
    container: {
      backgroundColor: 'transparent',
      paddingVertical: 8,
    },
    text: {
      fontFamily: TYPE.groteskBold,
      fontSize: 10,
      color: COLORS.textTertiary,
      letterSpacing: 1.5,
    },
  },
  inlineDateSeparator: {
    container: {
      backgroundColor: 'transparent',
      paddingVertical: 6,
    },
    text: {
      fontFamily: TYPE.groteskBold,
      fontSize: 10,
      color: COLORS.textTertiary,
      letterSpacing: 1.5,
    },
  },
  typingIndicator: {
    container: {
      backgroundColor: COLORS.void,
    },
    text: {
      fontFamily: TYPE.inter,
      fontSize: 12,
      color: COLORS.brandVolt,
      fontStyle: 'italic',
    },
  },
  imageGallery: {
    backgroundColor: COLORS.void,
    header: {
      container: { backgroundColor: COLORS.void },
      usernameText: { color: COLORS.textPrimary },
      dateText: { color: COLORS.textTertiary },
    },
    footer: {
      container: { backgroundColor: COLORS.void },
      imageCountText: { color: COLORS.textPrimary },
    },
  },
};

// ════════════════════════════════════════════════════════════════
// PER-MESSAGE AVATAR (small square frame, V3-flavored)
// ════════════════════════════════════════════════════════════════

function ThreadMessageAvatar(props: React.ComponentProps<typeof StreamMessageAvatar>) {
  // We deliberately ignore the StreamMessageAvatar render and roll our own —
  // Stream's avatar is circular and uses its own size/border tokens. We need
  // square frostBorder framing to match the inbox + thread header DNA.
  return <StreamMessageAvatar {...props} size={28} />;
}

// ════════════════════════════════════════════════════════════════
// THREAD HEADER
// ════════════════════════════════════════════════════════════════

interface ThreadHeaderProps {
  name?: string;
  handle?: string;
  avatarUrl?: string;
  isOnline?: boolean;
  onBack: () => void;
  onTapIdentity?: () => void;
  onMore?: () => void;
}

function ThreadHeader({
  name,
  handle,
  avatarUrl,
  isOnline,
  onBack,
  onTapIdentity,
  onMore,
}: ThreadHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={[headerS.bar, { borderBottomColor: colors.frostDivider, backgroundColor: colors.void }]}>
      <View style={headerS.leftSlot}>
        <IconButton icon={ArrowLeft} onPress={onBack} label="Back" />
      </View>

      <TouchableOpacity
        onPress={onTapIdentity}
        style={headerS.identity}
        activeOpacity={onTapIdentity ? 0.75 : 1}
        disabled={!onTapIdentity}
        accessibilityRole="button"
        accessibilityLabel={`Open ${name || 'user'} profile`}
      >
        <View style={[headerS.avatarFrame, { borderColor: colors.frostBorderStrong, backgroundColor: colors.void }]}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={headerS.avatar} contentFit="cover" />
          ) : (
            <View style={[headerS.avatar, headerS.avatarFallback, { backgroundColor: colors.sheetBg }]}>
              <Text style={[headerS.avatarInitial, { color: colors.textTertiary }]}>
                {(name || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isOnline ? <View style={[headerS.onlineDot, { backgroundColor: colors.semanticGreen, borderColor: colors.void }]} /> : null}
        </View>
        <View style={headerS.identityText}>
          <Text style={[headerS.name, { color: colors.textPrimary }]} numberOfLines={1}>
            {name || 'Loading…'}
          </Text>
          {handle ? (
            <Text style={[headerS.handle, { color: colors.textSecondary }]} numberOfLines={1}>
              {handle}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>

      <View style={headerS.rightSlot}>
        {onMore ? (
          <IconButton icon={MoreHorizontal} onPress={onMore} label="Conversation actions" />
        ) : (
          <View style={headerS.rightPlaceholder} />
        )}
      </View>
    </View>
  );
}

const headerS = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftSlot: {
    width: 44,
    alignItems: 'flex-start',
  },
  identity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    minWidth: 0,
  },
  avatarFrame: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    padding: 2,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 16,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: TYPE.groteskBold,
    fontSize: 16,
    letterSpacing: 0.1,
  },
  handle: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 11,
    letterSpacing: 0.1,
    marginTop: 1,
  },
  rightSlot: {
    width: 44,
    alignItems: 'flex-end',
  },
  rightPlaceholder: {
    width: 44,
    height: 44,
  },
});

// ════════════════════════════════════════════════════════════════
// INPUT BAR — SEND BUTTON
// ════════════════════════════════════════════════════════════════
//
// Stream's `InputButtons` slot is owned by `QuickAttachBar`, which
// collapses to a `>` chevron when the composer is engaged and re-expands
// when the keyboard hides. The send button is always visible (we don't
// have a like-action to swap with the way Messenger does).

function ThreadSendButton({ disabled }: { disabled: boolean }) {
  const { colors } = useTheme();
  const { sendMessage } = useMessageInputContext();

  const handlePress = () => {
    if (disabled) return;
    Haptics.selectionAsync();
    sendMessage();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled}
      style={inputS.sendBtn}
      accessibilityRole="button"
      accessibilityLabel="Send message"
      hitSlop={6}
    >
      <Send
        size={20}
        color={disabled ? colors.textTertiary : colors.brandVolt}
        strokeWidth={2}
      />
    </TouchableOpacity>
  );
}

const inputS = StyleSheet.create({
  sendBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ════════════════════════════════════════════════════════════════
// SUPPORTING SURFACES
// ════════════════════════════════════════════════════════════════

interface ThreadIntroCardProps {
  displayName: string;
  handleLabel: string;
  memberSinceLabel: string;
  avatarUrl?: string;
}

function ThreadIntroCard({
  displayName,
  handleLabel,
  memberSinceLabel,
  avatarUrl,
}: ThreadIntroCardProps) {
  const { colors } = useTheme();
  return (
    <View style={introS.wrap}>
      <View style={[introS.avatarFrame, { borderColor: colors.frostBorderStrong, backgroundColor: colors.void }]}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={introS.avatar} contentFit="cover" />
        ) : (
          <View style={[introS.avatar, introS.avatarFallback, { backgroundColor: colors.sheetBg }]}>
            <Text style={[introS.avatarInitial, { color: colors.textTertiary }]}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <Text style={[introS.name, { color: colors.textPrimary }]}>{displayName}</Text>
      <Text style={[introS.handle, { color: colors.textSecondary }]}>{handleLabel}</Text>
      <Text style={[introS.kicker, { color: colors.textTertiary }]}>{memberSinceLabel}</Text>
    </View>
  );
}

const introS = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 28,
    gap: 4,
  },
  avatarFrame: {
    width: 88,
    height: 88,
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
    marginBottom: 8,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 11,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 32,
  },
  name: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 26,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  handle: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 13,
    marginTop: 2,
  },
  kicker: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9,
    letterSpacing: 1.5,
    marginTop: 8,
  },
});

function ThreadEmptyState() {
  const { colors } = useTheme();
  return (
    <View style={emptyS.wrap}>
      <View style={[emptyS.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
        <Brackets />
        <Text style={[emptyS.title, { color: colors.textPrimary }]}>BEGIN CONVERSATION</Text>
        <Text style={[emptyS.subtitle, { color: colors.textSecondary }]}>Send a message to start things off.</Text>
      </View>
    </View>
  );
}

const emptyS = StyleSheet.create({
  wrap: {
    flex: 1,
    paddingHorizontal: GUTTER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    paddingVertical: 36,
    paddingHorizontal: 24,
    borderRadius: RADII.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 8,
    width: '100%',
    maxWidth: 320,
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

function ThreadLoadingState() {
  const { colors } = useTheme();
  return (
    <View style={loadingS.wrap}>
      <Text style={[loadingS.text, { color: colors.textSecondary }]}>LOADING CONVERSATION…</Text>
    </View>
  );
}

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

function ThreadErrorState({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View style={loadingS.wrap}>
      <Text style={[errorS.text, { color: colors.semanticRed }]}>{message}</Text>
    </View>
  );
}

const errorS = StyleSheet.create({
  text: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

function TypingBar() {
  const { colors } = useTheme();
  const typingString = useTypingString();
  if (!typingString) return null;
  return (
    <View style={typingS.wrap}>
      <Text style={[typingS.text, { color: colors.brandVolt }]}>{typingString.toLowerCase()}</Text>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// V3 DATE CHROME
// ════════════════════════════════════════════════════════════════
// Stream's default DateHeader / InlineDateSeparator render as a pill on
// `theme.colors.overlay` with `theme.colors.white` text. Even with theme
// overrides they read green-ish via legacy `colors.accent` carryover. We
// replace both with mono kicker labels on transparent surfaces so dates
// melt into the background like the rest of V3.

const MONTH_KICKERS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function formatKickerDate(date?: Date): string {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (same(d, now)) return 'TODAY';
  if (same(d, yesterday)) return 'YESTERDAY';
  const month = MONTH_KICKERS[d.getMonth()] ?? '';
  const day = d.getDate();
  const year = d.getFullYear();
  if (year === now.getFullYear()) return `${month} ${day}`;
  return `${month} ${day} · ${year}`;
}

function ThreadInlineDateSeparator({ date }: { date?: Date }) {
  const { colors } = useTheme();
  const label = formatKickerDate(date);
  if (!label) return null;
  return (
    <View style={dateS.wrap}>
      <View style={[dateS.rule, { backgroundColor: colors.frostDivider }]} />
      <Text style={[dateS.label, { color: colors.textTertiary }]}>{label}</Text>
      <View style={[dateS.rule, { backgroundColor: colors.frostDivider }]} />
    </View>
  );
}

function ThreadDateHeader({ dateString }: { dateString?: string | number }) {
  const { colors } = useTheme();
  let label = '';
  if (dateString != null) {
    const parsed = new Date(dateString);
    if (!Number.isNaN(parsed.getTime())) {
      label = formatKickerDate(parsed);
    } else {
      label = String(dateString).toUpperCase();
    }
  }
  if (!label) return null;
  return (
    <View style={dateS.headerWrap}>
      <Text style={[dateS.label, { color: colors.textTertiary }]}>{label}</Text>
    </View>
  );
}

const dateS = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  rule: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    maxWidth: 96,
  },
  headerWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});

const typingS = StyleSheet.create({
  wrap: {
    paddingHorizontal: GUTTER,
    paddingVertical: 4,
  },
  text: {
    fontFamily: TYPE.inter,
    fontStyle: 'italic',
    fontSize: 12,
    letterSpacing: 0.1,
  },
});

// ════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════

const NO_MESSAGE_ACTIONS = () => [] as any[];
function VitrineCardStub() { return null; }

export default function ConversationPage() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { client, isReady } = useStream();
  const insets = useSafeAreaInsets();

  // Stream's `KeyboardCompatibleView` measures its own frame relative to
  // its parent (so frame.y reads as 0 inside our channelContainer) but
  // compares against the keyboard's ABSOLUTE screenY. The
  // `keyboardVerticalOffset` bridges that mismatch and must equal the
  // total height of everything above the channel — top safe area inset
  // + the header. Hardcoded numbers don't survive devices with no notch
  // (~20pt status bar) vs Dynamic Island (~59pt), so we read the inset
  // dynamically.
  const keyboardOffset = insets.top + HEADER_HEIGHT;

  const [channel, setChannel] = useState<ChannelType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // ── Channel watch ────────────────────────────────────────────
  useEffect(() => {
    if (!isReady || !id) return;
    let cancelled = false;

    async function loadChannel() {
      try {
        const ch = client.channel('messaging', id);
        await ch.watch();
        if (!cancelled) setChannel(ch);
      } catch (err) {
        log.error('Failed to load channel:', (err as Error).message);
        if (!cancelled) setError('Could not load conversation');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadChannel();
    return () => { cancelled = true; };
  }, [isReady, client, id]);

  // ── Other-member presence ────────────────────────────────────
  const otherUser = useOtherMember(channel, client.userID);
  const [otherOnline, setOtherOnline] = useState<boolean | undefined>(otherUser?.online);

  useEffect(() => {
    if (!channel) return;
    setOtherOnline(otherUser?.online ?? undefined);
    const sub = channel.on('user.presence.changed', (event) => {
      if (event.user?.id && event.user.id !== client.userID) {
        setOtherOnline(event.user.online ?? false);
      }
    });
    return () => sub.unsubscribe();
  }, [channel, otherUser, client.userID]);

  const isMuted = channel ? channel.muteStatus().muted : false;

  // ── Action handlers ──────────────────────────────────────────
  const handleToggleMute = useCallback(async () => {
    if (!channel) return;
    try {
      if (isMuted) await channel.unmute();
      else await channel.mute();
    } catch (err) {
      log.error('Failed to toggle mute:', (err as Error).message);
    }
  }, [channel, isMuted]);

  const executeDelete = useCallback(async () => {
    if (!channel) return;
    try {
      await channel.delete();
      router.back();
    } catch (err) {
      log.error('Failed to delete conversation:', (err as Error).message);
    }
  }, [channel, router]);

  const displayName = otherUser?.name || otherUser?.id || 'Chat';
  const handleLabel = useMemo(() => resolveHandleLabel(otherUser), [otherUser]);
  const memberSinceLabel = useMemo(
    () => formatMemberSinceLabel((otherUser as any)?.created_at),
    [otherUser],
  );

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Conversation',
      `This will permanently delete your conversation with ${displayName}. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: executeDelete },
      ],
    );
  }, [displayName, executeDelete]);

  const handleTapIdentity = useCallback(() => {
    if (!otherUser?.id) return;
    router.push(`/profile/${otherUser.id}` as Href);
  }, [otherUser, router]);

  const conversationActions = useMemo(
    () => [
      {
        label: isMuted ? 'Unmute Conversation' : 'Mute Conversation',
        onPress: handleToggleMute,
      },
      {
        label: 'Delete Conversation',
        destructive: true,
        onPress: handleDelete,
      },
    ],
    [isMuted, handleToggleMute, handleDelete],
  );

  // ── Attach actions ───────────────────────────────────────────
  const channelId = channel?.id ?? null;

  const handlePickFromLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library to send images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    await uploadAssetToCurrentChannel(channel, asset);
  }, [channel]);

  const handleTakePhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    await uploadAssetToCurrentChannel(channel, asset);
  }, [channel]);

  // Each QuickAttachBar share action routes to its own dedicated picker.
  // The legacy `/messages/share-collection?tab=…` tabbed screen was split
  // because the two flows have diverged: collectible picker reuses
  // CollectionSurface (search/filter/sort + grid), showcase picker reuses
  // the lifted ShowcaseSurface (search + grid). Tap a card and it sends
  // immediately — no confirmation modal — then `router.back()`s to the
  // thread. See `app/messages/share-collectible.tsx` and
  // `app/messages/share-showcase.tsx` for the picker implementations.
  const handleShareCollectible = useCallback(() => {
    if (!channelId) return;
    router.push(
      `/messages/share-collectible?channelId=${encodeURIComponent(channelId)}` as Href,
    );
  }, [channelId, router]);

  const handleShareShowcase = useCallback(() => {
    if (!channelId) return;
    router.push(
      `/messages/share-showcase?channelId=${encodeURIComponent(channelId)}` as Href,
    );
  }, [channelId, router]);

  // Memoize the action bundle so the QuickAttachProvider's context value
  // is stable when the upstream handlers are stable. Each handler is
  // already useCallback'd against its own deps, so this only re-creates
  // when one of them genuinely changes.
  const quickAttachActions = useMemo<QuickAttachActions>(
    () => ({
      onTakePhoto: handleTakePhoto,
      onPickFromLibrary: handlePickFromLibrary,
      onShareCollectible: handleShareCollectible,
      onShareShowcase: handleShareShowcase,
    }),
    [handleTakePhoto, handlePickFromLibrary, handleShareCollectible, handleShareShowcase],
  );

  // ── Render ───────────────────────────────────────────────────
  // SafeAreaView edges include `bottom` so the composer doesn't sit on
  // top of the home indicator when the keyboard is down. When the
  // keyboard is up, it covers the bottom inset zone anyway, so the inset
  // and the keyboard never both occupy the same space.
  if (!isReady || loading) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.void }]} edges={['top', 'bottom']}>
        <ThreadHeader onBack={() => router.back()} />
        <ThreadLoadingState />
      </SafeAreaView>
    );
  }

  if (error || !channel) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.void }]} edges={['top', 'bottom']}>
        <ThreadHeader onBack={() => router.back()} />
        <ThreadErrorState message={error || 'Conversation not found'} />
      </SafeAreaView>
    );
  }

  const avatarUrl = otherUser?.image as string | undefined;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.void }]} edges={['top', 'bottom']}>
      <ThreadHeader
        name={displayName}
        handle={handleLabel}
        avatarUrl={avatarUrl}
        isOnline={otherOnline}
        onBack={() => router.back()}
        onTapIdentity={otherUser?.id ? handleTapIdentity : undefined}
        onMore={() => {
          Haptics.selectionAsync();
          setMenuVisible(true);
        }}
      />

      <View style={[styles.channelContainer, { backgroundColor: colors.void }]}>
        <ThemeProvider style={threadTheme}>
          <QuickAttachProvider actions={quickAttachActions}>
        <Channel
          channel={channel}
              keyboardVerticalOffset={keyboardOffset}
              messageActions={NO_MESSAGE_ACTIONS}
              disableTypingIndicator
              additionalTextInputProps={threadInputProps}
              MessageSimple={VitrineMessageBubble}
          Card={VitrineCardStub}
              InputButtons={QuickAttachBar}
          SendButton={ThreadSendButton}
          MessageAvatar={ThreadMessageAvatar}
          EmptyStateIndicator={ThreadEmptyState}
              DateHeader={ThreadDateHeader}
              InlineDateSeparator={ThreadInlineDateSeparator}
        >
          <View style={[styles.channelInner, { backgroundColor: colors.void }]}>
            <MessageList
              noGroupByUser={false}
                  additionalFlatListProps={{
                    style: [styles.messageListFlat, { backgroundColor: colors.void }],
                    contentContainerStyle: [styles.messageListContent, { backgroundColor: colors.void }],
                  }}
              FooterComponent={() => (
                <ThreadIntroCard
                  displayName={displayName}
                  handleLabel={handleLabel}
                  memberSinceLabel={memberSinceLabel}
                  avatarUrl={avatarUrl}
                />
              )}
            />
          </View>
          <TypingBar />
              <View style={[styles.inputWrap, { backgroundColor: colors.void }]}>
          <MessageInput />
              </View>
        </Channel>
          </QuickAttachProvider>
        </ThemeProvider>
      </View>

      <ActionSheet
        visible={menuVisible}
        title="Conversation"
        options={conversationActions}
        onClose={() => setMenuVisible(false)}
      />
    </SafeAreaView>
  );
}

// Helper: upload an asset directly to a channel (bypasses MessageInputContext
// since the attach picker lives outside the Channel provider tree).
async function uploadAssetToCurrentChannel(
  channel: ChannelType | null,
  asset: ImagePicker.ImagePickerAsset,
) {
  if (!channel) return;
  try {
    const fileName = asset.fileName || asset.uri.split('/').pop() || 'image.jpg';
    const contentType = asset.mimeType || 'image/jpeg';
    // Two-step send: upload to Stream's CDN, then post a message that
    // references the uploaded URL as an image attachment. We deliberately
    // bypass MessageInputContext here because the attach picker lives
    // outside the Channel provider tree (it's a top-level modal sibling).
    const response = await channel.sendImage(asset.uri, fileName, contentType);
    await channel.sendMessage({
      attachments: [
        {
          type: 'image',
          image_url: response.file,
          thumb_url: response.file,
          fallback: fileName,
        },
      ],
    });
  } catch (err) {
    log.error('Failed to send image:', (err as Error).message);
    Alert.alert('Send failed', 'Could not send the image. Please try again.');
  }
}

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  channelContainer: {
    flex: 1,
  },
  channelInner: {
    flex: 1,
  },
  messageListFlat: {
    flex: 1,
  },
  messageListContent: {
    flexGrow: 1,
  },
  inputWrap: {
  },
});
