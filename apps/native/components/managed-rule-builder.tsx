/**
 * ManagedRuleBuilder — the MANAGED lens body for Create Showcase and the
 * edit-rules screen for existing managed showcases.
 *
 * Layout:
 *   Match mode toggle
 *   Condition stack (field → op → value control, per row)
 *   + Add condition CTA
 *   Live preview card (count + value + 3-up thumbnails)
 *
 * The live preview calls `previewRuleMatches` on every condition change
 * against the in-memory collectibles array passed from the parent. Zero
 * network round-trip.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Plus, Trash2 } from 'lucide-react-native';

import { formatPrice, type CollectionItem } from '@/components/collectibles';
import { previewRuleMatches } from '@/lib/api/showcases';
import {
  defaultOpForField,
  isOpValidForField,
  labelForField,
  labelForOp,
  opsForField,
  type Condition,
  type ConditionValue,
  type ManagedRules,
  type RuleField,
  type RuleMatchMode,
  type RuleOp,
} from '@/lib/api/managed-rules';
import { TRAIT_CONFIG, type TraitKey } from '@/lib/design/trait-config';
import { STATUS_CONFIG, type ListingStatus } from '@/lib/design/status-config';
import { useTheme, RADII, SPACING, TYPE } from '@/lib/design';

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

const FIELD_OPTIONS: { key: RuleField; label: string }[] = [
  { key: 'collectible_type', label: 'Type' },
  { key: 'item_type', label: 'Item Type' },
  { key: 'listing_title', label: 'Title' },
  { key: 'value', label: 'Value' },
  { key: 'status', label: 'Status' },
  { key: 'traits', label: 'Traits' },
  { key: 'franchise', label: 'Franchise' },
  { key: 'year', label: 'Year' },
  { key: 'maker', label: 'Maker' },
  { key: 'tags', label: 'Tags' },
];

const TYPE_OPTIONS = [
  'memorabilia',
  'trading_card',
  'comics',
  'sneakers',
  'watches',
  'gaming',
  'music',
  'movies',
  'toys',
  'automotive',
];

const STATUS_OPTIONS: ListingStatus[] = ['FOR_SALE', 'FOR_TRADE', 'SELL_TRADE', 'NFST'];

const TRAIT_OPTIONS: TraitKey[] = ['is_rookie', 'is_autographed', 'is_game_used', 'is_graded'];

// ---------------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------------

export interface ManagedRuleBuilderProps {
  rules: ManagedRules;
  onRulesChange: (rules: ManagedRules) => void;
  /** In-memory collectibles to run the live preview against. */
  collectibles: CollectionItem[];
}

// ---------------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------------

export function ManagedRuleBuilder({
  rules,
  onRulesChange,
  collectibles,
}: ManagedRuleBuilderProps) {
  const { colors } = useTheme();
  // ── Live preview ─────────────────────────────────────────────────────
  const preview = useMemo(() => {
    if (rules.conditions.length === 0) {
      return { matchingIds: [] as string[], totalValue: 0, previewImages: [] as string[] };
    }
    return previewRuleMatches(
      collectibles.map((c) => ({
        id: c.id,
        title: c.title,
        collectibleType: c.collectibleType,
        value: c.value,
        status: c.status,
        traits: c.traits,
        image: c.image,
        filterTraits: c.filterTraits,
      })),
      rules,
    );
  }, [collectibles, rules]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const setMatchMode = useCallback(
    (mode: RuleMatchMode) => {
      onRulesChange({ ...rules, match: mode });
    },
    [onRulesChange, rules],
  );

  const addCondition = useCallback(() => {
    const field: RuleField = 'collectible_type';
    const op = defaultOpForField(field);
    const newCondition: Condition = { field, op, value: [] };
    onRulesChange({ ...rules, conditions: [...rules.conditions, newCondition] });
  }, [onRulesChange, rules]);

  const removeCondition = useCallback(
    (index: number) => {
      const next = rules.conditions.filter((_, i) => i !== index);
      onRulesChange({ ...rules, conditions: next });
    },
    [onRulesChange, rules],
  );

  const updateCondition = useCallback(
    (index: number, patch: Partial<Condition>) => {
      const next = rules.conditions.map((c, i) => (i === index ? { ...c, ...patch } : c));
      onRulesChange({ ...rules, conditions: next });
    },
    [onRulesChange, rules],
  );

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      {/* Match mode toggle */}
      <View style={styles.matchModeWrap}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>MATCH MODE</Text>
        <View style={styles.matchModeRow}>
          <MatchModeChip
            label="Match ALL"
            active={rules.match === 'all'}
            onPress={() => setMatchMode('all')}
          />
          <MatchModeChip
            label="Match ANY"
            active={rules.match === 'any'}
            onPress={() => setMatchMode('any')}
          />
        </View>
      </View>

      {/* Condition stack */}
      <View style={styles.conditionStack}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>CONDITIONS</Text>
        {rules.conditions.map((condition, index) => (
          <ConditionRow
            key={index}
            condition={condition}
            index={index}
            onUpdate={updateCondition}
            onRemove={removeCondition}
          />
        ))}
        <Pressable
          onPress={addCondition}
          accessibilityRole="button"
          accessibilityLabel="Add condition"
          style={({ pressed }) => [styles.addBtn, { borderColor: colors.brandVoltBorder }, pressed && { backgroundColor: colors.brandVoltFill }]}
        >
          <Plus size={14} color={colors.brandVolt} strokeWidth={2.4} />
          <Text style={[styles.addBtnText, { color: colors.brandVolt }]}>ADD CONDITION</Text>
        </Pressable>
      </View>

      {/* Live preview */}
      {rules.conditions.length > 0 && (
        <View style={[styles.previewCard, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
          <View style={[styles.previewAccentRail, { backgroundColor: colors.brandVolt }]} />
          <Text style={[styles.previewKicker, { color: colors.textSecondary }]}>LIVE PREVIEW</Text>
          <Text style={[styles.previewStat, { color: colors.textPrimary }]}>
            {preview.matchingIds.length} items match · {formatPrice(preview.totalValue)}
          </Text>
          {preview.previewImages.length > 0 && (
            <View style={styles.thumbStrip}>
              {[0, 1, 2].map((i) => {
                const uri = preview.previewImages[i];
                return (
                  <View key={i} style={[styles.thumbTile, { borderColor: colors.frostBorder, backgroundColor: colors.void }]}>
                    {uri ? (
                      <Image
                        source={{ uri }}
                        style={styles.thumbImage}
                        contentFit="cover"
                        transition={150}
                      />
                    ) : (
                      <View style={styles.thumbPlaceholder} />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

// ════════════════════════════════════════════════════════════════
// MATCH MODE CHIP
// ════════════════════════════════════════════════════════════════

function MatchModeChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      style={[
        styles.matchChip,
        { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg },
        active && { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
      ]}
    >
      <Text style={[
        styles.matchChipText,
        { color: colors.textSecondary },
        active && { color: colors.brandVolt },
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

// ════════════════════════════════════════════════════════════════
// CONDITION ROW
// ════════════════════════════════════════════════════════════════

function ConditionRow({
  condition,
  index,
  onUpdate,
  onRemove,
}: {
  condition: Condition;
  index: number;
  onUpdate: (index: number, patch: Partial<Condition>) => void;
  onRemove: (index: number) => void;
}) {
  const { colors } = useTheme();
  const handleFieldChange = useCallback(
    (field: RuleField) => {
      const op = defaultOpForField(field);
      const value = getDefaultValue(field, op);
      onUpdate(index, { field, op, value });
    },
    [index, onUpdate],
  );

  const handleOpChange = useCallback(
    (op: RuleOp) => {
      if (!isOpValidForField(condition.field, op)) return;
      const shouldResetValue = needsValueReset(condition.op, op, condition.field);
      const value = shouldResetValue ? getDefaultValue(condition.field, op) : condition.value;
      onUpdate(index, { op, value });
    },
    [condition.field, condition.op, condition.value, index, onUpdate],
  );

  const handleValueChange = useCallback(
    (value: ConditionValue) => {
      onUpdate(index, { value });
    },
    [index, onUpdate],
  );

  const ops = opsForField(condition.field);

  return (
    <View style={[styles.conditionRow, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
      <View style={styles.conditionHeader}>
        <Text style={[styles.conditionIndex, { color: colors.textTertiary }]}>{index + 1}</Text>
        <Pressable
          onPress={() => onRemove(index)}
          accessibilityRole="button"
          accessibilityLabel={`Remove condition ${index + 1}`}
          hitSlop={8}
          style={styles.removeBtn}
        >
          <Trash2 size={14} color={colors.semanticRed} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Field selector */}
      <View style={styles.chipRow}>
        {FIELD_OPTIONS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => handleFieldChange(f.key)}
            style={[
              styles.fieldChip,
              { borderColor: colors.frostBorder, backgroundColor: colors.void },
              condition.field === f.key && { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
            ]}
          >
            <Text
              style={[
                styles.fieldChipText,
                { color: colors.textTertiary },
                condition.field === f.key && { color: colors.brandVolt },
              ]}
            >
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Op selector */}
      {ops.length > 1 && (
        <View style={styles.chipRow}>
          {ops.map((op) => (
            <Pressable
              key={op}
              onPress={() => handleOpChange(op)}
              style={[
                styles.opChip,
                { borderColor: colors.frostBorder, backgroundColor: colors.void },
                condition.op === op && { borderColor: colors.frostBorderStrong, backgroundColor: colors.pressOverlay },
              ]}
            >
              <Text
                style={[
                  styles.opChipText,
                  { color: colors.textTertiary },
                  condition.op === op && { color: colors.textPrimary },
                ]}
              >
                {labelForOp(op)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Value control */}
      <ValueInput
        field={condition.field}
        op={condition.op}
        value={condition.value}
        onChange={handleValueChange}
      />
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// VALUE INPUT (discriminated by field + op)
// ════════════════════════════════════════════════════════════════

function ValueInput({
  field,
  op,
  value,
  onChange,
}: {
  field: RuleField;
  op: RuleOp;
  value: ConditionValue;
  onChange: (v: ConditionValue) => void;
}) {
  const { colors } = useTheme();
  switch (field) {
    case 'collectible_type':
      return (
        <MultiSelectChips
          options={TYPE_OPTIONS.map((t) => ({
            key: t,
            label: formatLabel(t),
          }))}
          selected={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
        />
      );

    case 'status':
      return (
        <MultiSelectChips
          options={STATUS_OPTIONS.map((s) => ({
            key: s,
            label: STATUS_CONFIG[s].label,
          }))}
          selected={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
        />
      );

    case 'traits':
      return (
        <MultiSelectChips
          options={TRAIT_OPTIONS.map((t) => ({
            key: t,
            label: TRAIT_CONFIG[t].label,
          }))}
          selected={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
        />
      );

    case 'listing_title':
      return (
        <TextInput
          value={typeof value === 'string' ? value : ''}
          onChangeText={(text) => onChange(text)}
          placeholder={op === 'starts_with' ? 'Starts with…' : 'Contains…'}
          placeholderTextColor={colors.textTertiary}
          style={[styles.textInput, { color: colors.textPrimary, backgroundColor: colors.void, borderColor: colors.frostBorder }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
      );

    case 'value':
      if (op === 'between') {
        const tuple = Array.isArray(value) ? (value as [number, number]) : [0, 0];
        return <BetweenInput value={tuple} onChange={onChange} />;
      }
      return (
        <NumericInput
          value={typeof value === 'number' ? value : 0}
          onChange={onChange}
          placeholder={`Value ${labelForOp(op)}…`}
        />
      );

    case 'tags':
      return (
        <TagInput
          tags={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
          placeholder="Type a tag + enter"
        />
      );

    case 'franchise':
      return (
        <TagInput
          tags={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
          placeholder="e.g. New York Yankees"
        />
      );

    case 'item_type':
      return (
        <TagInput
          tags={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
          placeholder="e.g. Jersey, Baseball"
        />
      );

    case 'maker':
      return (
        <TagInput
          tags={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
          placeholder="e.g. Topps, Nike"
        />
      );

    case 'year':
      if (op === 'between') {
        const tuple = Array.isArray(value) ? (value as [number, number]) : [0, 0];
        return <BetweenInput value={tuple} onChange={onChange} />;
      }
      return (
        <NumericInput
          value={typeof value === 'number' ? value : 0}
          onChange={onChange}
          placeholder={`Year ${labelForOp(op)}…`}
        />
      );

    default:
      return null;
  }
}

// ════════════════════════════════════════════════════════════════
// MULTI-SELECT CHIPS
// ════════════════════════════════════════════════════════════════

function MultiSelectChips({
  options,
  selected,
  onChange,
}: {
  options: { key: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const { colors } = useTheme();
  const toggle = useCallback(
    (key: string) => {
      const next = selected.includes(key)
        ? selected.filter((s) => s !== key)
        : [...selected, key];
      onChange(next);
    },
    [onChange, selected],
  );

  return (
    <View style={styles.chipRow}>
      {options.map((o) => {
        const active = selected.includes(o.key);
        return (
          <Pressable
            key={o.key}
            onPress={() => toggle(o.key)}
            style={[
              styles.valueChip,
              { borderColor: colors.frostBorder, backgroundColor: colors.void },
              active && { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
            ]}
          >
            <Text style={[
              styles.valueChipText,
              { color: colors.textTertiary },
              active && { color: colors.brandVolt },
            ]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// NUMERIC INPUT
// ════════════════════════════════════════════════════════════════

function NumericInput({
  value,
  onChange,
  placeholder,
}: {
  value: number;
  onChange: (v: number) => void;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  const [text, setText] = useState(value === 0 ? '' : String(value));

  const handleBlur = useCallback(() => {
    const parsed = parseFloat(text);
    onChange(Number.isFinite(parsed) ? parsed : 0);
  }, [onChange, text]);

  return (
    <TextInput
      value={text}
      onChangeText={setText}
      onBlur={handleBlur}
      placeholder={placeholder}
      placeholderTextColor={colors.textTertiary}
      keyboardType="numeric"
      style={[styles.textInput, { color: colors.textPrimary, backgroundColor: colors.void, borderColor: colors.frostBorder }]}
    />
  );
}

// ════════════════════════════════════════════════════════════════
// BETWEEN INPUT
// ════════════════════════════════════════════════════════════════

function BetweenInput({
  value,
  onChange,
}: {
  value: [number, number];
  onChange: (v: [number, number]) => void;
}) {
  const { colors } = useTheme();
  const [minText, setMinText] = useState(value[0] === 0 ? '' : String(value[0]));
  const [maxText, setMaxText] = useState(value[1] === 0 ? '' : String(value[1]));

  const handleMinBlur = useCallback(() => {
    const parsed = parseFloat(minText);
    const min = Number.isFinite(parsed) ? parsed : 0;
    onChange([min, value[1]]);
  }, [minText, onChange, value]);

  const handleMaxBlur = useCallback(() => {
    const parsed = parseFloat(maxText);
    const max = Number.isFinite(parsed) ? parsed : 0;
    onChange([value[0], max]);
  }, [maxText, onChange, value]);

  return (
    <View style={styles.betweenRow}>
      <TextInput
        value={minText}
        onChangeText={setMinText}
        onBlur={handleMinBlur}
        placeholder="Min"
        placeholderTextColor={colors.textTertiary}
        keyboardType="numeric"
        style={[styles.textInput, styles.betweenInput, { color: colors.textPrimary, backgroundColor: colors.void, borderColor: colors.frostBorder }]}
      />
      <Text style={[styles.betweenDash, { color: colors.textTertiary }]}>–</Text>
      <TextInput
        value={maxText}
        onChangeText={setMaxText}
        onBlur={handleMaxBlur}
        placeholder="Max"
        placeholderTextColor={colors.textTertiary}
        keyboardType="numeric"
        style={[styles.textInput, styles.betweenInput, { color: colors.textPrimary, backgroundColor: colors.void, borderColor: colors.frostBorder }]}
      />
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// TAG INPUT (free-form chip input)
// ════════════════════════════════════════════════════════════════

function TagInput({
  tags,
  onChange,
  placeholder = 'Type a tag + enter',
}: {
  tags: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const { colors } = useTheme();
  const [draft, setDraft] = useState('');

  const commitTag = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed.length === 0) return;
    if (!tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setDraft('');
  }, [draft, onChange, tags]);

  const removeTag = useCallback(
    (tag: string) => {
      onChange(tags.filter((t) => t !== tag));
    },
    [onChange, tags],
  );

  return (
    <View style={styles.tagWrap}>
      {tags.length > 0 && (
        <View style={styles.chipRow}>
          {tags.map((tag) => (
            <Pressable
              key={tag}
              onPress={() => removeTag(tag)}
              style={[styles.tagChip, { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill }]}
              accessibilityLabel={`Remove ${tag}`}
            >
              <Text style={[styles.tagChipText, { color: colors.brandVolt }]}>{tag}</Text>
              <Text style={[styles.tagChipX, { color: colors.brandVolt }]}>×</Text>
            </Pressable>
          ))}
        </View>
      )}
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={commitTag}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={[styles.textInput, { color: colors.textPrimary, backgroundColor: colors.void, borderColor: colors.frostBorder }]}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="done"
        blurOnSubmit={false}
      />
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════

function getDefaultValue(field: RuleField, op: RuleOp): ConditionValue {
  switch (field) {
    case 'listing_title':
      return '';
    case 'value':
      return op === 'between' ? [0, 0] : 0;
    case 'year':
      return op === 'between' ? [1950, 2026] : 0;
    default:
      return [];
  }
}

function needsValueReset(oldOp: RuleOp, newOp: RuleOp, field: RuleField): boolean {
  if (field === 'value' || field === 'year') {
    const wasBetween = oldOp === 'between';
    const isBetween = newOp === 'between';
    if (wasBetween !== isBetween) return true;
  }
  return false;
}

function formatLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: 20,
    paddingBottom: 100,
    gap: 24,
  },

  sectionLabel: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.6,
    marginBottom: 8,
  },

  // Match mode
  matchModeWrap: {},
  matchModeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  matchChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: RADII.small,
    borderWidth: 1,
  },
  matchChipText: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
  },

  // Condition stack
  conditionStack: {
    gap: 12,
  },
  conditionRow: {
    borderWidth: 1,
    borderRadius: RADII.card,
    padding: 14,
    gap: 12,
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conditionIndex: {
    fontFamily: TYPE.mono,
    fontSize: 11,
  },
  removeBtn: {
    padding: 4,
  },

  // Chip rows
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },

  // Field chips
  fieldChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  fieldChipText: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },

  // Op chips
  opChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  opChipText: {
    fontFamily: TYPE.inter,
    fontSize: 11,
  },

  // Value chips
  valueChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  valueChipText: {
    fontFamily: TYPE.inter,
    fontSize: 11,
  },

  // Text input
  textInput: {
    fontFamily: TYPE.inter,
    fontSize: 14,
    borderWidth: 1,
    borderRadius: RADII.small,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  // Between input
  betweenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  betweenInput: {
    flex: 1,
  },
  betweenDash: {
    fontFamily: TYPE.inter,
    fontSize: 14,
  },

  // Tag input
  tagWrap: {
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  tagChipText: {
    fontFamily: TYPE.inter,
    fontSize: 11,
  },
  tagChipX: {
    fontFamily: TYPE.inter,
    fontSize: 13,
  },

  // Add condition button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADII.small,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addBtnText: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.6,
  },

  // Live preview card
  previewCard: {
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: RADII.card,
    paddingTop: 22,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  previewAccentRail: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  previewKicker: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.6,
  },
  previewStat: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 18,
    letterSpacing: 1,
  },

  // Thumbnails
  thumbStrip: {
    flexDirection: 'row',
    gap: 8,
  },
  thumbTile: {
    flex: 1,
    aspectRatio: 4 / 5,
    borderRadius: RADII.small,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
});
