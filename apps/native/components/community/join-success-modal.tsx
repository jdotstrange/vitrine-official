import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Users } from 'lucide-react-native';
import { OptimizedImage } from '@/components/optimized-image';
import { colors } from '@/lib/colors';
import { getCategoryAccent } from '@/lib/category-identity';
import type { Group } from '@/lib/api/messaging';

interface JoinSuccessModalProps {
  visible: boolean;
  group: Group | null;
  onGoToGroup: (groupId: string) => void;
  onDismiss: () => void;
}

export function JoinSuccessModal({ visible, group, onGoToGroup, onDismiss }: JoinSuccessModalProps) {
  if (!group) return null;

  const { accent } = getCategoryAccent(group.category_type);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        />
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.card}>
          {/* Cover image */}
          <View style={styles.coverWrap}>
            {group.category_type && (
              <View style={[styles.accentStrip, { backgroundColor: accent }]} />
            )}
            <OptimizedImage
              src={group.cover_image_url || '/placeholder.svg'}
              style={styles.cover}
              width={320}
              height={120}
              accessibilityLabel={`${group.name} cover`}
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.headline}>You're in!</Text>
            <Text style={styles.groupName} numberOfLines={1}>{group.name}</Text>

            <View style={styles.stats}>
              <Users size={14} color={colors.mutedForeground} />
              <Text style={styles.statCount}>{group.member_count.toLocaleString()}</Text>
              <Text style={styles.statLabel}>members</Text>
              {group.online_count > 0 && (
                <>
                  <View style={styles.onlineDot} />
                  <Text style={styles.statCount}>{group.online_count}</Text>
                  <Text style={styles.statLabel}>online</Text>
                </>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => onGoToGroup(group.id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Go to ${group.name}`}
              >
                <Text style={styles.primaryBtnText}>Go to Group</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={onDismiss}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Keep browsing"
              >
                <Text style={styles.secondaryBtnText}>Keep Browsing</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.gradientOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverWrap: {
    position: 'relative',
    height: 120,
    backgroundColor: colors.muted,
  },
  accentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    zIndex: 1,
  },
  cover: {
    width: '100%',
    height: 120,
  },
  content: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  headline: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  statCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.foreground,
    fontFamily: 'JetBrainsMono',
  },
  statLabel: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.onlineDot,
    marginLeft: 4,
  },
  actions: {
    width: '100%',
    gap: 10,
    marginTop: 12,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryForeground,
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
});
