import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextStyle,
} from 'react-native';
import { KeyboardSafeScroll } from '@/components/vault';
import Animated, {
  CurvedTransition,
  Easing,
  FadeIn,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import DraggableFlatList, {
  ScaleDecorator,
  type RenderItemParams,
} from 'react-native-draggable-flatlist';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronDown,
  Eye,
  ImagePlus,
  Headphones,
  Lock,
  Pencil,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react-native';

import {
  ActionDock,
  ActionSheet,
  Button,
  HolographicFrame,
  InputDialog,
  RapidFireEdit,
  SchemaRow,
  ShowcaseSelectorSheet,
  TraitPill,
  type FieldEditorValue,
  type RapidFireEditItem,
  type ShowcaseSelectorOption,
} from '@/components/vault';
import { FramedHero } from '@/components/detail/framed-hero';
import { PushPrePrompt } from '@/components/push-pre-prompt';
import { useTheme, RADII, SPACING, STATUS_CONFIG, TYPE, type ListingStatus } from '@/lib/design';
import { useAuth } from '@/lib/contexts/auth-context';
import { getUserShowcases } from '@/lib/api/showcases';
import { createDraftCollectible, updateExtractionJobId, commitDraftCollectible, deleteCollectible } from '@/lib/api/collectibles';
import { enqueueExtraction, pollJobStatus, type ExtractionStatus } from '@/lib/api/extraction';
import { uploadOriginalOnly, generateVariantsBackground } from '@/lib/image-utils';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UploadStep = 'scan' | 'theater' | 'review' | 'finalize' | 'success' | 'failed';
type PhotoAsset = { id: string; uri: string };

type FieldSchema = Record<string, { type: string; description: string }>;
type AiMetadata = Record<string, unknown>;
type TraitMetadata = Record<string, unknown>;

interface ExtractionResult {
  id: string;
  listingTitle: string;
  listingDescription: string;
  classification: string;
  confidence: string;
  collectibleType: string;
  category: string;
  subcategory: string;
  traits: string[];
  aiMetadata: AiMetadata;
  traitMetadata: TraitMetadata;
  fieldSchema: FieldSchema;
  value: string;
  tags: string[];
  verificationUrl: string | null;
  photos: string[];
  availableForSale: boolean;
  availableForTrade: boolean;
  visibility: string;
}

const uploadLog = logger.create('Upload');

interface ChecklistItem {
  label: string;
  durationMs: number;
}

// Listing copy length ceilings. Hugged tight to the observed maximum
// across john@myvitrine.app's 529 production collectibles
// (max title 86 / max desc 418) — just enough buffer to absorb edge
// cases without inviting walls-of-text descriptions or run-on titles.
const LISTING_TITLE_MAX = 90;
const LISTING_DESCRIPTION_MAX = 420;

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { label: 'Visual calibration',  durationMs: 5000 },
  { label: 'Object recognition',  durationMs: 5000 },
  { label: 'Authentication scan', durationMs: 5000 },
  { label: 'Provenance check',    durationMs: 5000 },
  { label: 'Metadata extraction', durationMs: 10000 },
];

const STATUS_OPTIONS: { key: ListingStatus; title: string; subtitle: string }[] = [
  { key: 'NFST', title: 'NFST', subtitle: 'Catalog only' },
  { key: 'FOR_TRADE', title: 'Trade', subtitle: 'Open to offers' },
  { key: 'FOR_SALE', title: 'Sale', subtitle: 'Set asking price' },
  { key: 'SELL_TRADE', title: 'Sale + Trade', subtitle: 'All inquiries welcome' },
];

function deriveStatus(seed: ExtractionResult): ListingStatus {
  if (seed.availableForSale && seed.availableForTrade) return 'SELL_TRADE';
  if (seed.availableForSale) return 'FOR_SALE';
  if (seed.availableForTrade) return 'FOR_TRADE';
  return 'NFST';
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function UploadEntry() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [step, setStep] = useState<UploadStep>('scan');
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [context, setContext] = useState('');
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);

  // Extraction pipeline state
  const [draftCollectibleId, setDraftCollectibleId] = useState<string | null>(null);
  // Persists the just-saved row id past the draft→committed transition so the
  // success screen can deep-link straight to its detail view.
  const [committedCollectibleId, setCommittedCollectibleId] = useState<string | null>(null);
  const [extractionJobId, setExtractionJobId] = useState<string | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus | null>(null);
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [etaSeconds, setEtaSeconds] = useState<number>(30);
  const [theaterError, setTheaterError] = useState<string | null>(null);

  // Upload / scan screen loading
  const [isUploading, setIsUploading] = useState(false);

  // Theater HUD cosmetic state
  const [completedSteps, setCompletedSteps] = useState(0);
  const progress = useSharedValue(0);

  // Finalize (pre-filled from seed once extraction lands)
  const [status, setStatus] = useState<ListingStatus>('NFST');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [selectedShowcaseIds, setSelectedShowcaseIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // Showcase picker — remote list + locally-created (unpersisted) additions.
  // Merged at render time so a freshly-minted showcase appears in the picker
  // immediately without waiting on a DB round-trip.
  const [remoteShowcases, setRemoteShowcases] = useState<ShowcaseSelectorOption[]>([]);
  const [localShowcases, setLocalShowcases] = useState<ShowcaseSelectorOption[]>([]);
  const [showcasesLoading, setShowcasesLoading] = useState(false);
  const [showcaseSheetOpen, setShowcaseSheetOpen] = useState(false);

  // Tag input dialog (replaces Alert.prompt — iOS-only and un-themed).
  const [tagDialogOpen, setTagDialogOpen] = useState(false);

  // Photo source picker (camera vs library) — opens an ActionSheet on
  // empty-tile tap so users can shoot fresh or pull from library. The
  // library path goes directly through Apple's native PHPickerViewController
  // via expo-image-picker, so there's no in-app picker state to track —
  // the OS owns the modal lifecycle.
  const [photoSourceSheetOpen, setPhotoSourceSheetOpen] = useState(false);

  // Edit flow state — queue is the set of fields the user flagged on review;
  // `fieldEdits` overlays the base extraction with committed changes;
  // `pulseKeys` + `pulseNonce` drive the one-shot volt flash on the rows
  // that just changed, so the user sees what got corrected without any
  // persistent "edited" badge.
  const [editQueue, setEditQueue] = useState<QueueId[]>([]);
  const [fieldEdits, setFieldEdits] = useState<FieldEdits>(EMPTY_EDITS);
  const [rapidFireOpen, setRapidFireOpen] = useState(false);
  const [pulseKeys, setPulseKeys] = useState<QueueId[]>([]);
  const [pulseNonce, setPulseNonce] = useState(0);

  // Listing copy edits (title / description). Tracked separately from
  // `fieldEdits` because copy is fundamentally a different surface from
  // schema atoms — it's edited inline on the review screen rather than
  // queued + batched through rapid-fire.
  const [listingEdits, setListingEdits] = useState<{ title?: string; description?: string }>({});

  // Pulls the user's persisted showcases into local state for the picker.
  // Returns a cancellation token so callers can abort if the component
  // unmounts (or the user re-navigates) mid-fetch.
  const fetchShowcases = useCallback(() => {
    if (!user?.id) return () => {};
    let cancelled = false;
    setShowcasesLoading(true);
    getUserShowcases(user.id)
      .then((rows) => {
        if (cancelled) return;
        setRemoteShowcases(
          rows.map((r) => ({ id: r.id, title: r.title, items: r.items })),
        );
      })
      .catch(() => {
        // Silent: picker still works with locally-created entries; a reload
        // pulls fresh data. We don't want a bad network to block the flow.
      })
      .finally(() => {
        if (!cancelled) setShowcasesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    return fetchShowcases();
  }, [fetchShowcases]);

  // Refetch on tab focus so showcases created during a prior upload (which
  // were committed server-side via the upload) appear in the picker without
  // requiring an app relaunch. Without this, the next upload's picker still
  // shows the stale list from the initial mount fetch.
  useFocusEffect(
    useCallback(() => {
      return fetchShowcases();
    }, [fetchShowcases]),
  );

  const allShowcases = useMemo<ShowcaseSelectorOption[]>(
    () => [...localShowcases, ...remoteShowcases],
    [localShowcases, remoteShowcases],
  );

  // Resolved showcase objects for the chips on the finalize screen. Filters
  // out any selected id that no longer maps to a known showcase (e.g.,
  // deleted out-of-band) so the chip row never renders a ghost.
  const selectedShowcases = useMemo(
    () =>
      selectedShowcaseIds
        .map((id) => allShowcases.find((s) => s.id === id))
        .filter((s): s is ShowcaseSelectorOption => !!s)
        .map((s) => ({ id: s.id, title: s.title })),
    [selectedShowcaseIds, allShowcases],
  );

  const handleCreateShowcase = useCallback((title: string) => {
    const id = `local-${Date.now()}`;
    setLocalShowcases((current) => [{ id, title, items: 0 }, ...current]);
    setSelectedShowcaseIds((current) => [...current, id]);
  }, []);

  const handleRemoveShowcase = useCallback((id: string) => {
    Haptics.selectionAsync();
    setSelectedShowcaseIds((current) => current.filter((x) => x !== id));
  }, []);

  const handleAddTag = useCallback(
    (raw: string) => {
      const trimmed = raw.trim().replace(/^#/, '');
      setTagDialogOpen(false);
      if (!trimmed) return;
      if (tags.includes(trimmed)) return;
      setTags([...tags, trimmed]);
    },
    [tags],
  );

  const emptySlotCount = 6 - photos.length;

  // Value is required whenever the collectible is listed for sale or trade —
  // a catalog-only (NFST) entry can live without a dollar figure, everything
  // else needs a real positive number. `0` / `0.00` / blank all fail the
  // check so a listing can't go live without a meaningful asking price.
  const valueRequired = status !== 'NFST';
  const parsedValue = parseFloat(estimatedValue);
  const valueMissing = valueRequired && !(parsedValue > 0);

  // --- Photo capture: action sheet entry point + camera + library paths ---

  // Empty-tile tap opens the source picker rather than jumping straight to
  // the library — collectibles are usually being shot in hand, not pulled
  // from camera roll, and a library-only flow felt clunky.
  const openPhotoSourceSheet = useCallback(() => {
    if (emptySlotCount <= 0) return;
    Haptics.selectionAsync();
    setPhotoSourceSheetOpen(true);
  }, [emptySlotCount]);

  const appendPhotos = useCallback((uris: string[]) => {
    if (uris.length === 0) return;
    Haptics.selectionAsync();
    setPhotos((current) => {
      const slots = 6 - current.length;
      if (slots <= 0) return current;
      const fresh: PhotoAsset[] = uris.slice(0, slots).map((uri, i) => ({
        id: `photo-${Date.now()}-${i}`,
        uri,
      }));
      return [...current, ...fresh];
    });
  }, []);

  const pickFromCamera = useCallback(async () => {
    if (emptySlotCount <= 0) return;
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera access needed',
        'Vitrine needs camera access to photograph your collectibles. You can grant it in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.85,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      appendPhotos(result.assets.map((a) => a.uri));
    } catch (err) {
      uploadLog.error('Camera capture failed:', err);
    }
  }, [emptySlotCount, appendPhotos]);

  // Library picker — goes through Apple's native PHPickerViewController via
  // expo-image-picker. Multi-select with `orderedSelection` shows the iOS
  // numbered selection badges so users know the order their photos will be
  // imported in. Picker runs out-of-process, so scrolling is buttery (the
  // janky in-app FlatList grid this used to render no longer exists).
  const pickFromLibrary = useCallback(async () => {
    if (emptySlotCount <= 0) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo access needed',
        'Vitrine needs photo library access to attach images of your collectibles. You can grant it in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: emptySlotCount,
        orderedSelection: true,
        quality: 0.85,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      uploadLog.info('Library picker returned', { count: result.assets.length });
      appendPhotos(result.assets.map((a) => a.uri));
    } catch (err) {
      uploadLog.error('Library picker failed:', err);
    }
  }, [emptySlotCount, appendPhotos]);

  const removePhoto = useCallback((id: string) => {
    Haptics.selectionAsync();
    setPhotos((current) => current.filter((p) => p.id !== id));
  }, []);

  // Drag-to-reorder commit. DraggableFlatList drives the data array; we
  // just trust whatever it hands back. The first photo in the array is
  // automatically the cover, so reordering changes the cover as a side
  // effect — which is exactly what we want.
  const handleReorderPhotos = useCallback((next: PhotoAsset[]) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhotos(next);
  }, []);

  // --- Scan screen: upload + draft + enqueue handler ---
  const handleAnalyze = useCallback(async () => {
    if (!user?.id || photos.length === 0) return;
    setIsUploading(true);
    setStep('theater');

    try {
      const uploadResults = await Promise.all(
        photos.map((photo) => {
          const basePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
          return uploadOriginalOnly('collectible-images', basePath, photo.uri);
        }),
      );
      const uploadedUrls = uploadResults.map((r) => r.url);

      for (const r of uploadResults) {
        generateVariantsBackground('collectible-images', r.storagePath, r.compressedUri);
      }

      const title = context.trim() || 'New Collectible';
      const collectibleId = await createDraftCollectible(user.id, {
        title,
        photos: uploadedUrls,
        hint: context.trim() || undefined,
      });
      setDraftCollectibleId(collectibleId);

      const enqueueResult = await enqueueExtraction({
        imageUrls: uploadedUrls.slice(0, 4),
        title,
        hint: context.trim() || undefined,
      });
      setQueuePosition(enqueueResult.position);
      setEtaSeconds(enqueueResult.etaSeconds);
      setExtractionJobId(enqueueResult.jobId);

      await updateExtractionJobId(collectibleId, enqueueResult.jobId);

      setIsUploading(false);
      setExtractionStatus('queued');
    } catch (err) {
      setIsUploading(false);
      uploadLog.error('Upload pipeline failed:', err);
      setTheaterError(err instanceof Error ? err.message : 'Upload failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStep('failed');
    }
  }, [user?.id, photos, context]);

  // --- Theater: start progress ring immediately on step transition ---
  useEffect(() => {
    if (step !== 'theater') return;
    setCompletedSteps(0);
    progress.value = 0;
    progress.value = withTiming(0.97, {
      duration: 30000,
      easing: Easing.inOut(Easing.quad),
    });
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Theater: 2s polling + cosmetic checklist (starts once upload completes) ---
  useEffect(() => {
    if (step !== 'theater' || !draftCollectibleId || !extractionJobId) return;
    let cancelled = false;
    let lastStatus: ExtractionStatus | null = null;

    const cosmeticTimers: ReturnType<typeof setTimeout>[] = [];

    let cumulative = 0;
    for (let i = 0; i < CHECKLIST_ITEMS.length - 1; i++) {
      cumulative += CHECKLIST_ITEMS[i].durationMs;
      const target = i + 1;
      cosmeticTimers.push(
        setTimeout(() => {
          if (!cancelled) setCompletedSteps((cur) => Math.max(cur, target));
        }, cumulative),
      );
    }

    function handleStatus(status: ExtractionStatus, row: Record<string, unknown>) {
      if (cancelled || status === lastStatus) return;
      lastStatus = status;
      setExtractionStatus(status);

      if (status === 'processing') {
        // Cosmetic timers already running — nothing else to do here
      } else if (status === 'extracted' || status === 'complete') {
        // After upload-lane-unification, the BEFORE UPDATE trigger flips
        // 'extracted' -> 'complete' atomically and sets published_at, so
        // single-lane polling will most often see 'complete' here. Both
        // statuses route to the review screen identically — the row is
        // already a real, published collectible by the time we arrive.
        cosmeticTimers.forEach(clearTimeout);
        progress.value = withTiming(1, { duration: 250 });

        const classification = (row.classification as string) || 'unknown';
        const confidence = (row.confidence as string) || 'medium';
        const traits = (row.traits as string[]) || [];
        const aiMeta = (row.ai_metadata as AiMetadata) || {};

        const title = context.trim() || 'New Collectible';
        const mapped: ExtractionResult = {
          id: row.id as string,
          listingTitle: (row.listing_title as string) || title,
          listingDescription: (row.listing_description as string) || '',
          classification,
          confidence,
          collectibleType: (row.collectible_type as string) || 'memorabilia',
          category: (row.category as string) || 'pending',
          subcategory: (row.subcategory as string) || '',
          traits,
          aiMetadata: aiMeta,
          traitMetadata: (row.trait_metadata as TraitMetadata) || {},
          fieldSchema: (row.field_schema as FieldSchema) || {},
          value: '0.00',
          tags: (row.tags as string[]) || [],
          verificationUrl: (row.verification_url as string) || null,
          photos: (row.photos as string[]) || [],
          availableForSale: false,
          availableForTrade: false,
          visibility: (row.visibility as string) || 'public',
        };

        setExtraction(mapped);
        setStatus(deriveStatus(mapped));
        setEstimatedValue('0.00');
        setVisibility(mapped.visibility === 'private' ? 'private' : 'public');

        // Cascade-complete any remaining items (~80ms stagger).
        setCompletedSteps((cur) => {
          const remaining = CHECKLIST_ITEMS.length - cur;
          for (let i = 0; i < remaining; i++) {
            const target = cur + i + 1;
            cosmeticTimers.push(
              setTimeout(() => {
                if (!cancelled) setCompletedSteps((c) => Math.max(c, target));
              }, i * 80),
            );
          }
          return cur;
        });

        // ~1s pause after the cascade, then transition to Review.
        cosmeticTimers.push(
          setTimeout(() => {
            if (!cancelled) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              cancelled = true;
              clearInterval(pollTimer);
              setStep('review');
            }
          }, 1000),
        );
      } else if (status === 'failed') {
        cosmeticTimers.forEach(clearTimeout);
        cancelled = true;
        clearInterval(pollTimer);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setStep('failed');
      }
    }

    const pollTimer = setInterval(async () => {
      if (cancelled) return;
      try {
        const result = await pollJobStatus(extractionJobId);
        if (result.status !== 'unknown' && result.row) {
          handleStatus(result.status as ExtractionStatus, result.row);
        }
      } catch (err) {
        uploadLog.warn('Poll cycle failed:', err);
      }
    }, 2000);

    return () => {
      cancelled = true;
      cosmeticTimers.forEach(clearTimeout);
      clearInterval(pollTimer);
    };
  }, [step, draftCollectibleId, extractionJobId]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetFlow = useCallback(() => {
    if (draftCollectibleId && user?.id) {
      deleteCollectible(draftCollectibleId, user.id).catch(() => {});
      setDraftCollectibleId(null);
    } else if (draftCollectibleId) {
      setDraftCollectibleId(null);
    }

    setStep('scan');
    setIsUploading(false);
    setExtractionStatus(null);
    setExtractionJobId(null);
    setQueuePosition(0);
    setEtaSeconds(30);
    setTheaterError(null);
    setCompletedSteps(0);
    progress.value = 0;
    setPhotos([]);
    setContext('');
    setExtraction(null);
    setCommittedCollectibleId(null);
    setEditQueue([]);
    setFieldEdits(EMPTY_EDITS);
    setListingEdits({});
    setPulseKeys([]);
    setPulseNonce(0);
    setRapidFireOpen(false);

    // Finalize-screen fields. Without these, a follow-up upload starts with
    // the previous run's showcase selection, tags, status, value, etc. still
    // pre-filled — and any locally-minted showcase stubs (`local-${ts}` ids)
    // keep showing up in the picker even though they were already committed
    // server-side. Reset them all back to the same defaults as initial mount.
    setSelectedShowcaseIds([]);
    setLocalShowcases([]);
    setTags([]);
    setStatus('NFST');
    setVisibility('public');
    setEstimatedValue('');
  }, [draftCollectibleId, user?.id]);

  // Auto-reset on tab blur. Whenever the user leaves the upload tab — whether
  // they tapped X mid-flow, hit "View in Collection" from the success screen,
  // or just switched to another tab — we want to come back to a clean
  // "start a new upload" state instead of the screen they happened to be on.
  // We hold the latest `resetFlow` in a ref so the focus registration stays
  // stable across re-renders (otherwise the cleanup would fire mid-flow
  // every time `draftCollectibleId` changed identity).
  const resetFlowRef = useRef(resetFlow);
  useEffect(() => {
    resetFlowRef.current = resetFlow;
  }, [resetFlow]);
  useFocusEffect(
    useCallback(() => {
      return () => {
        resetFlowRef.current();
      };
    }, []),
  );

  // Effective extraction = seed + any committed edits. Used by review and
  // finalize alike so edits are honored wherever data renders.
  const effectiveExtraction = useMemo(
    () => (extraction ? applyEdits(extraction, fieldEdits) : null),
    [extraction, fieldEdits],
  );

  // Effective listing copy = inline-edited value when present, otherwise
  // the value extracted by the engine. Empty-string is treated as
  // "user cleared it" — we keep the empty so the input doesn't snap back
  // to the engine value while they're editing.
  const effectiveListingTitle =
    listingEdits.title ?? effectiveExtraction?.listingTitle ?? '';
  const effectiveListingDescription =
    listingEdits.description ?? effectiveExtraction?.listingDescription ?? '';

  const editableFields = useMemo(
    () => (effectiveExtraction ? buildEditableFields(effectiveExtraction) : []),
    [effectiveExtraction],
  );

  const toggleQueue = useCallback((id: QueueId) => {
    Haptics.selectionAsync();
    setEditQueue((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }, []);

  const cancelRapidFire = useCallback(() => {
    setRapidFireOpen(false);
  }, []);

  // Build the items payload rapid-fire walks through. The order is the
  // order the user queued them in, so the flow respects their mental
  // grouping ("I'll fix the year first, then the grade, then...").
  const rapidFireItems = useMemo<RapidFireEditItem[]>(() => {
    if (editQueue.length === 0) return [];
    const byId = new Map(editableFields.map((f) => [f.id, f]));
    return editQueue
      .map((id) => {
        const field = byId.get(id);
        if (!field) return null;
        return {
          id: field.id,
          label: field.label,
          description: field.description,
          type: field.type,
          currentValue: field.currentValue,
          // Long-form free text gets the taller multiline input; everything
          // else stays single-line. Notes/description fields are the only
          // real multiline candidates in the schema today.
          multiline:
            field.type === 'string' && /notes|description|inscription|details/i.test(field.key),
        } as RapidFireEditItem;
      })
      .filter((item): item is RapidFireEditItem => item !== null);
  }, [editQueue, editableFields]);

  const handleRapidFireSubmit = useCallback(
    (rawEdits: Record<string, FieldEditorValue>, editedIds: string[]) => {
      const next: FieldEdits = { ai: {}, trait: {} };
      for (const [id, value] of Object.entries(rawEdits)) {
        const { bucket, key } = parseQueueId(id);
        next[bucket][key] = value;
      }
      setFieldEdits((current) => ({
        ai: { ...current.ai, ...next.ai },
        trait: { ...current.trait, ...next.trait },
      }));
      setPulseKeys(editedIds);
      setPulseNonce((n) => n + 1);
      setEditQueue([]);
      setRapidFireOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [],
  );

  const hasInProgressWork =
    step !== 'success' && (photos.length > 0 || context.trim().length > 0 || extraction !== null);

  const handleClose = useCallback(() => {
    if (!hasInProgressWork) {
      router.back();
      return;
    }
    Alert.alert(
      'Discard this upload?',
      'You\u2019ll lose the photos, context, and anything the AI already identified. This can\u2019t be undone.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            if (draftCollectibleId && user?.id) {
              deleteCollectible(draftCollectibleId, user.id).catch(() => {});
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
      ],
    );
  }, [hasInProgressWork, router, draftCollectibleId, user?.id]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.void }]}>
      <View style={[styles.header, { borderBottomColor: colors.frostDivider }]}>
        {step === 'finalize' ? (
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setStep('review');
            }}
            style={[styles.closeButton, { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg }]}
            accessibilityRole="button"
            accessibilityLabel="Back to review"
          >
            <ChevronLeft size={20} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <Pressable
            onPress={handleClose}
            style={[styles.closeButton, { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg }]}
            accessibilityRole="button"
            accessibilityLabel="Close upload"
          >
            <X size={18} color={colors.textPrimary} />
          </Pressable>
        )}
        <View style={styles.headerCenter}>
          <Text style={[styles.kicker, { color: colors.brandVolt }]}>AI UPLOAD</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{getStepTitle(step)}</Text>
        </View>
        <View style={styles.closeButtonGhost} />
      </View>

      {step === 'scan' ? (
        <>
          <ScanStep
            photos={photos}
            context={context}
            onContextChange={setContext}
            onPickPhotos={openPhotoSourceSheet}
            onRemovePhoto={removePhoto}
            onReorderPhotos={handleReorderPhotos}
            onAnalyze={handleAnalyze}
            isUploading={isUploading}
            bottomInset={insets.bottom}
          />
          <ActionDock
            label="Identify"
            bottomInset={insets.bottom}
            onPress={handleAnalyze}
            disabled={isUploading || photos.length === 0}
          />
        </>
      ) : step === 'theater' ? (
        <TheaterStep
          photos={photos}
          completedSteps={completedSteps}
          progress={progress}
          extractionStatus={extractionStatus}
        />
      ) : step === 'review' && effectiveExtraction ? (
        <>
          <ReviewStep
            extraction={effectiveExtraction}
            images={
              effectiveExtraction.photos.length > 0
                ? effectiveExtraction.photos
                : photos.map((p) => p.uri)
            }
            listingTitleValue={effectiveListingTitle}
            listingDescriptionValue={effectiveListingDescription}
            onTitleChange={(value) => setListingEdits((prev) => ({ ...prev, title: value }))}
            onDescriptionChange={(value) =>
              setListingEdits((prev) => ({ ...prev, description: value }))
            }
            bottomInset={insets.bottom}
            editQueue={editQueue}
            pulseKeys={pulseKeys}
            pulseNonce={pulseNonce}
            editableFields={editableFields}
            onToggleQueue={toggleQueue}
          />
          <ActionDock
            label={editQueue.length > 0 ? `Make Edits (${editQueue.length})` : 'Looks Good'}
            icon={editQueue.length > 0 ? Pencil : ArrowRight}
            bottomInset={insets.bottom}
            onPress={() => {
              if (editQueue.length > 0) {
                setRapidFireOpen(true);
              } else {
                setStep('finalize');
              }
            }}
          />
        </>
      ) : step === 'finalize' && effectiveExtraction ? (
        <>
          <FinalizeStep
            extraction={effectiveExtraction}
            status={status}
            value={estimatedValue}
            visibility={visibility}
            selectedShowcases={selectedShowcases}
            onRemoveShowcase={handleRemoveShowcase}
            tags={tags}
            bottomInset={insets.bottom}
            valueRequired={valueRequired}
            valueMissing={valueMissing}
            onStatusChange={setStatus}
            onValueChange={setEstimatedValue}
            onVisibilityChange={setVisibility}
            onOpenShowcasePicker={() => setShowcaseSheetOpen(true)}
            onOpenTagDialog={() => setTagDialogOpen(true)}
            onRemoveTag={(t) => setTags(tags.filter((x) => x !== t))}
          />
          <ActionDock
            label={valueMissing ? 'Set a Value First' : 'Add to Collection'}
            icon={Check}
            bottomInset={insets.bottom}
            disabled={valueMissing}
            onPress={async () => {
              if (!draftCollectibleId || !effectiveExtraction) {
                return;
              }
              try {
                const parsedVal = parseFloat(estimatedValue);
                const finalTitle = (listingEdits.title ?? effectiveExtraction.listingTitle ?? '').trim();
                const finalDescription = (listingEdits.description ?? effectiveExtraction.listingDescription ?? '').trim();
                await commitDraftCollectible(draftCollectibleId, user!.id, {
                  title: finalTitle,
                  listingTitle: finalTitle,
                  listingDescription: finalDescription,
                  value: parsedVal > 0 ? parsedVal : 0,
                  availableForSale: status === 'FOR_SALE' || status === 'SELL_TRADE',
                  availableForTrade: status === 'FOR_TRADE' || status === 'SELL_TRADE',
                  visibility,
                  tags,
                  showcaseIds: selectedShowcaseIds,
                  aiMetadata: effectiveExtraction.aiMetadata,
                  traitMetadata: effectiveExtraction.traitMetadata,
                });
                setCommittedCollectibleId(draftCollectibleId);
                setDraftCollectibleId(null);
                setStep('success');
              } catch (err) {
                uploadLog.error('Commit failed:', err);
                Alert.alert('Error', 'Failed to save collectible. Please try again.');
              }
            }}
          />
        </>
      ) : step === 'failed' ? (
        <FailedStep
          onStartOver={resetFlow}
          onGetSupport={() => router.push('/settings/support' as Href)}
        />
      ) : (
        <SuccessStep
          extraction={effectiveExtraction}
          onAddAnother={resetFlow}
          onViewCollection={() => {
            if (committedCollectibleId) {
              router.push(`/collectible/${committedCollectibleId}` as Href);
            } else {
              router.push('/(tabs)' as Href);
            }
          }}
        />
      )}

      <View style={{ height: insets.bottom + 10 }} />

      <ShowcaseSelectorSheet
        visible={showcaseSheetOpen}
        onClose={() => setShowcaseSheetOpen(false)}
        showcases={allShowcases}
        selectedIds={selectedShowcaseIds}
        onSelectionChange={setSelectedShowcaseIds}
        onCreate={handleCreateShowcase}
        loading={showcasesLoading}
      />

      <InputDialog
        visible={tagDialogOpen}
        title="Add Tag"
        subtitle="Short lowercase labels (e.g. rookie, vintage, psa10)."
        placeholder="tag"
        submitLabel="Add"
        onSubmit={handleAddTag}
        onCancel={() => setTagDialogOpen(false)}
        autoCapitalize="none"
        maxLength={32}
      />

      <RapidFireEdit
        visible={rapidFireOpen}
        items={rapidFireItems}
        onSubmit={handleRapidFireSubmit}
        onCancel={cancelRapidFire}
      />

      <ActionSheet
        visible={photoSourceSheetOpen}
        title="Add a photo"
        message="Camera shoots one at a time; library lets you pick several."
        options={[
          {
            label: 'Take Photo',
            preferred: true,
            onPress: () => {
              setPhotoSourceSheetOpen(false);
              pickFromCamera();
            },
          },
          {
            label: 'Choose from Library',
            onPress: () => {
              setPhotoSourceSheetOpen(false);
              pickFromLibrary();
            },
          },
        ]}
        onClose={() => setPhotoSourceSheetOpen(false)}
      />
    </View>
  );
}

function getStepTitle(step: UploadStep): string {
  switch (step) {
    case 'scan': return 'Capture';
    case 'theater': return 'Processing';
    case 'review': return 'Review';
    case 'finalize': return 'Preferences';
    case 'failed': return 'Error';
    case 'success': return 'Saved';
  }
}

// ---------------------------------------------------------------------------
// Step 1 — Scan (single viewport, real picker)
// ---------------------------------------------------------------------------

type GridItem =
  | { kind: 'photo'; photo: PhotoAsset }
  | { kind: 'add' };

function ScanStep({
  photos,
  context,
  onContextChange,
  onPickPhotos,
  onRemovePhoto,
  onReorderPhotos,
  onAnalyze: _onAnalyze,
  isUploading,
  bottomInset,
}: {
  photos: PhotoAsset[];
  context: string;
  onContextChange: (value: string) => void;
  onPickPhotos: () => void;
  onRemovePhoto: (id: string) => void;
  onReorderPhotos: (next: PhotoAsset[]) => void;
  onAnalyze: () => void;
  isUploading: boolean;
  bottomInset: number;
}) {
  const { colors } = useTheme();

  // Dynamic-grid data model: filled photos followed by a single trailing
  // "+ Add" sentinel when count < 6. Matches the iOS Mail / iMessage /
  // Notes photo-attach pattern (no pre-rendered empty placeholders;
  // the grid grows as photos are added). DraggableFlatList drives the
  // visual reorder and we filter out the sentinel before committing.
  const gridData = useMemo<GridItem[]>(() => {
    const items: GridItem[] = photos.map((photo) => ({ kind: 'photo' as const, photo }));
    if (photos.length < 6) items.push({ kind: 'add' as const });
    return items;
  }, [photos]);

  const gridKey = useCallback(
    (item: GridItem) => (item.kind === 'photo' ? item.photo.id : '__add__'),
    [],
  );

  const handleDragEnd = useCallback(
    ({ data }: { data: GridItem[] }) => {
      const next: PhotoAsset[] = data
        .filter((d): d is { kind: 'photo'; photo: PhotoAsset } => d.kind === 'photo')
        .map((d) => d.photo);
      const unchanged =
        next.length === photos.length && next.every((p, i) => p.id === photos[i]?.id);
      if (unchanged) return;
      onReorderPhotos(next);
    },
    [photos, onReorderPhotos],
  );

  const renderGridItem = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<GridItem>) => {
      if (item.kind === 'add') {
        return (
          <Pressable
            onPress={onPickPhotos}
            style={[
              styles.emptyTile,
              { borderColor: colors.frostBorderStrong, backgroundColor: colors.sheetBg },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Add photo. ${6 - photos.length} of 6 slots remaining.`}
          >
            <ImagePlus size={20} color={colors.textTertiary} strokeWidth={1.6} />
          </Pressable>
        );
      }
      const index = getIndex() ?? 0;
      const isCover = index === 0;
      return (
        <ScaleDecorator activeScale={1.08}>
          <Animated.View
            // Reanimated layout transition: when DFL's
            // enableLayoutAnimationExperimental is on, sibling tiles animate
            // smoothly to their new positions as the dragged tile moves
            // past them. CurvedTransition uses an iOS-style ease so the
            // shuffle feels native (matches Springboard icon reorder).
            layout={CurvedTransition.duration(220)}
          >
            <Pressable
              onLongPress={drag}
              disabled={isActive}
              delayLongPress={220}
              style={[
                styles.photoTile,
                { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg },
                isCover && { borderColor: colors.brandVoltBorder, borderWidth: 1.5 },
                isActive && {
                  borderColor: colors.brandVolt,
                  borderWidth: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 12 },
                  shadowOpacity: 0.55,
                  shadowRadius: 22,
                  elevation: 16,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Photo ${index + 1}${isCover ? ', cover photo' : ''}. Long-press to reorder. Tap remove button to delete.`}
            >
              <Image source={{ uri: item.photo.uri }} style={styles.photoImage} contentFit="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.58)']}
                locations={[0.45, 1]}
                style={StyleSheet.absoluteFillObject}
              />
              <Pressable
                onPress={() => onRemovePhoto(item.photo.id)}
                style={[styles.removeBadge, { borderColor: colors.frostBorder }]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <X size={12} color={colors.textPrimary} strokeWidth={2.5} />
              </Pressable>
              {isCover ? (
                <View
                  style={[
                    styles.coverBadge,
                    { backgroundColor: colors.brandVoltFill, borderColor: colors.brandVoltBorder },
                  ]}
                >
                  <Text style={[styles.coverBadgeText, { color: colors.brandVolt }]}>COVER</Text>
                </View>
              ) : null}
            </Pressable>
          </Animated.View>
        </ScaleDecorator>
      );
    },
    [colors, onPickPhotos, onRemovePhoto, photos.length],
  );

  // Drop-target placeholder. DFL paints this at the cell where the dragged
  // tile will land if released. Mirrors the empty/add-tile chrome (dashed
  // border, sheet bg) tinted with brandVolt so it reads as "this is where
  // it goes" rather than just an empty spacer. Without this, the user
  // sees the lifted tile floating but has no positional anchor — exactly
  // the "totally just guessing" feedback the founder flagged.
  const renderPlaceholder = useCallback(
    () => (
      <View
        style={[
          styles.dropPlaceholder,
          { borderColor: colors.brandVolt, backgroundColor: colors.brandVoltFill },
        ]}
      />
    ),
    [colors],
  );

  // Use the same pattern as `vault/rapid-fire-edit.tsx`: KAV(offset=0,
  // padding) + an inner ScrollView for content + a docked footer (button)
  // *outside* the scroll. The KAV's padding behaviour shrinks the inner
  // area when the keyboard appears. KeyboardSafeScroll auto-scrolls the
  // focused TextInput into view above the keyboard (and accessory bar)
  // without needing manual offset math. The ActionDock space is reserved
  // via `paddingBottom` on the content container.
  return (
    <KeyboardSafeScroll
      style={[styles.scanBody, styles.scanScroll]}
      contentContainerStyle={[styles.scanScrollContent, { paddingBottom: ActionDock.reservedHeight(bottomInset) + 24 }]}
      pointerEvents={isUploading ? 'none' : 'auto'}
    >
      <View style={[styles.scanTitleBlock, isUploading && { opacity: 0.5 }]}>
        <Text style={[styles.scanTitle, { color: colors.textPrimary }]}>Scan Collectible</Text>
        <Text style={[styles.scanSubtitle, { color: colors.textSecondary }]}>
          Add 1–6 photos{' '}
          <Text style={[styles.scanSubtitleMuted, { color: colors.textTertiary }]}>· 1 required · first = featured</Text>
        </Text>
      </View>

      <View
        style={[styles.photoGrid, isUploading && { opacity: 0.5 }]}
        pointerEvents={isUploading ? 'none' : 'auto'}
      >
        <DraggableFlatList<GridItem>
          data={gridData}
          keyExtractor={gridKey}
          renderItem={renderGridItem}
          renderPlaceholder={renderPlaceholder}
          onDragEnd={handleDragEnd}
          onDragBegin={() => Haptics.selectionAsync()}
          onPlaceholderIndexChange={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          numColumns={3}
          scrollEnabled={false}
          activationDistance={6}
          dragItemOverflow
          enableLayoutAnimationExperimental
          containerStyle={styles.photoGridList}
          columnWrapperStyle={styles.photoGridRow}
        />
      </View>

      <View style={[styles.contextBlock, isUploading && { opacity: 0.5 }]}>
        <Text style={[styles.contextLabel, { color: colors.textPrimary }]}>
          Context <Text style={[styles.contextOptional, { color: colors.textTertiary }]}>(Optional)</Text>
        </Text>
        <View style={[styles.contextFieldWrap, { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg }]}>
          <TextInput
            value={context}
            onChangeText={(text) => onContextChange(text.slice(0, LISTING_TITLE_MAX))}
            placeholder="Origin, set, condition, player, cert info..."
            placeholderTextColor={colors.textTertiary}
            style={[styles.contextInput, { color: colors.textPrimary }]}
            maxLength={LISTING_TITLE_MAX}
            returnKeyType="done"
            editable={!isUploading}
          />
          <Text style={[styles.contextCounter, { color: colors.textTertiary }]}>{context.length}/{LISTING_TITLE_MAX}</Text>
        </View>
      </View>
    </KeyboardSafeScroll>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Theater (Looking Glass HUD)
// ---------------------------------------------------------------------------

const PROGRESS_RING_SIZE = 140;
const PROGRESS_RING_STROKE = 4;
const PROGRESS_RING_RADIUS = (PROGRESS_RING_SIZE - PROGRESS_RING_STROKE) / 2;
const PROGRESS_RING_CIRCUM = 2 * Math.PI * PROGRESS_RING_RADIUS;
const PROGRESS_RING_GRADIENT_ID = 'lookingGlassRingGradient';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);


function TheaterStep({
  photos,
  completedSteps,
  progress,
  extractionStatus,
}: {
  photos: PhotoAsset[];
  completedSteps: number;
  progress: SharedValue<number>;
  extractionStatus: ExtractionStatus | null;
}) {
  const { colors } = useTheme();
  const [percentText, setPercentText] = useState('0');
  const featuredPhoto = photos[0];

  // Drive the percent label off the same shared value as the ring.
  useEffect(() => {
    const id = setInterval(() => {
      const next = Math.round((progress.value ?? 0) * 100);
      setPercentText((cur) => (cur === String(next) ? cur : String(next)));
    }, 100);
    return () => clearInterval(id);
  }, [progress]);

  // Hero reveal — the photo emerges from black as the ring climbs.
  // The whole image stack sits inside an Animated.View whose opacity
  // climbs 0 → 0.5 over the 30s window, so the void shows through at
  // the start (only the ring is visible) and the photo asymptotically
  // appears at half-strength — bright enough to identify, dim enough
  // for the ring + checklist to keep the spotlight.
  const revealOpacity = useSharedValue(0);
  useEffect(() => {
    revealOpacity.value = 0;
    revealOpacity.value = withTiming(0.5, {
      duration: 30000,
      easing: Easing.inOut(Easing.quad),
    });
  }, [revealOpacity]);
  useEffect(() => {
    if (extractionStatus === 'extracted' || extractionStatus === 'complete') {
      revealOpacity.value = withTiming(0.5, { duration: 250 });
    }
  }, [extractionStatus, revealOpacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: revealOpacity.value }));

  // Inside the reveal, the sharp image fades up over the blurred one so
  // the photo also "loses focus" as it appears — same 30s window.
  const sharpOpacity = useSharedValue(0);
  useEffect(() => {
    sharpOpacity.value = 0;
    sharpOpacity.value = withTiming(1, {
      duration: 30000,
      easing: Easing.inOut(Easing.quad),
    });
  }, [sharpOpacity]);
  useEffect(() => {
    if (extractionStatus === 'extracted' || extractionStatus === 'complete') {
      sharpOpacity.value = withTiming(1, { duration: 250 });
    }
  }, [extractionStatus, sharpOpacity]);
  const sharpStyle = useAnimatedStyle(() => ({ opacity: sharpOpacity.value }));

  // Pulsing semanticGreen dot beside SYSTEM ONLINE.
  const dotOpacity = useSharedValue(1);
  useEffect(() => {
    dotOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [dotOpacity]);
  const dotStyle = useAnimatedStyle(() => ({ opacity: dotOpacity.value }));

  // Animated stroke offset for the progress ring.
  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: PROGRESS_RING_CIRCUM * (1 - (progress.value ?? 0)),
  }));

  return (
    <View style={styles.theaterWrap}>
      {/* Header band — kicker + pulsing system online */}
      <View style={styles.theaterHeader}>
        <Text style={[styles.headerKicker, { color: colors.textPrimary }]}>
          LENS: LOOKING GLASS
        </Text>
        <View style={styles.systemOnlineRow}>
          <Animated.View
            style={[styles.onlineDot, { backgroundColor: colors.semanticGreen }, dotStyle]}
          />
          <Text style={[styles.systemOnline, { color: colors.textTertiary }]}>
            SYSTEM ONLINE
          </Text>
        </View>
      </View>

      {/* Hero — holo-framed photo with matte padding; the photo emerges
          from black as the ring climbs, with the ring overlaid on top. */}
      <View style={styles.heroBlock}>
        <HolographicFrame intensity="standard" style={styles.heroFrame}>
          <View style={[styles.heroInner, { backgroundColor: colors.void }]}>
            <View style={[styles.heroPhotoContainer, { backgroundColor: colors.void }]}>
              {featuredPhoto ? (
                <Animated.View style={[StyleSheet.absoluteFill, revealStyle]}>
                  <Image
                    source={{ uri: featuredPhoto.uri }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    blurRadius={20}
                    recyclingKey={`hero-blur-${featuredPhoto.id}`}
                  />
                  <Animated.View style={[StyleSheet.absoluteFill, sharpStyle]}>
                    <Image
                      source={{ uri: featuredPhoto.uri }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      recyclingKey={`hero-sharp-${featuredPhoto.id}`}
                    />
                  </Animated.View>
                </Animated.View>
              ) : null}
            </View>

            {/* Iridescent progress ring centered over the photo */}
            <View style={styles.ringOverlay} pointerEvents="none">
              <View style={styles.ringInner}>
                <Svg
                  width={PROGRESS_RING_SIZE}
                  height={PROGRESS_RING_SIZE}
                  style={StyleSheet.absoluteFill}
                >
                  <Defs>
                    <SvgLinearGradient
                      id={PROGRESS_RING_GRADIENT_ID}
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <Stop offset="0%" stopColor="#22D3EE" stopOpacity={0.95} />
                      <Stop offset="40%" stopColor="#F0F0F0" stopOpacity={1} />
                      <Stop offset="70%" stopColor="#BBCA3A" stopOpacity={0.95} />
                      <Stop offset="100%" stopColor="#A78BFA" stopOpacity={0.95} />
                    </SvgLinearGradient>
                  </Defs>
                  <Circle
                    cx={PROGRESS_RING_SIZE / 2}
                    cy={PROGRESS_RING_SIZE / 2}
                    r={PROGRESS_RING_RADIUS}
                    stroke={colors.frostBorderStrong}
                    strokeWidth={PROGRESS_RING_STROKE}
                    fill="transparent"
                  />
                  <AnimatedCircle
                    cx={PROGRESS_RING_SIZE / 2}
                    cy={PROGRESS_RING_SIZE / 2}
                    r={PROGRESS_RING_RADIUS}
                    stroke={`url(#${PROGRESS_RING_GRADIENT_ID})`}
                    strokeWidth={PROGRESS_RING_STROKE}
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray={PROGRESS_RING_CIRCUM}
                    animatedProps={ringProps}
                    transform={`rotate(-90 ${PROGRESS_RING_SIZE / 2} ${PROGRESS_RING_SIZE / 2})`}
                  />
                </Svg>
                <View style={styles.ringTextWrap}>
                  <Text style={[styles.ringText, { color: colors.textPrimary }]}>
                    {percentText}
                  </Text>
                  <Text style={[styles.ringKicker, { color: colors.textPrimary }]}>
                    ANALYZING
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </HolographicFrame>
      </View>

      {/* Description block */}
      <View style={styles.descBlock}>
        <Text style={[styles.descTitle, { color: colors.textPrimary }]}>
          Translating Collectible
        </Text>
        <Text style={[styles.descBody, { color: colors.textSecondary }]}>
          Looking Glass is actively analyzing your collectible to understand its details and condition.
        </Text>
      </View>

      <View style={styles.checklist}>
        {CHECKLIST_ITEMS.map((item, i) => {
          const status: ChecklistRowStatus =
            i < completedSteps ? 'complete' : i === completedSteps ? 'processing' : 'queued';
          return (
            <ChecklistRow
              key={item.label}
              label={item.label}
              status={status}
              cascadeIndex={i}
            />
          );
        })}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ChecklistRow — single line of the Looking Glass checklist.
// ---------------------------------------------------------------------------

type ChecklistRowStatus = 'complete' | 'processing' | 'queued';

function ChecklistRow({
  label,
  status,
  cascadeIndex,
}: {
  label: string;
  status: ChecklistRowStatus;
  cascadeIndex: number;
}) {
  const { colors } = useTheme();

  const spin = useSharedValue(0);
  useEffect(() => {
    if (status === 'processing') {
      spin.value = 0;
      spin.value = withRepeat(
        withTiming(360, { duration: 1500, easing: Easing.linear }),
        -1,
        false,
      );
    } else {
      spin.value = 0;
    }
  }, [status, spin]);
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value}deg` }],
  }));

  let indicator: React.ReactNode;
  let statusLabel = '';
  let statusColor = colors.textTertiary;
  let labelColor = colors.textTertiary;

  if (status === 'complete') {
    indicator = (
      <View
        style={[
          styles.checklistIndicator,
          { backgroundColor: colors.brandVolt, borderColor: colors.brandVolt },
        ]}
      >
        <Check size={8} color={colors.textInverse} strokeWidth={3} />
      </View>
    );
    statusLabel = 'Complete';
    statusColor = colors.brandVolt;
    labelColor = colors.brandVolt;
  } else if (status === 'processing') {
    indicator = (
      <Animated.View
        style={[
          styles.checklistIndicator,
          styles.checklistIndicatorDashed,
          { borderColor: colors.brandVolt },
          spinStyle,
        ]}
      />
    );
    statusLabel = 'Processing';
    statusColor = colors.brandVolt;
    labelColor = colors.textPrimary;
  } else {
    indicator = (
      <View
        style={[
          styles.checklistIndicator,
          { borderColor: colors.frostBorder },
        ]}
      />
    );
    statusLabel = 'Queued';
    statusColor = colors.textTertiary;
  }

  return (
    <Animated.View
      key={`row-${status}`}
      entering={FadeIn.duration(200).delay(cascadeIndex * 80)}
      style={styles.checklistRow}
    >
      {indicator}
      <Text style={[styles.checklistLabel, { color: labelColor }]}>{label}</Text>
      <Text style={[styles.checklistStatus, { color: statusColor }]}>{statusLabel}</Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Failed Step
// ---------------------------------------------------------------------------

function FailedStep({
  onStartOver,
  onGetSupport,
}: {
  onStartOver: () => void;
  onGetSupport: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.failedWrap}>
      <View style={[styles.failedIconWrap, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
        <AlertCircle size={48} color={colors.textSecondary} strokeWidth={1.2} />
      </View>
      <Text style={[styles.failedTitle, { color: colors.textPrimary }]}>
        We couldn&apos;t analyze this item
      </Text>
      <Text style={[styles.failedCopy, { color: colors.textSecondary }]}>
        Something went wrong during extraction. This can happen with unusual items or temporary service issues.
      </Text>
      <Button label="Start Over" fullWidth onPress={onStartOver} style={{ marginTop: SPACING.xl }} />
      <Pressable onPress={onGetSupport} style={styles.failedSupportLink} accessibilityRole="button">
        <Headphones size={16} color={colors.textTertiary} />
        <Text style={[styles.failedSupportText, { color: colors.textTertiary }]}>Get Support</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Review (V3 SchemaRow / Section / Card pattern)
// Rendering logic mirrors collectible detail SpecsLens 1:1.
// ---------------------------------------------------------------------------


const MONO_KEY_PATTERNS = /(year|serial|number|cert|id|grade|confidence|print_run|count|ratio|edition|score|code)/i;

function looksLikeCode(value: string): boolean {
  if (!value || !/\d/.test(value)) return false;
  if (/^\d{4}$/.test(value)) return true;
  if (/^\d+\s*\/\s*\d+$/.test(value)) return true;
  if (/^[A-Z0-9][A-Z0-9\s\-\/]+$/i.test(value) && value.length <= 24) return true;
  if (/^\d+(\.\d+)?%$/.test(value)) return true;
  if (/^\d+\.\d+$/.test(value)) return true;
  return false;
}

function shouldMono(key: string, value: string): boolean {
  if (MONO_KEY_PATTERNS.test(key)) return true;
  return looksLikeCode(value);
}

function humanizeKey(key: string): string {
  return key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function capitalizeFirst(str: string): string {
  if (!str) return str;
  const first = str.charAt(0);
  const upper = first.toUpperCase();
  return first === upper ? str : upper + str.slice(1);
}

function isPopulated(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === 'string' && v.trim() === '') return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

function formatScalar(v: unknown): string | null {
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    const parts = v.map(formatScalar).filter((p): p is string => !!p);
    return parts.length ? parts.join(', ') : null;
  }
  return null;
}

const SKIP_KEYS_AI = new Set(['notes', 'customizations']);
const SKIP_KEYS_TRAIT = new Set(['item_type', 'authentications', 'verification_url']);

// ---------------------------------------------------------------------------
// Editable-field model — bridges schema into the queue-to-edit flow.
//
// A QueueId is namespaced (`ai:Year`, `trait:signer_name`) so the same
// underlying key in two buckets stays distinct and so the edits map can
// be blindly merged onto the right source without guesswork.
// ---------------------------------------------------------------------------

type EditBucket = 'ai' | 'trait';
type QueueId = string; // `${bucket}:${rawKey}`

function toQueueId(bucket: EditBucket, key: string): QueueId {
  return `${bucket}:${key}`;
}

function parseQueueId(id: QueueId): { bucket: EditBucket; key: string } {
  const [bucket, ...rest] = id.split(':');
  return { bucket: bucket as EditBucket, key: rest.join(':') };
}

// Trait schema isn't shipped by the engine the way `field_schema` is, so we
// hardcode the minimal type map we need for rapid-fire to pick the right
// keyboard / toggle. Everything unlisted falls back to `string`.
const TRAIT_FIELD_TYPES: Record<string, 'string' | 'number' | 'boolean'> = {
  signature_count: 'number',
  physical_certificate_present: 'boolean',
  gu_physical_certificate_present: 'boolean',
  matting_present: 'boolean',
  multi_item_display: 'boolean',
  display_item_count: 'number',
  seal_intact: 'boolean',
};

// Strip "(e.g. 2020)" / "(array)" / "(Mint, Near Mint...)" trailing bits from
// either a schema key or description. The verbose parentheticals are useful
// for the LLM prompt but pollute the UI. Mirrors the review screen's row
// labels and keeps the rapid-fire hero consistent.
function stripParenthetical(value: string): string {
  return value.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

function normalizeFieldType(raw: string): 'string' | 'number' | 'boolean' {
  if (raw === 'number' || raw === 'boolean' || raw === 'string') return raw;
  return 'string';
}

interface EditableField {
  id: QueueId;
  bucket: EditBucket;
  key: string;
  label: string;
  description?: string;
  type: 'string' | 'number' | 'boolean';
  currentValue: unknown;
  populated: boolean;
}

interface FieldEdits {
  ai: Record<string, unknown>;
  trait: Record<string, unknown>;
}

const EMPTY_EDITS: FieldEdits = { ai: {}, trait: {} };

/**
 * Overlay pending edits onto the base extraction so review + finalize can
 * render the live, user-corrected values without mutating the seed.
 */
function applyEdits(extraction: ExtractionResult, edits: FieldEdits): ExtractionResult {
  if (
    Object.keys(edits.ai).length === 0 &&
    Object.keys(edits.trait).length === 0
  ) {
    return extraction;
  }
  return {
    ...extraction,
    aiMetadata: { ...extraction.aiMetadata, ...edits.ai },
    traitMetadata: { ...extraction.traitMetadata, ...edits.trait },
  };
}

/**
 * Produce the canonical list of editable fields for a given extraction.
 *
 * AI fields come straight from `field_schema` — that's the source of truth
 * for what *could* have been extracted, not just what was. Trait fields are
 * derived from whatever keys exist on `trait_metadata` today (the engine
 * injects them per-trait via overlays), which keeps us flexible as new
 * traits ship without a code change.
 */
function buildEditableFields(extraction: ExtractionResult): EditableField[] {
  const fields: EditableField[] = [];

  for (const [key, schema] of Object.entries(extraction.fieldSchema || {})) {
    if (SKIP_KEYS_AI.has(key.toLowerCase())) continue;
    const currentValue = extraction.aiMetadata?.[key];
    const label = capitalizeFirst(stripParenthetical(humanizeKey(key)));
    fields.push({
      id: toQueueId('ai', key),
      bucket: 'ai',
      key,
      label,
      description: schema.description ? stripParenthetical(schema.description) : undefined,
      type: normalizeFieldType(schema.type),
      currentValue,
      populated: isPopulated(currentValue),
    });
  }

  for (const [key, value] of Object.entries(extraction.traitMetadata || {})) {
    if (SKIP_KEYS_TRAIT.has(key.toLowerCase())) continue;
    const inferred: 'string' | 'number' | 'boolean' =
      TRAIT_FIELD_TYPES[key] ??
      (typeof value === 'boolean'
        ? 'boolean'
        : typeof value === 'number'
        ? 'number'
        : 'string');
    fields.push({
      id: toQueueId('trait', key),
      bucket: 'trait',
      key,
      label: capitalizeFirst(humanizeKey(key)),
      type: inferred,
      currentValue: value,
      populated: isPopulated(value),
    });
  }

  return fields;
}

type Authentication = { company: string | null; number: string | null };

function buildAuthentications(auths: unknown): Authentication[] | null {
  if (!Array.isArray(auths) || auths.length === 0) return null;
  const entries: Authentication[] = [];
  for (const entry of auths) {
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    const company = typeof e.company === 'string' && e.company.trim() ? e.company.trim() : null;
    const number = typeof e.number === 'string' && e.number.trim() ? e.number.trim() : null;
    if (!company && !number) continue;
    entries.push({ company, number });
  }
  return entries.length ? entries : null;
}

/**
 * Convert an editable field into the display value we actually show in the
 * schema row. `—` for null/unpopulated — legible and scan-friendly, matches
 * the empty-state dash we already use elsewhere.
 */
function formatFieldValue(field: EditableField): string {
  if (!field.populated) return '—';
  const display = formatScalar(field.currentValue);
  if (display === null) return '—';
  return capitalizeFirst(display);
}

function ReviewStep({
  extraction,
  images,
  listingTitleValue,
  listingDescriptionValue,
  onTitleChange,
  onDescriptionChange,
  bottomInset,
  editQueue,
  pulseKeys,
  pulseNonce,
  editableFields,
  onToggleQueue,
}: {
  extraction: ExtractionResult;
  /** All available images for the carousel (remote URLs or local URIs). */
  images: string[];
  listingTitleValue: string;
  listingDescriptionValue: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  bottomInset: number;
  editQueue: QueueId[];
  pulseKeys: QueueId[];
  pulseNonce: number;
  editableFields: EditableField[];
  onToggleQueue: (id: QueueId) => void;
}) {
  const { colors } = useTheme();
  const [aiExpanded, setAiExpanded] = useState(false);
  const [traitExpanded, setTraitExpanded] = useState(false);

  const { aiPopulated, aiNull, traitPopulated, traitNull } = useMemo(() => {
    const ai = editableFields.filter((f) => f.bucket === 'ai');
    const trait = editableFields.filter((f) => f.bucket === 'trait');
    return {
      aiPopulated: ai.filter((f) => f.populated),
      aiNull: ai.filter((f) => !f.populated),
      traitPopulated: trait.filter((f) => f.populated),
      traitNull: trait.filter((f) => !f.populated),
    };
  }, [editableFields]);

  const authentications = useMemo(
    () => buildAuthentications((extraction.traitMetadata as Record<string, unknown>)?.authentications),
    [extraction.traitMetadata],
  );

  const hasCollectibleSection = aiPopulated.length > 0 || aiNull.length > 0;
  const hasAuthenticitySection =
    (authentications && authentications.length > 0) ||
    traitPopulated.length > 0 ||
    traitNull.length > 0;

  const queueSet = useMemo(() => new Set(editQueue), [editQueue]);
  const pulseSet = useMemo(() => new Set(pulseKeys), [pulseKeys]);

  const renderFieldRow = (field: EditableField, isLast: boolean) => {
    const display = formatFieldValue(field);
    const mono = field.populated && shouldMono(field.key, display);
    return (
      <SchemaRow
        key={field.id}
        label={field.label}
        value={display}
        mono={mono}
        isLast={isLast}
        onPress={() => onToggleQueue(field.id)}
        queued={queueSet.has(field.id)}
        edited={pulseSet.has(field.id)}
        editedNonce={pulseNonce}
      />
    );
  };

  return (
    <KeyboardSafeScroll
      style={[styles.reviewShell, styles.body]}
      contentContainerStyle={[
        styles.reviewContent,
        { paddingBottom: ActionDock.reservedHeight(bottomInset) + 24 },
      ]}
    >
        {/* Hero — same FramedHero used on the production CollectibleDetail
            DETAILS lens. Identical chrome, identical lightbox, gives the
            user a 1:1 preview of where this item lands post-commit. */}
        <FramedHero images={images} />

        {/* Identity block — pills above title (matches DETAILS lens
            ordering), title + description rendered as inline editable
            inputs so users can rewrite copy without leaving the screen. */}
        <View style={styles.reviewIdentityWrap}>
          {extraction.traits.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reviewPillsRow}
            >
              {extraction.traits.map((t) => <TraitPill key={t} traitKey={t} />)}
            </ScrollView>
          )}

          <InlineEditableField
            value={listingTitleValue}
            // Strip any newlines on input — multiline is only enabled so
            // long titles wrap visually; pressing Return shouldn't insert
            // a literal break in what's semantically a single-line field.
            onChange={(v) => onTitleChange(v.replace(/\r?\n/g, ' '))}
            placeholder="Add a listing title"
            maxLength={LISTING_TITLE_MAX}
            multiline
            minHeight={32}
            textStyle={styles.reviewListingTitle}
          />

          <InlineEditableField
            value={listingDescriptionValue}
            onChange={onDescriptionChange}
            placeholder="Add a listing description"
            maxLength={LISTING_DESCRIPTION_MAX}
            multiline
            minHeight={96}
            textStyle={styles.reviewListingDescription}
          />
        </View>

        {/* Confidence nudge — when confidence is soft, surface the
            "needs review" signal here (the badge that used to live on
            the image overlay folds in as a leading chip). Acts as a
            discoverability prompt toward the tap-to-queue pattern. */}
        {extraction.confidence !== 'high' && (
          <View style={[styles.confidenceHint, { borderColor: colors.frostBorderStrong, backgroundColor: colors.sheetBg }]}>
            <View style={[styles.confidenceHintBadge, { borderColor: colors.semanticOrange }]}>
              <Text style={[styles.confidenceHintBadgeText, { color: colors.semanticOrange }]}>Needs review</Text>
            </View>
            <View style={styles.confidenceHintCopy}>
              <Text style={[styles.confidenceHintText, { color: colors.textPrimary }]}>
                Some fields may need your review
              </Text>
              <Text style={[styles.confidenceHintMeta, { color: colors.textTertiary }]}>
                CONFIDENCE · {extraction.confidence.toUpperCase()}
              </Text>
            </View>
          </View>
        )}

        {/* Collectible details */}
        {hasCollectibleSection && (
          <View style={styles.reviewSection}>
            <Text style={[styles.reviewKicker, { color: colors.textSecondary }]}>COLLECTIBLE DETAILS</Text>
            <View style={styles.reviewCard}>
              {aiPopulated.map((field, i) => {
                const isLast =
                  i === aiPopulated.length - 1 && (!aiExpanded || aiNull.length === 0);
                return renderFieldRow(field, isLast);
              })}
              {aiExpanded &&
                aiNull.map((field, i) => renderFieldRow(field, i === aiNull.length - 1))}
            </View>
            <AddMoreFooter
              nullCount={aiNull.length}
              expanded={aiExpanded}
              onToggle={() => setAiExpanded((v) => !v)}
            />
          </View>
        )}

        {/* Authenticity details */}
        {hasAuthenticitySection && (
          <View style={styles.reviewSection}>
            <Text style={[styles.reviewKicker, { color: colors.textSecondary }]}>AUTHENTICITY DETAILS</Text>
            {authentications && authentications.length > 0 && (
              <View
                style={[
                  styles.reviewCard,
                  (traitPopulated.length > 0 || traitNull.length > 0) && { marginBottom: 10 },
                ]}
              >
                <View style={styles.ledgerHeaderRow}>
                  <Text style={[styles.ledgerHeaderLabel, { color: colors.textTertiary }]}>VERIFIED BY</Text>
                  <Text style={[styles.ledgerHeaderLabel, { color: colors.textTertiary }]}>CERT #</Text>
                </View>
                <View style={[styles.ledgerHeaderDivider, { backgroundColor: colors.frostBorder }]} />
                {authentications.map((entry, i) => (
                  <View
                    key={i}
                    style={[styles.ledgerRow, i < authentications.length - 1 && [styles.ledgerRowDivider, { borderBottomColor: colors.frostDivider }]]}
                  >
                    <View style={styles.ledgerLeftCol}>
                      <View style={[styles.ledgerVerifiedDot, { backgroundColor: colors.semanticGreen }]} />
                      <Text style={[styles.ledgerCompany, { color: colors.textPrimary }]} numberOfLines={1}>{entry.company || '—'}</Text>
                    </View>
                    <Text style={[styles.ledgerCertNumber, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="middle">
                      {entry.number || '—'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {(traitPopulated.length > 0 || (traitExpanded && traitNull.length > 0)) && (
              <View style={styles.reviewCard}>
                {traitPopulated.map((field, i) => {
                  const isLast =
                    i === traitPopulated.length - 1 &&
                    (!traitExpanded || traitNull.length === 0);
                  return renderFieldRow(field, isLast);
                })}
                {traitExpanded &&
                  traitNull.map((field, i) =>
                    renderFieldRow(field, i === traitNull.length - 1),
                  )}
              </View>
            )}
            <AddMoreFooter
              nullCount={traitNull.length}
              expanded={traitExpanded}
              onToggle={() => setTraitExpanded((v) => !v)}
              variant={traitPopulated.length === 0 && traitNull.length === 0 ? 'hidden' : 'visible'}
            />
          </View>
        )}
      </KeyboardSafeScroll>
  );
}

/**
 * AddMoreFooter — renders under each schema section to handle the two
 * "done" states from the handoff spec:
 *   - nullCount > 0: "+ Add More Details (N fields)" expand/collapse toggle.
 *   - nullCount = 0: "Complete extraction" reward chip (hooked-UX win
 *     moment — rewards the AI's success and explains why the accordion
 *     isn't here).
 * If the whole section has no fields at all we render nothing.
 */
function AddMoreFooter({
  nullCount,
  expanded,
  onToggle,
  variant = 'visible',
}: {
  nullCount: number;
  expanded: boolean;
  onToggle: () => void;
  variant?: 'visible' | 'hidden';
}) {
  const { colors } = useTheme();
  if (variant === 'hidden') return null;
  if (nullCount === 0) {
    return (
      <View style={[styles.rewardChip, { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill }]}>
        <Sparkles size={12} color={colors.brandVolt} strokeWidth={2} />
        <Text style={[styles.rewardChipText, { color: colors.brandVolt }]}>COMPLETE EXTRACTION</Text>
      </View>
    );
  }
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      style={({ pressed }) => [styles.addMoreButton, { borderTopColor: colors.frostDivider }, pressed && { opacity: 0.72 }]}
    >
      <Text style={[styles.addMoreLabel, { color: colors.brandVolt }]}>
        {expanded ? 'HIDE' : '+ ADD MORE DETAILS'}
      </Text>
      <View style={styles.addMoreMetaRow}>
        <Text style={[styles.addMoreCount, { color: colors.textTertiary }]}>
          {nullCount} {nullCount === 1 ? 'FIELD' : 'FIELDS'}
        </Text>
        <ChevronDown
          size={14}
          color={colors.textTertiary}
          strokeWidth={2}
          style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
        />
      </View>
    </Pressable>
  );
}

/**
 * InlineEditableField — render-as-text-but-actually-a-TextInput.
 *
 * Used on the Review screen for `listing_title` and `listing_description`.
 * Both are *copy* (presentation), not schema atoms, so they live outside
 * the rapid-fire queue and edit inline. The pencil icon is always visible
 * — explicit affordance > clean default state on a screen the user is
 * meant to scrub for accuracy.
 *
 * Behavior:
 *   - Always-on TextInput styled to look identical to the display text.
 *   - On focus: subtle frost border + sheetBg fill light up around the
 *     field so the active state is unmistakable. On blur: chrome fades.
 *   - Pencil icon sits in the top-right corner; tapping it focuses the
 *     input (covers the case where someone tries to tap the icon
 *     instead of the text).
 *   - Multiline variant grows up to ~4 lines of room before scrolling
 *     internally; single-line variant constrains to one row.
 */
function InlineEditableField({
  value,
  onChange,
  placeholder,
  maxLength,
  multiline,
  minHeight,
  textStyle,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  maxLength: number;
  multiline?: boolean;
  minHeight?: number;
  textStyle: TextStyle;
}) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const focusInput = () => inputRef.current?.focus();

  const overLimit = value.length >= maxLength;
  const remaining = maxLength - value.length;

  return (
    <View
      style={[
        styles.inlineFieldShell,
        {
          borderColor: focused ? colors.frostBorderStrong : 'transparent',
          backgroundColor: focused ? colors.sheetBg : 'transparent',
          minHeight: multiline ? (minHeight ?? 64) : undefined,
        },
      ]}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.slice(0, maxLength))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        multiline={!!multiline}
        textAlignVertical={multiline ? 'top' : 'auto'}
        scrollEnabled={!!multiline}
        maxLength={maxLength}
        style={[textStyle, { color: colors.textPrimary, paddingRight: 30 }]}
      />

      <Pressable
        onPress={focusInput}
        hitSlop={10}
        style={styles.inlineFieldPencil}
        accessibilityRole="button"
        accessibilityLabel="Edit"
      >
        <Pencil size={14} color={focused ? colors.brandVolt : colors.textTertiary} strokeWidth={1.8} />
      </Pressable>

      {focused ? (
        <Text
          style={[
            styles.inlineFieldCounter,
            { color: overLimit ? colors.semanticOrange : colors.textTertiary },
          ]}
        >
          {remaining}
        </Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — Finalize
// ---------------------------------------------------------------------------

function FinalizeStep({
  extraction: _extraction,
  status,
  value,
  visibility,
  selectedShowcases,
  tags,
  bottomInset,
  valueRequired,
  valueMissing,
  onStatusChange,
  onValueChange,
  onVisibilityChange,
  onOpenShowcasePicker,
  onRemoveShowcase,
  onOpenTagDialog,
  onRemoveTag,
}: {
  extraction: ExtractionResult;
  status: ListingStatus;
  value: string;
  visibility: 'public' | 'private';
  selectedShowcases: { id: string; title: string }[];
  tags: string[];
  bottomInset: number;
  valueRequired: boolean;
  valueMissing: boolean;
  onStatusChange: (s: ListingStatus) => void;
  onValueChange: (v: string) => void;
  onVisibilityChange: (v: 'public' | 'private') => void;
  onOpenShowcasePicker: () => void;
  onRemoveShowcase: (id: string) => void;
  onOpenTagDialog: () => void;
  onRemoveTag: (tag: string) => void;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={styles.body}
      contentContainerStyle={[
        styles.finalizeContent,
        { paddingBottom: ActionDock.reservedHeight(bottomInset) + SPACING.zoneIntra },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.finalizeHero}>
        <Text style={[styles.finalizeHeroEyebrow, { color: colors.textTertiary }]}>OWNER PREFERENCES</Text>
        <Text style={[styles.finalizeHeroTitle, { color: colors.textPrimary }]}>Choose how this item enters your Vault.</Text>
      </View>

      {/* Listing status — chrome cards (mirrors profile status grid) */}
      <View style={styles.finalizeSection}>
        <Text style={[styles.finalizeKicker, { color: colors.textSecondary }]}>LISTING STATUS</Text>
        <View style={styles.statusGrid}>
          {STATUS_OPTIONS.map((option) => {
            const chrome = STATUS_CONFIG[option.key];
            const selected = status === option.key;
            return (
              <Pressable
                key={option.key}
                onPress={() => onStatusChange(option.key)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[
                  styles.statusCard,
                  {
                    backgroundColor: chrome.fill,
                    borderColor: selected ? chrome.border : colors.frostDivider,
                    opacity: selected ? 1 : 0.7,
                  },
                ]}
              >
                <View style={styles.statusCardHeader}>
                  <Text style={[styles.statusCardTitle, { color: chrome.text }]}>
                    {option.title.toUpperCase()}
                  </Text>
                  {selected ? (
                    <Check size={14} color={chrome.text} strokeWidth={2.5} />
                  ) : null}
                </View>
                <Text style={[styles.statusCardSubtitle, { color: colors.textSecondary }]}>{option.subtitle}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Estimated value — required when the listing is for sale or trade.
          The kicker flips from neutral "REQUIRED" to a warning-tinted
          "REQUIRED" once the field is both demanded and empty, mirroring
          the form-error patterns used across the rest of the app. */}
      <View style={styles.finalizeSection}>
        <View style={styles.kickerRow}>
          <Text style={[styles.finalizeKicker, { color: colors.textSecondary }]}>ESTIMATED VALUE</Text>
          {valueRequired ? (
            <Text
              style={[
                styles.requiredHint,
                { color: colors.textTertiary },
                valueMissing && { color: colors.semanticRed },
              ]}
            >
              REQUIRED
            </Text>
          ) : null}
        </View>
        <View style={styles.valueFieldRow}>
          <Text
            style={[
              styles.valueCurrency,
              { color: colors.textTertiary },
              valueMissing && { color: colors.semanticRed },
            ]}
          >
            $
          </Text>
          <TextInput
            value={value}
            onChangeText={onValueChange}
            style={[styles.valueInput, { color: colors.textPrimary }]}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={valueMissing ? colors.semanticRed : colors.textTertiary}
          />
        </View>
      </View>

      {/* Visibility — full-width paired pills (mirrors profile's Follow/Share
          duo so the two-option choice reads with the same rhythm as the
          rest of the app). */}
      <View style={styles.finalizeSection}>
        <Text style={[styles.finalizeKicker, { color: colors.textSecondary }]}>VISIBILITY</Text>
        <View style={styles.visibilityRow}>
          {(['public', 'private'] as const).map((option) => {
            const active = visibility === option;
            const Icon = option === 'public' ? Eye : Lock;
            return (
              <Pressable
                key={option}
                onPress={() => onVisibilityChange(option)}
                style={[
                  styles.visibilityBtn,
                  { borderColor: colors.frostBorderStrong, backgroundColor: colors.sheetBg },
                  active && { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Icon
                  size={13}
                  color={active ? colors.textPrimary : colors.textSecondary}
                  strokeWidth={1.8}
                />
                <Text
                  style={[
                    styles.visibilityBtnText,
                    { color: colors.textSecondary },
                    active && { color: colors.textPrimary },
                  ]}
                >
                  {option.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Showcases — multi-select, removable chip row.
          Each selected showcase renders as a chip the user can tap to
          remove (matching the tag UX). A trailing "+ SHOWCASE" pill
          reopens the picker for additions. Critical for collectors with
          many showcases: surfaces the current selection at a glance and
          gives a one-tap removal path without re-entering the picker. */}
      <View style={styles.finalizeSection}>
        <Text style={[styles.finalizeKicker, { color: colors.textSecondary }]}>SHOWCASES</Text>
        <View style={styles.tagRow}>
          {selectedShowcases.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => onRemoveShowcase(s.id)}
              style={[
                styles.showcaseChip,
                { backgroundColor: colors.semanticSilverFill, borderColor: colors.frostBorder },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Remove from ${s.title}`}
              accessibilityHint="Double-tap to remove this showcase from the upload"
            >
              <Text
                style={[styles.showcaseChipText, { color: colors.textPrimary }]}
                numberOfLines={1}
              >
                {s.title}
              </Text>
              <X size={12} color={colors.textTertiary} strokeWidth={2} />
            </Pressable>
          ))}
          <Pressable
            onPress={onOpenShowcasePicker}
            style={[styles.tagChipAdd, { borderColor: colors.brandVoltBorder }]}
            accessibilityRole="button"
            accessibilityLabel="Add to a showcase"
          >
            <Text style={[styles.tagText, { color: colors.brandVolt }]}>+ SHOWCASE</Text>
          </Pressable>
        </View>
      </View>

      {/* Tags */}
      <View style={styles.finalizeSection}>
        <Text style={[styles.finalizeKicker, { color: colors.textSecondary }]}>TAGS</Text>
        <View style={styles.tagRow}>
          {tags.map((tag) => (
            <Pressable key={tag} onPress={() => onRemoveTag(tag)} style={[styles.tagChip, { backgroundColor: colors.semanticSilverFill, borderColor: colors.frostBorder }]}>
              <Text style={[styles.tagText, { color: colors.textPrimary }]}>#{tag}</Text>
            </Pressable>
          ))}
          <Pressable onPress={onOpenTagDialog} style={[styles.tagChipAdd, { borderColor: colors.brandVoltBorder }]}>
            <Text style={[styles.tagText, { color: colors.brandVolt }]}>+ TAG</Text>
          </Pressable>
        </View>
      </View>

    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — Success
// ---------------------------------------------------------------------------

function SuccessStep({
  extraction,
  onAddAnother,
  onViewCollection,
}: {
  extraction: ExtractionResult | null;
  onAddAnother: () => void;
  onViewCollection: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.successWrap}>
      <View style={[styles.successOrb, { backgroundColor: colors.brandVolt }]}>
        <View style={[styles.successGlow, { backgroundColor: colors.brandVoltFill }]} />
        <Check size={42} color={colors.textInverse} strokeWidth={2.5} />
      </View>
      <Text style={[styles.successTitle, { color: colors.textPrimary }]}>Saved to Vault</Text>
      {extraction && (
        <Text style={[styles.successItemTitle, { color: colors.textSecondary }]}>{extraction.listingTitle}</Text>
      )}
      <Text style={[styles.successCopy, { color: colors.textSecondary }]}>
        AI record created, preferences applied, and the collectible is live in your collection.
      </Text>
      <PushPrePrompt context="post_upload" />
      <View style={styles.successActions}>
        <Button label="Add Another" icon={RotateCcw} variant="frost" fullWidth onPress={onAddAnother} />
        <Button label="View in Collection" icon={ArrowRight} iconPosition="trailing" fullWidth onPress={onViewCollection} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 10;
const GRID_COLS = 3;
const GRID_H_PAD = SPACING.gutter * 2;
const TILE_WIDTH = (SCREEN_WIDTH - GRID_H_PAD - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    minHeight: 62,
    paddingHorizontal: SPACING.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonGhost: {
    width: 40,
  },
  headerCenter: {
    alignItems: 'center',
    gap: 3,
  },
  kicker: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
  },
  headerTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 13,
    letterSpacing: 0.4,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: SPACING.gutter,
    paddingBottom: 36,
    gap: 20,
  },

  heroBlock: { gap: 10 },
  heroEyebrow: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
  },
  heroTitle: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 28,
    lineHeight: 32,
  },

  scanBody: {
    flex: 1,
    paddingHorizontal: SPACING.gutter,
  },
  scanScroll: { flex: 1 },
  scanScrollContent: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  scanTitleBlock: { gap: 4 },
  scanTitle: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 28,
  },
  scanSubtitle: {
    fontFamily: TYPE.inter,
    fontSize: 13,
  },
  scanSubtitleMuted: {},
  // Wrapper for the DraggableFlatList grid. Layout (row gap, column gap,
  // numColumns) is driven by DFL itself via photoGridList +
  // photoGridRow below — we just give it top margin and a flexible
  // height so the list can grow as photos accumulate.
  photoGrid: {
    marginTop: 16,
  },
  photoGridList: {
    // DraggableFlatList renders a FlatList internally; no extra config
    // needed here, but the key exists so we can target it cleanly later
    // (e.g., if we ever need an outline / inner padding).
  },
  photoGridRow: {
    gap: 10,
    marginBottom: 10,
  },
  photoTile: {
    width: TILE_WIDTH,
    height: TILE_WIDTH * (5 / 4),
    borderRadius: RADII.medium,
    overflow: 'hidden',
    borderWidth: 1,
  },
  // Drop-target placeholder painted at the cell the dragged tile will
  // land in. Matches tile dimensions exactly so the layout doesn't jump
  // — uses a dashed brandVolt outline so it reads as "drop here" without
  // competing with the lifted tile for attention. Color is themed
  // inline via colors.brandVolt + colors.brandVoltFill.
  dropPlaceholder: {
    width: TILE_WIDTH,
    height: TILE_WIDTH * (5 / 4),
    borderRadius: RADII.medium,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  photoImage: { ...StyleSheet.absoluteFillObject },
  // "COVER" badge — sits at the bottom-left of photo[0] so the cover
  // photo is unambiguous after a drag-reorder. Uses brandVoltFill so it
  // reads at a glance against the dark photo gradient.
  coverBadge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  coverBadgeText: {
    fontFamily: TYPE.monoMedium,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  removeBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.72)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTile: {
    width: TILE_WIDTH,
    height: TILE_WIDTH * (5 / 4),
    borderRadius: RADII.medium,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextBlock: { gap: 8, marginTop: 16 },
  contextLabel: { fontFamily: TYPE.groteskBold, fontSize: 13 },
  contextOptional: { fontFamily: TYPE.inter, fontSize: 13 },
  contextFieldWrap: {
    borderRadius: RADII.medium,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  contextInput: {
    fontFamily: TYPE.inter,
    fontSize: 14,
    lineHeight: 20,
    padding: 0,
    minHeight: 44,
  },
  contextCounter: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    textAlign: 'right',
    marginTop: 6,
  },
  // --- Theater (Looking Glass HUD) ---
  theaterWrap: {
    flex: 1,
    paddingHorizontal: SPACING.gutter,
    paddingTop: 12,
    paddingBottom: SPACING.gutter,
    gap: 16,
  },
  theaterHeader: {
    alignItems: 'center',
    gap: 6,
  },
  headerKicker: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 1.6,
  },
  systemOnlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  systemOnline: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  // Theater hero — holographic frame around a matte-padded photo with the
  // ring overlaid in the center. The frame's iridescent border + sweeping
  // sheen come from `HolographicFrame`; we just give the photo a small
  // void inset so the chrome feels intentional rather than crushed.
  heroBlock: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroFrame: {
    width: '78%',
  },
  heroInner: {
    aspectRatio: 4 / 5,
    width: '100%',
    padding: 10,
    position: 'relative',
  },
  heroPhotoContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: RADII.small,
  },
  ringOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: PROGRESS_RING_SIZE,
    height: PROGRESS_RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTextWrap: {
    alignItems: 'center',
    gap: 2,
  },
  ringText: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 32,
    letterSpacing: 0.4,
  },
  ringKicker: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 10,
    letterSpacing: 1.6,
  },
  descBlock: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.gutter,
  },
  descTitle: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  descBody: {
    fontFamily: TYPE.inter,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  checklist: {
    gap: 10,
    marginTop: 4,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checklistIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistIndicatorDashed: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
  checklistLabel: {
    flex: 1,
    fontFamily: TYPE.inter,
    fontSize: 13,
  },
  checklistStatus: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textAlign: 'right',
  },

  reviewShell: {
    flex: 1,
  },
  reviewContent: { paddingTop: 16, gap: 0 },
  reviewIdentityWrap: {
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.zoneCluster,
  },
  reviewPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 10,
  },
  reviewListingTitle: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  reviewListingDescription: {
    fontFamily: TYPE.inter,
    fontSize: 16,
    lineHeight: 25,
  },
  inlineFieldShell: {
    position: 'relative' as const,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RADII.small,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
  },
  inlineFieldPencil: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineFieldCounter: {
    position: 'absolute' as const,
    bottom: 6,
    right: 10,
    fontFamily: TYPE.mono,
    fontSize: 10,
    letterSpacing: 0.4,
  },
  reviewSection: { marginTop: 28 },
  reviewKicker: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    paddingHorizontal: SPACING.gutter,
    marginBottom: SPACING.kickerGap,
  },
  reviewCard: {
    marginHorizontal: SPACING.cardEdge,
    backgroundColor: 'transparent',
  },
  confidenceHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.gutter,
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADII.small,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  confidenceHintBadge: {
    borderRadius: RADII.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  confidenceHintBadgeText: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  confidenceHintCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  confidenceHintText: {
    flex: 1,
    fontFamily: TYPE.interMedium,
    fontSize: 13,
  },
  confidenceHintMeta: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginHorizontal: SPACING.cardEdge,
    paddingVertical: 12,
    paddingHorizontal: SPACING.rowPadX,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  addMoreLabel: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  addMoreMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addMoreCount: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  rewardChip: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginHorizontal: SPACING.gutter,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADII.pill,
    borderWidth: 1,
  },
  rewardChipText: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  ledgerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.rowPadX,
    paddingTop: 12,
    paddingBottom: 10,
  },
  ledgerHeaderLabel: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
  },
  ledgerHeaderDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: SPACING.rowPadX,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.rowPadX,
    paddingVertical: 14,
    gap: 12,
  },
  ledgerRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ledgerLeftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  ledgerVerifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ledgerCompany: {
    fontFamily: TYPE.interMedium,
    fontSize: 14,
    letterSpacing: 0.1,
    flexShrink: 1,
  },
  ledgerCertNumber: {
    fontFamily: TYPE.monoMedium,
    fontSize: 13,
    letterSpacing: 0.4,
    flexShrink: 0,
    maxWidth: '55%',
    textAlign: 'right',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityBtn: {
    flex: 1,
    height: 38,
    borderRadius: RADII.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  visibilityBtnActive: {},
  visibilityBtnText: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  visibilityBtnTextActive: {},

  finalizeContent: {
    paddingTop: 20,
    gap: 0,
  },
  finalizeHero: {
    paddingHorizontal: SPACING.gutter,
    gap: 8,
    marginBottom: 8,
  },
  finalizeHeroEyebrow: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    letterSpacing: 1.8,
  },
  finalizeHeroTitle: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: 0.2,
  },
  finalizeSection: {
    marginTop: 28,
    paddingHorizontal: SPACING.gutter,
    gap: SPACING.kickerGap,
  },
  finalizeKicker: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  requiredHint: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 9,
    letterSpacing: 1.4,
  },
  requiredHintError: {},
  valueCurrencyError: {},
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statusCard: {
    width: (SCREEN_WIDTH - SPACING.gutter * 2 - 10) / 2,
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  statusCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusCardTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 11,
    letterSpacing: 1.35,
  },
  statusCardSubtitle: {
    fontFamily: TYPE.inter,
    fontSize: 12,
  },
  valueFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valueCurrency: {
    fontFamily: TYPE.monoMedium,
    fontSize: 22,
  },
  valueInput: {
    flex: 1,
    height: 40,
    paddingHorizontal: 0,
    fontFamily: TYPE.monoMedium,
    fontSize: 22,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  pickerRowValue: {
    flex: 1,
    fontFamily: TYPE.interMedium,
    fontSize: 15,
  },
  pickerRowValueMuted: {
    fontFamily: TYPE.inter,
  },
  pickerRowChevron: {
    fontFamily: TYPE.inter,
    fontSize: 22,
    lineHeight: 22,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagChipAdd: {
    borderRadius: RADII.pill,
    backgroundColor: 'transparent',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tagText: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
  },

  // Showcase chip variant: slightly larger and pairs the title with an
  // inline X icon to telegraph removability. Mirrors the tag chip's
  // pill shape and silver fill so the two chip rows feel related, but
  // uses interMedium 13pt so multi-word showcase titles read naturally
  // (tags are mono uppercase, which would look wrong on title-case names).
  showcaseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 7,
    maxWidth: '100%',
  },
  showcaseChipText: {
    fontFamily: TYPE.interMedium,
    fontSize: 13,
    flexShrink: 1,
  },

  successWrap: {
    flex: 1,
    padding: SPACING.gutter,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  successOrb: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successGlow: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
  },
  successTitle: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 38,
    textAlign: 'center',
  },
  successItemTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 15,
    textAlign: 'center',
  },
  successCopy: {
    fontFamily: TYPE.inter,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  successActions: {
    alignSelf: 'stretch',
    gap: 12,
    marginTop: 14,
  },

  // Failed step
  failedWrap: {
    flex: 1,
    paddingHorizontal: SPACING.gutter,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  failedIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  failedTitle: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 24,
    textAlign: 'center',
  },
  failedCopy: {
    fontFamily: TYPE.inter,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  failedSupportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  failedSupportText: {
    fontFamily: TYPE.interMedium,
    fontSize: 14,
  },
});
