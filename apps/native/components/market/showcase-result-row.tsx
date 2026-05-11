/**
 * ShowcaseResultRow — search result row for a showcase.
 *
 * Layout:
 *   [3-thumb stack]  Showcase Title           N items match
 *                    Owner Name • 47 total items
 */
import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import type { ShowcaseSearchResult } from '@/lib/api/market';
import { useTheme, RADII, TYPE } from '@/lib/design';

interface ShowcaseResultRowProps {
  result: ShowcaseSearchResult;
}

export function ShowcaseResultRow({ result }: ShowcaseResultRowProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    router.push(`/showcase/${result.showcaseId}`);
  };

  const thumbs = result.previewThumbs.slice(0, 3);
  const showMatchCount = result.matchCount > 0;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.row, { borderBottomColor: colors.frostDivider }, pressed && styles.rowPressed]}
    >
      <ThumbStack thumbs={thumbs} />

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>{result.title}</Text>
          {showMatchCount ? (
            <Text style={[styles.matchCount, { color: colors.brandVolt }]}>{result.matchCount} match</Text>
          ) : null}
        </View>
        <Text style={[styles.meta, { color: colors.textTertiary }]} numberOfLines={1}>
          {result.owner.displayName}
          {result.itemCount > 0 ? ` • ${result.itemCount} items` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

function ThumbStack({ thumbs }: { thumbs: string[] }) {
  const { colors } = useTheme();

  if (thumbs.length === 0) {
    return <View style={[styles.thumbPlaceholder, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]} />;
  }

  return (
    <View style={styles.thumbStack}>
      {thumbs.slice(0, 3).map((url, idx) => (
        <View
          key={`${url}-${idx}`}
          style={[
            styles.thumbFrame,
            { backgroundColor: colors.sheetBg, borderColor: colors.void },
            idx === 0 && styles.thumbFrame0,
            idx === 1 && styles.thumbFrame1,
            idx === 2 && styles.thumbFrame2,
          ]}
        >
          <Image
            source={{ uri: url }}
            style={styles.thumb}
            resizeMode="cover"
          />
        </View>
      ))}
    </View>
  );
}

const STACK_SIZE = 52;
const THUMB_SIZE = 40;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowPressed: {
    opacity: 0.75,
  },
  thumbStack: {
    width: STACK_SIZE,
    height: STACK_SIZE,
    position: 'relative',
  },
  thumbPlaceholder: {
    width: STACK_SIZE,
    height: STACK_SIZE,
    borderRadius: RADII.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumbFrame: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: RADII.small,
    overflow: 'hidden',
    borderWidth: 1,
  },
  thumbFrame0: { top: 0, left: 0, zIndex: 3 },
  thumbFrame1: { top: 6, left: 6, zIndex: 2 },
  thumbFrame2: { top: 12, left: 12, zIndex: 1 },
  thumb: {
    width: '100%',
    height: '100%',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: TYPE.interSemiBold,
    fontSize: 14,
  },
  matchCount: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
    paddingTop: 2,
  },
  meta: {
    fontFamily: TYPE.inter,
    fontSize: 12,
  },
});
