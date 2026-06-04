import { StyleSheet, View } from 'react-native';

import { DEFAULT_COMP_CARD_WIDTH } from '@/components/detail/comp-card';
import { SkeletonGroup, SkeletonRect } from '@/components/vault';
import { useTheme } from '@/lib/design';

const CARD_WIDTH = DEFAULT_COMP_CARD_WIDTH;
const IMAGE_ASPECT = 4 / 5;

function CompCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { width: CARD_WIDTH, backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
      <SkeletonRect width={CARD_WIDTH} height={CARD_WIDTH * IMAGE_ASPECT} radius={0} />
      <View style={styles.skelInfo}>
        <SkeletonRect width={CARD_WIDTH - 24} height={12} radius={6} />
        <SkeletonRect width={80} height={14} radius={6} />
        <SkeletonRect width={64} height={20} radius={8} />
      </View>
    </View>
  );
}

export function CompsSkeleton() {
  return (
    <SkeletonGroup>
      <View style={styles.row}>
        <CompCardSkeleton />
        <CompCardSkeleton />
        <CompCardSkeleton />
      </View>
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  skelInfo: {
    padding: 10,
    gap: 8,
  },
});
