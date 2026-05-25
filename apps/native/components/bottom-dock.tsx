import { useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Search, Target, Send } from 'lucide-react-native';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/lib/design';
import { useAuth } from '@/lib/contexts/auth-context';
import { useStream } from '@/lib/contexts/stream-context';
import { useFeeds } from '@/lib/contexts/feeds-context';
import { Avatar, VitrineMarkIcon } from '@/components/vault';
import { BadgeDot, CountBadge } from './ui/badge-indicator';

const tabs = [
  { id: 'tracking', label: 'TRACK', icon: Target, href: '/(tabs)/tracking' },
  { id: 'add', label: 'UPLOAD', icon: VitrineMarkIcon, href: '/(tabs)/upload' },
  { id: 'explore', label: 'MARKET', icon: Search, href: '/(tabs)/explore' },
  { id: 'messages', label: 'MESSAGES', icon: Send, href: '/(tabs)/messages' },
];

interface BottomDockProps {
  activeTab?: string;
  scrollDirection?: 'up' | 'down' | null;
}

export function BottomDock({
  activeTab: propActiveTab,
}: BottomDockProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { client, isReady: streamReady } = useStream();
  const { unseenCount } = useFeeds();
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const [tabLayouts, setTabLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const [unreadMessages, setUnreadMessages] = useState(0);

  const getActiveTab = () => {
    if (propActiveTab) return propActiveTab;
    if (pathname === '/(tabs)' || pathname === '/(tabs)/') return 'profile';
    if (pathname?.includes('/explore')) return 'explore';
    if (pathname?.includes('/upload')) return 'add';
    if (pathname?.includes('/tracking')) return 'tracking';
    if (pathname?.includes('/messages')) return 'messages';
    return 'profile';
  };

  const activeTab = getActiveTab();
  const activeLayout = tabLayouts[activeTab];

  useEffect(() => {
    if (!activeLayout) return;
    const pillWidthTarget = 58;
    pillX.value = withSpring(activeLayout.x + activeLayout.width / 2 - pillWidthTarget / 2, {
      damping: 22,
      stiffness: 180,
      mass: 0.8,
    });
    pillWidth.value = withSpring(pillWidthTarget, {
      damping: 22,
      stiffness: 180,
      mass: 0.8,
    });
  }, [activeLayout, pillWidth, pillX]);

  useEffect(() => {
    if (!streamReady) {
      setUnreadMessages(0);
      return;
    }

    setUnreadMessages(client.user?.total_unread_count ?? 0);

    const handleEvent = (event: { total_unread_count?: number }) => {
      if (typeof event.total_unread_count === 'number') {
        setUnreadMessages(event.total_unread_count);
      }
    };

    client.on('notification.mark_read', handleEvent);
    client.on('notification.message_new', handleEvent);
    client.on('message.new', handleEvent);
    client.on('message.read', handleEvent);

    return () => {
      client.off('notification.mark_read', handleEvent);
      client.off('notification.message_new', handleEvent);
      client.off('message.new', handleEvent);
      client.off('message.read', handleEvent);
    };
  }, [streamReady, client]);

  const pillStyle = useAnimatedStyle(() => ({
    opacity: pillWidth.value > 0 ? 1 : 0,
    width: pillWidth.value,
    transform: [{ translateX: pillX.value }],
  }));

  const handleNavLayout = (id: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts((current) => {
      const existing = current[id];
      if (existing && existing.x === x && existing.width === width) return current;
      return { ...current, [id]: { x, width } };
    });
  };

  const profileIsActive = activeTab === 'profile';

  const isDark = colors.void === '#000000';

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 10),
          borderTopColor: colors.frostBorder,
          shadowColor: colors.brandVolt,
          backgroundColor: isDark ? 'rgba(0, 0, 0, 0.70)' : 'rgba(255, 255, 255, 0.82)',
        },
      ]}
    >
      <BlurView intensity={28} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[styles.glassOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.68)' : 'rgba(255, 255, 255, 0.72)' }]} />
      <View style={styles.navBar}>
        <View style={[styles.topGlow, { backgroundColor: colors.brandVolt }]} />
        <Animated.View pointerEvents="none" style={[styles.activePill, { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill }, pillStyle]} />

        {/* Profile avatar — first position, with activity badge */}
        <TouchableOpacity
          onPress={() => router.push('/(tabs)')}
          style={styles.navButton}
          onLayout={(event) => handleNavLayout('profile', event)}
          activeOpacity={0.72}
          accessibilityRole="button"
          accessibilityState={{ selected: profileIsActive }}
          accessibilityLabel="Profile"
        >
          <View>
            <Avatar
              uri={user?.avatarUrl}
              name={user?.displayName}
              size="xs"
              ringed
            />
            <BadgeDot visible={unseenCount > 0} color={colors.brandVolt} />
          </View>
        </TouchableOpacity>

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isAdd = tab.id === 'add';
          const isMessages = tab.id === 'messages';

          if (isAdd) {
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => router.push(tab.href)}
                style={[styles.scanButton, {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                  shadowColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.25)',
                }]}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Upload a collectible"
              >
                <View style={[styles.scanButtonGlow, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]} />
                <View style={[styles.scanHalo, { backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }]} />
                <View style={[styles.scanButtonInnerRing, { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }]} />
                <Icon size={36} color={isDark ? colors.brandVolt : '#1A1A1A'} />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => router.push(tab.href)}
              style={styles.navButton}
              onLayout={(event) => handleNavLayout(tab.id, event)}
              activeOpacity={0.72}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              <View>
                <Icon
                  size={22}
                  color={colors.textTertiary}
                  strokeWidth={1.8}
                />
                {isMessages && (
                  <CountBadge count={unreadMessages} color={colors.semanticBlue} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 24,
    overflow: 'visible',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 66,
    paddingTop: 14,
    paddingHorizontal: 14,
    position: 'relative',
    overflow: 'visible',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: '28%',
    right: '28%',
    height: 1,
    opacity: 0.36,
  },
  navButton: {
    flex: 1,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
  },
  activePill: {
    position: 'absolute',
    top: 18,
    left: 0,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 1,
  },
  scanButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
    marginTop: -34,
    borderWidth: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.56,
    shadowRadius: 18,
    elevation: 32,
    zIndex: 4,
  },
  scanButtonInnerRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1,
  },
  scanButtonGlow: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
  },
  scanHalo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
  },
});
