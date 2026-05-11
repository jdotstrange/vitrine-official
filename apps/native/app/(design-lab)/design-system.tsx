/* eslint-disable react-native/no-inline-styles */
/**
 * Design System — V3 DNA gallery.
 *
 * Living source of truth for the Vault visual language. Every token we
 * extract must appear here. Every reusable component we build must render
 * here. If it's not in this screen, it doesn't exist in the system.
 *
 * Sections:
 *   § FOUNDATION  — color, typography, spacing, radii (Step 2, LIVE)
 *   § COMPONENTS  — atoms & molecules from components/vault/* (Step 3)
 *   § PATTERNS    — composed mini-surfaces (Step 3)
 *
 * Access: DEV-only entry under Nav Menu → Design Lab → Design System.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  MoreHorizontal,
  PackageOpen,
  SlidersHorizontal,
  Target,
  User,
} from 'lucide-react-native';

import { useTheme, COLORS, TYPE, SPACING, RADII, TRAIT_ORDER } from '@/lib/design';
import {
  StatusPill,
  StatusDot,
  TraitPill,
  MatchPercent,
  StatCell,
  SchemaRow,
  GridCard,
  ListCard,
  CompCard,
  Button,
  IconButton,
  Avatar,
  Chip,
  SearchBar,
  LensSelector,
  LensPager,
  FilterSheet,
  HolographicFrame,
  TopBar,
  EmptyState,
  SkeletonRect,
  SkeletonCircle,
  SpatialCard,
  CollectibleGridCard,
  CollectibleListCard,
  type CompData,
  type CollectibleCardData,
} from '@/components/vault';
import {
  CollectionFilterSheet,
  CollectionSortSheet,
  CollectionToolbar,
  CollectionTypePills,
  ViewModeSelector,
} from '@/components/collectibles';

// ===========================================================================
// TOKEN CATALOG — shape of the data rendered in the FOUNDATION section.
//
// The `path` field is the eventual dotted token name as it appears in the
// trailing comments of lib/design/tokens.ts. Exposing it next to the key
// in the gallery makes the token system legible to anyone reading this
// screen (designers, PMs, future-you) without them needing to open the
// source file.
// ===========================================================================

type ColorEntry = {
  key: keyof typeof COLORS;
  path: string;
};

type ColorGroup = {
  label: string;
  description: string;
  entries: ColorEntry[];
};

const COLOR_GROUPS: ColorGroup[] = [
  {
    label: 'CANVAS',
    description: 'The void. Page backgrounds and infinite-depth surfaces.',
    entries: [{ key: 'void', path: 'color.bg.canvas' }],
  },
  {
    label: 'TEXT',
    description: 'Four tiers of typographic hierarchy on void.',
    entries: [
      { key: 'textPrimary', path: 'color.text.primary' },
      { key: 'textSecondary', path: 'color.text.secondary' },
      { key: 'textTertiary', path: 'color.text.tertiary' },
      { key: 'textInverse', path: 'color.text.inverse' },
    ],
  },
  {
    label: 'STRUCTURE',
    description: 'Cool-white frost borders, graded by alpha.',
    entries: [
      { key: 'frostDivider', path: 'color.border.frost.soft' },
      { key: 'frostBorder', path: 'color.border.frost' },
      { key: 'frostBorderStrong', path: 'color.border.frost.strong' },
    ],
  },
  {
    label: 'SURFACES',
    description: 'Elevated sheets, press states, and scrims.',
    entries: [
      { key: 'sheetBg', path: 'color.bg.sheet' },
      { key: 'pressOverlay', path: 'color.bg.pressed' },
      { key: 'scrim', path: 'color.bg.scrim' },
    ],
  },
  {
    label: 'BRAND · VOLT',
    description: 'App identity accent. Active lens states, profile identity chrome, and brand moments.',
    entries: [
      { key: 'brandVolt', path: 'color.brand.volt' },
      { key: 'brandVoltFill', path: 'color.brand.volt.fill' },
      { key: 'brandVoltBorder', path: 'color.brand.volt.border' },
    ],
  },
  {
    label: 'SEMANTIC · GREEN',
    description: 'For Sale. Buy-primary intent.',
    entries: [
      { key: 'semanticGreen', path: 'color.semantic.green' },
      { key: 'semanticGreenFill', path: 'color.semantic.green.fill' },
      { key: 'semanticGreenBorder', path: 'color.semantic.green.border' },
    ],
  },
  {
    label: 'SEMANTIC · BLUE',
    description: 'For Trade. Swap-primary intent.',
    entries: [
      { key: 'semanticBlue', path: 'color.semantic.blue' },
      { key: 'semanticBlueFill', path: 'color.semantic.blue.fill' },
      { key: 'semanticBlueBorder', path: 'color.semantic.blue.border' },
    ],
  },
  {
    label: 'SEMANTIC · ORANGE',
    description: 'Sell + Trade. Dispatcher intent.',
    entries: [
      { key: 'semanticOrange', path: 'color.semantic.orange' },
      { key: 'semanticOrangeFill', path: 'color.semantic.orange.fill' },
      { key: 'semanticOrangeBorder', path: 'color.semantic.orange.border' },
    ],
  },
  {
    label: 'SEMANTIC · NEUTRAL & DESTRUCTIVE',
    description: 'NFST silver + destructive red. Yellow was retired.',
    entries: [
      { key: 'semanticSilverFill', path: 'color.semantic.silver.fill' },
      { key: 'semanticRed', path: 'color.semantic.red' },
    ],
  },
  {
    label: 'TRAIT · ROOKIE',
    description: 'Pink. First appearance.',
    entries: [
      { key: 'traitPink', path: 'color.trait.rookie' },
      { key: 'traitPinkFill', path: 'color.trait.rookie.fill' },
      { key: 'traitPinkBorder', path: 'color.trait.rookie.border' },
    ],
  },
  {
    label: 'TRAIT · SIGNED',
    description: 'Violet. Signature ink.',
    entries: [
      { key: 'traitViolet', path: 'color.trait.signed' },
      { key: 'traitVioletFill', path: 'color.trait.signed.fill' },
      { key: 'traitVioletBorder', path: 'color.trait.signed.border' },
    ],
  },
  {
    label: 'TRAIT · GAME USED',
    description: 'Olive. Field-worn — grass stain, aged canvas.',
    entries: [
      { key: 'traitOlive', path: 'color.trait.gameUsed' },
      { key: 'traitOliveFill', path: 'color.trait.gameUsed.fill' },
      { key: 'traitOliveBorder', path: 'color.trait.gameUsed.border' },
    ],
  },
  {
    label: 'TRAIT · GRADED',
    description: 'Cyan. Clinical precision.',
    entries: [
      { key: 'traitCyan', path: 'color.trait.graded' },
      { key: 'traitCyanFill', path: 'color.trait.graded.fill' },
      { key: 'traitCyanBorder', path: 'color.trait.graded.border' },
    ],
  },
];

type TypeSpecimenSpec = {
  family: keyof typeof TYPE;
  path: string;
  sample: string;
  sampleSize: number;
  sampleLetterSpacing?: number;
  role: string;
};

// One specimen per display-worthy family. Weight variants are listed in a
// compact sub-row beneath each primary specimen.
const TYPE_SPECIMENS: TypeSpecimenSpec[] = [
  {
    family: 'heroDisplay',
    path: 'type.family.heroDisplay',
    sample: 'THE VAULT',
    sampleSize: 38,
    sampleLetterSpacing: 1.4,
    role: 'Hero display. Titles, hero moments, screen identity.',
  },
  {
    family: 'grotesk',
    path: 'type.family.geometric',
    sample: 'SECTION · KICKER',
    sampleSize: 14,
    sampleLetterSpacing: 1.8,
    role: 'Kickers, section labels, nav chrome. 4 weights.',
  },
  {
    family: 'inter',
    path: 'type.family.body',
    sample: 'Body copy sets the floor for every readable surface in the app.',
    sampleSize: 15,
    role: 'Body + UI. 3 weights.',
  },
  {
    family: 'mono',
    path: 'type.family.mono',
    sample: 'PSA-10 · 2020 · #BQ15604',
    sampleSize: 13,
    sampleLetterSpacing: 0.4,
    role: 'Machine-readable data — IDs, numbers, codes, counts. 2 weights.',
  },
  {
    family: 'caslonText',
    path: 'type.family.serifText',
    sample: 'Editorial accents (reserve).',
    sampleSize: 18,
    role: 'Reserve serif — retained for editorial accents.',
  },
];

type SpacingEntry = { key: keyof typeof SPACING; path: string; note: string };

const SPACING_ENTRIES: SpacingEntry[] = [
  { key: 'cardEdge', path: 'spacing.cardEdge', note: 'Card margin so inner text lands at 20pt' },
  { key: 'kickerGap', path: 'spacing.kicker.gap', note: 'Kicker → content' },
  { key: 'rowPadY', path: 'spacing.row.y', note: 'Ledger row vertical' },
  { key: 'rowPadX', path: 'spacing.row.x', note: 'Ledger row horizontal' },
  { key: 'zoneIntra', path: 'spacing.zone.intra', note: 'Inside a cluster' },
  { key: 'gutter', path: 'spacing.gutter', note: 'Page horizontal padding' },
  { key: 'sectionGap', path: 'spacing.section.gap', note: 'Between sections' },
  { key: 'zoneCluster', path: 'spacing.zone.cluster', note: 'Between related clusters' },
  { key: 'zoneTransition', path: 'spacing.zone.transition', note: 'Between major zones' },
];

type RadiusEntry = { key: keyof typeof RADII; path: string };

const RADII_ENTRIES: RadiusEntry[] = [
  { key: 'sharp', path: 'radius.sharp' },
  { key: 'small', path: 'radius.small' },
  { key: 'medium', path: 'radius.medium' },
  { key: 'card', path: 'radius.card' },
  { key: 'pill', path: 'radius.pill' },
];

const TOKEN_COUNT =
  Object.keys(COLORS).length +
  Object.keys(TYPE).length +
  Object.keys(SPACING).length +
  Object.keys(RADII).length;

// Keep in sync with components/vault/index.ts. The header meta-line
// surfaces this so the system's scale is legible at a glance.
const COMPONENT_COUNT = 28;

// Grid geometry for card showcases — mirrors the sandbox's calc so the
// patterns read at the same density they will in production.
const { width: SCREEN_W } = Dimensions.get('window');
const GRID_GAP = 10;
const CARD_WIDTH_HALF = (SCREEN_W - SPACING.gutter * 2 - GRID_GAP) / 2;

// ===========================================================================
// SCREEN
// ===========================================================================

export default function DesignSystemScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.void }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 72,
          paddingBottom: insets.bottom + 64,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Header tokenCount={TOKEN_COUNT} />

        <Section
          kicker="§ FOUNDATION"
          description="Design tokens — the single source of truth for color, typography, spacing, and radii across the Vault. All values read from lib/design/tokens.ts."
        >
          <FoundationColor />
          <FoundationTypography />
          <FoundationSpacing />
          <FoundationRadii />
        </Section>

        <Section
          kicker="§ COMPONENTS"
          description="Reusable atoms and molecules from components/vault/*. Each component renders live here with every variant it supports."
        >
          <ComponentsCatalog />
        </Section>

        <Section
          kicker="§ PATTERNS"
          description="Composed mini-surfaces showing components working together (identity pill row, comps summary bar, comp card grid, schema rows)."
        >
          <PatternsCatalog />
        </Section>
      </ScrollView>

      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && { backgroundColor: colors.pressOverlay },
          ]}
          hitSlop={12}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

// ===========================================================================
// HEADER — page title + diagnostic status line
// ===========================================================================

function Header({ tokenCount }: { tokenCount: number }) {
  const { colors } = useTheme();
  return (
    <View style={headerStyles.wrap}>
      <Text style={[headerStyles.eyebrow, { color: colors.textTertiary }]}>VITRINE · THE VAULT</Text>
      <Text style={[headerStyles.title, { color: colors.textPrimary }]}>DESIGN SYSTEM · V3</Text>
      <View style={headerStyles.meta}>
        <Text style={[headerStyles.metaItem, { color: colors.textTertiary }]}>UPDATED 2026-04-28</Text>
        <Text style={[headerStyles.metaDot, { color: colors.textTertiary }]}>·</Text>
        <Text style={[headerStyles.metaItem, { color: colors.textTertiary }]}>STEP 3 / 3</Text>
        <Text style={[headerStyles.metaDot, { color: colors.textTertiary }]}>·</Text>
        <Text style={[headerStyles.metaItem, { color: colors.textTertiary }]}>{tokenCount} TOKENS</Text>
        <Text style={[headerStyles.metaDot, { color: colors.textTertiary }]}>·</Text>
        <Text style={[headerStyles.metaItem, { color: colors.textTertiary }]}>{COMPONENT_COUNT} COMPONENTS</Text>
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SPACING.gutter,
    marginBottom: 56,
  },
  eyebrow: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 2.0,
    marginBottom: 10,
  },
  title: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 32,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    fontFamily: TYPE.mono,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  metaDot: {
    fontFamily: TYPE.mono,
    fontSize: 10,
  },
});

// ===========================================================================
// SECTION — kicker + description + hairline + content
// ===========================================================================

function Section({
  kicker,
  description,
  children,
}: {
  kicker: string;
  description?: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={sectionStyles.wrap}>
      <Text style={[sectionStyles.kicker, { color: colors.textPrimary }]}>{kicker}</Text>
      {description ? (
        <Text style={[sectionStyles.description, { color: colors.textSecondary }]}>{description}</Text>
      ) : null}
      <View style={[sectionStyles.divider, { backgroundColor: colors.frostBorder }]} />
      <View style={sectionStyles.content}>{children}</View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: SPACING.gutter,
    marginBottom: SPACING.zoneTransition,
  },
  kicker: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 12,
    letterSpacing: 2.0,
    marginBottom: 10,
  },
  description: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: SPACING.zoneIntra,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 24,
  },
  content: {},
});

// ===========================================================================
// SUBSECTION — mini-kicker for a sub-category inside a Section
// ===========================================================================

function SubSection({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={subStyles.wrap}>
      <View style={subStyles.header}>
        <Text style={[subStyles.label, { color: colors.textSecondary }]}>— {label}</Text>
        <Text style={[subStyles.count, { color: colors.textTertiary }]}>{count}</Text>
      </View>
      <View style={subStyles.body}>{children}</View>
    </View>
  );
}

const subStyles = StyleSheet.create({
  wrap: {
    marginBottom: SPACING.zoneTransition,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: SPACING.zoneIntra,
  },
  label: {
    fontFamily: TYPE.mono,
    fontSize: 11,
    letterSpacing: 1.6,
  },
  count: {
    fontFamily: TYPE.mono,
    fontSize: 11,
    letterSpacing: 0.6,
  },
  body: {},
});

// ===========================================================================
// FOUNDATION · COLOR
// ===========================================================================

function FoundationColor() {
  const { colors } = useTheme();
  return (
    <SubSection label="COLOR" count={Object.keys(COLORS).length}>
      {COLOR_GROUPS.map((group) => (
        <View key={group.label} style={colorGroupStyles.group}>
          <Text style={[colorGroupStyles.groupLabel, { color: colors.textPrimary }]}>{group.label}</Text>
          <Text style={[colorGroupStyles.groupDescription, { color: colors.textTertiary }]}>{group.description}</Text>
          <View style={colorGroupStyles.list}>
            {group.entries.map((entry, idx) => (
              <ColorRow
                key={entry.key}
                entry={entry}
                isLast={idx === group.entries.length - 1}
              />
            ))}
          </View>
        </View>
      ))}
    </SubSection>
  );
}

function ColorRow({ entry, isLast }: { entry: ColorEntry; isLast: boolean }) {
  const { colors } = useTheme();
  const value = COLORS[entry.key];
  return (
    <View
      style={[
        colorRowStyles.row,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.frostDivider,
        },
      ]}
    >
      <View style={colorRowStyles.chipWrap}>
        <View
          style={[
            colorRowStyles.chip,
            { backgroundColor: value },
            {
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.frostBorder,
            },
          ]}
        />
      </View>
      <View style={colorRowStyles.meta}>
        <Text style={[colorRowStyles.key, { color: colors.textPrimary }]}>{entry.key}</Text>
        <Text style={[colorRowStyles.path, { color: colors.textTertiary }]}>{entry.path}</Text>
      </View>
      <Text style={[colorRowStyles.value, { color: colors.textSecondary }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const colorGroupStyles = StyleSheet.create({
  group: {
    marginBottom: SPACING.zoneCluster,
  },
  groupLabel: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 10,
    letterSpacing: 2.0,
    marginBottom: 4,
  },
  groupDescription: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: SPACING.zoneIntra,
  },
  list: {},
});

const colorRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  chipWrap: {
    width: 44,
    height: 44,
  },
  chip: {
    width: 44,
    height: 44,
    borderRadius: RADII.small,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  key: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  path: {
    fontFamily: TYPE.mono,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  value: {
    fontFamily: TYPE.mono,
    fontSize: 11,
    maxWidth: 140,
    textAlign: 'right',
  },
});

// ===========================================================================
// FOUNDATION · TYPOGRAPHY
// ===========================================================================

function FoundationTypography() {
  return (
    <SubSection label="TYPOGRAPHY" count={Object.keys(TYPE).length}>
      {TYPE_SPECIMENS.map((spec, idx) => (
        <TypeBlock
          key={spec.family}
          spec={spec}
          isLast={idx === TYPE_SPECIMENS.length - 1}
        />
      ))}
    </SubSection>
  );
}

function TypeBlock({ spec, isLast }: { spec: TypeSpecimenSpec; isLast: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        typeBlockStyles.wrap,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.frostDivider,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: TYPE[spec.family],
          fontSize: spec.sampleSize,
          letterSpacing: spec.sampleLetterSpacing ?? 0,
          color: colors.textPrimary,
          marginBottom: 12,
        }}
      >
        {spec.sample}
      </Text>
      <View style={typeBlockStyles.metaRow}>
        <Text style={[typeBlockStyles.key, { color: colors.textPrimary }]}>{spec.family}</Text>
        <Text style={[typeBlockStyles.family, { color: colors.textSecondary }]}>{TYPE[spec.family]}</Text>
      </View>
      <Text style={[typeBlockStyles.path, { color: colors.textTertiary }]}>{spec.path}</Text>
      <Text style={[typeBlockStyles.role, { color: colors.textSecondary }]}>{spec.role}</Text>
    </View>
  );
}

const typeBlockStyles = StyleSheet.create({
  wrap: {
    paddingVertical: SPACING.zoneIntra,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 2,
  },
  key: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  family: {
    fontFamily: TYPE.mono,
    fontSize: 10,
  },
  path: {
    fontFamily: TYPE.mono,
    fontSize: 10,
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  role: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    lineHeight: 18,
  },
});

// ===========================================================================
// FOUNDATION · SPACING
// ===========================================================================

function FoundationSpacing() {
  return (
    <SubSection label="SPACING" count={Object.keys(SPACING).length}>
      {SPACING_ENTRIES.map((entry, idx) => (
        <SpacingBar
          key={entry.key}
          entry={entry}
          isLast={idx === SPACING_ENTRIES.length - 1}
        />
      ))}
    </SubSection>
  );
}

function SpacingBar({ entry, isLast }: { entry: SpacingEntry; isLast: boolean }) {
  const { colors } = useTheme();
  const px = SPACING[entry.key];
  return (
    <View
      style={[
        spacingStyles.row,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.frostDivider,
        },
      ]}
    >
      <View style={spacingStyles.meta}>
        <Text style={[spacingStyles.key, { color: colors.textPrimary }]}>{entry.key}</Text>
        <Text style={[spacingStyles.path, { color: colors.textTertiary }]}>{entry.path}</Text>
        <Text style={[spacingStyles.note, { color: colors.textSecondary }]}>{entry.note}</Text>
      </View>
      <View style={spacingStyles.barCol}>
        <View style={[spacingStyles.bar, { width: px, backgroundColor: colors.textSecondary }]} />
        <Text style={[spacingStyles.value, { color: colors.textSecondary }]}>{px}pt</Text>
      </View>
    </View>
  );
}

const spacingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  key: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 13,
  },
  path: {
    fontFamily: TYPE.mono,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  note: {
    fontFamily: TYPE.inter,
    fontSize: 11,
    marginTop: 2,
  },
  barCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  bar: {
    height: 8,
    borderRadius: 2,
  },
  value: {
    fontFamily: TYPE.mono,
    fontSize: 11,
  },
});

// ===========================================================================
// FOUNDATION · RADII
// ===========================================================================

function FoundationRadii() {
  return (
    <SubSection label="RADII" count={Object.keys(RADII).length}>
      <View style={radiiStyles.grid}>
        {RADII_ENTRIES.map((entry) => (
          <RadiusSample key={entry.key} entry={entry} />
        ))}
      </View>
    </SubSection>
  );
}

function RadiusSample({ entry }: { entry: RadiusEntry }) {
  const { colors } = useTheme();
  const radius = RADII[entry.key];
  return (
    <View style={radiiStyles.sample}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.frostBorder,
          backgroundColor: colors.sheetBg,
        }}
      />
      <Text style={[radiiStyles.key, { color: colors.textPrimary }]}>{entry.key}</Text>
      <Text style={[radiiStyles.value, { color: colors.textSecondary }]}>{radius === 9999 ? '∞' : `${radius}pt`}</Text>
      <Text style={[radiiStyles.path, { color: colors.textTertiary }]}>{entry.path}</Text>
    </View>
  );
}

const radiiStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.zoneIntra,
  },
  sample: {
    alignItems: 'center',
    gap: 4,
    minWidth: 80,
  },
  key: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 0.4,
    marginTop: 8,
  },
  value: {
    fontFamily: TYPE.mono,
    fontSize: 10,
  },
  path: {
    fontFamily: TYPE.mono,
    fontSize: 9,
  },
});

// ===========================================================================
// COMPONENTS CATALOG — every atom + shell + composition in components/vault
// ===========================================================================

function ComponentsCatalog() {
  const { colors } = useTheme();
  return (
    <SubSection label="VAULT" count={COMPONENT_COUNT}>
      <ComponentShowcase
        name="STATUS PILL"
        importPath="import { StatusPill } from '@/components/vault'"
        description="Inline glass chip — listing status (For Sale / For Trade / Sell + Trade / NFST). Fill + border + text color flow from STATUS_CONFIG."
      >
        <ShowcaseRow>
          <StatusPill status="FOR_SALE" />
          <StatusPill status="FOR_TRADE" />
          <StatusPill status="SELL_TRADE" />
          <StatusPill status="NFST" />
        </ShowcaseRow>
      </ComponentShowcase>

      <ComponentShowcase
        name="STATUS DOT"
        importPath="import { StatusDot } from '@/components/vault'"
        description="Dot-only form of StatusPill. Two variants: inline (6pt, for dense legends) and overlay (7pt dot inside a 14pt dark bezel, for photo overlays)."
      >
        <ShowcaseSubLabel>inline</ShowcaseSubLabel>
        <ShowcaseRow>
          <StatusDot status="FOR_SALE" />
          <StatusDot status="FOR_TRADE" />
          <StatusDot status="SELL_TRADE" />
          <StatusDot status="NFST" />
        </ShowcaseRow>
        <ShowcaseSubLabel>overlay</ShowcaseSubLabel>
        <ShowcaseRow>
          <StatusDot status="FOR_SALE" variant="overlay" />
          <StatusDot status="FOR_TRADE" variant="overlay" />
          <StatusDot status="SELL_TRADE" variant="overlay" />
          <StatusDot status="NFST" variant="overlay" />
        </ShowcaseRow>
      </ComponentShowcase>

      <ComponentShowcase
        name="TRAIT PILL"
        importPath="import { TraitPill } from '@/components/vault'"
        description="Inline glass chip — collectible traits (Rookie / Signed / Game Used / Graded). Shares geometry with StatusPill — same material language, different hue zone. Returns null for unknown keys."
      >
        <ShowcaseRow>
          {TRAIT_ORDER.map((key) => (
            <TraitPill key={key} traitKey={key} />
          ))}
        </ShowcaseRow>
      </ComponentShowcase>

      <ComponentShowcase
        name="MATCH PERCENT"
        importPath="import { MatchPercent } from '@/components/vault'"
        description="Tiered match score for comps. Color bands from lib/design/match-tiers: ≥90 green (perfect), 70–89 blue (strong), <70 neutral (loose)."
      >
        <ShowcaseRow>
          <MatchPercent pct={98} />
          <MatchPercent pct={84} />
          <MatchPercent pct={65} />
        </ShowcaseRow>
      </ComponentShowcase>

      <ComponentShowcase
        name="STAT CELL"
        importPath="import { StatCell } from '@/components/vault'"
        description="Diagnostic readout cell — value over label. Mono by default for numeric data. Used inside summary bars and heads-up stat rails."
      >
        <View style={[catalogStyles.statRow, { borderColor: colors.frostBorder }]}>
          <StatCell label="COMPS" value="24" />
          <View style={[catalogStyles.statDivider, { backgroundColor: colors.frostDivider }]} />
          <StatCell label="AVG MATCH" value="87%" />
          <View style={[catalogStyles.statDivider, { backgroundColor: colors.frostDivider }]} />
          <StatCell label="MEDIAN" value="$2,400" />
        </View>
      </ComponentShowcase>

      <ComponentShowcase
        name="SCHEMA ROW"
        importPath="import { SchemaRow } from '@/components/vault'"
        description="Key/value ledger row with optional mono styling for machine-readable values. Bottom hairline divides rows in a group; pass isLast to suppress the divider on the terminal row."
      >
        <View style={catalogStyles.schemaGroup}>
          <SchemaRow label="Year" value="2020" />
          <SchemaRow label="Set" value="Topps Triple Threads" />
          <SchemaRow label="Serial" value="BQ15604" mono />
          <SchemaRow label="Grade" value="PSA 10" mono isLast />
        </View>
      </ComponentShowcase>

      <ComponentShowcase
        name="GRID CARD"
        importPath="import { GridCard } from '@/components/vault'"
        description="Generic grid-cell shell. Photo well + optional top-right overlay slot + meta slot via children. Selection haptic fires on press when onPress is set. Compose with variant-specific content (see CompCard)."
      >
        <View style={catalogStyles.cardPair}>
          <GridCard
            width={CARD_WIDTH_HALF - SPACING.gutter}
            accessibilityLabel="Example grid card with overlay"
          >
            <Text style={[catalogStyles.cardCaption, { color: colors.textTertiary }]}>with overlay slot</Text>
          </GridCard>
          <GridCard
            width={CARD_WIDTH_HALF - SPACING.gutter}
            overlay={<StatusDot status="FOR_SALE" variant="overlay" />}
            accessibilityLabel="Example grid card without overlay"
          >
            <Text style={[catalogStyles.cardCaption, { color: colors.textTertiary }]}>overlay = StatusDot</Text>
          </GridCard>
        </View>
      </ComponentShowcase>

      <ComponentShowcase
        name="COMP CARD"
        importPath="import { CompCard } from '@/components/vault'"
        description="Composition: GridCard shell + CompMeta content. Photo w/ status-dot overlay, match % + price baseline row, title, subtitle. Pure data — no outer frame."
      >
        <View style={catalogStyles.cardPair}>
          <CompCard
            comp={SHOWCASE_COMPS[0]}
            width={CARD_WIDTH_HALF - SPACING.gutter}
          />
          <CompCard
            comp={SHOWCASE_COMPS[1]}
            width={CARD_WIDTH_HALF - SPACING.gutter}
          />
        </View>
      </ComponentShowcase>

      <ComponentShowcase
        name="BUTTON"
        importPath="import { Button } from '@/components/vault'"
        description="CTA primitive with solid, frost, and ghost variants. Use for real actions before creating bespoke pressables."
      >
        <ShowcaseRow>
          <Button label="Follow" size="sm" />
          <Button label="Message" variant="frost" size="sm" />
          <Button label="Reset" variant="ghost" size="sm" />
        </ShowcaseRow>
      </ComponentShowcase>

      <ComponentShowcase
        name="ICON BUTTON"
        importPath="import { IconButton } from '@/components/vault'"
        description="Accessible 44pt icon-only affordance. Default is ghost; frost adds a quiet bezel for image or toolbar contexts."
      >
        <ShowcaseRow>
          <IconButton icon={MoreHorizontal} label="More options" />
          <IconButton icon={SlidersHorizontal} label="Filters" variant="frost" />
        </ShowcaseRow>
      </ComponentShowcase>

      <ComponentShowcase
        name="AVATAR"
        importPath="import { Avatar } from '@/components/vault'"
        description="User identity chrome with image and initials fallback. Ringed mode adds a frost outline for profile/card contexts."
      >
        <ShowcaseRow>
          <Avatar name="Ken Griffey Jr." size="xs" />
          <Avatar name="Ken Griffey Jr." size="sm" ringed />
          <Avatar name="Ken Griffey Jr." size="md" ringed />
          <Avatar name="Ken Griffey Jr." size="lg" ringed />
        </ShowcaseRow>
      </ComponentShowcase>

      <ComponentShowcase
        name="CHIP"
        importPath="import { Chip } from '@/components/vault'"
        description="Selectable text tag for filters, categories, and type toggles. Unlike StatusPill/TraitPill, Chip represents user choice."
      >
        <ShowcaseRow>
          <Chip label="All" selected />
          <Chip label="Cards" />
          <Chip label="Jerseys" />
          <Chip label="Locked" disabled />
        </ShowcaseRow>
      </ComponentShowcase>

      <ComponentShowcase
        name="SEARCH BAR"
        importPath="import { SearchBar } from '@/components/vault'"
        description="Search/filter input with leading glyph and trailing clear affordance. Use for collection, showcase, and search surfaces."
      >
        <SearchBar value="Jordan" onChange={() => {}} placeholder="Search collection" />
      </ComponentShowcase>

      <ComponentShowcase
        name="VIEW MODE SELECTOR"
        importPath="import { ViewModeSelector } from '@/components/collectibles'"
        description="Collection view-mode switcher for spatial, grid, and list browsing. Use inside collection/showcase toolbars."
      >
        <ViewModeSelector value="grid" onChange={() => {}} />
      </ComponentShowcase>

      <ComponentShowcase
        name="COLLECTION TYPE PILLS"
        importPath="import { CollectionTypePills } from '@/components/collectibles'"
        description="Horizontal type scoping row that pairs with CollectionToolbar and collection filters."
      >
        <CollectionTypePills
          types={['cards', 'jerseys', 'memorabilia']}
          selectedTypes={['cards']}
          onSelect={() => {}}
        />
      </ComponentShowcase>

      <ComponentShowcase
        name="COLLECTION SORT SHEET"
        importPath="import { CollectionSortSheet } from '@/components/collectibles'"
        description="Single-select sort sheet for collection surfaces. Uses FilterSheet chrome with radio-list rows."
      >
        <View style={[catalogStyles.mockSheet, { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg }]}>
          <Text style={[catalogStyles.mockSheetTitle, { color: colors.textPrimary }]}>SORT COLLECTION</Text>
          <Text style={[catalogStyles.mockSheetBody, { color: colors.textSecondary }]}>Recently Added · Highest Value · A-Z</Text>
        </View>
        <CollectionSortSheet
          visible={false}
          sortKey="recent"
          defaultKey="recent"
          options={[
            { key: 'recent', label: 'Recently Added', description: 'Newest items first' },
            { key: 'value_high', label: 'Highest Value', description: 'Estimated value, high to low' },
            { key: 'title_az', label: 'A-Z', description: 'Listing title alphabetically' },
          ]}
          onChange={() => {}}
          onClose={() => {}}
        />
      </ComponentShowcase>

      <ComponentShowcase
        name="COLLECTION FILTER SHEET"
        importPath="import { CollectionFilterSheet } from '@/components/collectibles'"
        description="Domain filter content for status, type, value, traits, people, and teams. Composes the vault FilterSheet shell."
      >
        <View style={[catalogStyles.mockSheet, { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg }]}>
          <Text style={[catalogStyles.mockSheetTitle, { color: colors.textPrimary }]}>FILTER COLLECTION</Text>
          <View style={[catalogStyles.mockSheetHandle, { backgroundColor: colors.textTertiary }]} />
          <ShowcaseRow>
            <Chip label="For Sale" selected />
            <Chip label="Signed" />
            <Chip label="$500+" />
          </ShowcaseRow>
        </View>
        <CollectionFilterSheet
          visible={false}
          filters={{
            statuses: ['FOR_SALE'],
            traits: ['is_rookie'],
            types: ['cards'],
            valueRange: { min: null, max: null },
            people: [],
            teams: [],
          }}
          options={{
            statuses: [{ value: 'FOR_SALE', label: 'For Sale', count: 12 }],
            traits: [{ value: 'is_rookie', label: 'Rookie', count: 8 }],
            types: [{ value: 'cards', label: 'Cards', count: 24 }],
            valueBounds: { min: 0, max: 5000 },
            people: [{ value: 'Michael Jordan', label: 'Michael Jordan', count: 6 }],
            teams: [{ value: 'Chicago Bulls', label: 'Chicago Bulls', count: 6 }],
          }}
          resultCount={24}
          onClose={() => {}}
          onReset={() => {}}
          onChange={() => {}}
        />
      </ComponentShowcase>

      <ComponentShowcase
        name="LENS SELECTOR"
        importPath="import { LensSelector } from '@/components/vault'"
        description="Horizontal segmented navigation for switching one entity through related views. Supports locked items for future paywalls."
      >
        <LensSelector
          activeKey="collection"
          onChange={() => {}}
          items={[
            { key: 'profile', label: 'Profile' },
            { key: 'collection', label: 'Collection' },
            { key: 'showcases', label: 'Showcases', locked: true },
          ]}
        />
        <LensSelector
          activeKey="profile"
          onChange={() => {}}
          variant="display"
          items={[
            { key: 'profile', label: 'Profile' },
            { key: 'collection', label: 'Collection' },
            { key: 'showcase', label: 'Showcase' },
          ]}
        />
      </ComponentShowcase>

      <ComponentShowcase
        name="LENS PAGER"
        importPath="import { LensPager } from '@/components/vault'"
        description="Swipeable page body that pairs with LensSelector when a screen supports horizontal lens gestures."
      >
        <View style={[catalogStyles.pagerDemo, { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg }]}>
          <LensPager index={0} onIndexChange={() => {}}>
            <View style={catalogStyles.pagerPage}>
              <Text style={[catalogStyles.pagerKicker, { color: colors.brandVolt }]}>PAGE 01</Text>
              <Text style={[catalogStyles.pagerText, { color: colors.textPrimary }]}>Specs lens body</Text>
            </View>
            <View style={catalogStyles.pagerPage}>
              <Text style={[catalogStyles.pagerKicker, { color: colors.brandVolt }]}>PAGE 02</Text>
              <Text style={[catalogStyles.pagerText, { color: colors.textPrimary }]}>Comps lens body</Text>
            </View>
          </LensPager>
        </View>
      </ComponentShowcase>

      <ComponentShowcase
        name="FILTER SHEET"
        importPath="import { FilterSheet } from '@/components/vault'"
        description="Bottom-sheet shell for filters, sort controls, and focused settings. The live modal is intentionally closed in the gallery; composition examples appear in Patterns."
      >
        <View style={[catalogStyles.mockSheet, { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg }]}>
          <Text style={[catalogStyles.mockSheetTitle, { color: colors.textPrimary }]}>FILTER COLLECTION</Text>
          <View style={[catalogStyles.mockSheetHandle, { backgroundColor: colors.textTertiary }]} />
          <ShowcaseRow>
            <Chip label="For Sale" selected />
            <Chip label="Signed" />
            <Chip label="$500+" />
          </ShowcaseRow>
        </View>
        <FilterSheet visible={false} title="Filter Collection" onClose={() => {}}>
          <Text />
        </FilterSheet>
      </ComponentShowcase>

      <ComponentShowcase
        name="LIST CARD"
        importPath="import { ListCard } from '@/components/vault'"
        description="Horizontal shell for dense rows. Owns thumbnail, optional overlay slot, press behavior, and trailing meta column."
      >
        <ListCard overlay={<StatusDot status="FOR_SALE" variant="overlay" />}>
          <Text style={[catalogStyles.listTitle, { color: colors.textPrimary }]}>1998 Skybox Premium Star Rubies</Text>
          <Text style={[catalogStyles.listSub, { color: colors.textSecondary }]}>ListCard shell + custom meta</Text>
        </ListCard>
      </ComponentShowcase>

      <ComponentShowcase
        name="TOP BAR"
        importPath="import { TopBar } from '@/components/vault'"
        description="Safe-area-aware screen navigation shell with left, center, and right slots. Use overlay over imagery or solid over canvas."
      >
        <View style={[catalogStyles.topBarDemo, { borderColor: colors.frostBorder }]}>
          <TopBar
            variant="solid"
            left={<IconButton icon={ArrowLeft} label="Back" />}
            center={<Text style={[catalogStyles.topBarTitle, { color: colors.textPrimary }]}>THE VAULT</Text>}
            right={<IconButton icon={MoreHorizontal} label="More" />}
            style={catalogStyles.topBarStatic}
          />
        </View>
      </ComponentShowcase>

      <ComponentShowcase
        name="EMPTY STATE"
        importPath="import { EmptyState } from '@/components/vault'"
        description="Centered empty/error/zero-results state with optional icon and CTA. Copy should stay short and actionable."
      >
        <EmptyState
          icon={PackageOpen}
          title="No collectibles yet"
          subtitle="Start your vault by uploading a grail."
          action={{ label: 'Upload', onPress: () => {} }}
        />
      </ComponentShowcase>

      <ComponentShowcase
        name="SKELETON"
        importPath="import { SkeletonRect, SkeletonCircle } from '@/components/vault'"
        description="Quiet loading placeholders: rectangles for cards/rows/bars and circles for avatars/dots."
      >
        <View style={catalogStyles.skeletonRow}>
          <SkeletonCircle size={44} />
          <View style={catalogStyles.skeletonStack}>
            <SkeletonRect width="70%" height={12} />
            <SkeletonRect width="45%" height={10} />
          </View>
        </View>
      </ComponentShowcase>

      <ComponentShowcase
        name="HOLOGRAPHIC FRAME"
        importPath="import { HolographicFrame } from '@/components/vault'"
        description="Reusable semantic chrome for featured objects. Use standard for hero modules and subtle for dense card states."
      >
        <HolographicFrame intensity="subtle" borderRadius={RADII.card}>
          <View style={[catalogStyles.holoDemo, { backgroundColor: colors.sheetBg }]}>
            <Text style={[catalogStyles.holoTitle, { color: colors.textPrimary }]}>CROWN JEWEL</Text>
            <Text style={[catalogStyles.holoSub, { color: colors.textSecondary }]}>Subtle feature state</Text>
          </View>
        </HolographicFrame>
      </ComponentShowcase>

      <ComponentShowcase
        name="SPATIAL CARD"
        importPath="import { SpatialCard } from '@/components/vault'"
        description="Immersive single-column collectible card. Supports adaptive image, badges, tracking count, double-tap track, and badge toggle."
      >
        <SpatialCard item={SHOWCASE_COLLECTIBLE} isTracked />
      </ComponentShowcase>

      <ComponentShowcase
        name="COLLECTIBLE GRID CARD"
        importPath="import { CollectibleGridCard } from '@/components/vault'"
        description="Scan-first 2-column collectible card: image, two-line title, and inline StatusDot only."
      >
        <CollectibleGridCard
          item={SHOWCASE_COLLECTIBLE}
          width={CARD_WIDTH_HALF - SPACING.gutter}
        />
      </ComponentShowcase>

      <ComponentShowcase
        name="COLLECTIBLE LIST CARD"
        importPath="import { CollectibleListCard } from '@/components/vault'"
        description="Dense collectible row with status/trait dots, two-line title, and price. Best for high-volume browsing."
        isLast
      >
        <CollectibleListCard item={SHOWCASE_COLLECTIBLE} />
      </ComponentShowcase>
    </SubSection>
  );
}

// Showcase fixtures — stable across renders, span multiple tiers + statuses
// so the gallery demonstrates every visual band without having to scroll.
const SHOWCASE_COMPS: CompData[] = [
  {
    id: 'demo-1',
    title: 'Mike Trout',
    subtitle: '2020 TTT Ruby /10',
    price: 3200,
    matchPct: 98,
    status: 'FOR_SALE',
  },
  {
    id: 'demo-2',
    title: 'Mike Trout',
    subtitle: '2019 Immaculate Patch /25',
    price: 2100,
    matchPct: 81,
    status: 'FOR_TRADE',
  },
  {
    id: 'demo-3',
    title: 'Mike Trout',
    subtitle: '2022 Topps Chrome Red /5',
    price: 1800,
    matchPct: 74,
    status: 'NFST',
  },
  {
    id: 'demo-4',
    title: 'Mike Trout',
    subtitle: '2021 Panini Prizm Gold',
    price: 1450,
    matchPct: 65,
    status: 'SELL_TRADE',
  },
];

const SHOWCASE_COLLECTIBLE: CollectibleCardData = {
  id: 'vault-card-demo',
  photoUrl: null,
  title: '1998 Skybox Premium Star Rubies Michael Jordan',
  subtitle: 'Basketball Card',
  price: '$24.5K',
  status: 'FOR_SALE',
  traits: ['is_graded', 'is_rookie'],
  trackingCount: 128,
};

// ---------------------------------------------------------------------------
// ComponentShowcase — single block renderer for a component in the catalog
// ---------------------------------------------------------------------------

function ComponentShowcase({
  name,
  importPath,
  description,
  isLast,
  children,
}: {
  name: string;
  importPath: string;
  description: string;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        showcaseStyles.wrap,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.frostDivider,
        },
      ]}
    >
      <Text style={[showcaseStyles.name, { color: colors.textPrimary }]}>{name}</Text>
      <Text style={[showcaseStyles.importPath, { color: colors.textTertiary }]} numberOfLines={1}>
        {importPath}
      </Text>
      <View style={showcaseStyles.well}>{children}</View>
      <Text style={[showcaseStyles.description, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  );
}

function ShowcaseRow({ children }: { children: React.ReactNode }) {
  return <View style={showcaseStyles.row}>{children}</View>;
}

function ShowcaseSubLabel({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[showcaseStyles.subLabel, { color: colors.textTertiary }]}>{children}</Text>;
}

// ===========================================================================
// PATTERNS CATALOG — composed mini-surfaces. Each pattern demonstrates how
// vault components snap together on a real screen. These are the "atoms →
// molecules → organisms" progression we rely on when we build production
// surfaces, made visible.
// ===========================================================================

function PatternsCatalog() {
  const { colors } = useTheme();
  return (
    <SubSection label="COMPOSITIONS" count={8}>
      <PatternShowcase
        name="IDENTITY PILL ROW"
        composedOf="StatusPill + TraitPill"
        description="State rail at the top of the identity strip. Status always leads (transactional state) followed by traits (object qualities). Horizontal scroll at small widths."
      >
        <View style={patternStyles.identityRow}>
          <StatusPill status="FOR_SALE" />
          <TraitPill traitKey="is_rookie" />
          <TraitPill traitKey="is_autographed" />
          <TraitPill traitKey="is_graded" />
        </View>
      </PatternShowcase>

      <PatternShowcase
        name="COMPS SUMMARY BAR"
        composedOf="StatCell × 3"
        description="Three-cell diagnostic bar. Top + bottom hairlines anchor it to the canvas without a boxed container; vertical hairlines split the cells."
      >
        <View style={[patternStyles.summaryWrap, { borderColor: colors.frostBorder }]}>
          <View style={patternStyles.summaryRow}>
            <StatCell label="COMPS" value="24" />
            <View style={[patternStyles.summaryDivider, { backgroundColor: colors.frostDivider }]} />
            <StatCell label="AVG MATCH" value="87%" />
            <View style={[patternStyles.summaryDivider, { backgroundColor: colors.frostDivider }]} />
            <StatCell label="MEDIAN" value="$2,400" />
          </View>
        </View>
      </PatternShowcase>

      <PatternShowcase
        name="COMP CARD GRID"
        composedOf="CompCard × N (GridCard shell + CompMeta content)"
        description="2-column grid of comp cards. Each card shows a status-dot overlay, color-tiered match %, price, title, subtitle. Pure data, no chrome."
      >
        <View style={patternStyles.compGrid}>
          {SHOWCASE_COMPS.map((comp) => (
            <CompCard
              key={comp.id}
              comp={comp}
              width={CARD_WIDTH_HALF - SPACING.gutter}
            />
          ))}
        </View>
      </PatternShowcase>

      <PatternShowcase
        name="SCHEMA CARD"
        composedOf="SchemaRow × N"
        description="Frame-less data group. Rows float on the canvas, internal hairlines do the structural work. Used for Collectible Details, Authenticity Details, and any key:value readout."
      >
        <View style={patternStyles.schemaCard}>
          <SchemaRow label="Year" value="2020" />
          <SchemaRow label="Set" value="Topps Triple Threads" />
          <SchemaRow label="Player" value="Mike Trout" />
          <SchemaRow label="Serial" value="BQ15604" mono />
          <SchemaRow label="Grade" value="PSA 10" mono isLast />
        </View>
      </PatternShowcase>

      <PatternShowcase
        name="COLLECTIBLE VIEW MODES"
        composedOf="SpatialCard + CollectibleGridCard + CollectibleListCard"
        description="The canonical collection browsing family. Spatial is immersive, grid is scan-first, and list is dense/data-forward."
      >
        <View style={patternStyles.viewModeStack}>
          <SpatialCard item={SHOWCASE_COLLECTIBLE} isTracked />
          <View style={patternStyles.cardModeRow}>
            <CollectibleGridCard
              item={SHOWCASE_COLLECTIBLE}
              width={CARD_WIDTH_HALF - SPACING.gutter}
            />
            <View style={patternStyles.listModeWrap}>
              <CollectibleListCard item={SHOWCASE_COLLECTIBLE} />
            </View>
          </View>
        </View>
      </PatternShowcase>

      <PatternShowcase
        name="SEARCH FILTER SORT BAR"
        composedOf="CollectionToolbar + SearchBar + ViewModeSelector"
        description="Canonical collection/showcase toolbar: sheet search, brand active filter/sort controls, and compact view switching."
      >
        <View style={patternStyles.toolbarPattern}>
          <CollectionToolbar
            searchQuery=""
            onSearchChange={() => {}}
            viewMode="grid"
            onViewModeChange={() => {}}
            activeFilterCount={2}
            sortLabel="A-Z"
            onOpenFilter={() => {}}
            onOpenSort={() => {}}
          />
          <ShowcaseRow>
            <Chip label="All" selected />
            <Chip label="Cards" />
            <Chip label="Memorabilia" />
          </ShowcaseRow>
        </View>
      </PatternShowcase>

      <PatternShowcase
        name="BRAND ACTIVE STATE"
        composedOf="COLORS.brandVolt + brandVoltFill + brandVoltBorder"
        description="Brand accent is app identity chrome, separate from traitOlive. Use for active lenses, selected controls, handles, and brand moments."
      >
        <View style={patternStyles.brandStateRow}>
          <View style={[patternStyles.brandSwatch, { backgroundColor: colors.brandVolt }]} />
          <Text style={[patternStyles.brandLabel, { color: colors.brandVolt }]}>@COLLECTOR</Text>
          <View style={[patternStyles.brandPill, { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill }]}>
            <Text style={[patternStyles.brandPillText, { color: colors.textPrimary }]}>ACTIVE</Text>
          </View>
        </View>
      </PatternShowcase>

      <PatternShowcase
        name="HOLOGRAPHIC FEATURE STATE"
        composedOf="HolographicFrame + card family"
        description="Semantic feature chrome for Crown Jewel and Featured Showcase. Standard intensity for hero modules; subtle intensity for collection/showcase cards."
        isLast
      >
        <View style={patternStyles.holoPair}>
          <HolographicFrame intensity="standard" borderRadius={RADII.card}>
            <View style={[patternStyles.holoFeatureCard, { backgroundColor: colors.sheetBg }]}>
              <Text style={[patternStyles.holoFeatureKicker, { color: colors.textTertiary }]}>STANDARD</Text>
              <Text style={[patternStyles.holoFeatureTitle, { color: colors.textPrimary }]}>Crown Jewel</Text>
            </View>
          </HolographicFrame>
          <HolographicFrame intensity="subtle" borderRadius={RADII.card}>
            <View style={[patternStyles.holoFeatureCard, { backgroundColor: colors.sheetBg }]}>
              <Text style={[patternStyles.holoFeatureKicker, { color: colors.textTertiary }]}>SUBTLE</Text>
              <Text style={[patternStyles.holoFeatureTitle, { color: colors.textPrimary }]}>Featured Card</Text>
            </View>
          </HolographicFrame>
        </View>
      </PatternShowcase>
    </SubSection>
  );
}

function PatternShowcase({
  name,
  composedOf,
  description,
  isLast,
  children,
}: {
  name: string;
  composedOf: string;
  description: string;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        showcaseStyles.wrap,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.frostDivider,
        },
      ]}
    >
      <Text style={[showcaseStyles.name, { color: colors.textPrimary }]}>{name}</Text>
      <Text style={[showcaseStyles.composedOf, { color: colors.textTertiary }]} numberOfLines={1}>
        {composedOf}
      </Text>
      <View style={showcaseStyles.well}>{children}</View>
      <Text style={[showcaseStyles.description, { color: colors.textSecondary }]}>{description}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// SHOWCASE + CATALOG STYLES
// ---------------------------------------------------------------------------

const showcaseStyles = StyleSheet.create({
  wrap: {
    paddingVertical: SPACING.zoneIntra,
  },
  name: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 12,
    letterSpacing: 1.6,
    marginBottom: 4,
  },
  importPath: {
    fontFamily: TYPE.mono,
    fontSize: 10,
    marginBottom: SPACING.zoneIntra,
  },
  composedOf: {
    fontFamily: TYPE.mono,
    fontSize: 10,
    marginBottom: SPACING.zoneIntra,
  },
  well: {
    paddingVertical: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  subLabel: {
    fontFamily: TYPE.mono,
    fontSize: 10,
    letterSpacing: 0.4,
    marginTop: 4,
  },
  description: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
});

const catalogStyles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 14,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
  },
  schemaGroup: {},
  cardPair: {
    flexDirection: 'row',
    gap: GRID_GAP,
  },
  pagerDemo: {
    height: 112,
    overflow: 'hidden',
    borderRadius: RADII.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pagerPage: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.zoneIntra,
    gap: 6,
  },
  pagerKicker: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  pagerText: {
    fontFamily: TYPE.inter,
    fontSize: 14,
  },
  mockSheet: {
    borderRadius: RADII.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: SPACING.zoneIntra,
    gap: 12,
  },
  mockSheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    opacity: 0.6,
  },
  mockSheetTitle: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  mockSheetBody: {
    fontFamily: TYPE.inter,
    fontSize: 12,
  },
  listTitle: {
    fontFamily: TYPE.interSemiBold,
    fontSize: 14,
  },
  listSub: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    marginTop: 4,
  },
  topBarDemo: {
    height: 64,
    overflow: 'hidden',
    borderRadius: RADII.card,
    borderWidth: StyleSheet.hairlineWidth,
  },
  topBarStatic: {
    position: 'relative',
    paddingTop: 0,
  },
  topBarTitle: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonStack: {
    flex: 1,
    gap: 8,
  },
  holoDemo: {
    minHeight: 96,
    padding: SPACING.zoneIntra,
    justifyContent: 'center',
  },
  holoTitle: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 1.4,
  },
  holoSub: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    marginTop: 4,
  },
  cardCaption: {
    fontFamily: TYPE.mono,
    fontSize: 10,
    letterSpacing: 0.3,
  },
});

const patternStyles = StyleSheet.create({
  identityRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  summaryWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },
  compGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: GRID_GAP,
    rowGap: 18,
  },
  schemaCard: {
    backgroundColor: 'transparent',
  },
  viewModeStack: {
    gap: SPACING.zoneIntra,
  },
  cardModeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: GRID_GAP,
  },
  listModeWrap: {
    flex: 1,
    minWidth: 0,
  },
  toolbarPattern: {
    gap: 12,
  },
  brandStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  brandSwatch: {
    width: 36,
    height: 36,
    borderRadius: RADII.small,
  },
  brandLabel: {
    fontFamily: TYPE.monoMedium,
    fontSize: 13,
    letterSpacing: 1.2,
  },
  brandPill: {
    borderRadius: RADII.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  brandPillText: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  holoPair: {
    gap: 12,
  },
  holoFeatureCard: {
    minHeight: 92,
    padding: SPACING.zoneIntra,
    justifyContent: 'center',
  },
  holoFeatureKicker: {
    fontFamily: TYPE.monoMedium,
    fontSize: 9,
    letterSpacing: 1.1,
  },
  holoFeatureTitle: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 16,
    marginTop: 6,
  },
});

// ===========================================================================
// STYLES — screen chrome
// ===========================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    left: SPACING.gutter - 8,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADII.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
