/**
 * Owner-authored custom fields — label + free text, no type picker.
 * Used on upload Review and edit Review; never modified by Looking Glass.
 */

import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Plus, X } from 'lucide-react-native';

import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';
import type { CollectibleCustomField } from '@/lib/api/collectibles';

type Props = {
  fields: CollectibleCustomField[];
  onChange: (fields: CollectibleCustomField[]) => void;
  /** When false, rows are read-only (optional). */
  editable?: boolean;
};

function newField(): CollectibleCustomField {
  return {
    id: `cf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    label: '',
    value: '',
    created_at: new Date().toISOString(),
  };
}

export function CustomFieldsEditor({ fields, onChange, editable = true }: Props) {
  const { colors } = useTheme();

  const updateField = useCallback(
    (id: string, patch: Partial<Pick<CollectibleCustomField, 'label' | 'value'>>) => {
      onChange(
        fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
      );
    },
    [fields, onChange],
  );

  const removeField = useCallback(
    (id: string) => {
      onChange(fields.filter((f) => f.id !== id));
    },
    [fields, onChange],
  );

  const addField = useCallback(() => {
    onChange([...fields, newField()]);
  }, [fields, onChange]);

  return (
    <View style={styles.wrap}>
      <Text style={[styles.sectionKicker, { color: colors.textTertiary }]}>
        ADDITIONAL DETAILS
      </Text>
      {fields.length === 0 && !editable ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          No additional details added.
        </Text>
      ) : null}
      {fields.map((field, index) => (
        <View
          key={field.id}
          style={[
            styles.row,
            index < fields.length - 1 && {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.frostDivider,
            },
          ]}
        >
          <TextInput
            style={[styles.labelInput, { color: colors.textPrimary, borderColor: colors.frostBorder }]}
            placeholder="Field name"
            placeholderTextColor={colors.textTertiary}
            value={field.label}
            editable={editable}
            onChangeText={(text) => updateField(field.id, { label: text })}
          />
          <TextInput
            style={[styles.valueInput, { color: colors.textPrimary, borderColor: colors.frostBorder }]}
            placeholder="Details"
            placeholderTextColor={colors.textTertiary}
            value={field.value}
            editable={editable}
            onChangeText={(text) => updateField(field.id, { value: text })}
          />
          {editable ? (
            <Pressable
              onPress={() => removeField(field.id)}
              hitSlop={8}
              accessibilityLabel="Remove field"
              style={styles.removeBtn}
            >
              <X size={16} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>
      ))}
      {editable ? (
        <Pressable
          onPress={addField}
          style={[styles.addBtn, { borderColor: colors.frostBorder }]}
          accessibilityRole="button"
          accessibilityLabel="Add custom field"
        >
          <Plus size={16} color={colors.brandVolt} />
          <Text style={[styles.addLabel, { color: colors.textSecondary }]}>Add field</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: SPACING.zoneIntra,
  },
  sectionKicker: {
    fontFamily: TYPE.interMedium,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: SPACING.rowPadY,
  },
  empty: {
    fontFamily: TYPE.inter,
    fontSize: 14,
    marginBottom: SPACING.rowPadY,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: SPACING.rowPadY,
  },
  labelInput: {
    flex: 0.42,
    fontFamily: TYPE.interMedium,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: RADII.small,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  valueInput: {
    flex: 1,
    fontFamily: TYPE.inter,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: RADII.small,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  removeBtn: {
    marginTop: 10,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING.rowPadY,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: RADII.small,
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  addLabel: {
    fontFamily: TYPE.interMedium,
    fontSize: 14,
  },
});
