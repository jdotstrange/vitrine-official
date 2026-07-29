import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  InputAccessoryView,
  Keyboard,
  Linking,
  Platform,
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
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Line,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
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
  InputDialog,
  PhotoReorderGrid,
  RapidFireEdit,
  SchemaRow,
  CustomFieldsEditor,
  ShowcaseSelectorSheet,
  StatusPill,
  TraitPill,
  type FieldEditorValue,
  type RapidFireEditItem,
  type ShowcaseSelectorOption,
} from '@/components/vault';
import { FramedHero } from '@/components/detail/framed-hero';
import { PushPrePrompt } from '@/components/push-pre-prompt';
import { useTheme, RADII, SPACING, STATUS_CONFIG, TYPE, type ListingStatus } from '@/lib/design';
import { useAuth } from '@/lib/contexts/auth-context';
import { createShowcase, getUserShowcases } from '@/lib/api/showcases';
import {
  createDraftCollectible,
  createReExtractionDraft,
  updateExtractionJobId,
  commitDraftCollectible,
  commitMetadataUpdate,
  commitReExtraction,
  deleteCollectible,
  getCollectible,
  getCollectibleShowcaseIds,
  resolveShowcaseIdsForCommit,
  type CollectibleCustomField,
  type MetadataProvenance,
} from '@/lib/api/collectibles';
import {
  listingStatusFromRow,
  photoMultisetChanged,
  photosFromUrls,
  isRemotePhotoUri,
} from '@/lib/edit-collectible-helpers';
import {
  enqueueExtraction,
  pollJobStatus,
  pollEngineJobStatus,
  subscribeToCollectibleRow,
  type ExtractionStatus,
} from '@/lib/api/extraction';
import { isLocalFileUri, uploadImage } from '@/lib/image-utils';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UploadStep = 'identify' | 'theater' | 'review' | 'success' | 'failed' | 'rejected';
type PhotoAsset = { id: string; uri: string };

/** In-flight or completed storage upload keyed by local photo id. */
type SpeculativeUploadEntry = {
  storagePath: string;
  promise: Promise<string>;
};

function buildCollectibleStoragePath(userId: string): string {
  return `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 11)}.jpg`;
}

/** Max wait for upload + draft + enqueue before surfacing a failure. */
const ANALYZE_LAUNCH_TIMEOUT_MS = 120_000;

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

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

// Listing copy length ceilings. Hugged tight to the observed maximum
// across john@myvitrine.app's 529 production collectibles
// (max title 86 / max desc 418) — just enough buffer to absorb edge
// cases without inviting walls-of-text descriptions or run-on titles.
const LISTING_TITLE_MAX = 90;
const LISTING_DESCRIPTION_MAX = 420;

// Theater is an indeterminate *scan*, not a progress bar. There is deliberately
// no percentage — AI extraction is variable-latency, and a determinate bar that
// stalls reads as "broken." The scan line loops forever and always looks alive.
/** How long each cosmetic status phrase holds before cross-dissolving. */
const STATUS_PHRASE_MS = 2_800;
/** After this, copy softens to reassurance while the scan keeps looping. */
const THEATER_REASSURE_AFTER_MS = 30_000;
/** Engine poll cadence — stage labels + reconcile backstop. */
const ENGINE_POLL_MS = 2_000;
/** Row poll cadence — primary completion signal (collectibles row). */
const ROW_POLL_MS = 2_000;
/**
 * Emergency reassurance only — never a terminal state. After this we soften copy
 * but keep polling until the row or engine is genuinely terminal.
 */
const THEATER_MAX_MS = 300_000;
/** Minimum time a stage label stays on screen (anti-strobe). */
const THEATER_STAGE_MIN_DWELL_MS = 500;
/** Beat after extraction completes — lets the Lattice convergence land before Review. */
const THEATER_REVIEW_TRANSITION_MS = 880;

// Fallback narration shown ONLY before the first real engine stage arrives.
// Once the engine reports a stage, we show the true stage label instead.
const SCAN_PHRASES = [
  'Reading the piece',
  'Identifying the maker',
  'Reading condition & detail',
  'Cross-referencing comps',
  'Extracting the details',
];
const THEATER_REASSURE_COPY = 'Still reading — detailed pieces take a little longer';

// Real engine stage -> honest, user-facing label. Stages are non-linear; any
// stage can be skipped. Unknown/missing stages fall back to cosmetic narration.
const ENGINE_STAGE_LABELS: Record<string, string> = {
  queued: 'Waiting in line',
  preparing: 'Preparing your photos',
  classifying: 'Identifying the piece',
  routing: 'Choosing the right lens',
  designing_schema: 'Learning this category',
  extracting: 'Reading the details',
  verifying: 'Verifying & finishing up',
};

// Engine stage -> ordinal rank. Stages are non-linear (any can be skipped), so a
// later stage implies every earlier visual beat is already resolved. The Lattice
// choreographs against this rank rather than a (nonexistent) linear progress %.
const STAGE_RANK: Record<string, number> = {
  queued: 0,
  preparing: 1,
  classifying: 2,
  routing: 3,
  designing_schema: 4,
  extracting: 5,
  verifying: 6,
};

// Rejection reason (engine REJECTION_CODES) -> user-facing explanation.
const REJECTION_COPY: Record<string, string> = {
  not_a_collectible: 'This doesn\u2019t look like a collectible we can catalog. Try a clearer photo of a single item.',
  multiple_distinct_items: 'We spotted several different items. Photograph one collectible at a time.',
  image_quality_too_low: 'The photo was too blurry or dark to read. Retake it in better light.',
  content_unclear: 'We couldn\u2019t make out enough detail to identify this. Try a sharper, closer photo.',
};
const REJECTION_FALLBACK_COPY =
  'We couldn\u2019t recognize this as a collectible. Try a clearer photo of a single item.';

// failure_code transience. Only transient failures offer a retry; permanent
// ones (bad input, cost cap) route to support/start-over instead.
const TRANSIENT_FAILURE_CODES = new Set([
  'AI_SERVICE_ERROR',
  'AI_TIMEOUT',
  'INTERNAL_ERROR',
  'UNKNOWN',
  'engine_error',
  'timeout',
]);
const FAILURE_COPY: Record<string, string> = {
  AI_TIMEOUT: 'The analysis took too long this time. This is usually temporary — give it another try.',
  AI_SERVICE_ERROR: 'Our analysis service hit a snag. This is usually temporary — give it another try.',
  AI_FORMAT_ERROR: 'We had trouble reading this item. Try a clearer photo.',
  URL_NOT_ALLOWED: 'We had trouble reading this item. Try a clearer photo.',
  COST_CAP_EXCEEDED: 'This item was unusually complex to analyze. Please reach out and we\u2019ll help.',
  // App-mapped reasons (from older failures / extraction_failure_reason)
  timeout: 'The analysis took too long this time. This is usually temporary — give it another try.',
  engine_error: 'Something went wrong during analysis. This is usually temporary — give it another try.',
  unreadable_image: 'We had trouble reading this item. Try a clearer photo.',
};
const FAILURE_FALLBACK_COPY =
  'Something went wrong during extraction. This can happen with unusual items or temporary service issues.';

const LISTING_STATUS_OPTIONS: ListingStatus[] = ['NFST', 'FOR_TRADE', 'FOR_SALE', 'SELL_TRADE'];

/** NFST-only UI: blank or all-zero input reads as priceless, not $0.00. */
function isZeroPersonalValue(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return true;
  return /^0(\.0+)?$/.test(trimmed);
}

/**
 * Map a `collectibles` row (as written by the engine webhook / reconciler)
 * into the review-screen ExtractionResult. Pure — reused by both the Realtime
 * subscription and the poll fallback so they can't diverge.
 */
function buildExtractionFromRow(
  row: Record<string, unknown>,
  fallbackTitle: string,
): ExtractionResult {
  return {
    id: row.id as string,
    listingTitle: (row.listing_title as string) || fallbackTitle,
    listingDescription: (row.listing_description as string) || '',
    classification: (row.classification as string) || 'unknown',
    confidence: (row.confidence as string) || 'medium',
    collectibleType: (row.collectible_type as string) || 'memorabilia',
    category: (row.category as string) || 'pending',
    subcategory: (row.subcategory as string) || '',
    traits: (row.traits as string[]) || [],
    aiMetadata: (row.ai_metadata as AiMetadata) || {},
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
}

export type UploadEntryProps = {
  mode?: 'create' | 'edit';
  editCollectibleId?: string;
};

type EditSessionSnapshot = {
  photos: PhotoAsset[];
  listingTitle: string;
  listingDescription: string;
  customFields: CollectibleCustomField[];
  metadataProvenance: MetadataProvenance;
  provenanceBaseline: {
    aiMetadata: Record<string, unknown>;
    traitMetadata: Record<string, unknown>;
    listingTitle: string | null;
    listingDescription: string | null;
  };
  extractionSeed: ExtractionResult;
};

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function UploadEntry({
  mode = 'create',
  editCollectibleId,
}: UploadEntryProps = {}) {
  const isEditMode = mode === 'edit' && !!editCollectibleId;
  const editOriginalId = isEditMode ? editCollectibleId! : null;
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [step, setStep] = useState<UploadStep>('identify');
  const [photos, setPhotos] = useState<PhotoAsset[]>([]);
  const [context, setContext] = useState('');
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);

  // Extraction pipeline state
  const [draftCollectibleId, setDraftCollectibleId] = useState<string | null>(null);
  // Persists the just-saved row id past the draft→committed transition so the
  // success screen can deep-link straight to its detail view.
  const [committedCollectibleId, setCommittedCollectibleId] = useState<string | null>(null);
  const [editLoadState, setEditLoadState] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    isEditMode ? 'loading' : 'idle',
  );
  const s0Ref = useRef<EditSessionSnapshot | null>(null);
  const engineBaselineRef = useRef<EditSessionSnapshot['provenanceBaseline'] | null>(null);
  const [rescanAcknowledged, setRescanAcknowledged] = useState(false);
  const [customFields, setCustomFields] = useState<CollectibleCustomField[]>([]);
  const [extractionJobId, setExtractionJobId] = useState<string | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus | null>(null);
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [etaSeconds, setEtaSeconds] = useState<number>(30);
  const [theaterError, setTheaterError] = useState<string | null>(null);

  // Theater narration phase — softens copy after a wait without ever failing.
  const [theaterPhase, setTheaterPhase] = useState<'analyzing' | 'reassure'>('analyzing');

  // Live engine stage (source of truth for the theater label). Null until the
  // first poll reports a stage — fall back to cosmetic narration until then.
  const [theaterStage, setTheaterStage] = useState<string | null>(null);

  // Terminal diagnostics for the failed / rejected screens.
  const [failureCode, setFailureCode] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  // Owner prefs — collected on Identify before Analyze
  const [status, setStatus] = useState<ListingStatus>('NFST');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [selectedShowcaseIds, setSelectedShowcaseIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // Showcase picker — loaded from Supabase; inline creates persist immediately.
  const [remoteShowcases, setRemoteShowcases] = useState<ShowcaseSelectorOption[]>([]);
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

  // Speculative uploads: start pushing photos to storage as soon as they land
  // on the scan screen so Analyze can enqueue without waiting on compression +
  // upload again.
  const speculativeUploadsRef = useRef<Map<string, SpeculativeUploadEntry>>(
    new Map(),
  );

  // Photos whose speculative upload has already been kicked off once. The
  // failure handler below clears the cache entry so an explicit Analyze can
  // retry, which would otherwise let the mount effect re-fire the same doomed
  // upload on every render.
  const speculativeAttemptedRef = useRef<Set<string>>(new Set());

  const ensureSpeculativeUpload = useCallback(
    (photo: PhotoAsset, userId: string) => {
      const map = speculativeUploadsRef.current;
      if (map.has(photo.id)) return;

      const storagePath = buildCollectibleStoragePath(userId);
      const promise = uploadImage('collectible-images', storagePath, photo.uri)
        .then((result) => result.url)
        .catch((err) => {
          map.delete(photo.id);
          throw err;
        });
      map.set(photo.id, { storagePath, promise });
    },
    [],
  );

  const resolveSpeculativeUrls = useCallback(
    async (photoList: PhotoAsset[], userId: string): Promise<string[]> => {
      const urls: string[] = [];
      for (const photo of photoList) {
        if (isRemotePhotoUri(photo.uri)) {
          urls.push(photo.uri);
          continue;
        }
        let entry = speculativeUploadsRef.current.get(photo.id);
        if (!entry) {
          ensureSpeculativeUpload(photo, userId);
          entry = speculativeUploadsRef.current.get(photo.id)!;
        }
        urls.push(await entry.promise);
      }
      return urls;
    },
    [ensureSpeculativeUpload],
  );

  useEffect(() => {
    if (!isEditMode || !editOriginalId || !user?.id) return;

    let cancelled = false;
    setEditLoadState('loading');

    (async () => {
      try {
        const row = await getCollectible(editOriginalId);
        if (cancelled || !row) {
          if (!cancelled) setEditLoadState('error');
          return;
        }

        const photoAssets = photosFromUrls(row.photos ?? []);
        const listingTitle = row.listingTitle?.trim() || row.title?.trim() || '';
        const listingDescription = row.listingDescription?.trim() || '';
        const extractionSeed = buildExtractionFromRow(
          {
            id: row.id,
            listing_title: listingTitle,
            listing_description: listingDescription,
            classification: row.classification,
            confidence: row.confidence,
            collectible_type: row.collectibleType,
            category: row.category,
            subcategory: row.subcategory,
            traits: row.traits,
            ai_metadata: row.aiMetadata,
            trait_metadata: row.traitMetadata,
            field_schema: row.fieldSchema,
            verification_url: row.verificationUrl,
            photos: row.photos,
          },
          listingTitle,
        );

        const snapshot: EditSessionSnapshot = {
          photos: photoAssets,
          listingTitle,
          listingDescription,
          customFields: row.customFields ?? [],
          metadataProvenance: row.metadataProvenance ?? {},
          provenanceBaseline: {
            aiMetadata: { ...(row.aiMetadata ?? {}) },
            traitMetadata: { ...(row.traitMetadata ?? {}) },
            listingTitle,
            listingDescription,
          },
          extractionSeed,
        };

        s0Ref.current = snapshot;
        setPhotos(photoAssets);
        setExtraction(extractionSeed);
        setContext(row.description?.trim() || '');
        setTags(row.tags ?? []);
        setStatus(listingStatusFromRow(row));
        setVisibility((row.privacy === 'private' ? 'private' : 'public') as 'public' | 'private');
        setEstimatedValue(
          row.value != null && Number(row.value) > 0 ? String(row.value) : '',
        );
        setCustomFields(snapshot.customFields);
        setListingEdits({ title: listingTitle, description: listingDescription });
        setRescanAcknowledged(false);

        const showcaseIds = await getCollectibleShowcaseIds(editOriginalId);
        if (!cancelled) {
          setSelectedShowcaseIds(showcaseIds);
          setEditLoadState('ready');
        }
      } catch (err) {
        uploadLog.error('Edit load failed:', err);
        if (!cancelled) setEditLoadState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, editOriginalId, user?.id]);

  const requiresRerun = useMemo(() => {
    if (!isEditMode || !s0Ref.current) return false;
    return photoMultisetChanged(s0Ref.current.photos, photos);
  }, [isEditMode, photos]);

  const requestPhotoUpdate = useCallback(
    (nextPhotos: PhotoAsset[]) => {
      if (!isEditMode || !s0Ref.current) {
        setPhotos(nextPhotos);
        return;
      }
      if (!photoMultisetChanged(s0Ref.current.photos, nextPhotos)) {
        setPhotos(nextPhotos);
        return;
      }
      if (rescanAcknowledged) {
        setPhotos(nextPhotos);
        return;
      }
      Alert.alert(
        'Modify photos?',
        'Modifying photos on this collectible will run it through Looking Glass again. Existing spec data may change. Tracking and activity on this listing will stay on this item.',
        [
          { text: 'Go Back', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: () => {
              setRescanAcknowledged(true);
              setPhotos(nextPhotos);
              setFieldEdits(EMPTY_EDITS);
              setEditQueue([]);
              setListingEdits({
                title: s0Ref.current!.listingTitle,
                description: s0Ref.current!.listingDescription,
              });
            },
          },
        ],
      );
    },
    [isEditMode, rescanAcknowledged],
  );

  const resetPhotosToS0 = useCallback(() => {
    if (!s0Ref.current) return;
    Haptics.selectionAsync();
    setPhotos([...s0Ref.current.photos]);
    setRescanAcknowledged(false);
    setFieldEdits(EMPTY_EDITS);
    setEditQueue([]);
    setListingEdits({
      title: s0Ref.current.listingTitle,
      description: s0Ref.current.listingDescription,
    });
  }, []);

  useEffect(() => {
    if (!user?.id || step !== 'identify') return;

    const activeIds = new Set(photos.map((p) => p.id));
    for (const photo of photos) {
      // Edit mode seeds `photos` with the collectible's existing storage URLs,
      // which are already uploaded and cannot be read as local files.
      if (isRemotePhotoUri(photo.uri)) continue;
      if (speculativeAttemptedRef.current.has(photo.id)) continue;
      speculativeAttemptedRef.current.add(photo.id);
      ensureSpeculativeUpload(photo, user.id);
    }
    for (const id of speculativeUploadsRef.current.keys()) {
      if (!activeIds.has(id)) {
        speculativeUploadsRef.current.delete(id);
      }
    }
    for (const id of speculativeAttemptedRef.current) {
      if (!activeIds.has(id)) {
        speculativeAttemptedRef.current.delete(id);
      }
    }
  }, [photos, user?.id, step, ensureSpeculativeUpload]);

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
    () => remoteShowcases,
    [remoteShowcases],
  );

  // Resolved showcase objects for the chips on the Identify screen. Filters
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

  const handleCreateShowcase = useCallback(
    async (title: string) => {
      if (!user?.id) return;
      const trimmed = title.trim();
      if (!trimmed) return;
      try {
        const id = await createShowcase({
          type: 'manual',
          userId: user.id,
          title: trimmed,
          visibility: 'public',
          collectibleIds: [],
        });
        setRemoteShowcases((current) => [
          { id, title: trimmed, items: 0 },
          ...current.filter((s) => s.id !== id),
        ]);
        setSelectedShowcaseIds((current) =>
          current.includes(id) ? current : [...current, id],
        );
      } catch {
        Alert.alert('Could not create showcase', 'Please try again.');
      }
    },
    [user?.id],
  );

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

  // NEVER dispatch state from inside a setPhotos updater. React evaluates
  // updaters eagerly inside the dispatch when the fiber is idle; a nested
  // setPhotos enqueued during that evaluation gets overwritten by the outer
  // updater's "no change" result, so the append/remove silently vanishes.
  // That was the "photos stop attaching after the first add" bug (2026-07-29):
  // first add worked (mount work pending -> no eager path), every later
  // add/remove was dropped, reorder (direct dispatch) always worked.
  // `photos` from the closure is current here: these run from picker/tap
  // handlers, and nothing else can mutate photos while the OS picker is up.
  const appendPhotos = useCallback(
    (uris: string[]) => {
      const slots = 6 - photos.length;
      if (uris.length === 0 || slots <= 0) return;
      const fresh: PhotoAsset[] = uris.slice(0, slots).map((uri, i) => ({
        id: `photo-${Date.now()}-${i}`,
        uri,
      }));
      Haptics.selectionAsync();
      requestPhotoUpdate([...photos, ...fresh]);
    },
    [photos, requestPhotoUpdate],
  );

  // Gate every picked asset on being a plain local file. The picker normally
  // writes a flattened still to cache — Live Photos included — but anything
  // that arrives as a non-file reference cannot be read at upload time and
  // used to fail the whole upload with an opaque error (REACT-NATIVE-12).
  const appendPickedAssets = useCallback(
    (assets: ImagePicker.ImagePickerAsset[]) => {
      const stills = assets.filter((asset) => asset.type !== 'pairedVideo');
      if (stills.length === 0) return;

      const usable: string[] = [];
      for (const asset of stills) {
        if (isLocalFileUri(asset.uri)) {
          usable.push(asset.uri);
          continue;
        }
        uploadLog.error('Rejected unreadable picked asset:', {
          uri: asset.uri,
          type: asset.type,
          mimeType: asset.mimeType,
        });
      }

      if (usable.length < stills.length) {
        Alert.alert(
          'Some photos could not be added',
          "We couldn't read one of those photos. Try selecting it again, or use a different shot.",
        );
      }
      if (usable.length > 0) appendPhotos(usable);
    },
    [appendPhotos],
  );

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
      appendPickedAssets(result.assets);
    } catch (err) {
      uploadLog.error('Camera capture failed:', err);
      Alert.alert(
        'Photo not captured',
        "That shot couldn't be imported. Try taking it again.",
      );
    }
  }, [emptySlotCount, appendPickedAssets]);

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
        // Deliberately NOT requesting `livePhotos`: asking only for `images`
        // is what makes iOS hand back the flattened still. Opting in returns
        // the original uncompressed frame plus a paired video, so `quality`
        // is ignored and we'd have to downsize the full-resolution frame
        // ourselves on devices that are already memory-starved.
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: emptySlotCount,
        orderedSelection: true,
        quality: 0.85,
      });
      if (result.canceled || !result.assets || result.assets.length === 0) return;
      uploadLog.info('Library picker returned', { count: result.assets.length });
      appendPickedAssets(result.assets);
    } catch (err) {
      // Previously silent: the picker throwing left the user staring at an
      // unchanged grid with no idea the import had failed.
      uploadLog.error('Library picker failed:', err);
      Alert.alert(
        'Photos not added',
        "Those photos couldn't be imported. Try selecting them again, or pick different shots.",
      );
    }
  }, [emptySlotCount, appendPickedAssets]);

  const removePhoto = useCallback(
    (id: string) => {
      // See appendPhotos: single direct dispatch, no nested updater.
      Haptics.selectionAsync();
      requestPhotoUpdate(photos.filter((p) => p.id !== id));
    },
    [photos, requestPhotoUpdate],
  );

  // Drag-to-reorder commit. PhotoReorderGrid drives the data array; we
  // just trust whatever it hands back. The first photo in the array is
  // automatically the cover, so reordering changes the cover as a side
  // effect — which is exactly what we want.
  const handleReorderPhotos = useCallback((next: PhotoAsset[]) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPhotos(next);
  }, []);

  const canAnalyze = photos.length > 0 && !valueMissing;

  const identifyDockLabel = valueMissing
    ? 'Set a Value First'
    : photos.length === 0
      ? 'Add Images'
      : isEditMode
        ? requiresRerun
          ? 'Rerun Looking Glass'
          : 'Continue'
        : 'Activate Looking Glass';

  const identifyDockHint = valueMissing
    ? 'Enter a personal value greater than zero when listing for sale or trade'
    : photos.length === 0
      ? 'Add at least one photo first'
      : isEditMode
        ? requiresRerun
          ? 'Re-scan with your updated photos'
          : 'Review and update spec data'
        : 'Starts Looking Glass analysis on your photos';

  const handleContinueEdit = useCallback(() => {
    if (!isEditMode || !editOriginalId || !canAnalyze) return;
    Keyboard.dismiss();
    if (s0Ref.current) {
      setExtraction(s0Ref.current.extractionSeed);
    }
    setStep('review');
  }, [isEditMode, editOriginalId, canAnalyze]);

  // --- Identify screen: upload + draft + enqueue handler ---
  const handleAnalyze = useCallback(async () => {
    if (!user?.id || !canAnalyze) return;
    if (isEditMode && !requiresRerun) {
      handleContinueEdit();
      return;
    }

    // Transition immediately — prep (upload, draft, enqueue) runs on Theater
    // so Identify never blocks interaction behind pointerEvents while waiting.
    Keyboard.dismiss();
    setTheaterPhase('analyzing');
    setTheaterStage('preparing');
    setExtractionStatus(null);
    setTheaterError(null);
    setDraftCollectibleId(null);
    setExtractionJobId(null);
    setStep('theater');

    try {
      await withTimeout(
        (async () => {
          const uploadedUrls = await resolveSpeculativeUrls(photos, user.id);

          const title =
            (isEditMode && s0Ref.current?.listingTitle) ||
            context.trim() ||
            'New Collectible';
          const parsedVal = parseFloat(estimatedValue);
          const draftPayload = {
            title,
            photos: uploadedUrls,
            hint: context.trim() || undefined,
            availableForSale: status === 'FOR_SALE' || status === 'SELL_TRADE',
            availableForTrade: status === 'FOR_TRADE' || status === 'SELL_TRADE',
            value: parsedVal > 0 ? parsedVal : null,
            visibility,
            tags,
          };

          const collectibleId =
            isEditMode && editOriginalId
              ? await createReExtractionDraft(user.id, {
                  ...draftPayload,
                  originalId: editOriginalId,
                })
              : await createDraftCollectible(user.id, draftPayload);
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

          speculativeUploadsRef.current.clear();

          setExtractionStatus('queued');
          setTheaterStage(null);
        })(),
        ANALYZE_LAUNCH_TIMEOUT_MS,
        'Upload timed out. Check your connection and try again.',
      );
    } catch (err) {
      uploadLog.error('Upload pipeline failed:', err);
      setTheaterError(err instanceof Error ? err.message : 'Upload failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStep('failed');
    }
  }, [
    user?.id,
    photos,
    context,
    canAnalyze,
    status,
    estimatedValue,
    visibility,
    tags,
    resolveSpeculativeUrls,
    isEditMode,
    requiresRerun,
    editOriginalId,
    handleContinueEdit,
  ]);

  // --- Theater: row is the PRIMARY completion signal (review needs row data).
  // Realtime + row poll open review as soon as the webhook/reconciler writes
  // extracted/complete. Engine poll drives stage labels and reconciles drops.
  useEffect(() => {
    if (step !== 'theater' || !draftCollectibleId || !extractionJobId) return;
    const jobId = extractionJobId;
    const collectibleId = draftCollectibleId;
    const fallbackTitle = context.trim() || 'New Collectible';

    let resolved = false;
    let latestRow: Record<string, unknown> | null = null;
    let rowPollTimer: ReturnType<typeof setInterval> | null = null;
    let enginePollTimer: ReturnType<typeof setInterval> | null = null;
    let maxWaitLogged = false;
    const startedAt = Date.now();
    const timers: ReturnType<typeof setTimeout>[] = [];

    setTheaterPhase('analyzing');
    setTheaterStage(null);

    timers.push(
      setTimeout(() => {
        if (!resolved) setTheaterPhase('reassure');
      }, THEATER_REASSURE_AFTER_MS),
    );

    function stopWatching() {
      resolved = true;
      timers.forEach(clearTimeout);
      if (rowPollTimer) clearInterval(rowPollTimer);
      if (enginePollTimer) clearInterval(enginePollTimer);
    }

    function goToReview(row: Record<string, unknown>, source: string) {
      if (resolved) return;
      stopWatching();
      uploadLog.info('Theater → review', { source, collectibleId, jobId });
      const mapped = buildExtractionFromRow(row, fallbackTitle);
      if (isEditMode && s0Ref.current) {
        engineBaselineRef.current = {
          aiMetadata: { ...(mapped.aiMetadata as Record<string, unknown>) },
          traitMetadata: { ...(mapped.traitMetadata as Record<string, unknown>) },
          listingTitle: s0Ref.current.listingTitle,
          listingDescription: s0Ref.current.listingDescription,
        };
        mapped.listingTitle = s0Ref.current.listingTitle;
        mapped.listingDescription = s0Ref.current.listingDescription;
      }
      setExtraction(mapped);
      setExtractionStatus('extracted');
      timers.push(
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setStep('review');
        }, THEATER_REVIEW_TRANSITION_MS),
      );
    }

    function goToRejected(reason: string | null | undefined, source: string) {
      if (resolved) return;
      stopWatching();
      uploadLog.info('Theater → rejected', { source, collectibleId, jobId, reason });
      setRejectionReason(reason ?? null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setStep('rejected');
    }

    function goToFailed(code: string | null | undefined, source: string) {
      if (resolved) return;
      stopWatching();
      uploadLog.info('Theater → failed', { source, collectibleId, jobId, code });
      setFailureCode(code ?? null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStep('failed');
    }

    function tryResolveFromRow(row: Record<string, unknown>, source: string): boolean {
      if (resolved) return true;
      const status = row.extraction_status as string | undefined;
      if (status === 'extracted' || status === 'complete') {
        goToReview(row, source);
        return true;
      }
      if (status === 'rejected') {
        goToRejected((row.extraction_failure_reason as string) ?? null, source);
        return true;
      }
      if (status === 'failed') {
        goToFailed((row.extraction_failure_reason as string) ?? null, source);
        return true;
      }
      return false;
    }

    const unsubscribe = subscribeToCollectibleRow(collectibleId, (update) => {
      latestRow = update.row;
      tryResolveFromRow(update.row, 'realtime');
    });

    async function pollRow(source: string) {
      if (resolved) return;
      if (latestRow && tryResolveFromRow(latestRow, `${source}:cache`)) return;
      try {
        const polled = await pollJobStatus(jobId);
        if (polled.row) {
          latestRow = polled.row;
          tryResolveFromRow(polled.row, source);
        }
      } catch (err) {
        uploadLog.warn('Theater row poll failed:', err);
      }
    }

    // Immediate row check — don't wait for first interval tick.
    void pollRow('row-poll-initial');

    rowPollTimer = setInterval(() => {
      void pollRow('row-poll');
    }, ROW_POLL_MS);

    enginePollTimer = setInterval(async () => {
      if (resolved) return;

      let engine;
      try {
        engine = await pollEngineJobStatus(jobId);
      } catch (err) {
        uploadLog.warn('Engine poll failed:', err);
        return;
      }
      if (resolved) return;

      if (engine.stage) {
        setTheaterStage(engine.stage);
      }

      if (engine.status === 'failed') {
        goToFailed(engine.failureCode, 'engine-poll');
        return;
      }

      if (engine.status === 'complete' && engine.outcome === 'rejected') {
        goToRejected(engine.rejectionReason, 'engine-poll');
        return;
      }

      // Engine done — row should follow via webhook/reconcile; nudge row poll now.
      if (engine.status === 'complete') {
        uploadLog.info('Engine complete — checking row', { jobId, outcome: engine.outcome });
        await pollRow('engine-complete');
      }

      // Never terminal — only soften copy after a long wait while still listening.
      if (!maxWaitLogged && Date.now() - startedAt > THEATER_MAX_MS) {
        maxWaitLogged = true;
        uploadLog.warn('Theater long wait — still polling', { collectibleId, jobId });
        setTheaterPhase('reassure');
      }
    }, ENGINE_POLL_MS);

    return () => {
      stopWatching();
      unsubscribe();
    };
  }, [step, draftCollectibleId, extractionJobId, isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clears all local device state so the next piece starts clean. Contained
  // lifecycle: this does NOT delete the draft — an abandoned piece resolves
  // into My Queue (Review when it finishes, Errors if it failed). Only the
  // explicit discard (X) and the rejected dead-end delete the row.
  const resetFlow = useCallback(() => {
    setDraftCollectibleId(null);
    setStep('identify');
    setExtractionStatus(null);
    setExtractionJobId(null);
    setQueuePosition(0);
    setEtaSeconds(30);
    setTheaterError(null);
    setTheaterPhase('analyzing');
    setTheaterStage(null);
    setFailureCode(null);
    setRejectionReason(null);
    setPhotos([]);
    setContext('');
    setExtraction(null);
    setCommittedCollectibleId(null);
    setEditQueue([]);
    setFieldEdits(EMPTY_EDITS);
    setListingEdits({});
    setCustomFields([]);
    setRescanAcknowledged(false);
    s0Ref.current = null;
    engineBaselineRef.current = null;
    setPulseKeys([]);
    setPulseNonce(0);
    setRapidFireOpen(false);

    // Identify-screen fields. Without these, a follow-up upload starts with
    // the previous run's showcase selection, tags, status, value, etc. still
    // pre-filled. Reset them all back to the same defaults as initial mount.
    setSelectedShowcaseIds([]);
    setTags([]);
    setStatus('NFST');
    setVisibility('public');
    setEstimatedValue('');
    speculativeUploadsRef.current.clear();
    speculativeAttemptedRef.current.clear();
  }, []);

  // Explicit discard: delete the draft row, then reset. Used by the rejected
  // dead-end and "retake". (The X-button discard deletes inline in handleClose.)
  const discardAndReset = useCallback(() => {
    if (draftCollectibleId && user?.id) {
      deleteCollectible(draftCollectibleId, user.id).catch(() => {});
    }
    resetFlow();
  }, [draftCollectibleId, user?.id, resetFlow]);

  // Retry a transient failure: drop the dead attempt and re-run extraction with
  // the photos/context still in local state.
  const handleRetry = useCallback(() => {
    if (draftCollectibleId && user?.id) {
      deleteCollectible(draftCollectibleId, user.id).catch(() => {});
    }
    setDraftCollectibleId(null);
    setExtractionJobId(null);
    setExtractionStatus(null);
    setFailureCode(null);
    setTheaterError(null);
    setTheaterStage(null);
    void handleAnalyze();
  }, [draftCollectibleId, user?.id, handleAnalyze]);

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
      if (isEditMode) return undefined;
      return () => {
        resetFlowRef.current();
      };
    }, [isEditMode]),
  );

  // Effective extraction = seed + any committed edits. Used by review and
  // review alike so edits are honored wherever data renders.
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

  const sanitizedCustomFields = useMemo(
    () =>
      customFields.filter((f) => f.label.trim().length > 0 && f.value.trim().length > 0),
    [customFields],
  );

  const handleCatalog = useCallback(async () => {
    if (!effectiveExtraction || !user?.id) return;

    let resolvedShowcaseIds: string[];
    try {
      resolvedShowcaseIds = await resolveShowcaseIdsForCommit(
        user.id,
        selectedShowcaseIds,
        [],
      );
    } catch (err) {
      uploadLog.error('Showcase resolution failed:', err);
      Alert.alert('Error', 'Could not save showcase assignments. Please try again.');
      return;
    }

    if (isEditMode && editOriginalId) {
      try {
        const parsedVal = parseFloat(estimatedValue);
        const finalTitle = (listingEdits.title ?? effectiveExtraction.listingTitle ?? '').trim();
        const finalDescription = (
          listingEdits.description ?? effectiveExtraction.listingDescription ?? ''
        ).trim();
        const uploadedUrls = await resolveSpeculativeUrls(photos, user.id);
        const payload = {
          listingTitle: finalTitle,
          listingDescription: finalDescription,
          value: parsedVal > 0 ? parsedVal : 0,
          availableForSale: status === 'FOR_SALE' || status === 'SELL_TRADE',
          availableForTrade: status === 'FOR_TRADE' || status === 'SELL_TRADE',
          visibility,
          tags,
          showcaseIds: resolvedShowcaseIds,
          photos: uploadedUrls,
          aiMetadata: effectiveExtraction.aiMetadata as Record<string, unknown>,
          traitMetadata: effectiveExtraction.traitMetadata as Record<string, unknown>,
          customFields: sanitizedCustomFields,
          provenanceBaseline:
            requiresRerun && engineBaselineRef.current
              ? engineBaselineRef.current
              : s0Ref.current?.provenanceBaseline,
        };

        if (requiresRerun && draftCollectibleId) {
          await commitReExtraction(
            editOriginalId,
            draftCollectibleId,
            user.id,
            payload,
            s0Ref.current?.metadataProvenance ?? {},
          );
        } else {
          await commitMetadataUpdate(
            editOriginalId,
            user.id,
            payload,
            s0Ref.current?.metadataProvenance ?? {},
          );
        }

        setCommittedCollectibleId(editOriginalId);
        setDraftCollectibleId(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStep('success');
      } catch (err) {
        uploadLog.error('Update collectible failed:', err);
        Alert.alert('Error', 'Failed to update collectible. Please try again.');
      }
      return;
    }

    if (!draftCollectibleId) return;

    try {
      const parsedVal = parseFloat(estimatedValue);
      const finalTitle = (listingEdits.title ?? effectiveExtraction.listingTitle ?? '').trim();
      const finalDescription = (listingEdits.description ?? effectiveExtraction.listingDescription ?? '').trim();
      await commitDraftCollectible(draftCollectibleId, user.id, {
        title: finalTitle,
        listingTitle: finalTitle,
        listingDescription: finalDescription,
        value: parsedVal > 0 ? parsedVal : 0,
        availableForSale: status === 'FOR_SALE' || status === 'SELL_TRADE',
        availableForTrade: status === 'FOR_TRADE' || status === 'SELL_TRADE',
        visibility,
        tags,
        showcaseIds: resolvedShowcaseIds,
        aiMetadata: effectiveExtraction.aiMetadata,
        traitMetadata: effectiveExtraction.traitMetadata,
        customFields: sanitizedCustomFields,
      });
      setCommittedCollectibleId(draftCollectibleId);
      setDraftCollectibleId(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('success');
    } catch (err) {
      uploadLog.error('Catalog commit failed:', err);
      Alert.alert('Error', 'Failed to catalog collectible. Please try again.');
    }
  }, [
    draftCollectibleId,
    effectiveExtraction,
    user?.id,
    estimatedValue,
    listingEdits,
    status,
    visibility,
    tags,
    selectedShowcaseIds,
    isEditMode,
    editOriginalId,
    requiresRerun,
    photos,
    resolveSpeculativeUrls,
    sanitizedCustomFields,
  ]);

  const hasInProgressWork =
    step !== 'success' &&
    (photos.length > 0 || context.trim().length > 0 || extraction !== null || isEditMode);

  const handleClose = useCallback(() => {
    if (!hasInProgressWork && !isEditMode) {
      router.back();
      return;
    }
    Alert.alert(
      isEditMode ? 'Discard changes?' : 'Discard this upload?',
      isEditMode
        ? 'Your edits will not be saved. The collectible stays as it was before you opened Edit.'
        : 'You\u2019ll lose the photos, context, and anything the AI already identified. This can\u2019t be undone.',
      [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            if (draftCollectibleId && user?.id && isEditMode) {
              deleteCollectible(draftCollectibleId, user.id).catch(() => {});
            } else if (draftCollectibleId && user?.id) {
              deleteCollectible(draftCollectibleId, user.id).catch(() => {});
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
      ],
    );
  }, [hasInProgressWork, isEditMode, router, draftCollectibleId, user?.id]);

  if (isEditMode && editLoadState === 'loading') {
    return (
      <View style={[styles.container, styles.editLoading, { paddingTop: insets.top, backgroundColor: colors.void }]}>
        <Text style={[styles.editLoadingText, { color: colors.textSecondary }]}>Loading collectible…</Text>
      </View>
    );
  }

  if (isEditMode && editLoadState === 'error') {
    return (
      <View style={[styles.container, styles.editLoading, { paddingTop: insets.top, backgroundColor: colors.void }]}>
        <Text style={[styles.editLoadingText, { color: colors.textSecondary }]}>
          Could not load this collectible.
        </Text>
        <Button label="Go Back" variant="frost" onPress={() => router.back()} />
      </View>
    );
  }

  const reviewCommitLabel =
    editQueue.length > 0
      ? `Make Edits (${editQueue.length})`
      : isEditMode
        ? 'Update Collectible'
        : 'Catalog';

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.void }]}>
      <View style={[styles.header, { borderBottomColor: colors.frostDivider }]}>
        <Pressable
          onPress={handleClose}
          style={[styles.closeButton, { borderColor: colors.frostBorder, backgroundColor: colors.sheetBg }]}
          accessibilityRole="button"
          accessibilityLabel={isEditMode ? 'Close edit' : 'Close upload'}
        >
          <X size={18} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {getStepTitle(step, isEditMode)}
          </Text>
        </View>
        <View style={styles.closeButtonGhost} />
      </View>

      {step === 'identify' ? (
        <>
          <IdentifyStep
            photos={photos}
            context={context}
            onContextChange={setContext}
            onPickPhotos={openPhotoSourceSheet}
            onRemovePhoto={removePhoto}
            onReorderPhotos={handleReorderPhotos}
            bottomInset={insets.bottom}
            status={status}
            value={estimatedValue}
            visibility={visibility}
            selectedShowcases={selectedShowcases}
            tags={tags}
            valueRequired={valueRequired}
            valueMissing={valueMissing}
            onStatusChange={setStatus}
            onValueChange={setEstimatedValue}
            onVisibilityChange={setVisibility}
            onOpenShowcasePicker={() => setShowcaseSheetOpen(true)}
            onRemoveShowcase={handleRemoveShowcase}
            onOpenTagDialog={() => setTagDialogOpen(true)}
            onRemoveTag={(t) => setTags(tags.filter((x) => x !== t))}
            showResetPhotos={isEditMode && requiresRerun}
            onResetPhotos={resetPhotosToS0}
          />
          <ActionDock
            label={identifyDockLabel}
            bottomInset={insets.bottom}
            onPress={handleAnalyze}
            disabled={!canAnalyze}
            accessibilityHint={identifyDockHint}
          />
        </>
      ) : step === 'theater' ? (
        <TheaterStep
          photos={photos}
          extractionStatus={extractionStatus}
          phase={theaterPhase}
          stage={theaterStage}
          extraction={effectiveExtraction}
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
            customFields={customFields}
            onCustomFieldsChange={setCustomFields}
          />
          <ActionDock
            label={reviewCommitLabel}
            icon={editQueue.length > 0 ? Pencil : Check}
            bottomInset={insets.bottom}
            onPress={() => {
              if (editQueue.length > 0) {
                setRapidFireOpen(true);
              } else {
                void handleCatalog();
              }
            }}
            disabled={isEditMode ? !effectiveExtraction : !draftCollectibleId}
          />
        </>
      ) : step === 'failed' ? (
        <FailedStep
          failureCode={failureCode}
          onRetry={
            failureCode && TRANSIENT_FAILURE_CODES.has(failureCode)
              ? handleRetry
              : undefined
          }
          onStartOver={discardAndReset}
          onGetSupport={() => router.push('/settings/support' as Href)}
        />
      ) : step === 'rejected' ? (
        <RejectedStep
          rejectionReason={rejectionReason}
          onRetake={discardAndReset}
          onCancel={() => {
            if (draftCollectibleId && user?.id) {
              deleteCollectible(draftCollectibleId, user.id).catch(() => {});
            }
            router.back();
          }}
        />
      ) : step === 'success' ? (
        <SuccessStep
          extraction={effectiveExtraction}
          isEditMode={isEditMode}
          onAddAnother={isEditMode ? undefined : resetFlow}
          onViewCollection={() => {
            resetFlow();
            router.replace('/(tabs)?lens=COLLECTION' as Href);
          }}
        />
      ) : null}

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

function getStepTitle(step: UploadStep, isEditMode: boolean): string {
  if (isEditMode) {
    switch (step) {
      case 'identify': return 'Edit';
      case 'theater': return 'Re-scanning';
      case 'review': return 'Review';
      case 'failed': return 'Error';
      case 'rejected': return 'Not Recognized';
      case 'success': return 'Updated';
    }
  }
  switch (step) {
    case 'identify': return 'Identify';
    case 'theater': return 'Processing';
    case 'review': return 'Review';
    case 'failed': return 'Error';
    case 'rejected': return 'Not Recognized';
    case 'success': return 'Saved';
  }
}

const IDENTIFY_VALUE_ACCESSORY_ID = 'identify-value-input-done';

// ---------------------------------------------------------------------------
// Identify screen helpers (grouped sections + decimal-pad Done bar)
// ---------------------------------------------------------------------------

function IdentifySection({
  title,
  hint,
  children,
  dimmed,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  dimmed?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.identifySection, dimmed]}>
      <View style={styles.identifySectionHeader}>
        <Text style={[styles.identifySectionTitle, { color: colors.textPrimary }]}>{title}</Text>
        {hint ? (
          <Text style={[styles.identifySectionHint, { color: colors.textTertiary }]}>{hint}</Text>
        ) : null}
      </View>
      <View style={styles.identifySectionBody}>{children}</View>
    </View>
  );
}

function DecimalPadDoneAccessory({ nativeID }: { nativeID: string }) {
  const { colors } = useTheme();
  if (Platform.OS !== 'ios') return null;
  return (
    <InputAccessoryView nativeID={nativeID}>
      <View
        style={[
          styles.keyboardAccessory,
          { borderTopColor: colors.frostBorder, backgroundColor: colors.sheetBg },
        ]}
      >
        <Pressable
          onPress={() => Keyboard.dismiss()}
          style={styles.keyboardAccessoryBtn}
          accessibilityRole="button"
          accessibilityLabel="Done"
        >
          <Text style={[styles.keyboardAccessoryDone, { color: colors.brandVolt }]}>Done</Text>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Identify (photos + context + owner prefs)
// ---------------------------------------------------------------------------

function IdentifyStep({
  photos,
  context,
  onContextChange,
  onPickPhotos,
  onRemovePhoto,
  onReorderPhotos,
  bottomInset,
  status,
  value,
  visibility,
  selectedShowcases,
  tags,
  valueRequired,
  valueMissing,
  onStatusChange,
  onValueChange,
  onVisibilityChange,
  onOpenShowcasePicker,
  onRemoveShowcase,
  onOpenTagDialog,
  onRemoveTag,
  showResetPhotos,
  onResetPhotos,
}: {
  photos: PhotoAsset[];
  context: string;
  onContextChange: (value: string) => void;
  onPickPhotos: () => void;
  onRemovePhoto: (id: string) => void;
  onReorderPhotos: (next: PhotoAsset[]) => void;
  bottomInset: number;
  status: ListingStatus;
  value: string;
  visibility: 'public' | 'private';
  selectedShowcases: { id: string; title: string }[];
  tags: string[];
  valueRequired: boolean;
  valueMissing: boolean;
  onStatusChange: (s: ListingStatus) => void;
  onValueChange: (v: string) => void;
  onVisibilityChange: (v: 'public' | 'private') => void;
  onOpenShowcasePicker: () => void;
  onRemoveShowcase: (id: string) => void;
  onOpenTagDialog: () => void;
  onRemoveTag: (tag: string) => void;
  showResetPhotos?: boolean;
  onResetPhotos?: () => void;
}) {
  const { colors } = useTheme();
  const isNfst = status === 'NFST';
  const personalValueDisplay = isNfst && isZeroPersonalValue(value) ? '' : value;
  const personalValuePlaceholder = isNfst ? 'PRICELESS' : '0.00';

  return (
    <>
    <KeyboardSafeScroll
      style={[styles.scanBody, styles.scanScroll]}
      contentContainerStyle={[
        styles.scanScrollContent,
        { paddingBottom: ActionDock.reservedHeight(bottomInset) + SPACING.sectionGap },
      ]}
    >
      <IdentifySection title="Add Collectible Images" hint="min 1 · max 6">
        <PhotoReorderGrid
          photos={photos}
          onReorder={onReorderPhotos}
          onRemove={onRemovePhoto}
          onAddMore={onPickPhotos}
        />
        {showResetPhotos && onResetPhotos ? (
          <Pressable
            onPress={onResetPhotos}
            style={[styles.resetPhotosBtn, { borderColor: colors.frostBorder }]}
            accessibilityRole="button"
            accessibilityLabel="Reset photos to original"
          >
            <RotateCcw size={14} color={colors.textSecondary} />
            <Text style={[styles.resetPhotosLabel, { color: colors.textSecondary }]}>
              Reset photos
            </Text>
          </Pressable>
        ) : null}
      </IdentifySection>

      <View style={styles.identifySectionBlock}>
        <Text style={[styles.contextLabel, { color: colors.textPrimary }]}>
          Context <Text style={[styles.contextOptional, { color: colors.textTertiary }]}>(optional)</Text>
        </Text>
        <View style={[styles.contextFieldWrap, { borderColor: colors.frostBorder, backgroundColor: 'transparent' }]}>
          <TextInput
            value={context}
            onChangeText={(text) => onContextChange(text.slice(0, LISTING_TITLE_MAX))}
            placeholder="Help Looking Glass identify this"
            placeholderTextColor={colors.textTertiary}
            style={[styles.contextInput, { color: colors.textPrimary }]}
            maxLength={LISTING_TITLE_MAX}
            returnKeyType="done"
            multiline={false}
            numberOfLines={1}
          />
        </View>
      </View>

      <IdentifySection title="Listing Status">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.identifyStatusScroll}
          contentContainerStyle={styles.identifyStatusScrollContent}
        >
          {LISTING_STATUS_OPTIONS.map((option) => {
            const active = status === option;
            const chrome = STATUS_CONFIG[option];
            return (
              <Pressable
                key={option}
                onPress={() => onStatusChange(option)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={chrome.label}
                accessibilityHint={active ? 'Currently selected' : 'Select this listing status'}
                style={[
                  styles.statusChipOption,
                  active && { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
                ]}
              >
                <View style={!active && styles.statusChipMuted}>
                  <StatusPill status={option} />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.identifySectionBlock}>
          <View style={styles.identifyFieldHeader}>
            <View style={styles.kickerRow}>
              <Text style={[styles.identifyFieldLabel, { color: colors.textSecondary }]}>
                Personal Value
                {!valueRequired ? (
                  <Text style={[styles.contextOptional, { color: colors.textTertiary }]}> (optional)</Text>
                ) : null}
              </Text>
              {valueRequired ? (
                <Text
                  style={[
                    styles.requiredHint,
                    { color: colors.textTertiary },
                    valueMissing && { color: colors.semanticRed },
                  ]}
                >
                  Required
                </Text>
              ) : null}
            </View>
            <Text style={[styles.identifyFieldHint, { color: colors.textTertiary }]}>
              How much is this piece worth to you?
            </Text>
          </View>
          <View
            style={[
              styles.contextFieldWrap,
              styles.valueFieldWrap,
              {
                borderColor: valueMissing ? colors.semanticRed : colors.frostBorder,
                backgroundColor: 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.valueCurrencyInline,
                { color: colors.textTertiary },
                valueMissing && { color: colors.semanticRed },
              ]}
            >
              $
            </Text>
            <TextInput
              value={personalValueDisplay}
              onChangeText={onValueChange}
              style={[styles.valueInputInline, { color: colors.textPrimary }]}
              keyboardType="decimal-pad"
              inputAccessoryViewID={IDENTIFY_VALUE_ACCESSORY_ID}
              placeholder={personalValuePlaceholder}
              placeholderTextColor={valueMissing ? colors.semanticRed : colors.textTertiary}
              accessibilityLabel="Personal value"
              accessibilityHint={
                valueMissing
                  ? 'Required when listing for sale or trade'
                  : isNfst
                    ? 'Optional for catalog-only items. Leave blank for priceless.'
                    : undefined
              }
            />
          </View>
        </View>

        <View style={styles.identifySectionBlock}>
          <Text style={[styles.identifyFieldLabel, { color: colors.textSecondary }]}>Visibility</Text>
          <View style={styles.visibilityRow}>
            {(['public', 'private'] as const).map((option) => {
              const active = visibility === option;
              const Icon = option === 'public' ? Eye : Lock;
              const label = option === 'public' ? 'Public' : 'Private';
              return (
                <Pressable
                  key={option}
                  onPress={() => onVisibilityChange(option)}
                  style={[
                    styles.visibilityBtn,
                    { borderColor: colors.frostBorderStrong, backgroundColor: 'transparent' },
                    active && { borderColor: colors.brandVoltBorder, backgroundColor: colors.brandVoltFill },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={label}
                >
                  <Icon
                    size={14}
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
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.identifySectionBlock}>
          <Text style={[styles.identifyFieldLabel, { color: colors.textSecondary }]}>Assign to Showcase(s)</Text>
          <Pressable
            onPress={onOpenShowcasePicker}
            style={[
              styles.showcasePickerRow,
              { borderColor: colors.frostBorder, backgroundColor: 'transparent' },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Assign to showcase"
            accessibilityHint={
              selectedShowcases.length > 0
                ? `${selectedShowcases.length} showcase${selectedShowcases.length === 1 ? '' : 's'} selected. Opens picker.`
                : 'Opens showcase picker'
            }
          >
            <Text
              style={[
                styles.showcasePickerRowLabel,
                {
                  color: selectedShowcases.length > 0 ? colors.textPrimary : colors.textTertiary,
                },
              ]}
              numberOfLines={1}
            >
              {selectedShowcases.length === 0
                ? 'Create or Select Showcase(s)'
                : selectedShowcases.length === 1
                  ? selectedShowcases[0].title
                  : `${selectedShowcases.length} showcases assigned`}
            </Text>
            <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2} />
          </Pressable>
          {selectedShowcases.length > 0 ? (
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
            </View>
          ) : null}
        </View>

        <View style={styles.identifySectionBlock}>
          <View style={styles.identifyFieldHeader}>
            <Text style={[styles.identifyFieldLabel, { color: colors.textSecondary }]}>Add Tags</Text>
            <Text style={[styles.identifyFieldHint, { color: colors.textTertiary }]}>
              Tags are designed to help organize your collection. They are only visible to you.
            </Text>
          </View>
          <View style={styles.tagRow}>
            {tags.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => onRemoveTag(tag)}
                style={[styles.tagChip, { backgroundColor: colors.semanticSilverFill, borderColor: colors.frostBorder }]}
                accessibilityRole="button"
                accessibilityLabel={`Remove tag ${tag}`}
              >
                <Text style={[styles.tagText, { color: colors.textPrimary }]}>#{tag}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={onOpenTagDialog}
              style={[styles.tagChipAdd, { borderColor: colors.brandVoltBorder }]}
              accessibilityRole="button"
              accessibilityLabel="Add tag"
            >
              <Text style={[styles.tagText, { color: colors.brandVolt }]}>+ Tag</Text>
            </Pressable>
          </View>
        </View>
      </IdentifySection>
    </KeyboardSafeScroll>
    <DecimalPadDoneAccessory nativeID={IDENTIFY_VALUE_ACCESSORY_ID} />
    </>
  );
}

// ---------------------------------------------------------------------------
// The Lattice — the Looking Glass, made visible.
//
// A reasoning graph that assembles itself in lock-step with the REAL engine
// pipeline. The collectible is the core node; hypotheses fan out as the machine
// classifies, one branch locks when it routes, the schema grows leaf-by-leaf on
// cold starts, energy pulses race inward while it extracts, then the whole
// structure collapses into the piece at the verdict. There is no fake progress
// bar — every beat is wired to an actual `stage`, and ambient looping motion
// keeps a 15-second run and a 90-second run equally alive (time-agnostic by
// construction). Monochrome ivory while it thinks; the single trait color only
// blooms at the end, when the atomic result finally lands.
// ---------------------------------------------------------------------------

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type LatticeTier = 'primary' | 'leaf' | 'schema';
type LatNode = { id: string; x: number; y: number; baseR: number; tier: LatticeTier; branch: number };
type LatEdge = {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  tier: LatticeTier;
  branch: number;
};

type SV = SharedValue<number>;
type LatticeAnim = {
  ignite: SV;
  classify: SV;
  route: SV;
  schema: SV;
  converge: SV;
  orbit: SV;
  extractPulse: SV;
  extractOn: SV;
  breathe: SV;
  attnLock: SV;
  attnX: SV;
  attnY: SV;
  attnOpacity: SV;
};

// The graph is generated deterministically from the stage size so it reads as a
// designed instrument, never random noise. One branch is the route target;
// schema growth sprouts from it on cold-start runs only.
const PRIMARY_COUNT = 6;
const CHOSEN_BRANCH = 1;

function buildLattice(w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const base = Math.min(w, h);
  const r1 = base * 0.3;
  const r2 = base * 0.42;
  const nodes: LatNode[] = [];
  const edges: LatEdge[] = [];

  for (let i = 0; i < PRIMARY_COUNT; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI * 2) / PRIMARY_COUNT + 0.18;
    const px = cx + r1 * Math.cos(ang);
    const py = cy + r1 * Math.sin(ang);
    nodes.push({ id: `p${i}`, x: px, y: py, baseR: 3.4, tier: 'primary', branch: i });
    edges.push({ id: `ec${i}`, x1: cx, y1: cy, x2: px, y2: py, tier: 'primary', branch: i });

    const leafCount = i % 2 === 0 ? 2 : 1;
    for (let l = 0; l < leafCount; l++) {
      const spread = leafCount === 2 ? (l === 0 ? -0.2 : 0.2) : 0;
      const a2 = ang + spread;
      const lx = cx + r2 * Math.cos(a2);
      const ly = cy + r2 * Math.sin(a2);
      nodes.push({ id: `l${i}_${l}`, x: lx, y: ly, baseR: 2.3, tier: 'leaf', branch: i });
      edges.push({ id: `el${i}_${l}`, x1: px, y1: py, x2: lx, y2: ly, tier: 'leaf', branch: i });
    }
  }

  const chosenP = nodes.find((n) => n.id === `p${CHOSEN_BRANCH}`)!;
  const chosenLeaf =
    nodes.find((n) => n.tier === 'leaf' && n.branch === CHOSEN_BRANCH) ?? chosenP;
  const baseAng = -Math.PI / 2 + (CHOSEN_BRANCH * Math.PI * 2) / PRIMARY_COUNT + 0.18;
  for (let s = 0; s < 3; s++) {
    const a = baseAng + (s - 1) * 0.26;
    const rr = r2 * (1.04 + s * 0.07);
    const sx = cx + rr * Math.cos(a);
    const sy = cy + rr * Math.sin(a);
    nodes.push({ id: `s${s}`, x: sx, y: sy, baseR: 2, tier: 'schema', branch: CHOSEN_BRANCH });
    edges.push({
      id: `es${s}`,
      x1: chosenP.x,
      y1: chosenP.y,
      x2: sx,
      y2: sy,
      tier: 'schema',
      branch: CHOSEN_BRANCH,
    });
  }

  return { cx, cy, r1, base, nodes, edges, chosenP, chosenLeaf };
}

// Trait → accent color. The graph runs ivory while it reasons — we genuinely
// don't know the type yet — then resolves to the real trait hue at the verdict.
function traitAccent(
  ex: ExtractionResult | null | undefined,
  fallback: string,
  colors: { traitCyan: string; traitViolet: string; traitOlive: string; traitPink: string },
) {
  const t = ex?.traits ?? [];
  if (t.includes('graded')) return colors.traitCyan;
  if (t.includes('signed') || t.includes('autograph') || t.includes('autographed'))
    return colors.traitViolet;
  if (t.includes('game_used') || t.includes('gameUsed') || t.includes('game-used'))
    return colors.traitOlive;
  if (t.includes('rookie')) return colors.traitPink;
  return fallback;
}

// An edge that draws itself (dash offset) when its tier activates, recedes if it
// isn't on the chosen branch once routed, and fades on convergence.
function LatticeEdge({
  edge,
  A,
  color,
  isChosen,
}: {
  edge: LatEdge;
  A: LatticeAnim;
  color: string;
  isChosen: boolean;
}) {
  const len = Math.hypot(edge.x2 - edge.x1, edge.y2 - edge.y1);
  const baseOpacity = edge.tier === 'primary' ? 0.5 : edge.tier === 'leaf' ? 0.3 : 0.36;
  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const reveal =
      edge.tier === 'primary'
        ? A.classify.value
        : edge.tier === 'leaf'
          ? A.route.value
          : A.schema.value;
    const conv = A.converge.value;
    const emph = isChosen ? 1 : 1 - 0.62 * A.route.value;
    return {
      strokeDashoffset: len * (1 - reveal),
      strokeOpacity: baseOpacity * reveal * emph * (1 - conv),
    };
  });
  return (
    <AnimatedLine
      x1={edge.x1}
      y1={edge.y1}
      x2={edge.x2}
      y2={edge.y2}
      stroke={color}
      strokeWidth={isChosen ? 1.4 : 1}
      strokeDasharray={len}
      strokeDashoffset={len}
      animatedProps={animatedProps}
    />
  );
}

// A node that swells in when its tier activates, shimmers as a candidate during
// classification, then rides inward to the core on convergence.
function LatticeNode({
  node,
  A,
  color,
  isChosen,
  cx,
  cy,
  phase,
}: {
  node: LatNode;
  A: LatticeAnim;
  color: string;
  isChosen: boolean;
  cx: number;
  cy: number;
  phase: number;
}) {
  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const tau = 6.283185307179586;
    const reveal =
      node.tier === 'primary'
        ? A.classify.value
        : node.tier === 'leaf'
          ? A.route.value
          : A.schema.value;
    const conv = A.converge.value;
    const emph = isChosen ? 1 : 1 - 0.55 * A.route.value;
    let flicker = 1;
    if (node.tier === 'primary') {
      const s = 0.78 + 0.22 * Math.sin(A.orbit.value * tau + phase);
      flicker = s + (1 - s) * A.route.value; // candidate shimmer calms once routed
    }
    const x = node.x + (cx - node.x) * conv;
    const y = node.y + (cy - node.y) * conv;
    const r = node.baseR * (0.45 + 0.55 * reveal) * (1 - 0.3 * conv);
    return {
      cx: x,
      cy: y,
      r: Math.max(0.1, r),
      opacity: reveal * emph * flicker * (1 - conv),
    };
  });
  return <AnimatedCircle cx={node.x} cy={node.y} r={node.baseR} fill={color} animatedProps={animatedProps} />;
}

// The attention point — the machine's focus. Orbits the candidate ring while
// classifying, then locks to wherever the work is happening.
function AttentionNode({
  A,
  cx,
  cy,
  r1,
  color,
}: {
  A: LatticeAnim;
  cx: number;
  cy: number;
  r1: number;
  color: string;
}) {
  const corePos = useAnimatedProps(() => {
    'worklet';
    const tau = 6.283185307179586;
    const ang = A.orbit.value * tau;
    const ox = cx + r1 * Math.cos(ang);
    const oy = cy + r1 * Math.sin(ang);
    const lock = A.attnLock.value;
    return {
      cx: ox + (A.attnX.value - ox) * lock,
      cy: oy + (A.attnY.value - oy) * lock,
      opacity: A.attnOpacity.value * (1 - A.converge.value),
    };
  });
  const glowPos = useAnimatedProps(() => {
    'worklet';
    const tau = 6.283185307179586;
    const ang = A.orbit.value * tau;
    const ox = cx + r1 * Math.cos(ang);
    const oy = cy + r1 * Math.sin(ang);
    const lock = A.attnLock.value;
    return {
      cx: ox + (A.attnX.value - ox) * lock,
      cy: oy + (A.attnY.value - oy) * lock,
      opacity: A.attnOpacity.value * 0.28 * (1 - A.converge.value),
    };
  });
  return (
    <>
      <AnimatedCircle cx={cx} cy={cy} r={15} fill={color} animatedProps={glowPos} />
      <AnimatedCircle cx={cx} cy={cy} r={3.6} fill={color} animatedProps={corePos} />
    </>
  );
}

// A mote of energy riding a primary edge inward to the core during extraction.
function Pulse({
  fromX,
  fromY,
  toX,
  toY,
  A,
  color,
  phase,
}: {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  A: LatticeAnim;
  color: string;
  phase: number;
}) {
  const animatedProps = useAnimatedProps(() => {
    'worklet';
    const t = (A.extractPulse.value + phase) % 1;
    const fade = Math.sin(t * Math.PI); // soft in/out at both ends of the run
    return {
      cx: fromX + (toX - fromX) * t,
      cy: fromY + (toY - fromY) * t,
      opacity: A.extractOn.value * fade * (1 - A.converge.value),
    };
  });
  return <AnimatedCircle cx={fromX} cy={fromY} r={2.4} fill={color} animatedProps={animatedProps} />;
}

// ---------------------------------------------------------------------------
// Step 2 — Theater (Looking Glass HUD)
// ---------------------------------------------------------------------------

function TheaterStep({
  photos,
  extractionStatus,
  phase,
  stage,
  extraction,
}: {
  photos: PhotoAsset[];
  extractionStatus: ExtractionStatus | null;
  phase: 'analyzing' | 'reassure';
  stage: string | null;
  extraction: ExtractionResult | null;
}) {
  const { colors } = useTheme();
  const featuredPhoto = photos[0];
  const done = extractionStatus === 'extracted' || extractionStatus === 'complete';

  // The stage the Lattice is drawn into — geometry is derived from its size.
  const [box, setBox] = useState({ w: 0, h: 0 });
  const lat = useMemo(
    () => (box.w > 4 && box.h > 4 ? buildLattice(box.w, box.h) : null),
    [box.w, box.h],
  );

  // Cosmetic fallback narration — shown ONLY before the first real engine stage
  // arrives. Cycles while analyzing; the looping (not a number) keeps it honest
  // about an indeterminate wait.
  const [phraseIdx, setPhraseIdx] = useState(0);
  const hasStage = !!stage && !!ENGINE_STAGE_LABELS[stage];
  useEffect(() => {
    if (done || phase !== 'analyzing' || hasStage) return;
    const id = setInterval(
      () => setPhraseIdx((i) => (i + 1) % SCAN_PHRASES.length),
      STATUS_PHRASE_MS,
    );
    return () => clearInterval(id);
  }, [done, phase, hasStage]);

  // Anti-strobe: hold each real stage label for a minimum dwell so rapid
  // engine transitions don't flicker. Latches the latest stage after dwell.
  const [shownStage, setShownStage] = useState<string | null>(null);
  const lastShownAt = useRef(0);
  useEffect(() => {
    if (!hasStage || !stage) return;
    const since = Date.now() - lastShownAt.current;
    if (since >= THEATER_STAGE_MIN_DWELL_MS) {
      setShownStage(stage);
      lastShownAt.current = Date.now();
      return;
    }
    const t = setTimeout(() => {
      setShownStage(stage);
      lastShownAt.current = Date.now();
    }, THEATER_STAGE_MIN_DWELL_MS - since);
    return () => clearTimeout(t);
  }, [stage, hasStage]);

  const stageLabel = shownStage ? ENGINE_STAGE_LABELS[shownStage] : null;
  const verdictTitle = extraction?.listingTitle?.trim();
  const accent = useMemo(
    () => traitAccent(extraction, colors.brandVolt, colors),
    [extraction, colors],
  );

  const statusText = done
    ? verdictTitle || 'Identified'
    : phase === 'reassure'
      ? THEATER_REASSURE_COPY
      : stageLabel ?? SCAN_PHRASES[phraseIdx];
  const statusKey = done
    ? 'done'
    : phase === 'reassure'
      ? 'reassure'
      : stageLabel
        ? `s-${shownStage}`
        : `p-${phraseIdx}`;
  const verdictSub = done
    ? [extraction?.category, extraction?.confidence]
        .filter((v) => v && v !== 'pending')
        .join('   ·   ')
        .toUpperCase() || 'CATALOG READY'
    : phase === 'reassure'
      ? 'A DEEPER READ IS IN PROGRESS'
      : 'THE LOOKING GLASS IS REASONING';

  // A tactile tick each time the machine advances a reasoning step.
  const firstStageRef = useRef(true);
  useEffect(() => {
    if (!shownStage) return;
    if (firstStageRef.current) {
      firstStageRef.current = false;
      return;
    }
    Haptics.selectionAsync().catch(() => {});
  }, [shownStage]);

  // --- Lattice shared values (all UI-thread) ----------------------------
  const ignite = useSharedValue(0);
  const classify = useSharedValue(0);
  const route = useSharedValue(0);
  const schema = useSharedValue(0);
  const converge = useSharedValue(0);
  const orbit = useSharedValue(0);
  const extractPulse = useSharedValue(0);
  const extractOn = useSharedValue(0);
  const breathe = useSharedValue(0);
  const attnLock = useSharedValue(1);
  const attnX = useSharedValue(0);
  const attnY = useSharedValue(0);
  const attnOpacity = useSharedValue(0);
  const A: LatticeAnim = {
    ignite,
    classify,
    route,
    schema,
    converge,
    orbit,
    extractPulse,
    extractOn,
    breathe,
    attnLock,
    attnX,
    attnY,
    attnOpacity,
  };

  // Ambient loops never stop while mounted, so the scene stays alive whether the
  // run takes 15s or 90s. They are a handful of cheap UI-thread interpolations.
  useEffect(() => {
    orbit.value = withRepeat(withTiming(1, { duration: 5200, easing: Easing.linear }), -1, false);
    extractPulse.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1,
      false,
    );
    breathe.value = withRepeat(
      withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(orbit);
      cancelAnimation(extractPulse);
      cancelAnimation(breathe);
    };
  }, [orbit, extractPulse, breathe]);

  // Seed the attention point at the core once we know where center is.
  useEffect(() => {
    if (!lat) return;
    attnX.value = lat.cx;
    attnY.value = lat.cy;
  }, [lat, attnX, attnY]);

  // Schema growth is exclusive to cold-start runs; latch it the instant we see
  // the stage so cached runs (which skip it) never show phantom growth.
  const [schemaSeen, setSchemaSeen] = useState(false);
  useEffect(() => {
    if (stage === 'designing_schema') setSchemaSeen(true);
  }, [stage]);

  // The choreography: map the real engine stage onto the structure's evolution.
  useEffect(() => {
    if (!lat) return;
    const rank = done
      ? 7
      : stage && STAGE_RANK[stage] !== undefined
        ? STAGE_RANK[stage]
        : hasStage
          ? 2
          : 1;

    ignite.value = withTiming(rank >= 1 ? 1 : 0, { duration: 600 });
    classify.value = withTiming(rank >= 2 ? 1 : 0, { duration: 700 });
    route.value = withTiming(rank >= 3 ? 1 : 0, { duration: 700 });
    extractOn.value = withTiming(rank === 5 ? 1 : 0, { duration: 500 });
    if (schemaSeen) schema.value = withTiming(1, { duration: 900 });
    converge.value = withTiming(done ? 1 : 0, {
      duration: done ? 760 : 300,
      easing: Easing.inOut(Easing.cubic),
    });
    attnOpacity.value = withTiming(done ? 0 : 1, { duration: done ? 240 : 600 });

    const lockTo = (x: number, y: number, lock: number) => {
      attnX.value = withSpring(x, { damping: 17, stiffness: 70 });
      attnY.value = withSpring(y, { damping: 17, stiffness: 70 });
      attnLock.value = withTiming(lock, { duration: 520 });
    };

    if (done) {
      lockTo(lat.cx, lat.cy, 1);
    } else if (rank <= 1) {
      lockTo(lat.cx, lat.cy, 1); // queued / preparing — focus rests on the core
    } else if (rank === 2) {
      attnLock.value = withTiming(0, { duration: 520 }); // classifying — orbit the candidates
    } else if (rank === 3) {
      lockTo(lat.chosenP.x, lat.chosenP.y, 1); // routing — dart to the chosen branch
    } else if (rank === 4) {
      lockTo(lat.chosenLeaf.x, lat.chosenLeaf.y, 1); // schema — hover the growth
    } else {
      lockTo(lat.cx, lat.cy, 1); // extracting / verifying — draw back to the core
    }
  }, [
    stage,
    done,
    lat,
    schemaSeen,
    hasStage,
    ignite,
    classify,
    route,
    schema,
    extractOn,
    converge,
    attnOpacity,
    attnX,
    attnY,
    attnLock,
  ]);

  // --- photo (the core node) + glows ------------------------------------
  const photoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + 0.012 * breathe.value + 0.09 * converge.value }],
  }));
  const sharpStyle = useAnimatedStyle(() => ({ opacity: converge.value }));
  const veilStyle = useAnimatedStyle(() => ({ opacity: 0.46 * (1 - converge.value) }));
  const ringStyle = useAnimatedStyle(() => ({ opacity: converge.value }));
  const livePulse = useAnimatedStyle(() => ({ opacity: 0.45 + 0.55 * breathe.value }));

  const coreGlowProps = useAnimatedProps(() => {
    'worklet';
    return { opacity: Math.min(0.92, 0.16 + 0.42 * ignite.value + 0.32 * converge.value) };
  });
  const burstProps = useAnimatedProps(() => {
    'worklet';
    return { opacity: 0.62 * converge.value };
  });

  const photoSize = lat ? Math.max(88, Math.min(150, lat.base * 0.3)) : 110;
  const pulseEdges = useMemo(
    () =>
      lat
        ? lat.nodes
            .filter((n) => n.tier === 'primary')
            .map((n) => ({ x: n.x, y: n.y, branch: n.branch, phase: n.branch / PRIMARY_COUNT }))
        : [],
    [lat],
  );

  return (
    <View style={[styles.theaterWrap, { backgroundColor: colors.void }]}>
      <View style={styles.latticeTop}>
        <Animated.View style={[styles.liveDot, { backgroundColor: colors.brandVolt }, livePulse]} />
        <Text style={[styles.latticeWordmark, { color: colors.textTertiary }]}>LOOKING GLASS</Text>
      </View>

      <View
        style={styles.latticeStage}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setBox((b) => (b.w === width && b.h === height ? b : { w: width, h: height }));
        }}
      >
        {lat ? (
          <>
            <Svg width={box.w} height={box.h} style={StyleSheet.absoluteFill}>
              <Defs>
                <RadialGradient id="latticeCore" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={colors.brandVolt} stopOpacity={0.5} />
                  <Stop offset="100%" stopColor={colors.brandVolt} stopOpacity={0} />
                </RadialGradient>
                <RadialGradient id="latticeBurst" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={accent} stopOpacity={0.75} />
                  <Stop offset="55%" stopColor={accent} stopOpacity={0.18} />
                  <Stop offset="100%" stopColor={accent} stopOpacity={0} />
                </RadialGradient>
              </Defs>

              <AnimatedCircle
                cx={lat.cx}
                cy={lat.cy}
                r={lat.base * 0.34}
                fill="url(#latticeCore)"
                animatedProps={coreGlowProps}
              />
              <AnimatedCircle
                cx={lat.cx}
                cy={lat.cy}
                r={lat.base * 0.52}
                fill="url(#latticeBurst)"
                animatedProps={burstProps}
              />

              {lat.edges.map((edge) => (
                <LatticeEdge
                  key={edge.id}
                  edge={edge}
                  A={A}
                  color={colors.brandVolt}
                  isChosen={edge.branch === CHOSEN_BRANCH}
                />
              ))}

              {lat.nodes.map((node, i) => (
                <LatticeNode
                  key={node.id}
                  node={node}
                  A={A}
                  color={colors.brandVolt}
                  isChosen={node.branch === CHOSEN_BRANCH}
                  cx={lat.cx}
                  cy={lat.cy}
                  phase={(i * 1.7) % 6.283}
                />
              ))}

              {pulseEdges.map((p, i) => (
                <Pulse
                  key={`pulse-${i}`}
                  fromX={p.x}
                  fromY={p.y}
                  toX={lat.cx}
                  toY={lat.cy}
                  A={A}
                  color={colors.brandVolt}
                  phase={p.phase}
                />
              ))}

              <AttentionNode A={A} cx={lat.cx} cy={lat.cy} r1={lat.r1} color={colors.brandVolt} />
            </Svg>

            <View style={styles.latticePhotoCenter} pointerEvents="none">
              <Animated.View
                style={[
                  styles.latticePhoto,
                  { width: photoSize, height: photoSize, borderColor: colors.frostBorder },
                  photoStyle,
                ]}
              >
                {featuredPhoto ? (
                  <>
                    <Image
                      source={{ uri: featuredPhoto.uri }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      blurRadius={14}
                      recyclingKey={`lat-blur-${featuredPhoto.id}`}
                    />
                    <Animated.View style={[StyleSheet.absoluteFill, sharpStyle]}>
                      <Image
                        source={{ uri: featuredPhoto.uri }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        recyclingKey={`lat-sharp-${featuredPhoto.id}`}
                      />
                    </Animated.View>
                    <Animated.View
                      style={[StyleSheet.absoluteFill, { backgroundColor: colors.void }, veilStyle]}
                    />
                  </>
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.sheetBg }]} />
                )}
                <Animated.View
                  style={[
                    StyleSheet.absoluteFill,
                    styles.latticePhotoRing,
                    { borderColor: accent },
                    ringStyle,
                  ]}
                />
              </Animated.View>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.latticeStatus}>
        <Animated.Text
          key={statusKey}
          entering={FadeIn.duration(320)}
          numberOfLines={2}
          style={[styles.latticeStatusText, { color: done ? accent : colors.textPrimary }]}
        >
          {statusText}
        </Animated.Text>
        <Text style={[styles.latticeStatusSub, { color: colors.textTertiary }]}>{verdictSub}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Failed Step
// ---------------------------------------------------------------------------

function FailedStep({
  failureCode,
  onRetry,
  onStartOver,
  onGetSupport,
}: {
  failureCode: string | null;
  onRetry?: () => void;
  onStartOver: () => void;
  onGetSupport: () => void;
}) {
  const { colors } = useTheme();
  const copy = (failureCode && FAILURE_COPY[failureCode]) || FAILURE_FALLBACK_COPY;
  return (
    <View style={styles.failedWrap}>
      <View style={[styles.failedIconWrap, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
        <AlertCircle size={48} color={colors.textSecondary} strokeWidth={1.2} />
      </View>
      <Text style={[styles.failedTitle, { color: colors.textPrimary }]}>
        We couldn&apos;t analyze this item
      </Text>
      <Text style={[styles.failedCopy, { color: colors.textSecondary }]}>
        {copy}
      </Text>
      {onRetry ? (
        <Button label="Try Again" fullWidth onPress={onRetry} style={{ marginTop: SPACING.xl }} />
      ) : (
        <Button label="Start Over" fullWidth onPress={onStartOver} style={{ marginTop: SPACING.xl }} />
      )}
      {onRetry ? (
        <Pressable onPress={onStartOver} style={styles.failedSupportLink} accessibilityRole="button">
          <RotateCcw size={16} color={colors.textTertiary} />
          <Text style={[styles.failedSupportText, { color: colors.textTertiary }]}>Start Over</Text>
        </Pressable>
      ) : (
        <Pressable onPress={onGetSupport} style={styles.failedSupportLink} accessibilityRole="button">
          <Headphones size={16} color={colors.textTertiary} />
          <Text style={[styles.failedSupportText, { color: colors.textTertiary }]}>Get Support</Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Rejected Step — the engine recognized the input but rejected it (not a
// collectible / multiple items / unreadable). Distinct from a failure: there's
// nothing to retry blindly, so we guide the user to retake or bail out.
// ---------------------------------------------------------------------------

function RejectedStep({
  rejectionReason,
  onRetake,
  onCancel,
}: {
  rejectionReason: string | null;
  onRetake: () => void;
  onCancel: () => void;
}) {
  const { colors } = useTheme();
  const copy = (rejectionReason && REJECTION_COPY[rejectionReason]) || REJECTION_FALLBACK_COPY;
  return (
    <View style={styles.failedWrap}>
      <View style={[styles.failedIconWrap, { backgroundColor: colors.sheetBg, borderColor: colors.frostBorder }]}>
        <Eye size={44} color={colors.textSecondary} strokeWidth={1.3} />
      </View>
      <Text style={[styles.failedTitle, { color: colors.textPrimary }]}>
        We couldn&apos;t recognize this
      </Text>
      <Text style={[styles.failedCopy, { color: colors.textSecondary }]}>
        {copy}
      </Text>
      <Button label="Retake Photos" fullWidth onPress={onRetake} style={{ marginTop: SPACING.xl }} />
      <Pressable onPress={onCancel} style={styles.failedSupportLink} accessibilityRole="button">
        <X size={16} color={colors.textTertiary} />
        <Text style={[styles.failedSupportText, { color: colors.textTertiary }]}>Cancel</Text>
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
 * Overlay pending edits onto the base extraction so review renders the
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
  customFields,
  onCustomFieldsChange,
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
  customFields: CollectibleCustomField[];
  onCustomFieldsChange: (fields: CollectibleCustomField[]) => void;
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
        <FramedHero images={images} displaySize="full" />

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

        <View style={styles.reviewCustomFieldsWrap}>
          <CustomFieldsEditor fields={customFields} onChange={onCustomFieldsChange} />
        </View>
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
// Step 4 — Success
// ---------------------------------------------------------------------------

function SuccessStep({
  extraction,
  isEditMode,
  onAddAnother,
  onViewCollection,
}: {
  extraction: ExtractionResult | null;
  isEditMode?: boolean;
  onAddAnother?: () => void;
  onViewCollection: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.successWrap}>
      <View style={[styles.successOrb, { backgroundColor: colors.brandVolt }]}>
        <View style={[styles.successGlow, { backgroundColor: colors.brandVoltFill }]} />
        <Check size={42} color={colors.textInverse} strokeWidth={2.5} />
      </View>
      <Text style={[styles.successTitle, { color: colors.textPrimary }]}>
        {isEditMode ? 'Updates saved' : 'Saved to Vault'}
      </Text>
      {extraction && (
        <Text style={[styles.successItemTitle, { color: colors.textSecondary }]}>{extraction.listingTitle}</Text>
      )}
      <Text style={[styles.successCopy, { color: colors.textSecondary }]}>
        {isEditMode
          ? 'Your collectible has been updated.'
          : 'AI record created, preferences applied, and the collectible is live in your collection.'}
      </Text>
      {!isEditMode ? <PushPrePrompt context="post_upload" /> : null}
      <View style={styles.successActions}>
        {onAddAnother ? (
          <Button label="Add Another" icon={RotateCcw} variant="frost" fullWidth onPress={onAddAnother} />
        ) : null}
        <Button
          label="View in Collection"
          icon={ArrowRight}
          iconPosition="trailing"
          fullWidth
          onPress={onViewCollection}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  editLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.gutter,
    gap: 16,
  },
  editLoadingText: {
    fontFamily: TYPE.inter,
    fontSize: 15,
    textAlign: 'center',
  },
  resetPhotosBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: RADII.small,
    borderStyle: 'dashed',
  },
  resetPhotosLabel: {
    fontFamily: TYPE.interMedium,
    fontSize: 13,
  },
  reviewCustomFieldsWrap: {
    marginTop: SPACING.sectionGap,
    paddingHorizontal: SPACING.gutter,
  },
  header: {
    minHeight: 56,
    paddingVertical: SPACING.zoneIntra / 2,
    paddingHorizontal: SPACING.gutter,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonGhost: {
    width: 44,
  },
  headerCenter: {
    alignItems: 'center',
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
    paddingTop: SPACING.zoneIntra,
    paddingBottom: SPACING.zoneIntra,
    gap: SPACING.sectionGap,
  },
  identifySection: {
    gap: SPACING.zoneIntra,
  },
  identifySectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: SPACING.zoneIntra,
  },
  identifySectionTitle: {
    fontFamily: TYPE.groteskBold,
    fontSize: 13,
  },
  identifySectionHint: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    flexShrink: 1,
    textAlign: 'right',
  },
  identifySectionBody: {
    gap: SPACING.sectionGap,
  },
  identifySectionBlock: {
    gap: SPACING.zoneIntra,
  },
  identifyFieldLabel: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 12,
  },
  identifyFieldHeader: {
    gap: SPACING.zoneIntra / 2,
  },
  identifyFieldHint: {
    fontFamily: TYPE.inter,
    fontSize: 12,
    lineHeight: 17,
  },
  identifyStatusScroll: {
    marginHorizontal: -SPACING.gutter,
    flexGrow: 0,
  },
  identifyStatusScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.zoneIntra / 2,
    paddingHorizontal: SPACING.gutter,
    paddingVertical: 2,
  },
  statusChipOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  statusChipMuted: {
    opacity: 0.34,
  },
  keyboardAccessory: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  keyboardAccessoryBtn: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  keyboardAccessoryDone: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 16,
  },
  valueFieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingVertical: SPACING.zoneIntra / 2,
  },
  valueCurrencyInline: {
    fontFamily: TYPE.monoMedium,
    fontSize: 17,
  },
  valueInputInline: {
    flex: 1,
    fontFamily: TYPE.monoMedium,
    fontSize: 17,
    padding: 0,
    minHeight: 24,
  },
  contextLabel: { fontFamily: TYPE.groteskBold, fontSize: 13 },
  contextOptional: { fontFamily: TYPE.inter, fontSize: 13 },
  contextFieldWrap: {
    borderRadius: RADII.medium,
    borderWidth: 1,
    paddingHorizontal: SPACING.rowPadX,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: SPACING.zoneIntra / 2,
  },
  contextInput: {
    fontFamily: TYPE.inter,
    fontSize: 15,
    lineHeight: 20,
    padding: 0,
    height: 22,
  },
  // The Lattice — a full-bleed void stage. The reasoning graph + core photo
  // fill the center; a whisper-thin wordmark floats above and the verdict /
  // status anchors the bottom. No frame, no chrome — the machine is the show.
  theaterWrap: {
    flex: 1,
  },
  latticeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingTop: 14,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  latticeWordmark: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    letterSpacing: 3,
  },
  latticeStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  latticePhotoCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  latticePhoto: {
    borderRadius: RADII.medium,
    overflow: 'hidden',
    borderWidth: 1,
  },
  latticePhotoRing: {
    borderRadius: RADII.medium,
    borderWidth: 1.5,
  },
  latticeStatus: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: SPACING.gutter,
    paddingBottom: 28,
  },
  latticeStatusText: {
    fontFamily: TYPE.heroDisplay,
    fontSize: 23,
    letterSpacing: 0.4,
    textAlign: 'center',
    lineHeight: 28,
  },
  latticeStatusSub: {
    fontFamily: TYPE.monoMedium,
    fontSize: 9.5,
    letterSpacing: 2,
    textAlign: 'center',
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
    gap: SPACING.zoneIntra / 2,
  },
  visibilityBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: RADII.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  visibilityBtnActive: {},
  visibilityBtnText: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 13,
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
    fontSize: 11,
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
  showcasePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    borderRadius: RADII.medium,
    borderWidth: 1,
    paddingHorizontal: SPACING.rowPadX,
    paddingVertical: SPACING.zoneIntra / 2,
    gap: SPACING.zoneIntra,
  },
  showcasePickerRowLabel: {
    flex: 1,
    fontFamily: TYPE.inter,
    fontSize: 15,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.zoneIntra / 2 },
  tagChip: {
    borderRadius: RADII.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  tagChipAdd: {
    borderRadius: RADII.pill,
    backgroundColor: 'transparent',
    borderWidth: 1,
    paddingHorizontal: 20,
    minHeight: 44,
    justifyContent: 'center',
  },
  tagText: {
    fontFamily: TYPE.interMedium,
    fontSize: 13,
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
    minHeight: 44,
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
