import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Layers, Grid3X3, List } from 'lucide-react-native';
import { colors } from '@/lib/colors';

export type ViewMode = 'spatial' | 'grid' | 'list';

interface CollectibleViewSelectorProps {
  viewMode: ViewMode;
  onChange: (mode: ViewMode) => void;
  allowedModes?: ViewMode[];
}

export function CollectibleViewSelector({
  viewMode,
  onChange,
  allowedModes,
}: CollectibleViewSelectorProps) {
  const views: { mode: ViewMode; icon: typeof Layers }[] = [
    { mode: 'spatial', icon: Layers },
    { mode: 'grid', icon: Grid3X3 },
    { mode: 'list', icon: List },
  ];
  const visibleViews = allowedModes
    ? views.filter((view) => allowedModes.includes(view.mode))
    : views;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.innerContainer}>
        {visibleViews.map(({ mode, icon: Icon }) => (
          <TouchableOpacity
            key={mode}
            onPress={() => onChange(mode)}
            style={[
              styles.button,
              viewMode === mode && styles.buttonActive,
            ]}
            activeOpacity={0.7}
          >
            <Icon
              size={16}
              color={viewMode === mode ? colors.background : colors.mutedForeground}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
  },
  innerContainer: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
  },
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: colors.primary,
  },
});
