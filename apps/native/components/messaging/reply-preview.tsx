import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { colors } from '@/lib/colors';

interface ReplyPreviewProps {
  senderName: string;
  content: string;
  onDismiss?: () => void;
  variant?: 'input' | 'inline';
}

export function ReplyPreview({ senderName, content, onDismiss, variant = 'input' }: ReplyPreviewProps) {
  const isInput = variant === 'input';

  return (
    <View style={[styles.container, isInput && styles.containerInput]}>
      <View style={styles.accent} />
      <View style={styles.content}>
        <Text style={styles.senderName} numberOfLines={1}>{senderName}</Text>
        <Text style={styles.text} numberOfLines={isInput ? 1 : 2}>{content}</Text>
      </View>
      {isInput && onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Cancel reply"
        >
          <X size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4,
  },
  containerInput: {
    backgroundColor: colors.surfaceElevated,
    paddingVertical: 8,
    paddingRight: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
  },
  accent: {
    width: 3,
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingLeft: 8,
    gap: 1,
  },
  senderName: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  text: {
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 16,
  },
  dismiss: {
    padding: 4,
    marginLeft: 4,
  },
});
