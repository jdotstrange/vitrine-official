import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Award, ChevronRight } from 'lucide-react-native';
import { colors } from '@/lib/colors';

export interface TradingCardFactsCardProps {
  category?: string;
  year?: number;
  cardNumber?: string;
  variant?: string;
  grade?: string;
  gradingCompany?: string;
  isRookie?: boolean;
  /** Total number of facts available (used to show count in the tile). */
  factsCount: number;
  onPress: () => void;
}

function buildSummary(props: TradingCardFactsCardProps): string {
  const parts: string[] = [];
  if (props.category) parts.push(props.category);
  if (props.year) parts.push(String(props.year));
  if (props.cardNumber) parts.push(`#${props.cardNumber}`);
  if (props.variant && props.variant.toLowerCase() !== 'base') {
    parts.push(props.variant);
  }
  if (props.grade) {
    const gc = props.gradingCompany;
    const displayGrade = gc && !props.grade.toLowerCase().startsWith(gc.toLowerCase())
      ? `${gc} ${props.grade}`
      : props.grade;
    parts.push(displayGrade);
  }
  return parts.join(' · ');
}

export function TradingCardFactsCard(props: TradingCardFactsCardProps) {
  const summary = buildSummary(props);

  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.7}
      onPress={props.onPress}
      accessibilityRole="button"
      accessibilityLabel="Open card facts"
    >
      <View style={styles.header}>
        <Text style={styles.headerLabel}>CARD FACTS</Text>
        {props.isRookie && (
          <View style={styles.rookieBadge}>
            <Award size={11} color={colors.primary} />
            <Text style={styles.rookieBadgeText}>ROOKIE</Text>
          </View>
        )}
      </View>

      <View style={styles.row}>
        <View style={styles.summary}>
          {summary ? (
            <Text style={styles.summaryText} numberOfLines={2}>
              {summary}
            </Text>
          ) : (
            <Text style={styles.summaryEmpty}>No card facts available</Text>
          )}
          <Text style={styles.factsCount}>
            {props.factsCount} {props.factsCount === 1 ? 'fact' : 'facts'} on file
          </Text>
        </View>
        <ChevronRight size={18} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.mutedForeground,
  },
  rookieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.primary + '12',
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  rookieBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summary: {
    flex: 1,
    gap: 4,
  },
  summaryText: {
    fontSize: 14,
    color: colors.foreground,
    fontWeight: '600',
    lineHeight: 20,
  },
  summaryEmpty: {
    fontSize: 13,
    color: colors.mutedForeground,
    fontStyle: 'italic',
  },
  factsCount: {
    fontSize: 11,
    color: colors.mutedForeground,
    letterSpacing: 0.5,
  },
});
