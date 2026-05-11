import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { ChevronRight, PenTool, Trophy, Star } from 'lucide-react-native';
import { type ListingStatus, getStatusConfig } from '@/lib/status-utils';
import { formatAddedOn } from '@/lib/format-time';
import { colors } from '@/lib/colors';

export interface TraitPill {
  label: string;
}

export interface IdentityStripProps {
  title: string;
  listingTitle?: string | null;
  status: ListingStatus;
  traits?: string[] | null;
  collectibleType?: string | null;
  collector: string;
  isOwner: boolean;
  listedAt: Date | string | number;
  onCollectorClick?: () => void;
}

const COLLECTIBLE_TYPE_LABELS: Record<string, string> = {
  memorabilia: 'Memorabilia',
  trading_card: 'Trading Card',
};

function formatCollectibleType(type?: string | null): string | null {
  if (!type) return null;
  if (COLLECTIBLE_TYPE_LABELS[type]) return COLLECTIBLE_TYPE_LABELS[type];
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function deriveTraitPills(traits?: string[] | null): TraitPill[] {
  const pills: TraitPill[] = [];
  if (traits?.includes('is_autographed')) pills.push({ label: 'Signed' });
  if (traits?.includes('is_game_used')) pills.push({ label: 'Game Used' });
  if (traits?.includes('is_rookie')) pills.push({ label: 'Rookie' });
  return pills;
}

function StatusBadge({ status }: { status: ListingStatus }) {
  const cfg = getStatusConfig(status);
  return (
    <View style={[styles.pill, { backgroundColor: cfg.bgColor, borderColor: cfg.borderColor }]}>
      <Text style={[styles.pillText, { color: cfg.textColor, letterSpacing: 0.8 }]}>
        {cfg.label.toUpperCase()}
      </Text>
    </View>
  );
}

function TraitPillView({ pill }: { pill: TraitPill }) {
  const icon =
    pill.label === 'Signed' ? PenTool :
    pill.label === 'Game Used' ? Trophy :
    pill.label === 'Rookie' ? Star : null;
  return (
    <View style={[styles.pill, styles.pillHighlight]}>
      {icon && React.createElement(icon, { size: 12, color: colors.accent })}
      <Text style={[styles.pillText, styles.pillTextHighlight]}>{pill.label}</Text>
    </View>
  );
}

export function IdentityStrip({
  title,
  listingTitle,
  status,
  traits,
  collectibleType,
  collector,
  isOwner,
  listedAt,
  onCollectorClick,
}: IdentityStripProps) {
  const displayTitle = listingTitle || title;
  const pills = deriveTraitPills(traits);
  const addedOn = formatAddedOn(listedAt);
  const typeLabel = formatCollectibleType(collectibleType);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgeRow}
      >
        <StatusBadge status={status} />
        {pills.map((pill, i) => (
          <TraitPillView key={`${pill.label}-${i}`} pill={pill} />
        ))}
      </ScrollView>

      <View style={styles.titleBlock}>
        {typeLabel && <Text style={styles.kicker}>{typeLabel}</Text>}
        <Text style={styles.title}>{displayTitle}</Text>
      </View>

      {isOwner ? (
        <View style={styles.collectorRow}>
          <Text style={styles.collectorMuted}>In your collection</Text>
          <Text style={styles.dotSeparator}>·</Text>
          <Text style={styles.collectorMuted}>{addedOn}</Text>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onCollectorClick}
          style={styles.collectorRow}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`View ${collector}'s profile`}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {collector.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </Text>
          </View>
          <Text style={styles.collectorMuted}>Collected by {collector}</Text>
          <Text style={styles.dotSeparator}>·</Text>
          <Text style={styles.collectorMuted}>{addedOn}</Text>
          <ChevronRight size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingBottom: 4,
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
  },
  titleBlock: {
    paddingHorizontal: 20,
    gap: 4,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.mutedForeground,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  collectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
    paddingHorizontal: 20,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.foreground,
  },
  collectorMuted: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  dotSeparator: {
    fontSize: 13,
    color: colors.mutedForeground,
    opacity: 0.5,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillHighlight: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent + '40',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextHighlight: {
    color: colors.accent,
  },
});
