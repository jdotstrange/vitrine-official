import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MemorabiliaUploadProgressProps {
  progress: number;
}

export function MemorabiliaUploadProgress({ progress }: MemorabiliaUploadProgressProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.overlay} />
      <View style={styles.content}>
        <Text style={styles.title}>Uploading...</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.percentage}>{Math.round(progress)}%</Text>
      </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  percentage: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
});
