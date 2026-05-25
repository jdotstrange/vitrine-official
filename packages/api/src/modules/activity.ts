/**
 * Activity API — JOURNAL stream + cross-stream merge.
 *
 * The Activity surface shows three kinds of rows:
 *   - INBOX   social signals (someone followed you, etc.)        — Stream Feeds
 *   - SIGNALS system-discovered events (comp alert, milestone)   — Stream Feeds
 *   - JOURNAL the user's own actions (you listed X, created Y)   — DB-sourced
 *
 * INBOX + SIGNALS arrive via Stream Feeds (see native lib/contexts/feeds-context).
 * JOURNAL is sourced client-side from the database — it never enters
 * the notification feed (would create echo + duplicate notifications).
 *
 * `mergeActivityStreams` interleaves the two streams chronologically so
 * the UI can render a single sorted list.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { JournalEntry, GetJournalOptions } from '@vitrine/types';
import type { Logger } from '../logger';

// Re-export types so consumers can do `import { type JournalEntry } from '@vitrine/api'`.
export type { JournalVerb, JournalEntry, GetJournalOptions } from '@vitrine/types';

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
 *
 * Pure helper — exported standalone so call sites don't need to instantiate
 * the activity API just to merge.
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

export function createActivityApi(supabase: SupabaseClient, logger: Logger) {
  const log = logger.create('ActivityAPI');

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
  async function getJournalEntries(
    userId: string,
    opts: GetJournalOptions = {},
  ): Promise<JournalEntry[]> {
    const limit = opts.limit ?? 25;
    const sinceIso = opts.since ? opts.since.toISOString() : undefined;

    const collectiblesQuery = supabase
      .from('collectibles')
      .select('id, title, photos, created_at')
      .eq('user_id', userId)
      .not('published_at', 'is', null)
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

  return {
    getJournalEntries,
    mergeActivityStreams,
  };
}

export type ActivityApi = ReturnType<typeof createActivityApi>;
