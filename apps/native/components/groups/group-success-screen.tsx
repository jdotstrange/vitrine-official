import { View, Text, StyleSheet } from 'react-native';
import { Globe, Lock, Users, Sparkles } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { OptimizedImage } from '../optimized-image';
import { VitrineButton } from '../ui/vitrine-button';
import { colors } from '@/lib/colors';

export interface GroupSuccessScreenProps {
  name: string;
  coverImage: string | null;
  visibility: 'public' | 'private';
  memberCount: number;
  insets: { top: number; bottom: number };
  onOpenGroup: () => void;
  onBackToCommunity: () => void;
}

export function GroupSuccessScreen({
  name,
  coverImage,
  visibility,
  memberCount,
  insets,
  onOpenGroup,
  onBackToCommunity,
}: GroupSuccessScreenProps) {
  return (
    <View style={[styles.successContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View
        entering={FadeIn}
        style={styles.successIconContainer}
      >
        <Sparkles size={48} color={colors.primary} />
      </Animated.View>

      <Animated.Text entering={FadeIn.delay(200)} style={styles.successTitle}>
        Group Created!
      </Animated.Text>

      <Animated.Text entering={FadeIn.delay(300)} style={styles.successDescription}>
        {name} is ready for members
      </Animated.Text>

      {/* Preview card */}
      <Animated.View entering={FadeIn.delay(400)} style={styles.successPreviewCard}>
        <View style={styles.successPreviewImageContainer}>
          {coverImage && (
            <OptimizedImage
              source={{ uri: coverImage || '/placeholder.svg' }}
              style={styles.successPreviewImage}
            />
          )}
          <View style={styles.successPreviewGradient} />
          <View style={styles.successPreviewContent}>
            <Text style={styles.successPreviewTitle}>{name}</Text>
            <View style={styles.successPreviewMeta}>
              {visibility === 'public' ? (
                <Globe size={14} color={colors.mutedForeground} />
              ) : (
                <Lock size={14} color={colors.mutedForeground} />
              )}
              <Text style={styles.successPreviewMetaText}>
                {visibility === 'public' ? 'Public' : 'Private'}
              </Text>
              <Text style={styles.successPreviewMetaText}>•</Text>
              <Users size={14} color={colors.mutedForeground} />
              <Text style={styles.successPreviewMetaText}>{memberCount} members</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* CTAs */}
      <Animated.View entering={FadeIn.delay(500)} style={styles.successActions}>
        <VitrineButton
          variant="confirmation"
          onPress={onOpenGroup}
          fullWidth
        >
          Open Group
        </VitrineButton>
        <VitrineButton
          variant="ghost"
          onPress={onBackToCommunity}
          fullWidth
        >
          Back to Community
        </VitrineButton>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary + '33',
    borderWidth: 1,
    borderColor: colors.primary + '80',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 8,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: 16,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 32,
  },
  successPreviewCard: {
    width: '100%',
    maxWidth: 384,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 32,
  },
  successPreviewImageContainer: {
    height: 128,
    position: 'relative',
  },
  successPreviewImage: {
    width: '100%',
    height: '100%',
  },
  successPreviewGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: colors.background + 'CC',
  },
  successPreviewContent: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  successPreviewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 8,
  },
  successPreviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  successPreviewMetaText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  successActions: {
    width: '100%',
    maxWidth: 384,
    gap: 12,
  },
});
