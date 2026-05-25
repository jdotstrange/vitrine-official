import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { KeyboardSafeSheet } from '@/components/vault';
import { X, Camera, Plus, Globe, Lock } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '@/lib/colors';
import { getStatusConfig, type ListingStatus } from '@/lib/status-utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OptimizedImage } from './optimized-image';
import { updateCollectible, type CreateCollectibleRequest } from '@/lib/api/collectibles';
import { logger } from '@/lib/logger';

const log = logger.create('EditInfo');

export interface EditInfoData {
  id: string;
  title: string;
  photos: string[];
  value?: number;
  status: ListingStatus;
  tags: string[];
  visibility: 'public' | 'private';
  description?: string;
}

interface EditInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: EditInfoData | null;
  onSaved: () => void;
}

export function EditInfoModal({ isOpen, onClose, data, onSaved }: EditInfoModalProps) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<ListingStatus>('NFST');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data && isOpen) {
      setTitle(data.title || '');
      setValue(data.value != null ? String(data.value) : '');
      setStatus(data.status || 'NFST');
      setTags(data.tags || []);
      setVisibility(data.visibility || 'public');
      setImages(data.photos || []);
      setTagInput('');
    }
  }, [data, isOpen]);

  const statusOptions: { value: ListingStatus; label: string }[] = [
    { value: 'NFST', label: 'NFST' },
    { value: 'FOR_SALE', label: 'For Sale' },
    { value: 'FOR_TRADE', label: 'For Trade' },
    { value: 'SELL_TRADE', label: 'Sell + Trade' },
  ];

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - images.length,
    });

    if (!result.canceled && result.assets) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags((prev) => [...prev, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!data?.id || !title.trim()) return;

    setSaving(true);
    try {
      const numericValue = value ? parseFloat(value.replace(/[^0-9.]/g, '')) : undefined;
      const availableForSale = status === 'FOR_SALE' || status === 'SELL_TRADE';
      const availableForTrade = status === 'FOR_TRADE' || status === 'SELL_TRADE';

      const updateData: Partial<CreateCollectibleRequest> = {
        title: title.trim(),
        photos: images,
        value: numericValue,
        availableForSale,
        availableForTrade,
        tags,
        privacy: visibility,
      };

      await updateCollectible(data.id, updateData);
      onSaved();
    } catch (err) {
      log.error('Save failed:', err);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = title.trim().length > 0;

  if (!isOpen || !data) return null;

  return (
    <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose} accessibilityViewIsModal={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalOverlay} />

        <KeyboardSafeSheet style={styles.flex}>
          <View style={[styles.flex, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={{ width: 40 }} />
              <Text style={styles.headerTitle}>Edit Info</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Close">
                <X size={20} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.flex}
              contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Photos */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>PHOTOS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
                  {images.map((uri, index) => (
                    <View key={`img-${index}`} style={styles.imageThumb}>
                      <OptimizedImage src={uri} style={styles.imageThumbImg} width={80} height={80} />
                      <TouchableOpacity
                        style={styles.imageRemove}
                        onPress={() => handleRemoveImage(index)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Remove photo"
                      >
                        <X size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  {images.length < 10 && (
                    <TouchableOpacity style={styles.addImageButton} onPress={handlePickImage} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Add photo">
                      <Camera size={20} color={colors.mutedForeground} />
                      <Text style={styles.addImageText}>Add</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>

              {/* Title */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>TITLE</Text>
                <TextInput
                  style={styles.textInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Collectible title"
                  placeholderTextColor={colors.mutedForeground + '80'}
                  maxLength={120}
                  accessibilityLabel="Title"
                />
              </View>

              {/* Value */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>VALUE</Text>
                <TextInput
                  style={styles.textInput}
                  value={value}
                  onChangeText={setValue}
                  placeholder="$0.00"
                  placeholderTextColor={colors.mutedForeground + '80'}
                  keyboardType="decimal-pad"
                  accessibilityLabel="Value"
                />
              </View>

              {/* Status */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>LISTING STATUS</Text>
                <View style={styles.statusRow}>
                  {statusOptions.map((opt) => {
                    const config = getStatusConfig(opt.value);
                    const isActive = status === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.value}
                        style={[
                          styles.statusPill,
                          isActive && { backgroundColor: config.bgColor, borderColor: config.borderColor },
                        ]}
                        onPress={() => setStatus(opt.value)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Status: ${opt.label}`}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            isActive && { color: config.textColor },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Visibility */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>VISIBILITY</Text>
                <View style={styles.statusRow}>
                  <TouchableOpacity
                    style={[styles.statusPill, visibility === 'public' && styles.statusPillActive]}
                    onPress={() => setVisibility('public')}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Set public visibility"
                  >
                    <Globe size={14} color={visibility === 'public' ? colors.foreground : colors.mutedForeground} />
                    <Text style={[styles.statusPillText, visibility === 'public' && styles.statusPillTextActive]}>
                      Public
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusPill, visibility === 'private' && styles.statusPillActive]}
                    onPress={() => setVisibility('private')}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Set private visibility"
                  >
                    <Lock size={14} color={visibility === 'private' ? colors.foreground : colors.mutedForeground} />
                    <Text style={[styles.statusPillText, visibility === 'private' && styles.statusPillTextActive]}>
                      Private
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tags */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>TAGS</Text>
                <View style={styles.tagsContainer}>
                  {tags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={styles.tag}
                      onPress={() => handleRemoveTag(tag)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove tag ${tag}`}
                    >
                      <Text style={styles.tagText}>{tag}</Text>
                      <X size={12} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.tagInputRow}>
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder="Add a tag..."
                    placeholderTextColor={colors.mutedForeground + '80'}
                    onSubmitEditing={handleAddTag}
                    returnKeyType="done"
                    accessibilityLabel="Tag input"
                  />
                  {tagInput.trim().length > 0 && (
                    <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Add tag">
                      <Plus size={16} color={colors.foreground} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Cancel">
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, (!isFormValid || saving) && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={!isFormValid || saving}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Save changes"
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardSafeSheet>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    position: 'relative',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
  },
  flex: {
    flex: 1,
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 24,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 10,
    color: colors.mutedForeground,
    letterSpacing: 2,
  },
  textInput: {
    fontSize: 16,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  imageRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  imageThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  imageThumbImg: {
    width: 80,
    height: 80,
  },
  imageRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addImageText: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  statusPillActive: {
    borderColor: colors.foreground + '40',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.mutedForeground,
  },
  statusPillTextActive: {
    color: colors.foreground,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagText: {
    fontSize: 13,
    color: colors.foreground,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addTagButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
});
