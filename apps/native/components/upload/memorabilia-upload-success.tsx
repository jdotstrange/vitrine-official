import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, Camera, ArrowRight } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { getStatusConfig, type ListingStatus } from '@/lib/status-utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OptimizedImage } from '../optimized-image';
import { KeyDetailsModal } from '../key-details-modal';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useState } from 'react';

interface MemorabiliaUploadSuccessProps {
  coverImageUri: string | null;
  title: string;
  type: string;
  category: string;
  value: string;
  status: ListingStatus;
  collectibleId: string | null;
  onViewCollection: () => void;
  onKeyDetailsSuccess: () => void;
}

function formatLabel(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function MemorabiliaUploadSuccess({
  coverImageUri,
  title,
  type,
  category,
  value,
  status,
  collectibleId,
  onViewCollection,
  onKeyDetailsSuccess,
}: MemorabiliaUploadSuccessProps) {
  const insets = useSafeAreaInsets();
  const [showKeyDetailsModal, setShowKeyDetailsModal] = useState(false);
  const statusConfig = getStatusConfig(status);

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.overlay} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn} style={styles.header}>
            <View style={styles.badge}>
              <Check size={20} color={colors.primary} />
              <Text style={styles.badgeText}>Added to Vitrine</Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(200)} style={styles.cardContainer}>
            <View style={styles.card}>
              <View style={styles.cardImageContainer}>
                {coverImageUri ? (
                  <OptimizedImage
                    source={{ uri: coverImageUri }}
                    style={styles.cardImage}
                    contentFit="cover"
                    accessibilityLabel="Uploaded collectible"
                  />
                ) : (
                  <View style={styles.cardImagePlaceholder}>
                    <Camera size={48} color={colors.mutedForeground + '4D'} />
                  </View>
                )}
              </View>

              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {title || 'Untitled'}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {formatLabel(type || '')} / {formatLabel(category || '')}
                </Text>
                <View style={[
                  styles.statusPill,
                  { backgroundColor: statusConfig.bgColor, borderColor: statusConfig.borderColor },
                ]}>
                  <Text style={[styles.statusPillText, { color: statusConfig.textColor }]}>
                    {statusConfig.label}
                  </Text>
                </View>
                <Text style={styles.cardValue}>
                  {value ? `$${Number(value).toLocaleString()}` : '--'}
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(400)} style={styles.ctas}>
            <Text style={styles.ctaText}>
              Add specs, provenance, and grading details to help your item stand out
            </Text>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => setShowKeyDetailsModal(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Add details and specs"
              >
                <Text style={styles.primaryButtonText}>Make It Stand Out</Text>
                <ArrowRight size={20} color={colors.background} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onViewCollection}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="View in my collection"
              >
                <Text style={styles.secondaryButtonText}>View in My Collection</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </View>

      <KeyDetailsModal
        isOpen={showKeyDetailsModal}
        onClose={() => setShowKeyDetailsModal(false)}
        type={type || ''}
        category={category || ''}
        collectibleId={collectibleId || undefined}
        onSuccess={onKeyDetailsSuccess}
      />
    </>
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.primary + '1A',
    borderWidth: 1,
    borderColor: colors.primary + '4D',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
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
    marginBottom: 10,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 10,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary,
    fontFamily: 'JetBrainsMono',
  },
  ctas: {
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
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
});
