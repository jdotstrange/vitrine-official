import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';

import { useTheme, SPACING, TYPE } from '@/lib/design';
import {
  assemblyVariants,
  type VariantWorkJob,
} from '@/lib/image-utils';
import { logger } from '@/lib/logger';
import { Sentry } from '@/lib/sentry';

const log = logger.create('AssemblyStep');

const COLLECTIBLE_IMAGES_BUCKET = 'collectible-images';
const ASSEMBLY_TIMEOUT_MS = 45_000;
const MIN_TOTAL_MS = 2_600;
const COMPLETION_HOLD_MS = 600;

const STAGGER_IDENTITY_MS = 200;
const STAGGER_CLASSIFICATION_MS = 600;
const STAGGER_DISPLAY_EARLIEST_MS = 1_350;
const STAGGER_LEDGER_AFTER_DISPLAY_MS = 900;

const LEDGER_ROW_LABELS = [
  'Recording identity',
  'Filing classification',
  'Mounting display',
  'Entering ledger',
] as const;

const SCANLINE_COUNT = 9;

export interface AssemblyStepProps {
  work: VariantWorkJob[];
  title: string;
  onComplete: () => void;
}

type RowStatus = 'queued' | 'processing' | 'complete';
type FilmstripCellStatus = 'queued' | 'processing' | 'sealed';

function BackgroundScanlines({ lineColor }: { lineColor: string }) {
  const lines = useMemo(() => Array.from({ length: SCANLINE_COUNT }, (_, i) => i), []);
  return (
    <View style={styles.scanlines} pointerEvents="none">
      {lines.map((i) => (
        <View
          key={i}
          style={[
            styles.scanline,
            {
              backgroundColor: lineColor,
              left: `${((i + 1) / (SCANLINE_COUNT + 1)) * 100}%`,
            },
          ]}
        />
      ))}
    </View>
  );
}

function FilmstripCell({
  uri,
  status,
  size,
  overlap,
  borderColor,
  brandVolt,
  sheetBg,
}: {
  uri: string;
  status: FilmstripCellStatus;
  size: number;
  overlap: number;
  borderColor: string;
  brandVolt: string;
  sheetBg: string;
}) {
  const blur =
    status === 'sealed' ? 0 : status === 'processing' ? 8 : 20;
  const opacity = status === 'sealed' ? 1 : status === 'processing' ? 0.85 : 0.6;
  const cellBorder = status === 'sealed' ? brandVolt : borderColor;
  const cellBorderWidth = status === 'sealed' ? 1 : 1;

  return (
    <View
      style={[
        styles.filmstripCell,
        {
          width: size,
          height: size * 1.15,
          marginLeft: overlap,
          borderColor: cellBorder,
          borderWidth: cellBorderWidth,
          backgroundColor: sheetBg,
          zIndex: status === 'sealed' ? 2 : 1,
        },
      ]}
    >
      <Image
        source={{ uri }}
        style={[StyleSheet.absoluteFill, { opacity }]}
        contentFit="cover"
        blurRadius={blur}
        transition={200}
      />
    </View>
  );
}

function LedgerRow({
  label,
  status,
  subline,
  cascadeIndex,
  reduceMotion,
}: {
  label: string;
  status: RowStatus;
  subline?: string;
  cascadeIndex: number;
  reduceMotion: boolean;
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
  let statusLabel = 'Pending';
  let statusColor = colors.textTertiary;
  let labelColor = colors.textTertiary;

  if (status === 'complete') {
    indicator = (
      <View
        style={[
          styles.rowIndicator,
          { backgroundColor: colors.brandVolt, borderColor: colors.brandVolt },
        ]}
      >
        <Check size={8} color={colors.textInverse} strokeWidth={3} />
      </View>
    );
    statusLabel = 'Sealed';
    statusColor = colors.brandVolt;
    labelColor = colors.brandVolt;
  } else if (status === 'processing') {
    indicator = (
      <Animated.View
        style={[
          styles.rowIndicator,
          styles.rowIndicatorDashed,
          { borderColor: colors.brandVolt },
          spinStyle,
        ]}
      />
    );
    statusLabel = 'In progress';
    statusColor = colors.brandVolt;
    labelColor = colors.textPrimary;
  } else {
    indicator = (
      <View style={[styles.rowIndicator, { borderColor: colors.frostBorder }]} />
    );
  }

  const content = (
    <View style={styles.ledgerRow}>
      {indicator}
      <View style={styles.ledgerLabelBlock}>
        <Text style={[styles.ledgerLabel, { color: labelColor }]}>{label}</Text>
        {subline ? (
          <Text style={[styles.ledgerSubline, { color: colors.textTertiary }]}>{subline}</Text>
        ) : null}
      </View>
      <Text style={[styles.ledgerStatus, { color: statusColor }]}>{statusLabel}</Text>
    </View>
  );

  if (reduceMotion) {
    return content;
  }

  return (
    <Animated.View entering={FadeIn.duration(200).delay(cascadeIndex * 80)}>
      {content}
    </Animated.View>
  );
}

export function AssemblyStep({ work, title, onComplete }: AssemblyStepProps) {
  const { colors } = useTheme();
  const { width: screenW } = useWindowDimensions();

  const [reduceMotion, setReduceMotion] = useState(false);
  const [kicker, setKicker] = useState<'binding' | 'bound'>('binding');
  const [cardBound, setCardBound] = useState(false);
  const [rowStatuses, setRowStatuses] = useState<RowStatus[]>([
    'processing',
    'queued',
    'queued',
    'queued',
  ]);
  const [filmstripStatuses, setFilmstripStatuses] = useState<FilmstripCellStatus[]>(() =>
    work.map(() => 'queued'),
  );
  const [displayCompleted, setDisplayCompleted] = useState(0);

  const finishedRef = useRef(false);
  const filledRef = useRef<Set<number>>(new Set());
  const variantsCompleteRef = useRef(false);
  const displaySealedRef = useRef(false);
  const ledgerScheduledRef = useRef(false);

  const cardBorderWidth = useSharedValue(1);
  const cardGlowOpacity = useSharedValue(0);

  const total = work.length;
  const cardW = Math.min(screenW - SPACING.gutter * 2, 360);
  const filmstripOverlap = total > 1 ? -10 : 0;
  const filmstripInnerW = cardW - 32;
  const filmstripCellSize =
    total <= 0
      ? 0
      : Math.min(
          80,
          Math.floor((filmstripInnerW - Math.abs(filmstripOverlap) * (total - 1)) / total),
        );

  const cardBorderStyle = useAnimatedStyle(() => ({
    borderWidth: cardBorderWidth.value,
  }));

  const cardGlowStyle = useAnimatedStyle(() => ({
    opacity: cardGlowOpacity.value,
  }));

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    setFilmstripStatuses(work.map(() => 'queued'));
    setRowStatuses(['processing', 'queued', 'queued', 'queued']);
    setDisplayCompleted(0);
    setKicker('binding');
    setCardBound(false);
    filledRef.current = new Set();
    variantsCompleteRef.current = false;
    displaySealedRef.current = false;
    ledgerScheduledRef.current = false;
    finishedRef.current = false;
    cardBorderWidth.value = 1;
    cardGlowOpacity.value = 0;
  }, [work, cardBorderWidth, cardGlowOpacity]);

  useEffect(() => {
    if (finishedRef.current) return;

    if (total === 0) {
      finishedRef.current = true;
      onComplete();
      return;
    }

    let cancelled = false;
    const startedAt = Date.now();
    const timers: ReturnType<typeof setTimeout>[] = [];

    const schedule = (fn: () => void, delayMs: number) => {
      timers.push(
        setTimeout(() => {
          if (!cancelled) fn();
        }, delayMs),
      );
    };

    const sealRow = (index: number) => {
      setRowStatuses((prev) => {
        const next = [...prev] as RowStatus[];
        next[index] = 'complete';
        const nextIndex = index + 1;
        if (nextIndex < next.length && next[nextIndex] === 'queued') {
          next[nextIndex] = 'processing';
        }
        return next;
      });
      void Haptics.selectionAsync();
    };

    const markFilmstripSealed = (photoIndex: number) => {
      setFilmstripStatuses((prev) => {
        const next = [...prev];
        next[photoIndex] = 'sealed';
        return next;
      });
      setDisplayCompleted(filledRef.current.size);
    };

    const setFilmstripProcessing = () => {
      setFilmstripStatuses((prev) =>
        prev.map((s) => (s === 'sealed' ? 'sealed' : 'processing')),
      );
    };

    const playClosingBeat = (timedOut: boolean): Promise<void> =>
      new Promise((resolve) => {
        if (timedOut) {
          resolve();
          return;
        }

        setKicker('bound');
        setCardBound(true);
        if (reduceMotion) {
          cardBorderWidth.value = 2;
          cardGlowOpacity.value = 0.06;
          resolve();
          return;
        }

        cardBorderWidth.value = withTiming(2, { duration: 280, easing: Easing.out(Easing.quad) });
        cardGlowOpacity.value = withTiming(0.06, { duration: 280, easing: Easing.out(Easing.quad) });
        schedule(resolve, 320);
      });

    const finish = async (timedOut: boolean) => {
      if (cancelled || finishedRef.current) return;
      finishedRef.current = true;

      const durationMs = Date.now() - startedAt;
      const completedPhotos = filledRef.current.size;

      Sentry.addBreadcrumb({
        category: 'upload.assembly',
        message: 'assembly_complete',
        level: timedOut ? 'warning' : 'info',
        data: { durationMs, completed: completedPhotos, total, timedOut },
      });

      log.info('Assembly complete', { durationMs, completed: completedPhotos, total, timedOut });

      if (!timedOut) {
        const waitMore = Math.max(0, MIN_TOTAL_MS - durationMs);
        if (waitMore > 0) {
          await new Promise<void>((r) => schedule(r, waitMore));
        }
        if (cancelled) return;

        await playClosingBeat(false);
        if (cancelled) return;

        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await new Promise<void>((r) => schedule(r, COMPLETION_HOLD_MS));
      }

      if (!cancelled) onComplete();
    };

    const scheduleLedger = () => {
      if (ledgerScheduledRef.current || cancelled) return;
      ledgerScheduledRef.current = true;
      schedule(() => {
        sealRow(3);
        void finish(false);
      }, STAGGER_LEDGER_AFTER_DISPLAY_MS);
    };

    const trySealDisplay = () => {
      if (cancelled || displaySealedRef.current || !variantsCompleteRef.current) return;

      const earliest = startedAt + STAGGER_DISPLAY_EARLIEST_MS;
      const delay = Math.max(0, earliest - Date.now());

      schedule(() => {
        if (cancelled || displaySealedRef.current) return;
        displaySealedRef.current = true;
        sealRow(2);
        scheduleLedger();
      }, delay);
    };

    schedule(() => sealRow(0), STAGGER_IDENTITY_MS);

    schedule(() => {
      sealRow(1);
      setFilmstripProcessing();
      trySealDisplay();
    }, STAGGER_CLASSIFICATION_MS);

    const runVariants = async () => {
      try {
        await assemblyVariants(COLLECTIBLE_IMAGES_BUCKET, work, {
          concurrency: 4,
          onPhotoComplete: (photoIndex) => {
            if (cancelled || finishedRef.current) return;
            if (filledRef.current.has(photoIndex)) return;
            filledRef.current.add(photoIndex);
            markFilmstripSealed(photoIndex);
            void Haptics.selectionAsync();

            if (filledRef.current.size >= total) {
              variantsCompleteRef.current = true;
              trySealDisplay();
            }
          },
        });

        if (cancelled || finishedRef.current) return;

        variantsCompleteRef.current = true;
        if (filledRef.current.size < total) {
          for (let i = 0; i < total; i += 1) {
            if (!filledRef.current.has(i)) {
              filledRef.current.add(i);
              markFilmstripSealed(i);
            }
          }
        }
        trySealDisplay();
      } catch (err) {
        log.error('Assembly variant run failed:', err);
        Sentry.captureException(err);
        variantsCompleteRef.current = true;
        trySealDisplay();
      }
    };

    void runVariants();

    const timeoutId = setTimeout(() => {
      void finish(true);
    }, ASSEMBLY_TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, reduceMotion]);

  const displaySubline =
    rowStatuses[2] === 'processing' && total > 0
      ? `${Math.min(displayCompleted, total)} / ${total}`
      : undefined;

  const kickerText = kicker === 'binding' ? 'BINDING TO VAULT' : 'BOUND';

  return (
    <View style={[styles.wrap, { backgroundColor: colors.void }]}>
      <BackgroundScanlines lineColor={colors.frostBorder} />

      <Text
        style={[styles.kicker, { color: colors.textTertiary }]}
        accessibilityRole="header"
        accessibilityLabel={kickerText}
      >
        {kickerText}
      </Text>

      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.sheetBg,
            maxWidth: cardW,
            borderColor: cardBound ? colors.brandVolt : colors.frostBorder,
          },
          cardBorderStyle,
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.cardInnerGlow,
            { backgroundColor: 'rgba(255,255,255,0.06)' },
            cardGlowStyle,
          ]}
        />

        {total > 0 ? (
          <View style={styles.filmstripRow}>
            {work.map((job, i) => (
              <FilmstripCell
                key={job.storagePath}
                uri={job.compressedUri}
                status={filmstripStatuses[i] ?? 'queued'}
                size={filmstripCellSize}
                overlap={i === 0 ? 0 : filmstripOverlap}
                borderColor={colors.frostBorder}
                brandVolt={colors.brandVolt}
                sheetBg={colors.sheetBg}
              />
            ))}
          </View>
        ) : null}

        {title.trim().length > 0 ? (
          <Text
            style={[styles.cardTitle, { color: colors.textPrimary }]}
            numberOfLines={2}
          >
            {title.trim()}
          </Text>
        ) : null}

        <View style={styles.ledgerRows}>
          {LEDGER_ROW_LABELS.map((label, i) => (
            <LedgerRow
              key={label}
              label={label}
              status={rowStatuses[i] ?? 'queued'}
              subline={i === 2 ? displaySubline : undefined}
              cascadeIndex={i}
              reduceMotion={reduceMotion}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.gutter,
    paddingBottom: 48,
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
  },
  scanline: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  kicker: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  card: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  cardInnerGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  filmstripRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  filmstripCell: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  cardTitle: {
    fontFamily: TYPE.groteskSemiBold,
    fontSize: 17,
    lineHeight: 22,
    marginBottom: 16,
  },
  ledgerRows: {
    gap: 12,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ledgerLabelBlock: {
    flex: 1,
    gap: 2,
  },
  ledgerLabel: {
    fontFamily: TYPE.inter,
    fontSize: 14,
  },
  ledgerSubline: {
    fontFamily: TYPE.monoMedium,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  ledgerStatus: {
    fontFamily: TYPE.monoMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  rowIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIndicatorDashed: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
  },
});
