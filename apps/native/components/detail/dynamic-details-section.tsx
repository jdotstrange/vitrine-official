import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { DynamicDetailSection } from '@/lib/api/collectibles';
import { colors } from '@/lib/colors';

export interface DynamicDetailsSectionProps {
  sections: DynamicDetailSection[];
  sectionCount: number;
  expandedSections: Record<string, boolean>;
  onToggleSection: (title: string) => void;
  detailDensityRowLimit: number;
  statusTextColor: string;
}

const getFieldDisplay = (displayValue: string | string[]) =>
  Array.isArray(displayValue) ? displayValue : [displayValue];

export function DynamicDetailsSection({
  sections,
  sectionCount,
  expandedSections,
  onToggleSection,
  detailDensityRowLimit,
  statusTextColor,
}: DynamicDetailsSectionProps) {
  return (
    <>
      {sections.map((section) => {
        const shouldAutoExpand = sectionCount <= 1;
        const isExpanded = !!expandedSections[section.title];
        const visibleFields = shouldAutoExpand || isExpanded
          ? section.fields
          : section.fields.slice(0, detailDensityRowLimit);
        const hasMore = sectionCount > 1 && section.fields.length > detailDensityRowLimit;

        return (
          <View key={section.title} style={styles.detailsCard}>
            <View style={styles.metadataList}>
              {visibleFields.map((row) => (
                <View key={`${section.title}-${row.id || row.label}`} style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>{String(row.label).toUpperCase()}</Text>
                  {getFieldDisplay(row.displayValue).length > 1 ? (
                    <View style={styles.metadataChipRow}>
                      {getFieldDisplay(row.displayValue).map((value) => (
                        <View key={`${section.title}-${row.id || row.label}-${value}`} style={styles.metadataChip}>
                          <Text style={styles.metadataChipText}>{value}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.metadataValue}>{getFieldDisplay(row.displayValue)[0]}</Text>
                  )}
                </View>
              ))}
            </View>
            {hasMore && (
              <TouchableOpacity
                style={styles.expandSectionButton}
                onPress={() => onToggleSection(section.title)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={isExpanded ? 'Show less details' : `Show all ${section.fields.length} details`}
              >
                <Text style={[styles.expandSectionButtonText, { color: statusTextColor }]}>
                  {isExpanded ? 'Show Less' : `Show All (${section.fields.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  detailsCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metadataList: {
    gap: 10,
  },
  metadataRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 10,
    gap: 4,
  },
  metadataLabel: {
    fontSize: 10,
    letterSpacing: 1.4,
    color: colors.mutedForeground,
  },
  metadataValue: {
    fontSize: 14,
    color: colors.foreground,
    fontWeight: '500',
    lineHeight: 20,
  },
  metadataChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  metadataChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary + '99',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metadataChipText: {
    fontSize: 12,
    color: colors.foreground,
  },
  expandSectionButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary + '80',
  },
  expandSectionButtonText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
});
