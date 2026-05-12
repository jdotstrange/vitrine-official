/**
 * Activity surface — JOURNAL stream types.
 *
 * The Activity surface shows three kinds of rows:
 *   - INBOX   social signals (someone followed you, etc.)        — Stream Feeds
 *   - SIGNALS system-discovered events (comp alert, milestone)   — Stream Feeds
 *   - JOURNAL the user's own actions (you listed X, created Y)   — DB-sourced
 *
 * JOURNAL verbs are kept in a separate union from notification verbs so the
 * type system enforces "JOURNAL verbs never enter the notification feed"
 * (would create echo + duplicate notifications).
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
