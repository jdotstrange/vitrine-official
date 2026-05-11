import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { ArrowLeft, AlertCircle } from 'lucide-react-native';
import { ActionIcon } from '@/components/ui/action-icon';
import { SearchBar } from '@/components/search-bar';
import { OptimizedImage } from '@/components/optimized-image';
import { colors } from '@/lib/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useStream } from '@/lib/contexts/stream-context';
import { logger } from '@/lib/logger';

const log = logger.create('NewMessage');

interface SearchUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
}

export default function NewMessagePage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { client, isReady } = useStream();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const { data, error: searchError } = await supabase
          .from('users')
          .select('id, display_name, username, avatar, bio')
          .or(`display_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
          .not('display_name', 'is', null)
          .not('username', 'is', null)
          .neq('id', client?.userID || '')
          .limit(20);

        if (searchError) throw searchError;

        setSearchResults(
          (data || []).map((u) => ({
            id: u.id,
            name: u.display_name || 'Unknown',
            username: `@${u.username}`,
            avatar: u.avatar || '',
            bio: u.bio,
          }))
        );
      } catch (err: unknown) {
        log.error('User search failed:', err);
        setError('Failed to search users');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, client?.userID]);

  const handleUserPress = useCallback(async (selectedUser: SearchUser) => {
    if (isCreating || !isReady) return;
    setIsCreating(true);
    setError(null);

    try {
      const channel = client.channel('messaging', {
        members: [client.userID!, selectedUser.id],
      });
      await channel.create();
      router.push(`/messages/${channel.id}` as Href);
    } catch (err: unknown) {
      log.error('Failed to create conversation:', err);
      const message = err instanceof Error ? err.message : 'Failed to start conversation';
      setError(message);
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, client, isReady, router]);

  const headerHeight = insets.top + 72;
  const showSearchResults = searchQuery.length >= 2;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerOverlay} />
        <View style={styles.headerContent}>
          <ActionIcon icon={ArrowLeft} onPress={() => router.back()} label="Go back" size={20} />
          <Text style={styles.headerTitle}>New Message</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <View style={{ flex: 1, paddingTop: headerHeight }}>
        {error && (
          <View style={styles.errorBanner}>
            <AlertCircle size={14} color={colors.destructive} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder="Search people..."
            showClear
            autoFocus
          />
        </View>

        {!showSearchResults && (
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>
              Search by name or username to start a conversation.
            </Text>
          </View>
        )}

        {isSearching && (
          <View style={styles.searchingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}

        {showSearchResults && !isSearching && searchResults.length === 0 && (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No users found</Text>
          </View>
        )}

        {showSearchResults && searchResults.length > 0 && (
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.userRow}
                onPress={() => handleUserPress(item)}
                activeOpacity={0.7}
                disabled={isCreating}
              >
                <View style={styles.avatarContainer}>
                  {item.avatar ? (
                    <OptimizedImage
                      src={item.avatar}
                      style={styles.avatar}
                      displaySize="thumbnail"
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                      <Text style={styles.avatarInitial}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.userHandle} numberOfLines={1}>{item.username}</Text>
                </View>
                {isCreating && (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
                )}
              </TouchableOpacity>
            )}
          />
        )}
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
    letterSpacing: 0.2,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(196, 101, 90, 0.12)',
    borderRadius: 8,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 13,
    flex: 1,
  },
  hintContainer: {
    paddingHorizontal: 16,
    paddingTop: 32,
    alignItems: 'center',
  },
  hintText: {
    color: colors.mutedForeground,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  searchingContainer: {
    paddingTop: 24,
    alignItems: 'center',
  },
  noResultsContainer: {
    paddingTop: 32,
    alignItems: 'center',
  },
  noResultsText: {
    color: colors.mutedForeground,
    fontSize: 14,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: '600',
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  userHandle: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
});
