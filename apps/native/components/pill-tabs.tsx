import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { colors } from '@/lib/colors';

export interface Tab {
  id: string;
  label: string;
}

interface PillTabsProps {
  tabs: Tab[] | string[];
  activeTab: string | null;
  onChange: (tabId: string | null) => void;
  includeAll?: boolean;
  allLabel?: string;
}

export function PillTabs({
  tabs,
  activeTab,
  onChange,
  includeAll = false,
  allLabel = 'ALL',
}: PillTabsProps) {
  // Normalize tabs to Tab[] format
  const normalizedTabs: Tab[] = tabs.map((tab) =>
    typeof tab === 'string' ? { id: tab, label: tab.toUpperCase() } : tab
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {includeAll && (
        <TouchableOpacity
          onPress={() => onChange(null)}
          style={[
            styles.tab,
            activeTab === null ? styles.tabActive : styles.tabInactive,
          ]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${allLabel} tab`}
          accessibilityState={{ selected: activeTab === null }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === null
                ? styles.tabTextActive
                : { color: colors.mutedForeground },
            ]}
          >
            {allLabel}
          </Text>
        </TouchableOpacity>
      )}
      {normalizedTabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => onChange(tab.id)}
          style={[
            styles.tab,
            activeTab === tab.id ? styles.tabActive : styles.tabInactive,
          ]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${tab.label} tab`}
          accessibilityState={{ selected: activeTab === tab.id }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.id
                ? styles.tabTextActive
                : { color: colors.mutedForeground },
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabInactive: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: colors.primaryForeground,
  },
});
