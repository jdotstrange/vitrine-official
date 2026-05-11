import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowUpRight, Repeat2, MessageCircle } from 'lucide-react-native';
import { type ListingStatus, type StatusConfig } from '@/lib/status-utils';
import { colors } from '@/lib/colors';

export interface ActionRailProps {
  status: ListingStatus;
  statusConfig: StatusConfig;
  price: string;
  bottomInset: number;
}

export function ActionRail({ status, statusConfig, price, bottomInset }: ActionRailProps) {
  const renderCTAButtons = () => {
    switch (status) {
      case 'SELL_TRADE':
        return (
          <>
            <TouchableOpacity style={styles.ctaTextButton} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Initiate trade">
              <Text style={styles.ctaText}>Initiate Trade</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: statusConfig.bgColor, borderColor: statusConfig.borderColor }]}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Buy now for ${price}`}
            >
              <ArrowUpRight size={16} color={statusConfig.textColor} />
              <Text style={[styles.ctaButtonText, { color: statusConfig.textColor }]}>
                Buy Now · {price}
              </Text>
            </TouchableOpacity>
          </>
        );
      case 'FOR_SALE':
        return (
          <>
            <TouchableOpacity style={styles.ctaTextButton} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Message seller">
              <Text style={styles.ctaText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: statusConfig.bgColor, borderColor: statusConfig.borderColor }]}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Buy now for ${price}`}
            >
              <ArrowUpRight size={16} color={statusConfig.textColor} />
              <Text style={[styles.ctaButtonText, { color: statusConfig.textColor }]}>
                Buy Now · {price}
              </Text>
            </TouchableOpacity>
          </>
        );
      case 'FOR_TRADE':
        return (
          <>
            <TouchableOpacity style={styles.ctaTextButton} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Message trader">
              <Text style={styles.ctaText}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: statusConfig.bgColor, borderColor: statusConfig.borderColor }]}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Initiate trade"
            >
              <Repeat2 size={16} color={statusConfig.textColor} />
              <Text style={[styles.ctaButtonText, { color: statusConfig.textColor }]}>Initiate Trade</Text>
            </TouchableOpacity>
          </>
        );
      case 'NFST':
        return (
          <TouchableOpacity
            style={[styles.ctaButton, styles.ctaButtonFull, { backgroundColor: statusConfig.bgColor, borderColor: statusConfig.borderColor }]}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Message collector"
          >
            <MessageCircle size={16} color={statusConfig.textColor} />
            <Text style={[styles.ctaButtonText, { color: statusConfig.textColor }]}>Message Collector</Text>
          </TouchableOpacity>
        );
    }
  };

  return (
    <View style={[styles.stickyActionRail, { paddingBottom: Math.max(bottomInset, 12) }]}>
      {renderCTAButtons()}
    </View>
  );
}

const styles = StyleSheet.create({
  stickyActionRail: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(10, 10, 16, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ctaTextButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.mutedForeground,
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(153, 153, 170, 0.5)',
  },
  ctaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  ctaButtonFull: {
    flex: 1,
  },
  ctaButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
