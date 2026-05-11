import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';
import { Button } from './button';

/**
 * EmptyState — the "nothing here (yet)" surface.
 *
 * Centered vertical stack: icon medallion → title → subtitle → optional CTA.
 * Used inside empty tabs, search with no results, freshly-created accounts,
 * etc. The icon sits inside a frost-bordered circular medallion — the same
 * "void well" shape we use for avatar fallbacks — so empty states feel
 * visually consistent with the rest of the DNA rather than like error art.
 *
 * Keep copy short: one-line title, one-to-two-line subtitle. Anything
 * longer belongs in an educational sheet.
 */

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
}

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      {Icon && (
        <View style={[styles.medallion, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
          <Icon size={24} color={colors.textSecondary} strokeWidth={1.5} />
        </View>
      )}
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
      {action ? (
        <View style={styles.actionWrap}>
          <Button label={action.label} onPress={action.onPress} variant="frost" size="sm" />
        </View>
      ) : null}
    </View>
  );
}

const MEDALLION_SIZE = 56;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.zoneTransition,
    paddingHorizontal: SPACING.gutter,
  },
  medallion: {
    width: MEDALLION_SIZE,
    height: MEDALLION_SIZE,
    borderRadius: MEDALLION_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.zoneIntra,
  },
  title: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 0.1,
  },
  subtitle: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 280,
  },
  actionWrap: {
    marginTop: SPACING.zoneIntra,
    borderRadius: RADII.pill,
  },
});
