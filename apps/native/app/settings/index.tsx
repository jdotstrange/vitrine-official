import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowLeft, User, Bell, Shield, KeyRound, UserX, FileText, ChevronRight, Sun, Moon, Smartphone } from 'lucide-react-native';
import { useTheme, TYPE, SPACING, RADII } from '@/lib/design';
import type { ThemeMode } from '@/lib/design';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

/**
 * OTA verification stamp: publish time + short ID of the update this launch
 * is actually running. Set once by expo-updates at startup — if a production
 * OTA applied, this shows its publish time; "embedded build" means the app
 * is on the JS bundled into the binary (no OTA yet on this runtimeVersion).
 */
const OTA_STAMP =
  Updates.isEmbeddedLaunch || !Updates.createdAt
    ? 'embedded build'
    : `${Updates.createdAt.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })}, ${Updates.createdAt.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      })}${Updates.updateId ? ` · ${Updates.updateId.slice(0, 8)}` : ''}`;

type SettingsSection = {
  title: string | null;
  items: { icon: typeof User; label: string; route: string }[];
};

const settingsSections: SettingsSection[] = [
  {
    title: null,
    items: [
      { icon: User, label: 'Edit Profile', route: '/settings/profile' },
    ],
  },
  {
    title: 'PREFERENCES',
    items: [
      { icon: Bell, label: 'Notifications', route: '/settings/notifications' },
    ],
  },
  {
    title: 'PRIVACY & SECURITY',
    items: [
      { icon: KeyRound, label: 'Account Settings', route: '/settings/account' },
      { icon: Shield, label: 'Privacy Settings', route: '/settings/privacy' },
      { icon: UserX, label: 'Blocked Users', route: '/settings/blocked' },
    ],
  },
  {
    title: 'LEGAL',
    items: [
      { icon: FileText, label: 'Privacy Policy', route: '/settings/privacy-policy' },
      { icon: FileText, label: 'Terms of Service', route: '/settings/terms' },
    ],
  },
];

const THEME_OPTIONS: { mode: ThemeMode; icon: typeof Sun }[] = [
  { mode: 'light', icon: Sun },
  { mode: 'dark', icon: Moon },
  { mode: 'auto', icon: Smartphone },
];

export default function SettingsPage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, mode, setMode } = useTheme();

  return (
    <View style={[s.container, { backgroundColor: colors.void }]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 48 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header row with back, title, and theme toggle */}
        <View style={s.header}>
          <Pressable
            onPress={() => router.back()}
            style={s.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={[s.title, { color: colors.textPrimary }]}>Settings</Text>

          {/* Theme segmented control */}
          <View style={[s.themeToggle, { borderColor: colors.frostBorder }]}>
            {THEME_OPTIONS.map(({ mode: m, icon: Icon }) => {
              const active = mode === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMode(m)}
                  style={[
                    s.themeBtn,
                    active && { backgroundColor: colors.brandVoltFill },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Theme: ${m}`}
                  accessibilityState={{ selected: active }}
                >
                  <Icon
                    size={14}
                    color={active ? colors.brandVolt : colors.textTertiary}
                    strokeWidth={active ? 2.2 : 1.5}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Sections */}
        {settingsSections.map((section, si) => (
          <View key={si} style={s.section}>
            {section.title && (
              <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>
                {section.title}
              </Text>
            )}
            <View style={[s.card, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
              {section.items.map((item, ii) => {
                const Icon = item.icon;
                const isLast = ii === section.items.length - 1;
                return (
                  <Pressable
                    key={ii}
                    style={({ pressed }) => [
                      s.row,
                      !isLast && [s.rowBorder, { borderBottomColor: colors.frostDivider }],
                      pressed && { backgroundColor: colors.pressOverlay },
                    ]}
                    onPress={() => router.push(item.route as Href)}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                  >
                    <Icon size={18} color={colors.textTertiary} />
                    <Text style={[s.rowLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                    <ChevronRight size={16} color={colors.textTertiary} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {/* Version footer */}
        <Text style={[s.version, { color: colors.textTertiary }]}>Vitrine v{APP_VERSION}</Text>
        <Text style={[s.otaStamp, { color: colors.textTertiary }]}>
          Last updated: {OTA_STAMP}
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.gutter,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: SPACING.zoneCluster,
    marginTop: SPACING.gutter,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 22,
  },
  themeToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: RADII.pill,
    overflow: 'hidden',
  },
  themeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: SPACING.sectionGap,
  },
  sectionTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: SPACING.kickerGap,
    marginLeft: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: RADII.medium,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.rowPadX,
    paddingVertical: SPACING.rowPadY,
  },
  rowBorder: {
    borderBottomWidth: 1,
  },
  rowLabel: {
    flex: 1,
    fontFamily: TYPE.inter,
    fontSize: 15,
  },
  version: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
    textAlign: 'center',
    marginTop: SPACING.zoneCluster,
  },
  otaStamp: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.7,
  },
});
