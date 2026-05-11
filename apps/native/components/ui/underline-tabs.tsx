import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '@/lib/colors';

export interface Tab {
  id: string;
  label: string;
}

interface UnderlineTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
}

export function UnderlineTabs({ tabs, activeTab, onChange }: UnderlineTabsProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          onPress={() => onChange(tab.id)}
          style={styles.tab}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.id && styles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
          {activeTab === tab.id && <View style={styles.underline} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  tabTextActive: {
    color: colors.foreground,
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 2,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
});
