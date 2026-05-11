import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/lib/colors';
import { getStatusConfig } from '@/lib/status-utils';

interface CollectibleChatCardProps {
  collectible: {
    id: string;
    title: string;
    primary_photo_url: string | null;
    value: number | null;
    status?: string;
  };
  isOwnMessage?: boolean;
}

export function CollectibleChatCard({ collectible, isOwnMessage }: CollectibleChatCardProps) {
  const router = useRouter();
  const statusConfig = collectible.status ? getStatusConfig(collectible.status) : null;

  const handlePress = () => {
    router.push(`/collectible/${collectible.id}` as never);
  };

  return (
    <TouchableOpacity
      style={[styles.container, isOwnMessage && styles.containerOwn]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`View ${collectible.title}`}
    >
      {collectible.primary_photo_url ? (
        <Image
          source={{ uri: collectible.primary_photo_url }}
          style={styles.image}
          accessibilityLabel={collectible.title}
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Text style={styles.placeholderText}>No Photo</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{collectible.title}</Text>
        <View style={styles.meta}>
          {collectible.value != null ? (
            <Text style={styles.value}>${collectible.value.toLocaleString()}</Text>
          ) : (
            <Text style={styles.noValue}>--</Text>
          )}
          {statusConfig && (
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '22' }]}>
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          )}
        </View>
      </View>
      {/* Marketplace socket: footer area reserved for future Buy/Offer/Trade CTAs */}
      <View style={styles.actionSocket} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  containerOwn: {
    borderColor: colors.primaryGlow,
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: colors.muted,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
  info: {
    padding: 10,
    gap: 6,
  },
  title: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: {
    color: colors.foreground,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'JetBrainsMono',
  },
  noValue: {
    color: colors.mutedForeground,
    fontSize: 15,
    fontFamily: 'JetBrainsMono',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  actionSocket: {
    height: 0,
  },
});
