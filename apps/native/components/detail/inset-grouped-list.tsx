import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@/lib/colors';

export interface InsetGroupedRow {
  key: string;
  label: string;
  value?: React.ReactNode;
  onPress?: () => void;
  accent?: boolean;
  leftIcon?: React.ReactNode;
  /**
   * 'inline' (default) — label left, value right, single row.
   * 'stacked' — label on top, value renders below, full-width.
   *             Use for multi-line / tabular values like arrays-of-objects.
   */
  layout?: 'inline' | 'stacked';
}

export interface InsetGroupedListProps {
  header?: string;
  rows: InsetGroupedRow[];
  footer?: string;
  style?: StyleProp<ViewStyle>;
}

export function InsetGroupedList({ header, rows, footer, style }: InsetGroupedListProps) {
  if (rows.length === 0) return null;

  return (
    <View style={[styles.section, style]}>
      {header && <Text style={styles.sectionHeader}>{header}</Text>}
      <View style={styles.card}>
        {rows.map((row, i) => {
          const isLast = i === rows.length - 1;
          return (
            <RowContent
              key={row.key}
              row={row}
              showSeparator={!isLast}
            />
          );
        })}
      </View>
      {footer && <Text style={styles.sectionFooter}>{footer}</Text>}
    </View>
  );
}

interface RowContentProps {
  row: InsetGroupedRow;
  showSeparator: boolean;
}

function RowContent({ row, showSeparator }: RowContentProps) {
  const isInteractive = !!row.onPress;
  const isStacked = row.layout === 'stacked';

  const inner = isStacked ? (
    <View style={styles.rowStacked}>
      <Text style={[styles.label, row.accent && styles.labelAccent]}>{row.label}</Text>
      {row.value !== undefined && (
        <View style={styles.stackedValue}>
          {typeof row.value === 'string' || typeof row.value === 'number' ? (
            <Text style={[styles.valueStackedText, row.accent && styles.valueAccent]}>
              {row.value}
            </Text>
          ) : (
            row.value
          )}
        </View>
      )}
    </View>
  ) : (
    <View style={styles.rowInner}>
      {row.leftIcon && <View style={styles.leftIcon}>{row.leftIcon}</View>}
      <Text style={[styles.label, row.accent && styles.labelAccent]}>{row.label}</Text>
      <View style={styles.spacer} />
      {row.value !== undefined && (
        typeof row.value === 'string' || typeof row.value === 'number' ? (
          <Text style={[styles.value, row.accent && styles.valueAccent]}>
            {row.value}
          </Text>
        ) : (
          <View style={styles.valueSlot}>{row.value}</View>
        )
      )}
      {isInteractive && (
        <ChevronRight size={16} color={colors.mutedForeground} style={styles.chevron} />
      )}
    </View>
  );

  const handlePress = () => {
    Haptics.selectionAsync();
    row.onPress?.();
  };

  return (
    <>
      {isInteractive ? (
        <TouchableOpacity
          activeOpacity={0.55}
          onPress={handlePress}
          accessibilityRole="button"
          accessibilityLabel={row.label}
        >
          {inner}
        </TouchableOpacity>
      ) : (
        <View>{inner}</View>
      )}
      {showSeparator && <View style={styles.separator} />}
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: colors.mutedForeground,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionFooter: {
    fontSize: 12,
    color: colors.mutedForeground,
    paddingHorizontal: 20,
    marginTop: 6,
    lineHeight: 16,
  },
  card: {
    marginHorizontal: 4,
    borderRadius: 14,
    backgroundColor: colors.warmIvory,
    overflow: 'hidden',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  rowStacked: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  stackedValue: {
    gap: 4,
  },
  valueStackedText: {
    fontSize: 15,
    color: colors.mutedForeground,
    textAlign: 'left',
  },
  leftIcon: {
    width: 22,
    alignItems: 'center',
    paddingTop: 2,
  },
  label: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.foreground,
    paddingTop: 1,
  },
  labelAccent: {
    color: colors.accent,
  },
  spacer: {
    flex: 1,
  },
  value: {
    fontSize: 15,
    color: colors.mutedForeground,
    textAlign: 'right',
    flexShrink: 1,
  },
  valueAccent: {
    color: colors.accent,
    fontWeight: '500',
  },
  valueSlot: {
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  chevron: {
    marginLeft: 2,
    opacity: 0.6,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 16,
  },
});
