import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/lib/colors';

interface ShowcaseChatCardProps {
  showcase: {
    id: string;
    title: string;
    cover_image_url: string | null;
    item_count?: number;
  };
  isOwnMessage?: boolean;
}

export function ShowcaseChatCard({ showcase, isOwnMessage }: ShowcaseChatCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/showcase/${showcase.id}` as never);
  };

  return (
    <TouchableOpacity
      style={[styles.container, isOwnMessage && styles.containerOwn]}
      onPress={handlePress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`View showcase: ${showcase.title}`}
    >
      {showcase.cover_image_url ? (
        <Image
          source={{ uri: showcase.cover_image_url }}
          style={styles.coverImage}
          accessibilityLabel={`${showcase.title} cover`}
        />
      ) : (
        <View style={[styles.coverImage, styles.coverPlaceholder]}>
          <Text style={styles.placeholderText}>Showcase</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{showcase.title}</Text>
        {showcase.item_count != null && (
          <Text style={styles.itemCount}>
            {showcase.item_count} {showcase.item_count === 1 ? 'item' : 'items'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 200,
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
  coverImage: {
    width: '100%',
    height: 100,
    backgroundColor: colors.muted,
  },
  coverPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
  info: {
    padding: 10,
    gap: 2,
  },
  title: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '600',
  },
  itemCount: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
});
