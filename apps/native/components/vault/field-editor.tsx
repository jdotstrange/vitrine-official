/**
 * FieldEditor — type-aware input for structured schema data.
 *
 * Renders the correct native control for a given `field_schema` entry
 * so rapid-fire edit flows (and any future inline editors) can hand off
 * a field key and get back a sensibly-typed control with no per-field
 * boilerplate.
 *
 * Type routing:
 *   string   → TextInput, auto-capitalized sentences, multiline if the
 *              value is long-form (description-ish).
 *   number   → TextInput with decimal-pad keyboard.
 *   boolean  → segmented Yes / No pair (full-width, mirrors visibility
 *              toggle on the finalize step so toggle UX stays consistent).
 *
 * Unknown types fall back to string. Keep this component dumb —
 * validation, required-field gating, and submission live in the parent.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, X } from 'lucide-react-native';

import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';

export type FieldEditorValue = string | number | boolean | null;

export interface FieldEditorProps {
  label: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | string;
  value: FieldEditorValue;
  onChange: (next: FieldEditorValue) => void;
  multiline?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
}

export function FieldEditor({
  label,
  description,
  type,
  value,
  onChange,
  multiline = false,
  autoFocus = true,
  placeholder,
}: FieldEditorProps) {
  const { colors } = useTheme();
  const stringVal = value == null ? '' : String(value);

  return (
    <View style={styles.root}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label.toUpperCase()}</Text>
      {description ? <Text style={[styles.description, { color: colors.textTertiary }]}>{description}</Text> : null}

      {type === 'boolean' ? (
        <View style={styles.boolRow}>
          {(
            [
              { v: true, label: 'YES', Icon: Check },
              { v: false, label: 'NO', Icon: X },
            ] as const
          ).map(({ v, label: optLabel, Icon }) => {
            const active = value === v;
            return (
              <Pressable
                key={optLabel}
                onPress={() => onChange(v)}
                style={[
                  styles.boolBtn,
                  { borderColor: colors.frostBorderStrong, backgroundColor: colors.sheetBg },
                  active && { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Icon
                  size={14}
                  color={active ? colors.textPrimary : colors.textSecondary}
                  strokeWidth={2}
                />
                <Text style={[styles.boolBtnText, { color: colors.textSecondary }, active && { color: colors.textPrimary }]}>
                  {optLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : type === 'number' ? (
        <TextInput
          value={stringVal}
          onChangeText={(text) => {
            const cleaned = text.replace(/[^0-9.\-]/g, '');
            if (cleaned === '' || cleaned === '-') {
              onChange(cleaned === '' ? null : cleaned);
              return;
            }
            const n = parseFloat(cleaned);
            onChange(Number.isFinite(n) ? n : cleaned);
          }}
          placeholder={placeholder ?? '0'}
          placeholderTextColor={colors.textTertiary}
          keyboardType="decimal-pad"
          autoFocus={autoFocus}
          style={[styles.input, { borderColor: colors.frostBorderStrong, color: colors.textPrimary, backgroundColor: colors.sheetBg }]}
        />
      ) : (
        <TextInput
          value={stringVal}
          onChangeText={(text) => onChange(text)}
          placeholder={placeholder ?? 'Enter value'}
          placeholderTextColor={colors.textTertiary}
          multiline={multiline}
          autoFocus={autoFocus}
          autoCapitalize="sentences"
          style={[styles.input, { borderColor: colors.frostBorderStrong, color: colors.textPrimary, backgroundColor: colors.sheetBg }, multiline && styles.inputMultiline]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: SPACING.kickerGap,
  },
  label: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  description: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
  },
  input: {
    minHeight: 48,
    borderRadius: RADII.medium,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: TYPE.inter,
    fontSize: 17,
  },
  inputMultiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  boolRow: {
    flexDirection: 'row',
    gap: 8,
  },
  boolBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADII.medium,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  boolBtnText: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 3,
  },
});
