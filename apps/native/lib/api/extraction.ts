/**
 * Extraction API — wrappers for the async extraction pipeline.
 *
 * enqueueExtraction: calls the enqueue-extraction Edge Function proxy
 * subscribeToCollectibleRow: Realtime subscription for Theater state transitions
 * pollJobStatus: polling fallback for when Realtime drops a message
 *
 * NOTE: We call Edge Functions via direct fetch() rather than
 * supabase.functions.invoke() because the latter throws
 * "Cannot read property 'prototype' of undefined" in React Native
 * (it depends on a Node Stream class not present in Hermes).
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const log = logger.create('Extraction');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export interface EnqueueResult {
  jobId: string;
  position: number;
  etaSeconds: number;
}

export type ExtractionStatus =
  | 'queued'
  | 'processing'
  | 'extracted'
  | 'complete'
  | 'failed';

export interface ExtractionStatusUpdate {
  extractionStatus: ExtractionStatus;
  row: Record<string, unknown>;
}

/**
 * Enqueue an extraction via the app's proxy Edge Function.
 * The proxy adds the engine secret server-side so it never touches the device.
 */
export async function enqueueExtraction(params: {
  imageUrls: string[];
  title: string;
  hint?: string;
}): Promise<EnqueueResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const url = `${SUPABASE_URL}/functions/v1/enqueue-extraction`;

  log.info('enqueueExtraction sending:', {
    title: params.title,
    imageUrlCount: params.imageUrls.length,
    imageUrls: params.imageUrls,
  });

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        imageUrls: params.imageUrls,
        title: params.title,
        hint: params.hint,
      }),
    });
  } catch (err) {
    log.error('enqueue-extraction network error:', err);
    throw new Error('Network error contacting extraction service');
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = await res.json();
  } catch {
    // Body wasn't JSON; let the status check below handle it
  }

  if (!res.ok) {
    // Stringify so React Native doesn't truncate nested objects to [Array]
    log.error(
      'enqueue-extraction non-ok response:',
      res.status,
      JSON.stringify(payload, null, 2),
    );
    const message =
      (payload.error as string) ||
      (payload.message as string) ||
      `Extraction service returned ${res.status}`;
    throw new Error(message);
  }

  const jobId = payload.job_id as string | undefined;
  if (!jobId) {
    log.error('enqueue-extraction missing job_id:', payload);
    throw new Error('Unexpected response from extraction service');
  }

  return {
    jobId,
    position: (payload.position as number) ?? 1,
    etaSeconds: (payload.eta_seconds as number) ?? 30,
  };
}

/**
 * Subscribe to Realtime changes on a collectible row. Returns an unsubscribe
 * function. The callback fires on every UPDATE with the new extraction_status.
 */
export function subscribeToCollectibleRow(
  collectibleId: string,
  callback: (update: ExtractionStatusUpdate) => void,
): () => void {
  const channel = supabase
    .channel(`extraction:${collectibleId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'collectibles',
        filter: `id=eq.${collectibleId}`,
      },
      (payload) => {
        const newRow = payload.new as Record<string, unknown>;
        const status = newRow.extraction_status as ExtractionStatus | null;
        if (status) {
          callback({ extractionStatus: status, row: newRow });
        }
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Poll for status by re-reading the row from our own DB (faster and more
 * secure than calling the engine directly — webhook updates are written
 * here anyway).
 */
export async function pollJobStatus(jobId: string): Promise<{
  status: ExtractionStatus | 'unknown';
  row?: Record<string, unknown>;
}> {
  const { data: row, error } = await supabase
    .from('collectibles')
    .select('*')
    .eq('extraction_job_id', jobId)
    .maybeSingle();

  if (error || !row) {
    return { status: 'unknown' };
  }

  return {
    status: (row.extraction_status as ExtractionStatus) ?? 'unknown',
    row,
  };
}

const TERMINAL_STATUSES: ExtractionStatus[] = ['extracted', 'failed', 'complete'];

/**
 * Race Realtime subscription against 2-second polling. Whichever detects a
 * terminal status first wins. Returns a cancel handle for cleanup on unmount.
 */
export function raceForCompletion(
  collectibleId: string,
  jobId: string,
  onStatusChange: (update: ExtractionStatusUpdate) => void,
): { cancel: () => void } {
  let resolved = false;

  function cleanup() {
    resolved = true;
    unsubscribe();
    clearInterval(pollTimer);
  }

  const unsubscribe = subscribeToCollectibleRow(collectibleId, (update) => {
    if (resolved) return;
    onStatusChange(update);
    if (TERMINAL_STATUSES.includes(update.extractionStatus)) {
      cleanup();
    }
  });

  const pollTimer = setInterval(async () => {
    if (resolved) return;
    try {
      const result = await pollJobStatus(jobId);
      if (result.status !== 'unknown' && result.row) {
        onStatusChange({
          extractionStatus: result.status as ExtractionStatus,
          row: result.row,
        });
        if (TERMINAL_STATUSES.includes(result.status as ExtractionStatus)) {
          cleanup();
        }
      }
    } catch (err) {
      log.warn('Poll cycle failed:', err);
    }
  }, 2000);

  return { cancel: cleanup };
}
