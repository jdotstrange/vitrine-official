import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import Animated, { FadeIn } from 'react-native-reanimated';
import { type CategoryItem } from './type-card';

interface SubcategoryRowProps {
  category: CategoryItem;
  index: number;
  onSelect: () => void;
}

export function SubcategoryRow({ category, index, onSelect }: SubcategoryRowProps) {
  return (
    <Animated.View entering={FadeIn.delay(index * 30)}>
      <TouchableOpacity
        style={styles.row}
        onPress={onSelect}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${category.name} subcategory`}
      >
        <Text style={styles.name}>{category.name}</Text>
        <ChevronRight size={18} color={colors.mutedForeground} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
  },
});
