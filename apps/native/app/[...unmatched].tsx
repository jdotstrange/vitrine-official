import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams, useSegments } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>
          The page you're looking for doesn't exist.
        </Text>
        <Text style={styles.path}>/{segments.join('/')}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={colors.foreground} />
          <Text style={styles.buttonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  code: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.mutedForeground,
    opacity: 0.4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 16,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
  path: {
    fontSize: 12,
    color: colors.mutedForeground,
    opacity: 0.6,
    marginTop: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    color: colors.foreground,
  },
});
