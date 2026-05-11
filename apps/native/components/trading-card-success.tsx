import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Check, Camera, ArrowRight } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { OptimizedImage } from './optimized-image';
import { formatPrice } from '@/lib/api/trading-cards';
import { TradingCardDetailsFormData } from './trading-card-details-form';

interface TradingCardSuccessProps {
  data: TradingCardDetailsFormData;
  collectibleId?: string;
  onViewCollection: () => void;
  onAddAnother: () => void;
}

export function TradingCardSuccess({
  data,
  collectibleId,
  onViewCollection,
  onAddAnother,
}: TradingCardSuccessProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.overlay} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with badge */}
        <Animated.View entering={FadeIn} style={styles.header}>
          <View style={styles.successBadge}>
            <Check size={20} color={colors.accent} />
            <Text style={styles.successBadgeText}>Added to Vitrine</Text>
          </View>
        </Animated.View>

        {/* Card preview - matching memorabilia success card */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.cardContainer}>
          <View style={styles.card}>
            {/* Image section */}
            <View style={styles.cardImageContainer}>
              {data.photos[0] ? (
                <OptimizedImage
                  source={{ uri: data.photos[0] }}
                  style={styles.cardImage}
                  contentFit="cover"
                />
              ) : data.card.imageUrl ? (
                <OptimizedImage
                  source={{ uri: data.card.imageUrl }}
                  style={styles.cardImage}
                  contentFit="cover"
                />
              ) : (
                <View style={styles.cardImagePlaceholder}>
                  <Camera size={48} color={colors.mutedForeground + '4D'} />
                </View>
              )}
            </View>

            {/* Info section */}
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {data.card.cardName}
              </Text>
              <Text style={styles.cardSubtitle}>
                {data.grade.grade} • {data.grade.gradingCompany || 'PSA'}
              </Text>
              <Text style={styles.cardValue}>
                {formatPrice(data.effectivePrice)}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Pricing Mode Info */}
        {data.pricingMode !== 'manual' && (
          <Animated.View entering={FadeIn.delay(300)} style={styles.pricingInfo}>
            <View style={styles.pricingInfoBadge}>
              <Text style={styles.pricingInfoText}>
                {data.pricingMode === 'dynamic' 
                  ? '📈 Dynamic pricing enabled'
                  : data.marginPercentage && data.marginPercentage >= 0
                    ? `📈 ${data.marginPercentage}% above market`
                    : `📉 ${Math.abs(data.marginPercentage || 0)}% below market`
                }
              </Text>
            </View>
          </Animated.View>
        )}

        {/* CTAs */}
        <Animated.View entering={FadeIn.delay(400)} style={styles.ctaContainer}>
          <Text style={styles.ctaText}>
            Your trading card has been added to your collection
          </Text>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={onViewCollection}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonPrimaryText}>View in My Collection</Text>
              <ArrowRight size={20} color={colors.background} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={onAddAnother}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonSecondaryText}>Add Another Card</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
    zIndex: 10,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.accent + '1A',
    borderWidth: 1,
    borderColor: colors.accent + '4D',
    position: 'relative',
  },
  successBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 260,
    marginVertical: 24,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cardImageContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    position: 'relative',
    backgroundColor: colors.card,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    padding: 16,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent,
    fontFamily: 'JetBrainsMono',
  },
  pricingInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pricingInfoBadge: {
    backgroundColor: colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pricingInfoText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  ctaContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 24,
    position: 'relative',
    zIndex: 10,
  },
  ctaText: {
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  buttonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  buttonSecondary: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
});
