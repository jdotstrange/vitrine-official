import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react-native';
import { colors } from '@/lib/colors';

interface TagsInputProps {
  tags: string[];
  tagInput: string;
  onTagInputChange: (text: string) => void;
  onTagSubmit: () => void;
  onTagRemove: (index: number) => void;
  scrollViewRef?: React.RefObject<ScrollView | null>;
}

export function TagsInput({
  tags,
  tagInput,
  onTagInputChange,
  onTagSubmit,
  onTagRemove,
  scrollViewRef,
}: TagsInputProps) {
  const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, []);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Tags</Text>
      <Text style={styles.description}>
        Add tags to help organize and find this item in smart collections
      </Text>
      <View style={styles.container}>
        <View style={styles.overlay} />
        {tags.length > 0 && (
          <View style={styles.list}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.chip}>
                <Text style={styles.chipText}>#{tag}</Text>
                <TouchableOpacity
                  onPress={() => onTagRemove(index)}
                  style={styles.removeButton}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove tag ${tag}`}
                >
                  <X size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder={tags.length === 0 ? 'Type a tag...' : 'Add another tag...'}
            placeholderTextColor={colors.mutedForeground}
            value={tagInput}
            onChangeText={onTagInputChange}
            onSubmitEditing={onTagSubmit}
            returnKeyType="done"
            accessibilityLabel="Tag input"
            onFocus={() => {
              scrollTimerRef.current = setTimeout(() => {
                scrollViewRef?.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
          />
          {tagInput.length > 0 && (
            <TouchableOpacity
              onPress={onTagSubmit}
              style={styles.addButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Add tag"
            >
              <Plus size={16} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  description: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 12,
  },
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 56,
    padding: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245, 245, 240, 0.85)',
  },
  list: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.primary + '33',
    borderWidth: 1,
    borderColor: colors.primary + '4D',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  removeButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.foreground,
    padding: 0,
    minHeight: 24,
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
