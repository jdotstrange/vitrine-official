import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Download } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionIcon } from './ui/action-icon';

export function SettingsExport() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <ActionIcon icon={ArrowLeft} onPress={() => router.back()} label="Go back" size={20} />
          <View>
            <Text style={styles.headerTitle}>Export Collection</Text>
            <Text style={styles.headerSubtitle}>// download your data</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Download size={36} color={colors.mutedForeground} />
        </View>
        <Text style={styles.title}>Coming Soon</Text>
        <Text style={styles.description}>
          We're building CSV and JSON export so you can download your full collection, showcases, and
          metadata anytime. This will be available in a future update.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontFamily: 'monospace',
  },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },
});
