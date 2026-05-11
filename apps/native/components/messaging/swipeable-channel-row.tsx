import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BellOff, Bell, Eye, EyeOff, Trash2 } from 'lucide-react-native';

import { useTheme, TYPE } from '@/lib/design';

/**
 * SwipeableChannelRow — V3 inbox row chrome with bidirectional swipe.
 *
 * Gesture contract:
 *   - Swipe LEFT (right → left) reveals destructive action set on the right:
 *       [Mute / Unmute] [Delete]
 *   - Swipe RIGHT (left → right) reveals constructive action on the left:
 *       [Read / Unread]
 *   - Tap when revealed → snaps closed, no row press fires.
 *   - Tap when closed → fires onPress.
 *   - Spring snap based on velocity OR position threshold (50% of action set).
 *
 * Design contract:
 *   - Action surfaces live behind the foreground row, revealed by translation.
 *   - Mute / Unread buttons are sheet-filled with frost borders (constructive).
 *   - Delete button is sheet-filled with red glyph + label (destructive ink,
 *     no red surface — keeps the void/sheet/frost rhythm consistent and
 *     avoids the "alert banner" loudness of a full-red tile).
 *   - 80pt action width × 2 left actions = 160pt left reveal.
 *   - 80pt right action = 80pt right reveal.
 */

const ACTION_WIDTH = 80;
const LEFT_ACTIONS_TOTAL = ACTION_WIDTH * 2;
const RIGHT_ACTION_TOTAL = ACTION_WIDTH;
// iOS-standard sheet/swipe ease-out curve (the same `cubic-bezier(0.32, 0.72, 0, 1)`
// UIKit uses for sheet presentation). Crisp deceleration, zero bounce.
const SWIPE_EASING = Easing.bezier(0.32, 0.72, 0, 1);
const SNAP_TIMING = { duration: 220, easing: SWIPE_EASING } as const;
const CLOSE_TIMING = { duration: 200, easing: SWIPE_EASING } as const;

interface SwipeableChannelRowProps {
  children: ReactNode;
  hasUnread: boolean;
  isMuted: boolean;
  onPress: () => void;
  onDelete: () => void;
  onToggleMute: () => void;
  onToggleRead: () => void;
}

export function SwipeableChannelRow({
  children,
  hasUnread,
  isMuted,
  onPress,
  onDelete,
  onToggleMute,
  onToggleRead,
}: SwipeableChannelRowProps) {
  const { colors } = useTheme();
  // translateX is negative when swiped left (revealing mute/delete on the right),
  // positive when swiped right (revealing read on the left).
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  const reset = () => {
    translateX.value = withTiming(0, CLOSE_TIMING);
  };

  const fireDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    reset();
    onDelete();
  };

  const fireMute = () => {
    Haptics.selectionAsync();
    reset();
    onToggleMute();
  };

  const fireRead = () => {
    Haptics.selectionAsync();
    reset();
    onToggleRead();
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-8, 8])
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((e) => {
      const next = startX.value + e.translationX;
      // Clamp: cannot reveal more than the available action set on either side.
      translateX.value = Math.max(-LEFT_ACTIONS_TOTAL, Math.min(RIGHT_ACTION_TOTAL, next));
    })
    .onEnd((e) => {
      const v = e.velocityX;
      const x = translateX.value;

      // Velocity beats position. Negative velocity = leftward intent.
      if (v < -500) {
        translateX.value = withTiming(-LEFT_ACTIONS_TOTAL, SNAP_TIMING);
        return;
      }
      if (v > 500) {
        translateX.value = withTiming(RIGHT_ACTION_TOTAL, SNAP_TIMING);
        return;
      }

      // Position-based commit when velocity is sluggish.
      if (x < -LEFT_ACTIONS_TOTAL * 0.5) {
        translateX.value = withTiming(-LEFT_ACTIONS_TOTAL, SNAP_TIMING);
        return;
      }
      if (x > RIGHT_ACTION_TOTAL * 0.5) {
        translateX.value = withTiming(RIGHT_ACTION_TOTAL, SNAP_TIMING);
        return;
      }

      // Snap closed.
      translateX.value = withTiming(0, CLOSE_TIMING);
    });

  const tap = Gesture.Tap().onEnd((_e, success) => {
    if (!success) return;
    // If revealed in either direction, a tap closes instead of firing onPress.
    if (Math.abs(translateX.value) > 5) {
      translateX.value = withTiming(0, CLOSE_TIMING);
      return;
    }
    runOnJS(onPress)();
  });

  const composed = Gesture.Exclusive(pan, tap);

  const foregroundStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.void }]}>
      <View style={styles.rightActions}>
        <ActionTile
          onPress={fireMute}
          icon={
            isMuted ? (
              <Bell size={18} color={colors.textPrimary} strokeWidth={2} />
            ) : (
              <BellOff size={18} color={colors.textPrimary} strokeWidth={2} />
            )
          }
          label={isMuted ? 'UNMUTE' : 'MUTE'}
          surface="sheet"
        />
        <ActionTile
          onPress={fireDelete}
          icon={<Trash2 size={18} color={colors.semanticRed} strokeWidth={2} />}
          label="DELETE"
          labelColor={colors.semanticRed}
          surface="sheet"
        />
      </View>

      <View style={styles.leftActions}>
        <ActionTile
          onPress={fireRead}
          icon={
            hasUnread ? (
              <Eye size={18} color={colors.brandVolt} strokeWidth={2} />
            ) : (
              <EyeOff size={18} color={colors.brandVolt} strokeWidth={2} />
            )
          }
          label={hasUnread ? 'READ' : 'UNREAD'}
          labelColor={colors.brandVolt}
          surface="brandVolt"
        />
      </View>

      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.foreground, foregroundStyle, { backgroundColor: colors.void }]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

interface ActionTileProps {
  onPress: () => void;
  icon: ReactNode;
  label: string;
  labelColor?: string;
  surface: 'sheet' | 'brandVolt';
}

function ActionTile({ onPress, icon, label, labelColor, surface }: ActionTileProps) {
  const { colors } = useTheme();
  return (
    <Animated.View
      style={[
        styles.actionTile,
        surface === 'brandVolt'
          ? [styles.actionTileVolt, { backgroundColor: colors.brandVoltFill, borderRightColor: colors.brandVoltBorder }]
          : [styles.actionTileSheet, { backgroundColor: colors.sheetBg, borderLeftColor: colors.frostBorder }],
      ]}
    >
      <View style={styles.actionTileInner} onTouchEnd={onPress}>
        {icon}
        <Text style={[styles.actionLabel, { color: colors.textPrimary }, labelColor ? { color: labelColor } : null]}>
          {label}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    // CRITICAL: pin to row width so the foreground and its children
    // (the conversation card) get a definite horizontal layout anchor.
    // Without this, RN auto-sizes everything to natural-width and `flex: 1`
    // children inside the card layout themselves to content rather than to
    // the row — which causes inner text (timestamps, etc.) to spill into
    // the action-tile area when the foreground translates.
    width: '100%',
  },
  // Right-side actions are absolute-positioned to the right edge so they're
  // revealed when the foreground translates left.
  rightActions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  // Left-side action sits at the left edge, revealed when foreground moves right.
  leftActions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  actionTile: {
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTileSheet: {
    borderLeftWidth: 1,
  },
  actionTileVolt: {
    borderRightWidth: 1,
  },
  actionTileInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionLabel: {
    fontFamily: TYPE.groteskBold,
    fontSize: 9,
    letterSpacing: 1.35,
  },
  foreground: {
    width: '100%',
  },
});
