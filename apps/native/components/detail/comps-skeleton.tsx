import { View, StyleSheet } from 'react-native';
import { Skeleton } from '@/components/skeleton';
import { colors } from '@/lib/colors';
import { DEFAULT_COMP_CARD_WIDTH } from '@/components/detail/comp-card';

const CARD_WIDTH = DEFAULT_COMP_CARD_WIDTH;
const IMAGE_ASPECT = 4 / 5;

function CompCardSkeleton() {
  return (
    <View style={[styles.card, { width: CARD_WIDTH }]}>
      <Skeleton
        width={CARD_WIDTH}
        height={CARD_WIDTH * IMAGE_ASPECT}
        borderRadius={0}
        style={styles.skelImage}
      />
      <View style={styles.skelInfo}>
        <Skeleton width={CARD_WIDTH - 24} height={12} borderRadius={6} />
        <Skeleton width={80} height={14} borderRadius={6} />
        <Skeleton width={64} height={20} borderRadius={8} />
      </View>
    </View>
  );
}

export function CompsSkeleton() {
  return (
    <View style={styles.row}>
      <CompCardSkeleton />
      <CompCardSkeleton />
      <CompCardSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  skelImage: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  skelInfo: {
    padding: 10,
    gap: 8,
  },
});
