import { View, Text, StyleSheet } from 'react-native';
import Animated, { ZoomIn, ZoomOut } from 'react-native-reanimated';
import { colors } from '@/lib/colors';

interface BadgeDotProps {
  visible: boolean;
  /** Override background color. Defaults to colors.attention */
  color?: string;
}

/**
 * Simple animated dot badge — used for notification indicators.
 * Matches iOS convention: plain dot = "there are unseen items."
 */
export function BadgeDot({ visible, color }: BadgeDotProps) {
  if (!visible) return null;
  return (
    <Animated.View
      entering={ZoomIn.duration(200)}
      exiting={ZoomOut.duration(150)}
      style={[s.dot, color ? { backgroundColor: color } : undefined]}
    />
  );
}

interface CountBadgeProps {
  count: number;
  /** Cap display value. Defaults to 9 (shows "9+"). */
  max?: number;
  /** Override background color. Defaults to colors.attention */
  color?: string;
}

/**
 * Animated numbered pill badge — used for message unread counts.
 * Shows count up to `max`, then "N+" for higher values.
 * Renders nothing when count is 0.
 */
export function CountBadge({ count, max = 9, color }: CountBadgeProps) {
  if (count <= 0) return null;
  const label = count > max ? `${max}+` : String(count);
  const isWide = label.length > 1;

  return (
    <Animated.View
      entering={ZoomIn.duration(200)}
      exiting={ZoomOut.duration(150)}
      style={[
        s.pill,
        isWide && s.pillWide,
        color ? { backgroundColor: color } : undefined,
      ]}
    >
      <Text style={s.pillText}>{label}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  dot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.attention,
    borderWidth: 2,
    borderColor: colors.background,
  },
  pill: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.attention,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  pillWide: {
    paddingHorizontal: 4,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.background,
    lineHeight: 12,
  },
});
