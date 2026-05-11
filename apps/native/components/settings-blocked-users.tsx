import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, UserX } from 'lucide-react-native';
import { useTheme, TYPE, SPACING, RADII } from '@/lib/design';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/lib/contexts/auth-context';
import { getBlockedUsers, unblockUser, type BlockedUser } from '@/lib/api/blocked';

export function SettingsBlockedUsers() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  const loadBlockedUsers = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getBlockedUsers(user.id);
      setBlockedUsers(data);
    } catch (err) {
      console.error('Failed to load blocked users:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadBlockedUsers();
  }, [loadBlockedUsers]);

  const handleUnblock = (item: BlockedUser) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock @${item.user.username ?? 'this user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            if (!user?.id) return;
            setUnblocking(item.id);
            try {
              await unblockUser(user.id, item.blocked_id);
              setBlockedUsers((prev) => prev.filter((b) => b.id !== item.id));
            } catch (err) {
              console.error('Failed to unblock:', err);
              Alert.alert('Error', 'Failed to unblock user. Please try again.');
            } finally {
              setUnblocking(null);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: BlockedUser }) => (
    <View style={[s.row, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
      <View style={s.rowLeft}>
        {item.user.avatar_url ? (
          <Image source={{ uri: item.user.avatar_url }} style={s.avatar} />
        ) : (
          <View style={[s.avatar, s.avatarPlaceholder, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
            <UserX size={16} color={colors.textTertiary} />
          </View>
        )}
        <View>
          <Text style={[s.displayName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.user.display_name || 'Unknown'}
          </Text>
          {item.user.username && (
            <Text style={[s.username, { color: colors.textSecondary }]} numberOfLines={1}>
              @{item.user.username}
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[s.unblockBtn, { borderColor: colors.frostBorder }]}
        onPress={() => handleUnblock(item)}
        disabled={unblocking === item.id}
        accessibilityRole="button"
        accessibilityLabel={`Unblock ${item.user.username}`}
      >
        {unblocking === item.id ? (
          <ActivityIndicator size="small" color={colors.textSecondary} />
        ) : (
          <Text style={[s.unblockText, { color: colors.textSecondary }]}>Unblock</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[s.container, { paddingTop: insets.top, backgroundColor: colors.void }]}>
      <View style={[s.header, { borderBottomColor: colors.frostDivider }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.textPrimary }]}>Blocked Users</Text>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.brandVolt} />
        </View>
      ) : blockedUsers.length === 0 ? (
        <View style={s.center}>
          <UserX size={40} color={colors.textTertiary} />
          <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>No blocked users</Text>
          <Text style={[s.emptySubtitle, { color: colors.textSecondary }]}>You haven't blocked anyone</Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: SPACING.gutter,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 16,
  },
  emptySubtitle: {
    fontFamily: TYPE.inter,
    fontSize: 14,
  },
  list: {
    padding: SPACING.gutter,
    gap: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: RADII.small,
    paddingHorizontal: SPACING.rowPadX,
    paddingVertical: SPACING.rowPadY,
    marginBottom: 8,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayName: {
    fontFamily: TYPE.interMedium,
    fontSize: 14,
  },
  username: {
    fontFamily: TYPE.mono,
    fontSize: 12,
    marginTop: 1,
  },
  unblockBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  unblockText: {
    fontFamily: TYPE.interMedium,
    fontSize: 12,
  },
});
