import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { GroupDiscoverCard } from './group-discover-card';
import { GroupCardSkeleton } from '@/components/skeleton';
import { colors } from '@/lib/colors';
import type { Group } from '@/lib/api/messaging';

type SectionVariant = 'default' | 'compact';

interface DiscoverSectionProps {
  title: string;
  groups: Group[];
  isLoading?: boolean;
  onGroupPress: (groupId: string) => void;
  variant?: SectionVariant;
}

export function DiscoverSection({
  title,
  groups,
  isLoading,
  onGroupPress,
  variant = 'default',
}: DiscoverSectionProps) {
  if (!isLoading && groups.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {isLoading ? (
        <View style={styles.skeletonRow}>
          {Array.from({ length: 3 }).map((_, i) => (
            <GroupCardSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          horizontal
          data={groups}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          renderItem={({ item }) => (
            <GroupDiscoverCard
              group={item}
              onPress={() => onGroupPress(item.id)}
              variant={variant}
            />
          )}
          ItemSeparatorComponent={Separator}
        />
      )}
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  separator: {
    width: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
});
