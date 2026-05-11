import { Alert } from 'react-native';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { type ListingStatus } from '@/lib/status-utils';
import { createCollectible, type CreateCollectibleRequest } from '@/lib/api/collectibles';
import { useAuth } from '@/lib/contexts/auth-context';
import { logger } from '@/lib/logger';
import { MemorabiliaCoreForm, type ImageItem } from './upload/memorabilia-core-form';
import { MemorabiliaUploadProgress } from './upload/memorabilia-upload-progress';
import { MemorabiliaUploadSuccess } from './upload/memorabilia-upload-success';
import { ShowcasePickerModal, type ShowcaseOption } from './ui/showcase-picker-modal';

const log = logger.create('MemorabiliaDetails');

const MOCK_SHOWCASES: ShowcaseOption[] = [
  { id: '1', name: 'Grails', itemCount: 12 },
  { id: '2', name: 'Sports Memorabilia', itemCount: 28 },
  { id: '3', name: 'Vintage Collection', itemCount: 45 },
  { id: '4', name: 'Investments', itemCount: 8 },
];

type UploadState = 'form' | 'success' | 'uploading';

export function MemorabiliaDetailsForm() {
  const router = useRouter();
  const { user } = useAuth();
  const localParams = useLocalSearchParams<{ type: string; category: string; unmatched?: string[] }>();
  
  const type = localParams.type || (Array.isArray(localParams.unmatched) && localParams.unmatched[2]) || '';
  const category = localParams.category || (Array.isArray(localParams.unmatched) && localParams.unmatched[3]) || '';

  const [images, setImages] = useState<ImageItem[]>([]);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<ListingStatus>('NFST');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedShowcase, setSelectedShowcase] = useState<ShowcaseOption | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showShowcaseModal, setShowShowcaseModal] = useState(false);
  const [uploadState, setUploadState] = useState<UploadState>('form');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [createdCollectibleId, setCreatedCollectibleId] = useState<string | null>(null);
  const uploadSuccessTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (uploadSuccessTimerRef.current) clearTimeout(uploadSuccessTimerRef.current);
    };
  }, []);

  const valueRequired = status !== 'NFST';
  const isFormValid = images.length > 0 && title.trim() !== '' && (!valueRequired || value !== '');

  const handleImageSelect = useCallback(async () => {
    const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permStatus !== 'granted') {
      Alert.alert('Permission needed', 'We need access to your photos to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 7 - images.length,
    });

    if (!result.canceled && result.assets) {
      const newImages: ImageItem[] = result.assets.map((asset) => ({
        id: Math.random().toString(36).substring(7),
        uri: asset.uri,
      }));
      setImages((prev) => [...prev, ...newImages]);
    }
  }, [images.length]);

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setUploadState('uploading');
    setUploadProgress(0);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 10 + 3;
      });
    }, 200);

    try {
      const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
      const availableForSale = status === 'FOR_SALE' || status === 'SELL_TRADE';
      const availableForTrade = status === 'FOR_TRADE' || status === 'SELL_TRADE';

      const collectibleData: CreateCollectibleRequest = {
        title: title.trim(),
        category: type,
        subcategory: category,
        value: numericValue,
        availableForSale,
        availableForTrade,
        privacy: isPublic ? 'public' : 'private',
        photos: images.map((img) => img.uri),
        tags,
        showcaseId: selectedShowcase?.id,
      };

      const response = await createCollectible(user?.id || '', collectibleData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setCreatedCollectibleId(response.id);
      uploadSuccessTimerRef.current = setTimeout(() => setUploadState('success'), 300);
    } catch (err) {
      clearInterval(progressInterval);
      log.error('Failed to upload collectible:', err);
      
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to upload. Please try again.';
      
      setUploadProgress(0);
      setUploadState('form');
      Alert.alert('Upload Failed', errorMessage, [{ text: 'OK' }]);
    }
  };

  const handleTagInputChange = (text: string) => {
    const filtered = text.toLowerCase().replace(/[^a-z0-9]/g, '');
    setTagInput(filtered);
    
    if (text.includes(',') || text.includes(' ')) {
      const trimmedTag = filtered.trim();
      if (trimmedTag && !tags.includes(trimmedTag)) {
        setTags([...tags, trimmedTag]);
        setTagInput('');
      }
    }
  };

  const handleTagSubmit = () => {
    const trimmedTag = tagInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  if (uploadState === 'uploading') {
    return <MemorabiliaUploadProgress progress={uploadProgress} />;
  }

  if (uploadState === 'success') {
    return (
      <MemorabiliaUploadSuccess
        coverImageUri={images[0]?.uri ?? null}
        title={title}
        type={type}
        category={category}
        value={value}
        status={status}
        collectibleId={createdCollectibleId}
        onViewCollection={() => {
          const id = createdCollectibleId || 'mock-' + Math.random().toString(36).substring(7);
          router.push(`/collectible/${id}`);
        }}
        onKeyDetailsSuccess={() => {
          const id = createdCollectibleId || 'mock-' + Math.random().toString(36).substring(7);
          router.replace(`/collectible/${id}`);
        }}
      />
    );
  }

  return (
    <>
      <MemorabiliaCoreForm
        type={type}
        category={category}
        images={images}
        title={title}
              value={value}
        status={status}
        isPublic={isPublic}
        selectedShowcase={selectedShowcase}
        tags={tags}
        tagInput={tagInput}
        isFormValid={isFormValid}
        onImagesReorder={setImages}
        onImageSelect={handleImageSelect}
        onImageRemove={(id) => setImages((prev) => prev.filter((img) => img.id !== id))}
        onTitleChange={setTitle}
        onValueChange={setValue}
        onStatusChange={setStatus}
        onPublicToggle={setIsPublic}
        onShowcasePress={() => setShowShowcaseModal(true)}
        onTagInputChange={handleTagInputChange}
        onTagSubmit={handleTagSubmit}
        onTagRemove={(index) => setTags(tags.filter((_, i) => i !== index))}
        onSubmit={handleSubmit}
        onBack={() => router.back()}
      />

      <ShowcasePickerModal
        isOpen={showShowcaseModal}
        onClose={() => setShowShowcaseModal(false)}
        selected={selectedShowcase}
        onSelect={setSelectedShowcase}
        showcases={MOCK_SHOWCASES}
      />
    </>
  );
}
