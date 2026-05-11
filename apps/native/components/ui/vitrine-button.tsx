import { TouchableOpacity, Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

export interface VitrineButtonProps {
  variant?: 'confirmation' | 'step' | 'ghost';
  showArrow?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function VitrineButton({
  variant = 'confirmation',
  showArrow = false,
  fullWidth = true,
  disabled = false,
  children,
  onPress,
  style,
}: VitrineButtonProps) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: disabled ? 1 : withSpring(1, { damping: 15 }) }],
    };
  });

  if (variant === 'ghost') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[fullWidth && styles.fullWidth, style]}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.ghostText,
            disabled && styles.ghostTextDisabled,
          ]}
        >
          {children}
        </Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'step' && !disabled) {
    return (
      <AnimatedTouchable
        onPress={onPress}
        disabled={disabled}
        style={[fullWidth && styles.fullWidth, style, animatedStyle]}
        activeOpacity={0.8}
      >
        <View style={styles.stepButton}>
          <View style={styles.stepInner}>
            <Text style={styles.stepText}>{children}</Text>
            {showArrow && <ChevronRight size={16} color={colors.foreground} />}
          </View>
        </View>
      </AnimatedTouchable>
    );
  }

  // Confirmation variant (or step when disabled)
  return (
    <AnimatedTouchable
      onPress={onPress}
      disabled={disabled}
      style={[fullWidth && styles.fullWidth, style, animatedStyle]}
      activeOpacity={0.8}
    >
      {disabled ? (
        <View style={styles.confirmationDisabled}>
          <Text style={styles.confirmationTextDisabled}>{children}</Text>
          {showArrow && variant === 'step' && <ChevronRight size={16} color={colors.mutedForeground} />}
        </View>
      ) : (
        <View style={styles.confirmationButton}>
          <Text style={styles.confirmationText}>{children}</Text>
        </View>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  stepButton: {
    borderRadius: 999,
    padding: 2,
    backgroundColor: colors.primary,
  },
  stepInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: colors.background,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.foreground,
  },
  confirmationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmationText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.primaryForeground,
  },
  confirmationDisabled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 999,
    backgroundColor: colors.muted,
  },
  confirmationTextDisabled: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.mutedForeground,
  },
  ghostText: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.mutedForeground,
    textDecorationLine: 'underline',
    textDecorationColor: colors.mutedForeground + '80',
    paddingVertical: 8,
    textAlign: 'center',
  },
  ghostTextDisabled: {
    color: colors.mutedForeground + '50',
    textDecorationColor: colors.mutedForeground + '30',
  },
});
