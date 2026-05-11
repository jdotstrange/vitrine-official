/**
 * Activity API — JOURNAL stream + cross-stream merge.
 *
 * The Activity surface shows three kinds of rows:
 *   - INBOX   social signals (someone followed you, etc.)
 *   - SIGNALS system-discovered events (comp alert, view milestone, etc.)
 *   - JOURNAL the user's own actions (you listed X, you created Y)
 *
 * INBOX + SIGNALS arrive via Stream Feeds (see `lib/contexts/feeds-context`).
 * JOURNAL is sourced client-side from the database — it never enters
 * the notification feed (would create echo + duplicate notifications).
 *
 * `mergeActivityStreams` interleaves the two streams chronologically so
 * the UI can render a single sorted list.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '../logger';

const log = logger.create('ActivityAPI');

/**
 * JOURNAL verb taxonomy. Mirrors verbs from notifications.ts but kept
 * separate so the type system enforces "JOURNAL verbs are never sent
 * through the notification feed."
 */
export type JournalVerb =
  | 'you_listed_collectible'
  | 'you_created_showcase'
  | 'you_changed_status'
  | 'you_changed_value';

export interface JournalEntry {
  /** Stable id for FlatList keys + read/seen tracking. */
  id: string;
  verb: JournalVerb;
  /** ISO timestamp; sortable as a string (UTC). */
  time: string;
  /** Object the action was performed on. */
  collectibleId?: string;
  collectibleTitle?: string;
  collectibleImage?: string;
  showcaseId?: string;
  showcaseTitle?: string;
  /** For status/value verbs. */
  prevValue?: unknown;
  newValue?: unknown;
}

export interface GetJournalOptions {
  /** Cap per-source pull. Default 25; the merged result is sliced separately. */
  limit?: number;
  /** Chronology cutoff — only return entries newer than this. */
  since?: Date;
}

/**
 * Pull journal entries for a single user from three source tables:
 *   - collectibles                (you_listed_collectible)
 *   - showcases                   (you_created_showcase)
 *   - collectible_change_log      (you_changed_status, you_changed_value)
 *
 * The three queries run in parallel; results are merged sorted-desc by
 * time. Each source is capped at `limit` so a noisy table doesn't
 * crowd out the others before the merge.
 */
export async function getJournalEntries(
  userId: string,
  opts: GetJournalOptions = {},
): Promise<JournalEntry[]> {
  const limit = opts.limit ?? 25;
  const sinceIso = opts.since ? opts.since.toISOString() : undefined;

  const collectiblesQuery = supabase
    .from('collectibles')
    .select('id, title, photos, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (sinceIso) collectiblesQuery.gte('created_at', sinceIso);

  const showcasesQuery = supabase
    .from('showcases')
    .select('id, title, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (sinceIso) showcasesQuery.gte('created_at', sinceIso);

  const changeLogQuery = supabase
    .from('collectible_change_log')
    .select('id, collectible_id, change_type, prev_value, new_value, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (sinceIso) changeLogQuery.gte('created_at', sinceIso);

  const [collectiblesRes, showcasesRes, changeLogRes] = await Promise.all([
    collectiblesQuery,
    showcasesQuery,
    changeLogQuery,
  ]);

  if (collectiblesRes.error) log.warn('collectibles journal failed:', collectiblesRes.error.message);
  if (showcasesRes.error) log.warn('showcases journal failed:', showcasesRes.error.message);
  if (changeLogRes.error) log.warn('change_log journal failed:', changeLogRes.error.message);

  const entries: JournalEntry[] = [];

  for (const row of collectiblesRes.data ?? []) {
    entries.push({
      id: `journal:listed:${row.id}`,
      verb: 'you_listed_collectible',
      time: row.created_at,
      collectibleId: row.id,
      collectibleTitle: row.title ?? undefined,
      collectibleImage: row.photos?.[0] ?? undefined,
    });
  }

  for (const row of showcasesRes.data ?? []) {
    entries.push({
      id: `journal:showcase:${row.id}`,
      verb: 'you_created_showcase',
      time: row.created_at,
      showcaseId: row.id,
      showcaseTitle: row.title ?? undefined,
    });
  }

  // Hydrate change-log rows with the collectible's current title + image
  // so the row can render without a per-row fetch.
  const changeLogRows = changeLogRes.data ?? [];
  let collectibleMeta = new Map<string, { title: string | null; image: string | null }>();
  if (changeLogRows.length > 0) {
    const ids = Array.from(new Set(changeLogRows.map((r) => r.collectible_id))) as string[];
    const { data: colRows } = await supabase
      .from('collectibles')
      .select('id, title, photos')
      .in('id', ids);
    collectibleMeta = new Map(
      (colRows ?? []).map((r: any) => [
        r.id,
        { title: r.title ?? null, image: r.photos?.[0] ?? null },
      ]),
    );
  }

  for (const row of changeLogRows) {
    const meta = collectibleMeta.get(row.collectible_id);
    entries.push({
      id: `journal:change:${row.id}`,
      verb: row.change_type === 'value' ? 'you_changed_value' : 'you_changed_status',
      time: row.created_at,
      collectibleId: row.collectible_id,
      collectibleTitle: meta?.title ?? undefined,
      collectibleImage: meta?.image ?? undefined,
      prevValue: row.prev_value,
      newValue: row.new_value,
    });
  }

  entries.sort((a, b) => (a.time < b.time ? 1 : a.time > b.time ? -1 : 0));
  return entries;
}

/**
 * Discriminated union for the merged feed. The Activity lens UI keys
 * its row renderer off `kind` so we can safely render two structurally
 * different shapes from a single sorted list.
 */
export type MergedActivityItem =
  | { kind: 'notification'; time: string; group: any }
  | { kind: 'journal'; time: string; entry: JournalEntry };

/**
 * Merge two streams in reverse-chronological order. Stable on equal
 * timestamps (notifications win the tie) so journal rows can't shoulder
 * out user-facing inbox rows when both occur at the same instant.
 */
export function mergeActivityStreams(
  notifications: Array<{ id: string; updated_at: string; created_at: string } & Record<string, any>>,
  journal: JournalEntry[],
): MergedActivityItem[] {
  const merged: MergedActivityItem[] = [];
  for (const group of notifications) {
    merged.push({
      kind: 'notification',
      time: group.updated_at || group.created_at,
      group,
    });
  }
  for (const entry of journal) {
    merged.push({ kind: 'journal', time: entry.time, entry });
  }
  merged.sort((a, b) => {
    if (a.time < b.time) return 1;
    if (a.time > b.time) return -1;
    if (a.kind === 'notification' && b.kind === 'journal') return -1;
    if (a.kind === 'journal' && b.kind === 'notification') return 1;
    return 0;
  });
  return merged;
}
