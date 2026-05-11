import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { getOptimizedUrl, IMAGE_SIZES } from '@/lib/image-utils';
import { colors } from '@/lib/colors';
import { getStatusConfig } from '@/lib/status-utils';
import { getCompTierLabel, type CompTierLabel, type CompItem } from '@/lib/api/comps';

const IMAGE_ASPECT = 4 / 5;

export const DEFAULT_COMP_CARD_WIDTH = 200;

function formatPrice(value: number): string {
  if (!value || value <= 0) return '';
  return `$${Math.round(value).toLocaleString()}`;
}

function tierStyle(tier: CompTierLabel) {
  switch (tier) {
    case 'Strong match':
      return {
        color: colors.foreground,
        fontStyle: 'normal' as const,
        backgroundColor: 'rgba(0, 0, 0, 0.04)',
      };
    case 'Close match':
      return {
        color: colors.mutedForeground,
        fontStyle: 'normal' as const,
        backgroundColor: 'transparent',
      };
    case 'Similar range':
      return {
        color: colors.mutedForeground,
        fontStyle: 'italic' as const,
        backgroundColor: 'transparent',
      };
    default:
      return {
        color: colors.mutedForeground,
        fontStyle: 'italic' as const,
        backgroundColor: 'transparent',
      };
  }
}

export interface CompCardProps {
  item: CompItem;
  cardWidth?: number;
}

export function CompCard({ item, cardWidth = DEFAULT_COMP_CARD_WIDTH }: CompCardProps) {
  const router = useRouter();
  const statusConfig = getStatusConfig(item.status);
  const tier = getCompTierLabel(item);
  const tierStyles = tierStyle(tier);
  const uri = item.image ? getOptimizedUrl(item.image, IMAGE_SIZES.card) : '';

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      activeOpacity={0.85}
      onPress={() => router.push(`/collectible/${item.id}` as Href)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${tier}, ${statusConfig.label}`}
    >
      {uri ? (
        <Image
          source={{ uri }}
          recyclingKey={item.image}
          style={[styles.cardImage, { width: cardWidth }]}
          contentFit="cover"
          accessibilityLabel={item.title}
        />
      ) : (
        <View style={[styles.cardImage, styles.imagePlaceholder, { width: cardWidth }]} accessibilityLabel={item.title} />
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.value > 0 && (
          <Text style={styles.cardPrice}>{formatPrice(item.value)}</Text>
        )}
        <View style={styles.metaRow}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: statusConfig.bgColor,
                borderColor: statusConfig.borderColor,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: statusConfig.textColor }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.tierWrap,
            tier === 'Strong match' && { backgroundColor: tierStyles.backgroundColor },
            tier === 'Similar' || tier === 'Similar range' ? styles.tierWrapPlain : null,
          ]}
        >
          <Text
            style={[
              styles.tierText,
              { color: tierStyles.color, fontStyle: tierStyles.fontStyle },
            ]}
            numberOfLines={1}
          >
            {tier.toUpperCase()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardImage: {
    aspectRatio: IMAGE_ASPECT,
    backgroundColor: colors.muted,
  },
  cardInfo: {
    padding: 10,
    gap: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
    minHeight: 34,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
    fontFamily: 'JetBrainsMono',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  tierWrap: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tierWrapPlain: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  imagePlaceholder: {
    aspectRatio: IMAGE_ASPECT,
    backgroundColor: colors.muted,
  },
  tierText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
});
