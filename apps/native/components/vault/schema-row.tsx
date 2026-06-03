/**
 * SchemaRow — key/value ledger row for structured schema data.
 *
 * Used inside frame-less data groups (collectible details, authenticity
 * details, any key:value readout). Hairline divider renders at the bottom
 * unless the row is the last in its group — caller passes `isLast` for
 * the terminal row so the list renders as: row / hairline / row /
 * hairline / row with no trailing rule.
 *
 * Typography is dual-mode: `mono={false}` (default) renders a humanized
 * text value in Inter; `mono={true}` switches to JetBrains Mono for
 * machine-readable data (IDs, serials, codes, ratios). The sandbox's
 * `shouldMono()` heuristic picks the mode automatically; callers that
 * build rows manually pass `mono` explicitly.
 *
 * Interaction states (all optional):
 *   - `onPress`          makes the row tappable (no visual change on its
 *                        own — parents opt in to interactive visuals).
 *   - `queued`           draws the volt selection chrome (same border/fill
 *                        system used by filter chips and status toggles)
 *                        and flips the pencil glyph to brand volt. Signals
 *                        "this row is flagged for edit."
 *   - `edited`           runs a one-shot volt fill pulse that fades back
 *                        to the base surface. Call site bumps a nonce to
 *                        retrigger (see `editedNonce`). Used after a
 *                        rapid-fire edit to point the user at what
 *                        changed without persistent chrome noise.
 *
 * Usage:
 *   <SchemaRow label="Year" value="2020" />
 *   <SchemaRow label="Serial" value="BQ15604" mono />
 *   <SchemaRow label="Grade" value="PSA 10" mono isLast />
 *   <SchemaRow label="Year" value="2020" onPress={queue} queued />
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Pencil } from 'lucide-react-native';

import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';

type Props = {
  label: string;
  value: string;
  mono?: boolean;
  isLast?: boolean;
  onPress?: () => void;
  queued?: boolean;
  edited?: boolean;
  /**
   * Bump this to retrigger the edit pulse. Same-value → no pulse. Used so
   * the parent can say "pulse this row again" after an edit without needing
   * to tear the row down and remount it.
   */
  editedNonce?: number;
  /** Persistent post-catalog correction badge (owners + viewers). */
  userEdited?: boolean;
};

export function SchemaRow({
  label,
  value,
  mono = false,
  isLast = false,
  onPress,
  queued = false,
  edited = false,
  editedNonce = 0,
  userEdited = false,
}: Props) {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!edited) return;
    pulse.setValue(1);
    Animated.timing(pulse, {
      toValue: 0,
      duration: 900,
      useNativeDriver: true,
    }).start();
  }, [edited, editedNonce, pulse]);

  const content = (
    <View style={styles.inner}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.valueWrap}>
        <Text
          style={[
            styles.value,
            { color: colors.textPrimary },
            mono && styles.valueMono,
            queued && { color: colors.textPrimary },
            userEdited && styles.valueWithBadge,
          ]}
          numberOfLines={2}
        >
          {value}
        </Text>
        {userEdited ? (
          <View style={[styles.editedChip, { borderColor: colors.frostBorder, backgroundColor: colors.pressOverlay }]}>
            <Text style={[styles.editedChipText, { color: colors.textSecondary }]}>Edited</Text>
          </View>
        ) : null}
      </View>
      {onPress ? (
        <Pencil
          size={12}
          color={queued ? colors.brandVolt : colors.textTertiary}
          strokeWidth={2}
          style={styles.pencil}
        />
      ) : null}
    </View>
  );

  const interactive = !!onPress;

  const rowStyle: StyleProp<ViewStyle> = [
    styles.row,
    interactive && styles.rowInteractive,
    !isLast && !queued && [styles.divider, { borderBottomColor: colors.frostDivider }],
    queued && [styles.rowQueued, { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill }],
  ];

  const pulseOverlay = (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.pulseOverlay,
        {
          backgroundColor: colors.brandVoltFill,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.65] }),
        },
      ]}
    />
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value}`}
        accessibilityState={{ selected: queued }}
        accessibilityHint={queued ? 'Unflag for edit' : 'Flag for edit'}
        style={({ pressed }) => [rowStyle, pressed && styles.rowPressed]}
      >
        {pulseOverlay}
        {content}
      </Pressable>
    );
  }

  return (
    <View style={rowStyle}>
      {pulseOverlay}
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: SPACING.rowPadX,
    paddingVertical: SPACING.rowPadY,
  },
  rowInteractive: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: RADII.small,
    overflow: 'hidden',
  },
  rowPressed: {
    opacity: 0.72,
  },
  rowQueued: {
    borderWidth: 1,
    borderRadius: RADII.small,
    overflow: 'hidden',
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  label: {
    fontFamily: TYPE.interMedium,
    fontSize: 13,
    flexShrink: 0,
    maxWidth: '45%',
  },
  valueWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 6,
  },
  value: {
    fontFamily: TYPE.inter,
    fontSize: 15,
    textAlign: 'right',
    lineHeight: 21,
    flexShrink: 1,
  },
  valueWithBadge: {
    maxWidth: '72%',
  },
  editedChip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADII.small,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  editedChipText: {
    fontFamily: TYPE.interMedium,
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  valueMono: {
    fontFamily: TYPE.mono,
    fontSize: 14,
    letterSpacing: 0.2,
  },
  pencil: {
    marginTop: 4,
    marginLeft: 2,
  },
  pulseOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
