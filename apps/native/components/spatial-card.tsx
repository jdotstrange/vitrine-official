import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Target } from 'lucide-react-native';
import { OptimizedImage } from './optimized-image';
import { AdaptiveImage } from './adaptive-image';
import { type ListingStatus, getStatusConfig } from '@/lib/status-utils';
import { formatTimeAgo } from '@/lib/format-time';
import { formatCount } from '@/lib/format-count';
import { colors } from '@/lib/colors';
import { useRouter, type Href } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface SpatialCardProps {
  id?: string;
  image: string;
  title: string;
  listedAt: Date | string | number;
  price: string;
  change?: string;
  collector: string;
  collectorAvatar?: string;
  status: ListingStatus;
  tracks: number;
  index: number;
  onPress?: () => void;
  isOwned?: boolean;
  isTracked?: boolean;
  onTrackToggle?: (collectibleId: string) => void;
  onEdit?: () => void;
  listingType: string;
  badgeClass: string;
}

export function SpatialCard({
  id,
  image,
  title,
  listedAt,
  price,
  collector,
  collectorAvatar,
  status,
  tracks: initialTracks,
  onPress,
  isOwned = false,
  isTracked = false,
  onTrackToggle,
  onEdit,
  listingType,
}: SpatialCardProps) {
  const router = useRouter();
  const trackCount = initialTracks;

  const statusConfig = getStatusConfig(status);

  const handleTrackClick = () => {
    if (onTrackToggle && id) {
      onTrackToggle(id);
    }
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (id) {
      router.push(`/collectible/${id}` as Href);
    }
  };

  return (
    <Pressable
      style={styles.container}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${price}`}
    >
      <View style={styles.card}>

        {/* Image section */}
        <View style={styles.imageContainer}>
          <AdaptiveImage
            uri={image || '/placeholder.svg'}
            targetAspectRatio={4 / 5}
            style={styles.image}
          />

          {!isOwned && (
            <Pressable
              onPress={handleTrackClick}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel={isTracked ? 'Untrack item' : 'Track item'}
            >
              <Target
                size={20}
                color={isTracked ? colors.primary : colors.foreground}
                fill={isTracked ? colors.primary : 'none'}
              />
            </Pressable>
          )}
        </View>

        {/* Info section */}
        <View style={styles.info}>
          <View style={styles.infoHeader}>
            <View style={styles.infoLeft}>
              <Text style={styles.title}>{title}</Text>
              {!isOwned && <Text style={styles.time}>{formatTimeAgo(listedAt)}</Text>}
            </View>
            <View style={styles.infoRight}>
              <Text style={styles.price}>{price}</Text>
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: statusConfig.bgColor || colors.primary + '33',
                    borderColor: statusConfig.borderColor || colors.primary + '4D',
                  },
                ]}
              >
                <Text style={[styles.badgeText, { color: statusConfig.textColor || colors.primary }]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>
          </View>

          {/* Collector (hidden when owned) + tracking count */}
          <View style={styles.collectorSection}>
            {!isOwned && (
              <View style={styles.collectorLeft}>
                {collectorAvatar ? (
                  <View style={styles.avatarContainer}>
                    <OptimizedImage
                      source={{ uri: collectorAvatar }}
                      style={styles.avatar}
                      contentFit="cover"
                      accessibilityLabel={`${collector} avatar`}
                    />
                  </View>
                ) : (
                  <View style={[styles.avatarContainer, styles.avatarGradient]} />
                )}
                <Text style={styles.collectorName}>{collector}</Text>
              </View>
            )}
            <View style={[styles.trackingInfo, isOwned && styles.trackingInfoOwned]}>
              <Target size={14} color={colors.mutedForeground} />
              <Text style={styles.trackingText}>
                {formatCount(trackCount)} tracking
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  imageContainer: {
    aspectRatio: 4 / 5,
    backgroundColor: colors.secondary,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '600',
  },
  actionButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  info: {
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLeft: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 4,
  },
  time: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  infoRight: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 16,
    fontFamily: 'JetBrainsMono',
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 2,
  },
  collectorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  collectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarGradient: {
    backgroundColor: colors.primary,
  },
  collectorName: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  trackingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackingInfoOwned: {
    marginLeft: 'auto',
  },
  trackingText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
});
