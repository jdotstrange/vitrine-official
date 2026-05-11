/**
 * ListCard — horizontal card shell. The list-oriented analog of GridCard.
 *
 * Where GridCard stacks photo-over-meta for a grid cell, ListCard places a
 * fixed-size thumbnail on the leading edge and lets `children` flow meta
 * content into the trailing column. Used for dense vertical scrolls where
 * density-per-row matters more than image scale.
 *
 * Contract mirrors GridCard intentionally — same overlay slot, same press
 * behavior, same haptic on press — so any meta composition that runs on
 * one shell can slot into the other by swapping the wrapper.
 *
 * Example:
 *   <ListCard
 *     photoUrl={item.photoUrl}
 *     overlay={<StatusDot status={item.status} variant="overlay" />}
 *     onPress={() => router.push(...)}
 *   >
 *     <CollectibleListMeta {...item} />
 *   </ListCard>
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { useTheme, RADII, TYPE } from '@/lib/design';

type Props = {
  photoUrl?: string | null;
  placeholder?: React.ReactNode;
  overlay?: React.ReactNode;
  onPress?: () => void;
  thumbSize?: number;
  accessibilityLabel?: string;
  /**
   * Multi-select selection chrome. When true, the thumbnail gets a
   * brandVolt border ring to indicate selection. Mirrors the pattern in
   * GridCard so meta layout stays untouched in either mode.
   */
  selected?: boolean;
  children?: React.ReactNode;
};

export function ListCard({
  photoUrl,
  placeholder,
  overlay,
  onPress,
  thumbSize = 72,
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
      style={styles.wrap}
      onPress={handlePress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
    >
      <View
        style={[
          styles.photo,
          { width: thumbSize, height: thumbSize },
          selected && { borderWidth: 2, borderColor: colors.brandVolt },
        ]}
      >
        {photoUrl ? (
          <Image
            source={{ uri: photoUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={150}
          />
        ) : (
          (placeholder ?? <DefaultPlaceholder />)
        )}

        {overlay ? <View style={styles.overlay}>{overlay}</View> : null}
      </View>

      <View style={styles.meta}>{children}</View>
    </Pressable>
  );
}

function DefaultPlaceholder() {
  const { colors } = useTheme();
  return <Text style={[styles.placeholderMark, { color: colors.textTertiary }]}>—</Text>;
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  photo: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADII.small,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  placeholderMark: {
    fontFamily: TYPE.mono,
    fontSize: 20,
  },
  meta: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
});
