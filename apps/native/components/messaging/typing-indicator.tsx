import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/lib/colors';

interface TypingIndicatorProps {
  userNames?: string[];
}

function AnimatedDot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-4, { duration: 300, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 300, easing: Easing.in(Easing.ease) })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export function TypingIndicator({ userNames }: TypingIndicatorProps) {
  const label = userNames?.length
    ? userNames.length === 1
      ? `${userNames[0]} is typing`
      : `${userNames.slice(0, 2).join(', ')} ${userNames.length > 2 ? `and ${userNames.length - 2} more ` : ''}are typing`
    : 'Someone is typing';

  return (
    <View
      style={styles.container}
      accessibilityLabel={label}
      accessibilityRole="text"
    >
      <View style={styles.bubble}>
        <AnimatedDot delay={0} />
        <AnimatedDot delay={150} />
        <AnimatedDot delay={300} />
      </View>
      {userNames && userNames.length > 0 && (
        <Text style={styles.label} numberOfLines={1}>
          {userNames.length === 1
            ? `${userNames[0]} is typing...`
            : `${userNames.join(', ')} are typing...`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  bubble: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mutedForeground,
  },
  label: {
    color: colors.mutedForeground,
    fontSize: 12,
    flex: 1,
  },
});
