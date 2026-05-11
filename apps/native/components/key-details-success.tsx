import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Check, ArrowRight } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';

export function KeyDetailsSuccess() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type: string; category: string; collectibleId?: string }>();

  const type = params.type || '';
  const category = params.category || '';
  const collectibleId = params.collectibleId || '';

  const formatLabel = (str: string) =>
    str
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const handleViewCollectible = () => {
    // Navigate to the collectible detail page
    if (collectibleId) {
      router.replace(`/collectible/${collectibleId}`);
    } else {
      // Fallback to profile if no ID
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.overlay} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Success Badge */}
        <Animated.View entering={FadeIn} style={styles.header}>
          <View style={styles.successBadge}>
            <Check size={24} color={colors.primary} />
            <Text style={styles.successBadgeText}>Details Saved</Text>
          </View>
        </Animated.View>

        {/* Message */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.messageContainer}>
          <Text style={styles.title}>Your collectible is complete!</Text>
          <Text style={styles.subtitle}>
            All specifications and provenance details have been saved.
          </Text>
          <Text style={styles.info}>
            {formatLabel(type)} / {formatLabel(category)}
          </Text>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeIn.delay(400)} style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleViewCollectible}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>View in My Collection</Text>
            <ArrowRight size={20} color={colors.background} />
          </TouchableOpacity>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.primary + '1A',
    borderWidth: 1,
    borderColor: colors.primary + '4D',
  },
  successBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  info: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  ctaContainer: {
    width: '100%',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});
