import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, MessageSquare, Package, Shield, Camera } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/colors';
import { logger } from '@/lib/logger';
import { ConversationListSkeleton } from '@/components/skeleton';
import type { MessageType } from '@/lib/api/messaging';
import * as MessagingAPI from '@/lib/api/messaging';

const log = logger.create('PostComposer');

type PostType = 'discussion' | 'collection_share' | 'legit_check';

interface PostTypeOption {
  id: PostType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const POST_TYPES: PostTypeOption[] = [
  {
    id: 'discussion',
    label: 'Discussion',
    description: 'Start a conversation with the group',
    icon: <MessageSquare size={20} color={colors.primary} />,
  },
  {
    id: 'collection_share',
    label: 'Share from Collection',
    description: 'Share a collectible from your collection',
    icon: <Package size={20} color={colors.accent} />,
  },
  {
    id: 'legit_check',
    label: 'Legit Check',
    description: 'Get the community to verify authenticity',
    icon: <Shield size={20} color={colors.attention} />,
  },
];

interface PostComposerProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  onPostCreated: () => void;
}

export function PostComposer({
  visible,
  onClose,
  conversationId,
  onPostCreated,
}: PostComposerProps) {
  const insets = useSafeAreaInsets();
  const [postType, setPostType] = useState<PostType | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedCollectibleId, setSelectedCollectibleId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = useCallback(() => {
    setPostType(null);
    setTitle('');
    setBody('');
    setSelectedCollectibleId(null);
    setIsSubmitting(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const canSubmit = (() => {
    if (!postType || isSubmitting) return false;
    if (postType === 'discussion') return body.trim().length > 0;
    if (postType === 'collection_share') return !!selectedCollectibleId;
    if (postType === 'legit_check') return title.trim().length > 0;
    return false;
  })();

  const handleSubmit = async () => {
    if (!canSubmit || !postType) return;
    setIsSubmitting(true);

    try {
      const options: Parameters<typeof MessagingAPI.sendMessage>[0] = {
        conversation_id: conversationId,
        message_type: postType as MessageType,
      };

      if (title.trim()) options.post_title = title.trim();
      if (body.trim()) options.content = body.trim();
      if (selectedCollectibleId) options.collectible_id = selectedCollectibleId;

      await MessagingAPI.sendMessage(options);
      handleClose();
      onPostCreated();
    } catch (err: unknown) {
      log.error('Failed to create post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close post composer"
          >
            <X size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {postType ? POST_TYPES.find((t) => t.id === postType)?.label : 'New Post'}
          </Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={[styles.postBtn, canSubmit && styles.postBtnActive]}
            accessibilityRole="button"
            accessibilityLabel="Publish post"
          >
            <Text style={[styles.postBtnText, canSubmit && styles.postBtnTextActive]}>
              {isSubmitting ? 'Posting...' : 'Post'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardDismissMode="interactive">
          {/* Type selector */}
          {!postType && (
            <View style={styles.typeSelector}>
              <Text style={styles.sectionLabel}>What would you like to share?</Text>
              {POST_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={styles.typeOption}
                  onPress={() => setPostType(type.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Create ${type.label} post`}
                >
                  <View style={styles.typeIcon}>{type.icon}</View>
                  <View style={styles.typeInfo}>
                    <Text style={styles.typeLabel}>{type.label}</Text>
                    <Text style={styles.typeDesc}>{type.description}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Discussion form */}
          {postType === 'discussion' && (
            <View style={styles.form}>
              <TextInput
                style={styles.titleInput}
                placeholder="Title (optional)"
                placeholderTextColor={colors.mutedForeground}
                value={title}
                onChangeText={setTitle}
                maxLength={120}
                accessibilityLabel="Post title"
              />
              <TextInput
                style={styles.bodyInput}
                placeholder="What's on your mind?"
                placeholderTextColor={colors.mutedForeground}
                value={body}
                onChangeText={setBody}
                multiline
                textAlignVertical="top"
                maxLength={2000}
                accessibilityLabel="Post body"
              />
            </View>
          )}

          {/* Collection share form */}
          {postType === 'collection_share' && (
            <CollectionShareForm
              selectedId={selectedCollectibleId}
              onSelect={setSelectedCollectibleId}
              body={body}
              onBodyChange={setBody}
            />
          )}

          {/* Legit check form */}
          {postType === 'legit_check' && (
            <View style={styles.form}>
              <TextInput
                style={styles.titleInput}
                placeholder="What item are you checking?"
                placeholderTextColor={colors.mutedForeground}
                value={title}
                onChangeText={setTitle}
                maxLength={120}
                accessibilityLabel="Legit check title"
              />
              <TextInput
                style={styles.bodyInput}
                placeholder="Add details about what you'd like verified..."
                placeholderTextColor={colors.mutedForeground}
                value={body}
                onChangeText={setBody}
                multiline
                textAlignVertical="top"
                maxLength={2000}
                accessibilityLabel="Legit check details"
              />
              <TouchableOpacity
                style={styles.photoBtn}
                accessibilityRole="button"
                accessibilityLabel="Add photos for legit check"
              >
                <Camera size={20} color={colors.primary} />
                <Text style={styles.photoBtnText}>Add Photos</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Back button to type selector */}
          {postType && (
            <TouchableOpacity
              style={styles.backToTypes}
              onPress={() => setPostType(null)}
              accessibilityRole="button"
              accessibilityLabel="Change post type"
            >
              <Text style={styles.backToTypesText}>Change post type</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Mini collection browser for sharing collectibles
function CollectionShareForm({
  selectedId,
  onSelect,
  body,
  onBodyChange,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  body: string;
  onBodyChange: (text: string) => void;
}) {
  const [collectibles, setCollectibles] = useState<Array<{ id: string; title: string; photos: string[] | null }>>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user's collectibles for selection
  React.useEffect(() => {
    const fetchCollectibles = async () => {
      setIsLoading(true);
      try {
        const { default: apiClient } = await import('@/lib/api/client');
        const response = await apiClient.get<{ collectibles: Array<{ id: string; title: string; photos: string[] | null }> }>(
          '/collectibles-list',
          { limit: '50' }
        );
        setCollectibles(response.collectibles || []);
      } catch (err: unknown) {
        log.error('Failed to fetch collectibles:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCollectibles();
  }, []);

  const filtered = search
    ? collectibles.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : collectibles;

  return (
    <View style={styles.form}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search your collection..."
        placeholderTextColor={colors.mutedForeground}
        value={search}
        onChangeText={setSearch}
        accessibilityLabel="Search collectibles"
      />

      {isLoading && (
        <ConversationListSkeleton count={3} />
      )}

      <View style={styles.collectibleList}>
        {filtered.slice(0, 20).map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.collectibleItem, selectedId === item.id && styles.collectibleItemSelected]}
            onPress={() => onSelect(selectedId === item.id ? null : item.id)}
            accessibilityRole="button"
            accessibilityLabel={`Select ${item.title}`}
          >
            <Text style={styles.collectibleTitle} numberOfLines={1}>{item.title}</Text>
            {selectedId === item.id && (
              <View style={styles.checkMark}>
                <Text style={styles.checkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {selectedId && (
        <TextInput
          style={styles.bodyInput}
          placeholder="Add a comment (optional)"
          placeholderTextColor={colors.mutedForeground}
          value={body}
          onChangeText={onBodyChange}
          multiline
          textAlignVertical="top"
          maxLength={500}
          accessibilityLabel="Post comment"
        />
      )}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
  },
  postBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.muted,
  },
  postBtnActive: {
    backgroundColor: colors.primary,
  },
  postBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  postBtnTextActive: {
    color: colors.primaryForeground,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  typeSelector: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 4,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 14,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeInfo: {
    flex: 1,
    gap: 2,
  },
  typeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  typeDesc: {
    fontSize: 13,
    color: colors.mutedForeground,
  },
  form: {
    gap: 12,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  bodyInput: {
    fontSize: 15,
    color: colors.foreground,
    minHeight: 120,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
  searchInput: {
    fontSize: 15,
    color: colors.foreground,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: 'center',
    padding: 20,
  },
  collectibleList: {
    gap: 6,
  },
  collectibleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  collectibleItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryGlow,
  },
  collectibleTitle: {
    fontSize: 14,
    color: colors.foreground,
    flex: 1,
  },
  checkMark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: '700',
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  photoBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  backToTypes: {
    alignItems: 'center',
    padding: 16,
    marginTop: 12,
  },
  backToTypesText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});
