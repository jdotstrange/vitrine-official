import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { Search, Check, X } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchBar } from '../search-bar';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface BottomSheetPickerProps {
  isOpen: boolean;
  onClose: () => void;
  options: { value: string; label: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  label: string;
  searchable?: boolean;
}

export function BottomSheetPicker({
  isOpen,
  onClose,
  options,
  selectedValue,
  onSelect,
  label,
  searchable = false,
}: BottomSheetPickerProps) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filteredOptions = searchable
    ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalOverlay} />
        
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + 16,
              maxHeight: '70%',
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{label}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
              <X size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          {searchable && (
            <View style={styles.searchContainer}>
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search..."
                showClear
              />
            </View>
          )}

          {/* Options */}
          <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
            {filteredOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  selectedValue === option.value && styles.optionSelected,
                ]}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedValue === option.value && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {selectedValue === option.value && (
                  <Check size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    position: 'relative',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.mutedForeground + '4D',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '80',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '80',
  },
  optionsList: {
    flex: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '40',
  },
  optionSelected: {
    backgroundColor: colors.primary + '1A',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.foreground,
  },
  optionTextSelected: {
    color: colors.primary,
  },
});
