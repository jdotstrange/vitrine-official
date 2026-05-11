import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { X, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { DynamicDetailSection } from '@/lib/api/collectibles';
import { ActionIcon } from '../ui/action-icon';
import { colors } from '@/lib/colors';

interface DetailCoverageSheetProps {
  visible: boolean;
  onClose: () => void;
  sections: DynamicDetailSection[];
  fieldCount: number;
  density: string;
  densityColors: { text: string; bg: string; border: string };
  isOwner?: boolean;
  onEditDetails?: () => void;
}

const getFieldDisplay = (displayValue: string | string[]) =>
  Array.isArray(displayValue) ? displayValue : [displayValue];

export function DetailCoverageSheet({
  visible,
  onClose,
  sections,
  fieldCount,
  density,
  densityColors,
  isOwner = false,
  onEditDetails,
}: DetailCoverageSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.modalContainer}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Detail Coverage</Text>
              <View style={[styles.densityBadge, { borderColor: densityColors.border, backgroundColor: densityColors.bg }]}>
                <Text style={[styles.densityBadgeText, { color: densityColors.text }]}>
                  {density.toUpperCase()}
                </Text>
              </View>
            </View>
            <ActionIcon icon={X} onPress={onClose} label="Close" size={18} />
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryCount, { color: densityColors.text }]}>{fieldCount}</Text>
            <Text style={styles.summaryLabel}>
              {fieldCount === 0 ? 'No unique identifiers provided' : 'unique identifiers provided'}
            </Text>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {sections.map((section) => (
              <View key={section.title} style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{section.title.toUpperCase()}</Text>
                <View style={styles.fieldList}>
                  {section.fields.map((row, idx) => (
                    <View
                      key={`${section.title}-${row.id || row.label}`}
                      style={[
                        styles.fieldRow,
                        idx < section.fields.length - 1 && styles.fieldRowBorder,
                      ]}
                    >
                      <Text style={styles.fieldLabel}>{String(row.label).toUpperCase()}</Text>
                      {getFieldDisplay(row.displayValue).length > 1 ? (
                        <View style={styles.chipRow}>
                          {getFieldDisplay(row.displayValue).map((value) => (
                            <View key={`${row.id || row.label}-${value}`} style={styles.chip}>
                              <Text style={styles.chipText}>{value}</Text>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.fieldValue}>{getFieldDisplay(row.displayValue)[0]}</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {isOwner && fieldCount <= 5 && onEditDetails && (
              <TouchableOpacity
                style={styles.enrichRow}
                onPress={() => { onClose(); onEditDetails(); }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Add more details"
              >
                <View style={styles.enrichContent}>
                  <Text style={styles.enrichTitle}>Enrich This Item</Text>
                  <Text style={styles.enrichSubtitle}>Add identifiers to boost trust & discoverability</Text>
                </View>
                <ChevronRight size={18} color={colors.primary} />
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '90%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4,
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.foreground,
  },
  densityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  densityBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '80',
  },
  summaryCount: {
    fontSize: 28,
    fontFamily: 'JetBrainsMono',
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 16,
  },
  sectionCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 2,
    color: colors.mutedForeground,
    marginBottom: 14,
    fontWeight: '600',
  },
  fieldList: {
    gap: 0,
  },
  fieldRow: {
    paddingVertical: 10,
    gap: 4,
  },
  fieldRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  fieldLabel: {
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.mutedForeground,
  },
  fieldValue: {
    fontSize: 15,
    color: colors.foreground,
    fontWeight: '500',
    lineHeight: 22,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary + '99',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 13,
    color: colors.foreground,
  },
  enrichRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.primary + '0F',
    borderWidth: 1,
    borderColor: colors.primary + '26',
  },
  enrichContent: {
    flex: 1,
    gap: 2,
  },
  enrichTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  enrichSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    lineHeight: 16,
  },
});
