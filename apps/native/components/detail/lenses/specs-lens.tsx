import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { SchemaRow, StatusPill, TraitPill } from '@/components/vault';
import { useTheme, SPACING, TYPE, type ListingStatus } from '@/lib/design';

import { LensEmpty } from './lens-empty';

/**
 * SPECS lens — the "reference / cataloging" surface.
 *
 * Where DETAILS is for *experiencing* the object (image-forward,
 * narrative), SPECS is for *referencing* it (data-forward,
 * spreadsheet-quiet). Promoted from the design-lab sandbox's `SpecsLens`
 * (line ~1404 of [`app/(design-lab)/collectible-detail.tsx`]) with a
 * compact identity strip added at the top so the lens reads grounded
 * when entered via swipe (no hero context to anchor it otherwise).
 *
 * Sections (when populated):
 *   - COLLECTIBLE DETAILS   — schema rows from `aiMetadata`
 *   - AUTHENTICITY DETAILS  — verifications ledger + trait_metadata rows
 *
 * Empty all-around state falls back to `<LensEmpty />`. With the
 * collection-quality assumption (every item rich in DETAILS + SPECS),
 * the empty branch should be effectively unreachable in production.
 */

// ---------------------------------------------------------------------------
// LOCAL DATA HELPERS — mirror the sandbox's normalization rules so the
// production SPECS lens renders the same canonical shape we tuned
// against. If we extract these later, callers swap to the shared module
// without changing visuals.
// ---------------------------------------------------------------------------

const SKIP_KEYS_AI = new Set(['notes', 'customizations']);
const SKIP_KEYS_TRAIT = new Set(['item_type', 'authentications', 'verification_url']);
const MONO_KEY_PATTERNS =
  /(year|serial|number|cert|id|grade|confidence|print_run|count|ratio|edition|score|code)/i;

type SpecRow = {
  key: string;
  label: string;
  kind: 'text' | 'mono';
  value: string;
};

type Authentication = {
  company: string | null;
  number: string | null;
};

function looksLikeCode(value: string): boolean {
  if (!value) return false;
  if (!/\d/.test(value)) return false;
  if (/^\d{4}$/.test(value)) return true;
  if (/^\d+\s*\/\s*\d+$/.test(value)) return true;
  if (/^[A-Z0-9][A-Z0-9\s\-/]+$/i.test(value) && value.length <= 24) return true;
  if (/^\d+(\.\d+)?%$/.test(value)) return true;
  if (/^\d+\.\d+$/.test(value)) return true;
  return false;
}

function shouldMono(key: string, value: string): boolean {
  if (MONO_KEY_PATTERNS.test(key)) return true;
  return looksLikeCode(value);
}

function humanizeKey(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  const first = str.charAt(0);
  const upper = first.toUpperCase();
  return first === upper ? str : upper + str.slice(1);
}

function isPopulated(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string' && v.trim() === '') return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

function formatScalar(v: unknown): string | null {
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    const parts = v.map(formatScalar).filter((p): p is string => !!p);
    return parts.length ? parts.join(', ') : null;
  }
  return null;
}

function jsonbToRows(
  data: Record<string, unknown> | null | undefined,
  skipKeys: Set<string>,
): SpecRow[] {
  if (!data) return [];
  const rows: SpecRow[] = [];

  for (const [rawKey, value] of Object.entries(data)) {
    if (skipKeys.has(rawKey.toLowerCase())) continue;
    if (!isPopulated(value)) continue;

    const label = capitalizeFirst(humanizeKey(rawKey));
    const display = formatScalar(value);
    if (display === null) continue;

    const final = capitalizeFirst(display);
    rows.push({
      key: rawKey,
      label,
      kind: shouldMono(rawKey, final) ? 'mono' : 'text',
      value: final,
    });
  }

  return rows;
}

function buildAuthentications(auths: unknown): Authentication[] | null {
  if (!Array.isArray(auths) || auths.length === 0) return null;

  const entries: Authentication[] = [];
  for (const entry of auths) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const company =
      typeof e.company === 'string' && e.company.trim() ? e.company.trim() : null;
    const number =
      typeof e.number === 'string' && e.number.trim() ? e.number.trim() : null;
    if (!company && !number) continue;
    entries.push({ company, number });
  }

  return entries.length ? entries : null;
}

// ---------------------------------------------------------------------------
// LENS COMPONENT
// ---------------------------------------------------------------------------

export interface SpecsLensProps {
  title: string;
  status: ListingStatus;
  /** Trait keys (e.g. 'is_autographed'). */
  traitKeys: string[];
  /** Raw `ai_metadata` JSONB column from the row. */
  aiMetadata?: Record<string, unknown> | null;
  /** Raw `trait_metadata` JSONB column from the row. */
  traitMetadata?: Record<string, unknown> | null;
  bottomInset: number;
  dockReservedHeight: number;
}

export function SpecsLens({
  title,
  status,
  traitKeys,
  aiMetadata,
  traitMetadata,
  bottomInset,
  dockReservedHeight,
}: SpecsLensProps) {
  const { colors } = useTheme();
  const collectibleDetailRows = useMemo(
    () => jsonbToRows(aiMetadata ?? null, SKIP_KEYS_AI),
    [aiMetadata],
  );
  const authenticityDetailRows = useMemo(
    () => jsonbToRows(traitMetadata ?? null, SKIP_KEYS_TRAIT),
    [traitMetadata],
  );
  const authentications = useMemo(
    () =>
      buildAuthentications(
        (traitMetadata as Record<string, unknown> | undefined)?.authentications,
      ),
    [traitMetadata],
  );

  const hasAuthenticitySection =
    (authentications && authentications.length > 0) ||
    authenticityDetailRows.length > 0;
  const hasAnything = collectibleDetailRows.length > 0 || hasAuthenticitySection;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: bottomInset + dockReservedHeight + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <CompactIdentity title={title} status={status} traitKeys={traitKeys} />

      {!hasAnything ? (
        <View style={styles.emptyWrap}>
          <LensEmpty
            kicker="SPECS"
            title="NO SPECS YET"
            message="No structured data has been added to this collectible."
          />
        </View>
      ) : (
        <>
          {collectibleDetailRows.length > 0 ? (
            <Section kicker="COLLECTIBLE DETAILS">
              <SpecCard>
                {collectibleDetailRows.map((row, i) => (
                  <SchemaRow
                    key={row.key}
                    label={row.label}
                    value={row.value}
                    mono={row.kind === 'mono'}
                    isLast={i === collectibleDetailRows.length - 1}
                  />
                ))}
              </SpecCard>
            </Section>
          ) : null}

          {hasAuthenticitySection ? (
            <Section kicker="AUTHENTICITY DETAILS">
              {authentications && authentications.length > 0 ? (
                <AuthenticationsLedger
                  entries={authentications}
                  bottomMargin={authenticityDetailRows.length > 0}
                />
              ) : null}
              {authenticityDetailRows.length > 0 ? (
                <SpecCard>
                  {authenticityDetailRows.map((row, i) => (
                    <SchemaRow
                      key={row.key}
                      label={row.label}
                      value={row.value}
                      mono={row.kind === 'mono'}
                      isLast={i === authenticityDetailRows.length - 1}
                    />
                  ))}
                </SpecCard>
              ) : null}
            </Section>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// SUB-COMPONENTS — local to SPECS so the section/card chrome stays
// tunable without leaking into other lenses.
// ---------------------------------------------------------------------------

function CompactIdentity({
  title,
  status,
  traitKeys,
}: {
  title: string;
  status: ListingStatus;
  traitKeys: string[];
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.identityWrap}>
      <Text style={[styles.identityTitle, { color: colors.textPrimary }]} numberOfLines={2}>
        {title}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.identityPills}
      >
        <StatusPill status={status} inverted />
        {traitKeys.map((key) => (
          <TraitPill key={key} traitKey={key} />
        ))}
      </ScrollView>
    </View>
  );
}

function Section({
  kicker,
  children,
}: {
  kicker: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionKicker, { color: colors.textSecondary }]}>{kicker}</Text>
      {children}
    </View>
  );
}

function SpecCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.specCard}>{children}</View>;
}

function AuthenticationsLedger({
  entries,
  bottomMargin,
}: {
  entries: Authentication[];
  bottomMargin: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.specCard,
        bottomMargin ? styles.specCardSpaced : null,
      ]}
    >
      <View style={ledgerStyles.headerRow}>
        <Text style={[ledgerStyles.headerLabel, { color: colors.textTertiary }]}>VERIFIED BY</Text>
        <Text style={[ledgerStyles.headerLabel, { color: colors.textTertiary }]}>CERT #</Text>
      </View>
      <View style={[ledgerStyles.headerDivider, { backgroundColor: colors.frostBorder }]} />
      {entries.map((entry, i) => (
        <View
          key={`${entry.company ?? 'na'}-${i}`}
          style={[
            ledgerStyles.row,
            i < entries.length - 1 && [ledgerStyles.rowDivider, { borderBottomColor: colors.frostDivider }],
          ]}
        >
          <View style={ledgerStyles.leftCol}>
            <View style={[ledgerStyles.verifiedDot, { backgroundColor: colors.semanticGreen }]} />
            <Text style={[ledgerStyles.company, { color: colors.textPrimary }]} numberOfLines={1}>
              {entry.company || '—'}
            </Text>
          </View>
          <Text
            style={[ledgerStyles.certNumber, { color: colors.textPrimary }]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {entry.number || '—'}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    paddingTop: 16,
  },
  identityWrap: {
    paddingHorizontal: SPACING.gutter,
    marginBottom: 8,
  },
  identityTitle: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0.6,
    marginBottom: SPACING.zoneIntra,
  },
  identityPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  section: {
    marginTop: 28,
  },
  sectionKicker: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    paddingHorizontal: SPACING.gutter,
    marginBottom: SPACING.kickerGap,
  },
  specCard: {
    marginHorizontal: SPACING.cardEdge,
    backgroundColor: 'transparent',
  },
  specCardSpaced: {
    marginBottom: 10,
  },
  emptyWrap: {
    marginTop: 32,
    paddingHorizontal: SPACING.gutter,
  },
});

const ledgerStyles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.rowPadX,
    paddingTop: 12,
    paddingBottom: 10,
  },
  headerLabel: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: SPACING.rowPadX,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.rowPadX,
    paddingVertical: 14,
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  company: {
    fontFamily: TYPE.interMedium,
    fontSize: 14,
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  certNumber: {
    fontFamily: TYPE.monoMedium,
    fontSize: 13,
    letterSpacing: 0.4,
    flexShrink: 0,
    maxWidth: '55%',
    textAlign: 'right',
  },
});
