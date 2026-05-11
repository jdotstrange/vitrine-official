import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Globe, Lock, Layers, ChevronRight } from 'lucide-react-native';
import Animated from 'react-native-reanimated';
import { colors } from '@/lib/colors';
import type { CategoryType } from '@/lib/contexts/category-context';

export interface GroupFormFieldsProps {
  name: string;
  onChangeName: (text: string) => void;
  description: string;
  onChangeDescription: (text: string) => void;
  selectedType: CategoryType | null;
  selectedCategory: { code: string; title: string } | null;
  onOpenTypeSelector: () => void;
  visibility: 'public' | 'private';
  onChangeVisibility: (v: 'public' | 'private') => void;
  focusedField: string | null;
  onFocusField: (field: string | null) => void;
}

export function GroupFormFields({
  name,
  onChangeName,
  description,
  onChangeDescription,
  selectedType,
  selectedCategory,
  onOpenTypeSelector,
  visibility,
  onChangeVisibility,
  focusedField,
  onFocusField,
}: GroupFormFieldsProps) {
  return (
    <>
      {/* Group Name */}
      <View style={styles.section}>
        <Text style={styles.label}>
          Group Name <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            value={name}
            onChangeText={(text) => onChangeName(text.slice(0, 50))}
            onFocus={() => onFocusField('name')}
            onBlur={() => onFocusField(null)}
            placeholder="e.g., NYC Card Collectors"
            placeholderTextColor={colors.mutedForeground + '99'}
            accessibilityLabel="Group name"
            style={[
              styles.input,
              focusedField === 'name' ? styles.inputFocused : styles.inputUnfocused,
            ]}
          />
        </View>
        <Text style={styles.characterCount}>{name.length}/50</Text>
      </View>

      {/* Description */}
      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <View style={styles.inputContainer}>
          <TextInput
            value={description}
            onChangeText={(text) => onChangeDescription(text.slice(0, 200))}
            onFocus={() => onFocusField('description')}
            onBlur={() => onFocusField(null)}
            placeholder="What's your group about?"
            placeholderTextColor={colors.mutedForeground + '99'}
            multiline
            numberOfLines={3}
            accessibilityLabel="Group description"
            style={[
              styles.textArea,
              focusedField === 'description' ? styles.inputFocused : styles.inputUnfocused,
            ]}
          />
        </View>
        <Text style={styles.characterCount}>{description.length}/200</Text>
      </View>

      {/* Type & Category */}
      <View style={styles.section}>
        <Text style={styles.label}>
          Type & Category <Text style={styles.required}>*</Text>
        </Text>
        <TouchableOpacity
          onPress={onOpenTypeSelector}
          style={styles.typeSelectorButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Select type and category"
        >
          <View style={styles.typeSelectorContent}>
            <View style={styles.typeSelectorIcon}>
              {selectedType ? (
                <selectedType.icon size={20} color={colors.primary} />
              ) : (
                <Layers size={20} color={colors.mutedForeground} />
              )}
            </View>
            <View style={styles.typeSelectorText}>
              <Text style={styles.typeSelectorLabel}>Type & Category</Text>
              <Text style={styles.typeSelectorValue}>
                {selectedType
                  ? selectedCategory
                    ? `${selectedType.title} · ${selectedCategory.title}`
                    : selectedType.title
                  : 'Select type (required)'}
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Visibility */}
      <View style={styles.section}>
        <Text style={styles.label}>Visibility</Text>
        <View style={styles.visibilityContainer}>
          <Animated.View
            style={[
              styles.visibilityIndicator,
              {
                left: visibility === 'public' ? 4 : '50%',
              },
            ]}
          />
          <TouchableOpacity
            onPress={() => onChangeVisibility('public')}
            style={[styles.visibilityButton, visibility === 'public' && styles.visibilityButtonActive]}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Set visibility to public"
          >
            <Globe size={20} color={visibility === 'public' ? colors.primary : colors.mutedForeground} />
            <Text
              style={[
                styles.visibilityButtonText,
                visibility === 'public' && styles.visibilityButtonTextActive,
              ]}
            >
              Public
            </Text>
          </TouchableOpacity>
          <View
            style={[styles.visibilityButton, styles.visibilityButtonDisabled]}
          >
            <Lock size={20} color={colors.mutedForeground} />
            <Text style={styles.visibilityButtonText}>Private</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          </View>
        </View>
        <Text style={styles.visibilityHint}>
          {visibility === 'public'
            ? 'Anyone can find and join this group'
            : 'Private groups are coming with Vitrine Pro'}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
  },
  required: {
    color: colors.primary,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    fontSize: 16,
    color: colors.foreground,
  },
  inputFocused: {
    backgroundColor: colors.card + 'E6',
  },
  inputUnfocused: {
    backgroundColor: colors.card + '99',
  },
  textArea: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 16,
    fontSize: 16,
    color: colors.foreground,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: colors.mutedForeground,
    textAlign: 'right',
    marginTop: 8,
    fontFamily: 'JetBrainsMono',
  },
  typeSelectorButton: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card + '80',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  typeSelectorIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSelectorText: {
    flex: 1,
  },
  typeSelectorLabel: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  typeSelectorValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  visibilityContainer: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: colors.card + '99',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    position: 'relative',
  },
  visibilityIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '48%',
    backgroundColor: colors.primary + '33',
    borderWidth: 1,
    borderColor: colors.primary + '80',
    borderRadius: 12,
  },
  visibilityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  visibilityButtonActive: {},
  visibilityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  visibilityButtonTextActive: {
    color: colors.primary,
  },
  visibilityButtonDisabled: {
    opacity: 0.5,
  },
  proBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.primaryMuted,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  visibilityHint: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});
