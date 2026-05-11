import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { colors } from '@/lib/colors';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
  compact = false,
}: ErrorStateProps) {
  if (compact) {
    return (
      <View style={styles.compactContainer} accessibilityRole="alert">
        <AlertTriangle size={16} color={colors.destructive} />
        <Text style={styles.compactMessage}>{message}</Text>
        {onRetry && (
          <TouchableOpacity
            onPress={onRetry}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <RefreshCw size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container} accessibilityRole="alert">
      <View style={styles.iconWrap}>
        <AlertTriangle size={20} color={colors.destructive} />
      </View>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          style={styles.retryButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          accessibilityHint="Retries loading the content"
        >
          <RefreshCw size={14} color={colors.primary} />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.destructive + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary + '1A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.destructive + '0D',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.destructive + '1A',
  },
  compactMessage: {
    flex: 1,
    fontSize: 13,
    color: colors.mutedForeground,
  },
});
