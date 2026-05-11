import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TrendingUp, TrendingDown, Minus, Settings2, ChevronRight } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import {
  formatPrice,
  type PricingMode,
} from '@/lib/api/trading-cards';

export interface TradingCardPricingCardProps {
  pricingMode: PricingMode;
  effectivePrice: number;
  apiPrice?: number | null;
  apiPriceAvailable?: boolean;
  marginPercentage?: number | null;
  manualPrice?: number | null;
  apiPriceUpdatedAt?: string;
  isOwner: boolean;
  onEditPricing?: () => void;
}

function modeTitle(mode: PricingMode): string {
  switch (mode) {
    case 'dynamic':
      return 'Market price';
    case 'dynamic_margin':
      return 'Market price + margin';
    case 'manual':
      return 'Custom price';
  }
}

function modeSubtitle(mode: PricingMode): string {
  switch (mode) {
    case 'dynamic':
      return 'Tracks the market value for this card automatically.';
    case 'dynamic_margin':
      return 'Tracks the market, with your margin applied.';
    case 'manual':
      return 'You set this price manually.';
  }
}

function formatMargin(margin: number): string {
  const sign = margin > 0 ? '+' : '';
  return `${sign}${margin}%`;
}

export function TradingCardPricingCard({
  pricingMode,
  effectivePrice,
  apiPrice,
  apiPriceAvailable,
  marginPercentage,
  manualPrice,
  isOwner,
  onEditPricing,
}: TradingCardPricingCardProps) {
  const marginValue = marginPercentage ?? 0;
  const hasMarket = apiPriceAvailable !== false && apiPrice != null && apiPrice > 0;

  let marginRow: React.ReactNode = null;
  if (pricingMode === 'dynamic_margin' && marginValue !== 0) {
    const Icon = marginValue > 0 ? TrendingUp : marginValue < 0 ? TrendingDown : Minus;
    const tone = marginValue > 0 ? colors.statusSale : colors.destructive;
    marginRow = (
      <View style={styles.breakdownRow}>
        <View style={styles.breakdownLabelRow}>
          <Icon size={12} color={tone} />
          <Text style={styles.breakdownLabel}>Your margin</Text>
        </View>
        <Text style={[styles.breakdownValue, { color: tone }]}>
          {formatMargin(marginValue)}
        </Text>
      </View>
    );
  }

  let baseRow: React.ReactNode = null;
  if ((pricingMode === 'dynamic' || pricingMode === 'dynamic_margin') && hasMarket) {
    baseRow = (
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownLabel}>Market reference</Text>
        <Text style={styles.breakdownValue}>{formatPrice(apiPrice)}</Text>
      </View>
    );
  }

  let manualRow: React.ReactNode = null;
  if (pricingMode === 'manual' && manualPrice != null) {
    manualRow = (
      <View style={styles.breakdownRow}>
        <Text style={styles.breakdownLabel}>Your price</Text>
        <Text style={styles.breakdownValue}>{formatPrice(manualPrice)}</Text>
      </View>
    );
  }

  const showBreakdown = baseRow || marginRow || manualRow;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLabel}>PRICING</Text>
          <View style={styles.modeBadge}>
            <Text style={styles.modeBadgeText}>{modeTitle(pricingMode)}</Text>
          </View>
        </View>
        {isOwner && onEditPricing && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={onEditPricing}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Edit pricing"
          >
            <Settings2 size={14} color={colors.foreground} />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.price}>{formatPrice(effectivePrice)}</Text>
      <Text style={styles.subtitle}>{modeSubtitle(pricingMode)}</Text>

      {!hasMarket && pricingMode !== 'manual' && (
        <View style={styles.warning}>
          <Text style={styles.warningText}>
            No market price is available for this grade right now. Effective price will update
            once pricing comes back online.
          </Text>
        </View>
      )}

      {showBreakdown && (
        <View style={styles.breakdown}>
          {baseRow}
          {marginRow}
          {manualRow}
        </View>
      )}

      {isOwner && onEditPricing && (
        <TouchableOpacity
          style={styles.fullWidthCta}
          onPress={onEditPricing}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Change pricing mode"
        >
          <Text style={styles.fullWidthCtaText}>Change pricing mode</Text>
          <ChevronRight size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
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
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.mutedForeground,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: colors.primary + '12',
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  modeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.foreground,
  },
  price: {
    fontSize: 28,
    fontFamily: 'JetBrainsMono',
    fontWeight: 'bold',
    color: colors.foreground,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  warning: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.warning + '15',
    borderWidth: 1,
    borderColor: colors.warning + '33',
  },
  warningText: {
    fontSize: 12,
    color: colors.warning,
    lineHeight: 16,
  },
  breakdown: {
    marginTop: 12,
    gap: 6,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  breakdownLabel: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
    fontFamily: 'JetBrainsMono',
  },
  fullWidthCta: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fullWidthCtaText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
  },
});
