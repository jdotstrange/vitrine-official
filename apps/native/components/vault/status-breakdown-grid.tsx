import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme, STATUS_CONFIG, TYPE, type ListingStatus } from '@/lib/design';

export type StatusBreakdownEntry = {
  key: string;
  count: number;
  pct: number;
};

export interface StatusBreakdownGridProps {
  entries: StatusBreakdownEntry[];
  style?: ViewStyle | ViewStyle[];
}

const SUMMARY_COPY: Record<ListingStatus, { title: string; subtitle: string }> = {
  NFST: { title: 'NFS', subtitle: 'NOT FOR SALE' },
  FOR_SALE: { title: 'FOR SALE', subtitle: 'LIQUIDATING' },
  FOR_TRADE: { title: 'FOR TRADE', subtitle: 'OPEN TO OFFERS' },
  SELL_TRADE: { title: 'BUY + TRADE', subtitle: 'ACQUIRING' },
};

const PROGRESS_LEVELS = 6;

function resolveSummary(rawKey: string, textSecondary: string) {
  const key = rawKey as ListingStatus;
  const copy = SUMMARY_COPY[key] ?? SUMMARY_COPY.NFST;
  const chrome = STATUS_CONFIG[key] ?? STATUS_CONFIG.NFST;
  return {
    ...copy,
    bg: chrome.fill,
    border: chrome.border,
    text: key === 'NFST' ? textSecondary : chrome.text,
    fill: chrome.dot,
  };
}

/**
 * 2-up wrapping grid of status summary cards (NFST / For Sale / For Trade /
 * Sell + Trade). Each card shows its share of the collection as a percentage
 * plus a 6-segment progress bar.
 *
 * Pure presentational — caller computes the entries (status key + count + pct).
 * Uses semantic colors from STATUS_CONFIG so any future status added to the
 * config lights up here automatically (only the local SUMMARY_COPY needs new
 * narrative text).
 */
export function StatusBreakdownGrid({ entries, style }: StatusBreakdownGridProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.grid, style]}>
      {entries.map((entry) => {
        const summary = resolveSummary(entry.key, colors.textSecondary);
        const level = Math.min(PROGRESS_LEVELS, Math.round((entry.pct / 100) * PROGRESS_LEVELS));
        return (
          <View
            key={entry.key}
            style={[styles.card, { backgroundColor: summary.bg, borderColor: summary.border }]}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.title, { color: summary.text }]}>{summary.title}</Text>
              <Text style={[styles.value, { color: summary.text }]}>{entry.pct}%</Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{summary.subtitle}</Text>
            <Text style={[styles.count, { color: colors.textSecondary }]}>{entry.count.toLocaleString()} ITEMS</Text>
            <View style={styles.progressRow}>
              {Array.from({ length: PROGRESS_LEVELS }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressSegment,
                    { backgroundColor: i < level ? summary.fill : colors.frostDivider },
                  ]}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    flexBasis: '48%',
    flexGrow: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.35,
  },
  value: {
    fontFamily: TYPE.monoMedium,
    fontSize: 14,
  },
  subtitle: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 9,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  count: {
    fontFamily: TYPE.monoMedium,
    fontSize: 9,
    marginTop: 8,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 6,
    width: 48,
  },
  progressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 1,
  },
});
