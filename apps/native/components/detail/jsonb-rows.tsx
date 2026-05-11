import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/colors';
import type { InsetGroupedRow } from './inset-grouped-list';

/**
 * Converts a jsonb column (e.g. `ai_metadata` or `trait_metadata`) into
 * an array of InsetGroupedRow, ready to feed into InsetGroupedList.
 *
 * Rules:
 *  - Hide null, undefined, '', and empty arrays
 *  - Hide any key listed in `skipKeys` (case-insensitive match on raw key)
 *  - Booleans render as "Yes" / "No"
 *  - Arrays of primitives flatten with ", "
 *  - Arrays of objects render STACKED: one line per object, values joined by " · "
 *  - Scalars render as their string representation
 *  - Labels and string values get a sentence-case first letter
 *  - Optionally Title-Case snake_case keys for display
 */
export function jsonbToRows(
  data: Record<string, unknown> | null | undefined,
  opts: { humanizeKeys?: boolean; skipKeys?: string[] } = {},
): InsetGroupedRow[] {
  if (!data) return [];

  const skip = new Set((opts.skipKeys ?? []).map((k) => k.toLowerCase()));
  const rows: InsetGroupedRow[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (skip.has(key.toLowerCase())) continue;
    if (!isPopulated(value)) continue;

    const rawLabel = opts.humanizeKeys ? humanizeKey(key) : key;
    const label = capitalizeFirst(rawLabel);

    // Array of objects → stacked multi-line value
    if (isArrayOfObjects(value)) {
      const lines = (value as Record<string, unknown>[])
        .map(flattenObjectToLine)
        .filter((line): line is string => !!line);

      if (lines.length === 0) continue;

      rows.push({
        key,
        label,
        layout: 'stacked',
        value: <StackedLines lines={lines} />,
      });
      continue;
    }

    const display = formatValue(value);
    if (display === null) continue;

    rows.push({
      key,
      label,
      value: capitalizeFirst(display),
    });
  }

  return rows;
}

export function StackedLines({ lines }: { lines: string[] }) {
  return (
    <View style={styles.lines}>
      {lines.map((line, i) => (
        <Text
          key={i}
          style={styles.line}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {line}
        </Text>
      ))}
    </View>
  );
}

function isPopulated(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string' && value.trim() === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

function isArrayOfObjects(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.some(
    (v) => v !== null && typeof v === 'object' && !Array.isArray(v),
  );
}

function formatValue(value: unknown): string | null {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;

  if (Array.isArray(value)) {
    const parts = value
      .map(formatArrayItem)
      .filter((v): v is string => v !== null && v !== '');
    if (parts.length === 0) return null;
    return parts.join(', ');
  }

  if (typeof value === 'object' && value !== null) {
    return formatArrayItem(value);
  }

  return null;
}

function formatArrayItem(item: unknown): string | null {
  if (item === null || item === undefined) return null;
  if (typeof item === 'string') return item.trim() === '' ? null : item;
  if (typeof item === 'number') return String(item);
  if (typeof item === 'boolean') return item ? 'Yes' : 'No';
  if (typeof item === 'object') return flattenObjectToLine(item as Record<string, unknown>);
  return null;
}

function flattenObjectToLine(obj: Record<string, unknown>): string | null {
  const parts: string[] = [];
  for (const v of Object.values(obj)) {
    if (v === null || v === undefined) continue;
    if (typeof v === 'string') {
      const trimmed = v.trim();
      if (trimmed === '') continue;
      parts.push(capitalizeFirst(trimmed));
    } else if (typeof v === 'number') {
      parts.push(String(v));
    } else if (typeof v === 'boolean') {
      parts.push(v ? 'Yes' : 'No');
    }
  }
  if (parts.length === 0) return null;
  return parts.join(' · ');
}

function humanizeKey(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  const first = str.charAt(0);
  const upper = first.toUpperCase();
  if (first === upper) return str;
  return upper + str.slice(1);
}

const styles = StyleSheet.create({
  lines: {
    gap: 4,
  },
  line: {
    fontSize: 15,
    color: colors.mutedForeground,
    lineHeight: 22,
  },
});
