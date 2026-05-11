/**
 * GridCard — generic grid-cell shell.
 *
 * The "shared shell" half of our card architecture. GridCard owns the
 * things every grid cell shares: the photo well, optional top-right
 * overlay slot, the press behavior, the selection haptic, and the meta
 * slot below the photo. Card-specific content (title, price, match %,
 * etc.) lives in the `children` slot and is contributed by the composing
 * variant (e.g. <CompCard />).
 *
 * This is a deliberate split from a "variants" pattern: a single
 * <Card variant="comp" /> would force every card type's props into one
 * union, which gets messy fast. Composition lets each variant own its
 * own meta component with its own typed props, while sharing the shell.
 *
 * Example variants (current and planned):
 *   <GridCard ...><CompMeta ... /></GridCard>                   — comps
 *   <GridCard ...><ShowcaseMeta ... /></GridCard>               — showcase grids
 *   <GridCard ...><SearchResultMeta ... /></GridCard>           — search grids
 *
 * Usage:
 *   <GridCard
 *     photoUrl={comp.photoUrl}
 *     overlay={<StatusDot status={comp.status} variant="overlay" />}
 *     onPress={() => router.push(...)}
 *     accessibilityLabel={`${comp.title}, ${comp.subtitle}`}
 *     width={cardWidth}
 *   >
 *     <CompMeta {...comp} />
 *   </GridCard>
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useTheme, RADII, TYPE } from '@/lib/design';
import { AdaptiveImage } from '@/components/adaptive-image';

type Props = {
  photoUrl?: string | null;
  placeholder?: React.ReactNode;
  overlay?: React.ReactNode;
  onPress?: () => void;
  width?: number;
  aspectRatio?: number;
  accessibilityLabel?: string;
  /**
   * Multi-select selection chrome. When true, the photo well gets a
   * brandVolt border ring to indicate selection. Used by surfaces in
   * selection mode (e.g. Create Showcase / CURATED lens). The wrap
   * itself isn't bordered — the photo well carries the chrome so meta
   * spacing stays untouched.
   */
  selected?: boolean;
  children?: React.ReactNode;
};

export function GridCard({
  photoUrl,
  placeholder,
  overlay,
  onPress,
  width,
  aspectRatio = 1,
  accessibilityLabel,
  selected = false,
  children,
}: Props) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (!onPress) return;
    Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      style={[styles.wrap, width != null ? { width } : null]}
      onPress={handlePress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
    >
      <View
        style={[
          styles.photo,
          { aspectRatio },
          selected && [styles.photoSelected, { borderColor: colors.brandVolt }],
        ]}
      >
        {photoUrl ? (
          <AdaptiveImage
            uri={photoUrl}
            targetAspectRatio={aspectRatio}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          (placeholder ?? <DefaultPlaceholder />)
        )}

        {overlay ? <View style={styles.overlay}>{overlay}</View> : null}
      </View>

      {children ? <View style={styles.meta}>{children}</View> : null}
    </Pressable>
  );
}

function DefaultPlaceholder() {
  const { colors } = useTheme();
  return (
    <Text style={[styles.placeholderMark, { color: colors.textTertiary }]}>—</Text>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  photo: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',    // color.bg.photoPlaceholder
    borderRadius: RADII.small,                       // radius.card.photo
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoSelected: {
    borderWidth: 2,
  },
  overlay: {
    position: 'absolute',
    top: 8,                                          // spacing.overlay.inset
    right: 8,
  },
  placeholderMark: {
    fontFamily: TYPE.mono,
    fontSize: 24,
  },
  meta: {
    marginTop: 10,                                   // spacing.card.photo-to-meta
  },
});
