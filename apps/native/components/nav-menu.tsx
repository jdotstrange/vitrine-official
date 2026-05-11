import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Modal, Pressable } from 'react-native';
import { X, Settings, LogOut, Send, Bell } from 'lucide-react-native';
import { useRouter, type Href } from 'expo-router';
import { BlurView } from 'expo-blur';
import { OptimizedImage } from './optimized-image';
import { VitrineLogo } from './vitrine-logo';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { useStream } from '@/lib/contexts/stream-context';
import { useFeeds } from '@/lib/contexts/feeds-context';
import Animated, {
  useAnimatedStyle,
  withTiming,
  ZoomIn,
  ZoomOut,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.7; // 70% of screen width

interface NavMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const staticPrimaryItems = [
  { label: 'Messages', href: '/messages', hasUnread: false, count: 0, icon: Send },
  { label: 'Notifications', href: '/notifications', hasUnread: false, count: 0, icon: Bell },
];

// Test links for auth flow
const testItems = [
  { label: 'Login (TEST)', href: '/login', hasUnread: false },
  { label: 'Signup (TEST)', href: '/signup', hasUnread: false },
];

// Design lab sandboxes — DEV-only entries for iterating on new visual DNA
// in isolation from production screens. See docs/COLLECTIBLE_DETAIL_SANDBOX_SPEC.md.
const designLabItems = [
  { label: 'Design System (V3)', href: '/design-system', hasUnread: false },
  { label: 'Collectible Detail (V3 DNA)', href: '/collectible-detail', hasUnread: false },
];

export function NavMenu({ isOpen, onClose }: NavMenuProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { client, isReady } = useStream();
  const { unseenCount: feedsUnseenCount } = useFeeds();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isReady) {
      setUnreadCount(0);
      return;
    }
    setUnreadCount(client.user?.total_unread_count ?? 0);

    const handleEvent = (event: { total_unread_count?: number }) => {
      if (typeof event.total_unread_count === 'number') {
        setUnreadCount(event.total_unread_count);
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
  }, [isReady, client]);

  const primaryItems = staticPrimaryItems.map((item) => {
    if (item.label === 'Messages') return { ...item, hasUnread: unreadCount > 0, count: unreadCount };
    if (item.label === 'Notifications') return { ...item, hasUnread: feedsUnseenCount > 0, count: feedsUnseenCount };
    return item;
  });

  const handleItemPress = (href: string) => {
    onClose();
    router.push(href as Href);
  };

  const handleSignOut = async () => {
    onClose();
    await logout();
  };

  const drawerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withTiming(isOpen ? 0 : DRAWER_WIDTH, {
            duration: 300,
          }),
        },
      ],
    };
  });

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isOpen ? 1 : 0, { duration: 200 }),
    };
  });

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close menu">
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.backdrop,
              backdropAnimatedStyle,
            ]}
          >
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="light" />
          </Animated.View>
        </Pressable>

        {/* Drawer */}
        <Animated.View
          style={[
            styles.drawerContainer,
            { paddingTop: insets.top },
            drawerAnimatedStyle,
          ]}
        >
          <BlurView intensity={95} style={StyleSheet.absoluteFill} tint="light" />
          <View style={styles.drawerOverlay} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <VitrineLogo width={80} height={24} color={colors.foreground} />
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Close menu"
            >
              <X size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileContainer}>
              <View style={styles.avatarContainer}>
                {user?.avatarUrl ? (
                  <OptimizedImage
                    source={{ uri: user.avatarUrl }}
                    style={styles.avatar}
                    contentFit="cover"
                    accessibilityLabel={`${user.displayName || 'Your'} profile photo`}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>
                      {(user?.displayName || user?.username || 'V')[0].toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.displayName || 'Collector'}</Text>
                <Text style={styles.profileHandle}>{user?.username ? `@${user.username}` : ''}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleItemPress('/(tabs)')}
                style={styles.viewProfileButton}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="View profile"
              >
                <Text style={styles.viewProfileText}>View</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView
            style={styles.menuItems}
            contentContainerStyle={styles.menuItemsContent}
            showsVerticalScrollIndicator={false}
          >
            {primaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => handleItemPress(item.href)}
                  style={styles.menuItem}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <View style={styles.menuItemLeft}>
                    <Icon size={16} color={item.hasUnread ? colors.foreground : colors.mutedForeground} />
                    <Text style={[styles.menuItemText, item.hasUnread && styles.menuItemTextActive]}>{item.label}</Text>
                  </View>
                  {item.label === 'Messages' && item.count > 0 ? (
                    <Animated.View entering={ZoomIn.duration(200)} exiting={ZoomOut.duration(150)} style={styles.countPill}>
                      <Text style={styles.countPillText}>{item.count > 9 ? '9+' : item.count}</Text>
                    </Animated.View>
                  ) : item.hasUnread ? (
                    <Animated.View entering={ZoomIn.duration(200)} exiting={ZoomOut.duration(150)} style={styles.unreadDot} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
            
            {__DEV__ && (
              <>
                <View style={styles.testSection}>
                  <Text style={styles.testSectionLabel}>Design Lab</Text>
                  {designLabItems.map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      onPress={() => handleItemPress(item.href)}
                      style={styles.menuItem}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                    >
                      <Text style={[styles.menuItemText, styles.testItemText]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.testSection}>
                  <Text style={styles.testSectionLabel}>Testing</Text>
                  {testItems.map((item) => (
                    <TouchableOpacity
                      key={item.label}
                      onPress={() => handleItemPress(item.href)}
                      style={styles.menuItem}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                    >
                      <Text style={[styles.menuItemText, styles.testItemText]}>{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </ScrollView>

          {/* Footer Links */}
          <View style={styles.footerLinks}>
            <TouchableOpacity
              onPress={() => handleItemPress('/settings/help')}
              style={styles.footerLink}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Help Center"
            >
              <Text style={styles.footerLinkText}>Help Center</Text>
            </TouchableOpacity>
            <View style={styles.footerLinkRow}>
              <TouchableOpacity
                onPress={() => handleItemPress('/settings/privacy-policy')}
                style={styles.footerLink}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Privacy policy"
              >
                <Text style={styles.footerLinkText}>Privacy</Text>
              </TouchableOpacity>
              <Text style={styles.footerLinkSeparator}>/</Text>
              <TouchableOpacity
                onPress={() => handleItemPress('/settings/terms')}
                style={styles.footerLink}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Terms of service"
              >
                <Text style={styles.footerLinkText}>Terms</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Actions */}
          <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity
              onPress={() => handleItemPress('/settings')}
              style={styles.settingsButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Settings size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSignOut}
              style={styles.signOutButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
            >
              <LogOut size={20} color={colors.destructive} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: 'transparent',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoContainer: {
    height: 24,
    justifyContent: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: `${colors.primary}4D`, // 30% opacity
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    backgroundColor: colors.primary + '20',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.foreground,
  },
  profileHandle: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  viewProfileButton: {
    paddingVertical: 4,
  },
  viewProfileText: {
    fontSize: 12,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  menuItems: {
    flex: 1,
  },
  menuItemsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    minHeight: 44,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuItemText: {
    fontSize: 14,
    color: colors.mutedForeground,
  },
  menuItemTextActive: {
    color: colors.foreground,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.attention,
  },
  countPill: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.attention,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.background,
    lineHeight: 13,
  },
  footerLinks: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: `${colors.border}80`, // 50% opacity
    gap: 4,
  },
  footerLink: {
    paddingVertical: 4,
  },
  footerLinkText: {
    fontSize: 12,
    color: `${colors.mutedForeground}99`, // 60% opacity
  },
  footerLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerLinkSeparator: {
    fontSize: 12,
    color: `${colors.mutedForeground}66`, // 40% opacity
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  signOutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: `${colors.destructive}1A`,
    borderWidth: 1,
    borderColor: `${colors.destructive}33`,
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.destructive,
  },
  testSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: `${colors.border}40`, // 25% opacity
  },
  testSectionLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.mutedForeground + '66', // 40% opacity
    marginBottom: 8,
  },
  testItemText: {
    color: colors.primary + 'CC', // 80% opacity
  },
});
