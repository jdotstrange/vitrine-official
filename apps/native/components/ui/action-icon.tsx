import { TouchableOpacity, StyleSheet } from 'react-native';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/lib/design';

interface ActionIconProps {
  icon: LucideIcon;
  onPress?: () => void;
  label: string;
  size?: number;
  iconColor?: string;
  children?: ReactNode;
  disabled?: boolean;
  variant?: 'solid' | 'outline';
}

export function ActionIcon({
  icon: Icon,
  onPress,
  label,
  size = 18,
  iconColor,
  children,
  disabled = false,
  variant = 'solid',
}: ActionIconProps) {
  const { colors: themeColors } = useTheme();
  const resolvedIconColor = iconColor ?? themeColors.textPrimary;

  return (
    <TouchableOpacity
      style={[styles.container, variant === 'outline' && [styles.outline, { borderColor: themeColors.frostBorderStrong }]]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
    >
      <Icon size={size} color={resolvedIconColor} />
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  outline: {
    backgroundColor: 'transparent',
  },
});
