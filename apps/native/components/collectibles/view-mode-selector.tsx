import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { LayoutGrid, List, Square, type LucideIcon } from 'lucide-react-native';

import { useTheme, RADII } from '@/lib/design';

export type CollectionViewMode = 'spatial' | 'grid' | 'list';

export interface ViewModeSelectorProps {
  value: CollectionViewMode;
  onChange: (value: CollectionViewMode) => void;
  style?: ViewStyle;
}

const VIEW_MODES: Array<{
  value: CollectionViewMode;
  label: string;
  icon: LucideIcon;
}> = [
  { value: 'spatial', label: 'Spatial view', icon: Square },
  { value: 'grid', label: 'Grid view', icon: LayoutGrid },
  { value: 'list', label: 'List view', icon: List },
];

export function ViewModeSelector({ value, onChange, style }: ViewModeSelectorProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityLabel="Collection view mode"
      style={[styles.container, { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg }, style]}
    >
      {VIEW_MODES.map((mode) => {
        const active = mode.value === value;
        const Icon = mode.icon;

        return (
          <Pressable
            key={mode.value}
            onPress={() => onChange(mode.value)}
            accessibilityRole="button"
            accessibilityLabel={mode.label}
            accessibilityState={{ selected: active }}
            hitSlop={6}
            style={({ pressed }) => [
              styles.button,
              active && [styles.buttonActive, { backgroundColor: colors.frostDivider }],
              pressed && !active && [styles.buttonPressed, { backgroundColor: colors.pressOverlay }],
            ]}
          >
            <Icon size={16} color={active ? colors.textPrimary : colors.textSecondary} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    borderRadius: RADII.small,
    borderWidth: 1,
  },
  button: {
    width: 36,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  buttonActive: {},
  buttonPressed: {},
});
