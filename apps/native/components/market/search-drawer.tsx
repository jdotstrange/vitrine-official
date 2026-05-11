/**
 * SearchDrawer — State 2 body (focused, no query yet).
 *
 * Shows recent searches (up to 2, with timestamps) and an empty-state hint.
 * Tap a recent search → re-executes it. Swipe-to-delete / X button removes it.
 */
import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { X, Clock } from 'lucide-react-native';

import type { RecentSearch } from '@/lib/storage/recent-searches';
import { useTheme, RADII, TYPE } from '@/lib/design';

interface SearchDrawerProps {
  recentSearches: RecentSearch[];
  onSelectSearch: (query: string) => void;
  onDeleteSearch: (query: string) => void;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function SearchDrawer({ recentSearches, onSelectSearch, onDeleteSearch }: SearchDrawerProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {recentSearches.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Recent</Text>
          {recentSearches.map((item) => (
            <Pressable
              key={item.query}
              onPress={() => onSelectSearch(item.query)}
              style={({ pressed }) => [
                styles.recentRow,
                { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg },
                pressed && styles.recentRowPressed,
              ]}
            >
              <Clock size={14} color={colors.textTertiary} strokeWidth={1.5} />
              <Text style={[styles.recentQuery, { color: colors.textPrimary }]} numberOfLines={1}>{item.query}</Text>
              <Text style={[styles.recentTime, { color: colors.textTertiary }]}>{formatRelativeTime(item.searchedAt)}</Text>
              <Pressable
                onPress={() => onDeleteSearch(item.query)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.query}`}
              >
                <X size={13} color={colors.textTertiary} strokeWidth={2} />
              </Pressable>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.hint}>
        <Text style={[styles.hintText, { color: colors.textTertiary }]}>Search collectibles, showcases, and collectors</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
    gap: 24,
  },
  section: {
    gap: 4,
  },
  sectionTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.35,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: RADII.medium,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  recentRowPressed: {
    opacity: 0.7,
  },
  recentQuery: {
    flex: 1,
    fontFamily: TYPE.inter,
    fontSize: 14,
  },
  recentTime: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
  },
  hint: {
    alignItems: 'center',
    paddingTop: 8,
  },
  hintText: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    textAlign: 'center',
  },
});
