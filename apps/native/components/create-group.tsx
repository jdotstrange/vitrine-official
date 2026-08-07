import { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VitrineButton } from './ui/vitrine-button';
import { colors } from '@/lib/colors';
import { useCategories, type CategoryType } from '@/lib/contexts/category-context';
import { MOCK_CONNECTIONS } from '@/lib/mock-communities';
import * as ImagePicker from 'expo-image-picker';
import * as MessagingAPI from '@/lib/api/messaging';
import { useAuth } from '@/lib/contexts/auth-context';
import { logger } from '@/lib/logger';
import { FALLBACK_TYPES } from './groups/fallback-types';
import { CoverImageUpload } from './groups/cover-image-upload';
import { GroupFormFields } from './groups/group-form-fields';
import { InviteMembersSection } from './groups/invite-members-section';
import { TypeSelectorModal } from './groups/type-selector-modal';
import { InviteModal } from './groups/invite-modal';
import { GroupSuccessScreen } from './groups/group-success-screen';

const log = logger.create('CreateGroup');

export function CreateGroup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const { types: apiTypes, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const categoryTypes = apiTypes.length > 0 ? apiTypes : FALLBACK_TYPES;

  useEffect(() => {
    log.debug('Category data:', {
      apiTypesCount: apiTypes.length,
      categoryTypesCount: categoryTypes.length,
      isLoading: categoriesLoading,
      error: categoriesError,
      usingFallback: categoryTypes === FALLBACK_TYPES,
      firstApiType: apiTypes[0] ? { code: apiTypes[0].code, title: apiTypes[0].title, hasIcon: !!apiTypes[0].icon } : null,
      firstCategoryType: categoryTypes[0] ? { code: categoryTypes[0].code, title: categoryTypes[0].title, hasIcon: !!categoryTypes[0].icon } : null,
    });
  }, [apiTypes, categoryTypes, categoriesLoading, categoriesError]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<CategoryType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<{ code: string; title: string } | null>(null);
  const [invitedMembers, setInvitedMembers] = useState<string[]>([]);

  // UI state
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [modalStep, setModalStep] = useState<'types' | 'categories'>('types');
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  const handleImageUpload = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to add a cover image.', [{ text: 'OK' }]);
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCoverImage(result.assets[0].uri);
      }
    } catch (error) {
      log.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !selectedType) return;
    setIsCreating(true);
    try {
      let coverImageUrl: string | undefined;
      if (coverImage) {
        try {
          const uploadResponse = await MessagingAPI.uploadMedia(
            { uri: coverImage, type: 'image/jpeg', name: 'group-cover.jpg' },
            { folder: 'group-covers' },
          );
          coverImageUrl = uploadResponse.url;
        } catch (uploadError) {
          log.error('Failed to upload cover image:', uploadError);
        }
      }
      const response = await MessagingAPI.createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        cover_image_url: coverImageUrl,
        visibility,
        category_type: selectedType.code,
        category_code: selectedCategory?.code,
        invited_user_ids: invitedMembers.length > 0 ? invitedMembers : undefined,
      });
      log.info('Group created successfully:', response.conversation.id);
      setIsCreating(false);
      setShowSuccess(true);
    } catch (error: unknown) {
      log.error('Failed to create group:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create group. Please try again.', [{ text: 'OK' }]);
      setIsCreating(false);
    }
  };

  // Derived data for modals
  const filteredConnections = useMemo(() => {
    return MOCK_CONNECTIONS.filter(
      (c) =>
        c.name.toLowerCase().includes(inviteSearch.toLowerCase()) ||
        c.username.toLowerCase().includes(inviteSearch.toLowerCase()),
    );
  }, [inviteSearch]);

  const filteredTypes = useMemo(() => {
    if (!modalSearchQuery) return categoryTypes;
    const query = modalSearchQuery.toLowerCase();
    return categoryTypes.filter(
      (type) =>
        type.title.toLowerCase().includes(query) ||
        type.categories.some((cat) => cat.title.toLowerCase().includes(query)),
    );
  }, [modalSearchQuery, categoryTypes]);

  const filteredCategories = useMemo(() => {
    if (!selectedType) return [];
    if (!modalSearchQuery) return selectedType.categories;
    const query = modalSearchQuery.toLowerCase();
    return selectedType.categories.filter((cat) => cat.title.toLowerCase().includes(query));
  }, [selectedType, modalSearchQuery]);

  // Modal handlers
  const handleTypeSelect = (type: CategoryType) => {
    setSelectedType(type);
    setModalStep('categories');
    setModalSearchQuery('');
  };

  const handleCategorySelect = (category?: { code: string; title: string }) => {
    setSelectedCategory(category || null);
    setShowTypeSelector(false);
    setModalStep('types');
    setModalSearchQuery('');
  };

  const handleCloseTypeModal = () => {
    setShowTypeSelector(false);
    setModalStep('types');
    setModalSearchQuery('');
  };

  const handleModalBack = () => {
    if (modalStep === 'categories') {
      setModalStep('types');
      setSelectedType(null);
      setModalSearchQuery('');
    }
  };

  const handleToggleInvitedMember = (id: string) => {
    setInvitedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  // Success screen
  if (showSuccess) {
    return (
      <GroupSuccessScreen
        name={name}
        coverImage={coverImage}
        visibility={visibility}
        memberCount={invitedMembers.length + 1}
        insets={insets}
        onOpenGroup={() => router.push('/community/demo-group')}
        onBackToCommunity={() => router.push('/messages')}
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Group</Text>
        </View>
      </View>

      {/* Form Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <CoverImageUpload
          coverImage={coverImage}
          onUpload={handleImageUpload}
          onRemove={() => setCoverImage(null)}
        />

        <GroupFormFields
          name={name}
          onChangeName={setName}
          description={description}
          onChangeDescription={setDescription}
          selectedType={selectedType}
          selectedCategory={selectedCategory}
          onOpenTypeSelector={() => setShowTypeSelector(true)}
          visibility={visibility}
          onChangeVisibility={setVisibility}
          focusedField={focusedField}
          onFocusField={setFocusedField}
        />

        <InviteMembersSection
          invitedMembers={invitedMembers}
          onRemoveMember={(id) => setInvitedMembers((prev) => prev.filter((m) => m !== id))}
          onOpenInviteModal={() => setShowInviteModal(true)}
        />
      </ScrollView>

      {/* Create Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        <VitrineButton
          variant="confirmation"
          onPress={handleCreate}
          disabled={!name.trim() || !selectedType || isCreating}
          fullWidth
        >
          {isCreating ? 'Creating...' : 'Create Group'}
        </VitrineButton>
      </View>

      {/* Modals */}
      <TypeSelectorModal
        visible={showTypeSelector}
        onClose={handleCloseTypeModal}
        modalStep={modalStep}
        onBack={handleModalBack}
        selectedType={selectedType}
        categoriesLoading={categoriesLoading}
        filteredTypes={filteredTypes}
        filteredCategories={filteredCategories}
        categoryTypesCount={categoryTypes.length}
        modalSearchQuery={modalSearchQuery}
        onSearchChange={setModalSearchQuery}
        onTypeSelect={handleTypeSelect}
        onCategorySelect={handleCategorySelect}
      />

      <InviteModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        inviteSearch={inviteSearch}
        onSearchChange={setInviteSearch}
        filteredConnections={filteredConnections}
        invitedMembers={invitedMembers}
        onToggleMember={handleToggleInvitedMember}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  footer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background + 'CC',
  },
});
