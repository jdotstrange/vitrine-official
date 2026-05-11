import React from 'react';
import { View, Text, ScrollView, Modal, StyleSheet, Pressable } from 'react-native';
import { X, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionIcon } from '../ui/action-icon';
import { colors } from '@/lib/colors';

export interface TradingCardFactsSheetProps {
  visible: boolean;
  onClose: () => void;

  // Identity
  category?: string;
  playerName?: string;
  year?: number;
  setName?: string;
  cardNumber?: string;
  variant?: string;
  isRookie?: boolean;

  // Grading
  grade?: string;
  gradingCompany?: string;
  certificateNumber?: string;

  // Market activity (from Card Hedge)
  sales7day?: number | null;
  sales30day?: number | null;
  gain7day?: number | null;
  gain30day?: number | null;
  apiPriceUpdatedAt?: string | null;

  // Source
  cardHedgeId?: string;
}

interface Row {
  label: string;
  value: React.ReactNode;
}

interface Section {
  title: string;
  rows: Row[];
}

function formatRelativeTime(iso?: string | null): string | null {
  if (!iso) return null;
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const delta = now - then;
  const mins = Math.floor(delta / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function TrendValue({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <Text style={sheetStyles.fieldValue}>—</Text>;
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  const color =
    rounded > 0 ? colors.primary : rounded < 0 ? colors.destructive : colors.mutedForeground;
  const Icon = rounded > 0 ? TrendingUp : rounded < 0 ? TrendingDown : Minus;
  return (
    <View style={sheetStyles.trendWrapper}>
      <Icon size={14} color={color} />
      <Text style={[sheetStyles.fieldValue, { color }]}>
        {sign}
        {rounded}%
      </Text>
    </View>
  );
}

function buildSections(props: TradingCardFactsSheetProps): Section[] {
  const identity: Row[] = [];
  if (props.category) identity.push({ label: 'Category', value: props.category });
  if (props.playerName) identity.push({ label: 'Player', value: props.playerName });
  if (props.year) identity.push({ label: 'Year', value: String(props.year) });
  if (props.setName) identity.push({ label: 'Set', value: props.setName });
  if (props.cardNumber) identity.push({ label: 'Card #', value: `#${props.cardNumber}` });
  if (props.variant && props.variant.toLowerCase() !== 'base') {
    identity.push({ label: 'Variant', value: props.variant });
  }
  if (props.isRookie) identity.push({ label: 'Rookie Card', value: 'Yes' });

  const grading: Row[] = [];
  if (props.gradingCompany) grading.push({ label: 'Grading Company', value: props.gradingCompany });
  if (props.grade) {
    const gc = props.gradingCompany;
    const display = gc && !props.grade.toLowerCase().startsWith(gc.toLowerCase())
      ? `${gc} ${props.grade}`
      : props.grade;
    grading.push({ label: 'Grade', value: display });
  }
  if (props.certificateNumber) {
    grading.push({ label: 'Certificate #', value: props.certificateNumber });
  }

  const market: Row[] = [];
  const hasMarketNumbers =
    props.sales7day != null || props.sales30day != null ||
    props.gain7day != null || props.gain30day != null;
  if (hasMarketNumbers) {
    if (props.sales7day != null) {
      market.push({ label: 'Sales (last 7 days)', value: String(props.sales7day) });
    }
    if (props.sales30day != null) {
      market.push({ label: 'Sales (last 30 days)', value: String(props.sales30day) });
    }
    if (props.gain7day != null) {
      market.push({ label: 'Price gain (7d)', value: <TrendValue value={props.gain7day} /> });
    }
    if (props.gain30day != null) {
      market.push({ label: 'Price gain (30d)', value: <TrendValue value={props.gain30day} /> });
    }
  }
  const updated = formatRelativeTime(props.apiPriceUpdatedAt);
  if (updated) market.push({ label: 'Market data updated', value: updated });

  const source: Row[] = [];
  if (props.cardHedgeId) source.push({ label: 'Card Hedge ID', value: props.cardHedgeId });

  const sections: Section[] = [];
  if (identity.length) sections.push({ title: 'Card Identity', rows: identity });
  if (grading.length) sections.push({ title: 'Grading & Authentication', rows: grading });
  if (market.length) sections.push({ title: 'Market Activity', rows: market });
  if (source.length) sections.push({ title: 'Reference', rows: source });
  return sections;
}

export function TradingCardFactsSheet(props: TradingCardFactsSheetProps) {
  const insets = useSafeAreaInsets();
  const sections = buildSections(props);
  const totalFacts = sections.reduce((sum, s) => sum + s.rows.length, 0);

  return (
    <Modal
      visible={props.visible}
      animationType="slide"
      transparent
      onRequestClose={props.onClose}
      accessibilityViewIsModal
    >
      <View style={sheetStyles.modalContainer}>
        <Pressable style={StyleSheet.absoluteFill} onPress={props.onClose} />
        <View style={[sheetStyles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={sheetStyles.handleContainer}>
            <View style={sheetStyles.handle} />
          </View>

          <View style={sheetStyles.header}>
            <View style={sheetStyles.headerLeft}>
              <Text style={sheetStyles.headerTitle}>Card Facts</Text>
              {props.isRookie && (
                <View style={sheetStyles.rookieBadge}>
                  <Award size={11} color={colors.primary} />
                  <Text style={sheetStyles.rookieBadgeText}>ROOKIE</Text>
                </View>
              )}
            </View>
            <ActionIcon icon={X} onPress={props.onClose} label="Close" size={18} />
          </View>

          <View style={sheetStyles.summaryRow}>
            <Text style={sheetStyles.summaryCount}>{totalFacts}</Text>
            <Text style={sheetStyles.summaryLabel}>
              {totalFacts === 0 ? 'No card facts available' : 'facts on record'}
            </Text>
          </View>

          <ScrollView
            style={sheetStyles.scrollArea}
            contentContainerStyle={sheetStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {sections.map((section) => (
              <View key={section.title} style={sheetStyles.sectionCard}>
                <Text style={sheetStyles.sectionTitle}>{section.title.toUpperCase()}</Text>
                <View style={sheetStyles.fieldList}>
                  {section.rows.map((row, idx) => (
                    <View
                      key={`${section.title}-${row.label}`}
                      style={[
                        sheetStyles.fieldRow,
                        idx < section.rows.length - 1 && sheetStyles.fieldRowBorder,
                      ]}
                    >
                      <Text style={sheetStyles.fieldLabel}>{row.label.toUpperCase()}</Text>
                      {typeof row.value === 'string' ? (
                        <Text style={sheetStyles.fieldValue}>{row.value}</Text>
                      ) : (
                        row.value
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '90%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.mutedForeground + '4D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '80',
  },
  summaryCount: {
    fontSize: 28,
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
    color: colors.primary,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 16,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 2,
    color: colors.mutedForeground,
    marginBottom: 14,
    fontWeight: '600',
  },
  fieldList: {
    gap: 0,
  },
  fieldRow: {
    paddingVertical: 10,
    gap: 4,
  },
  fieldRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  fieldLabel: {
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.mutedForeground,
  },
  fieldValue: {
    fontSize: 15,
    color: colors.foreground,
    fontWeight: '500',
    lineHeight: 22,
  },
  trendWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
