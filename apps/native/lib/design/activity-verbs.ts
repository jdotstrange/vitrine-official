/**
 * Activity verb configuration — single source of truth for the Activity
 * surface.
 *
 * Adding a new verb:
 *   1. Append to the appropriate `NotificationType` / `JournalVerb`
 *      union in lib/api/notifications.ts or lib/api/activity.ts.
 *   2. Append a `VERB_CONFIG[<verb>] = {...}` entry below.
 *   3. (Optional) Append a `PREFERENCE_CATALOG` entry in
 *      lib/api/notifications.ts to expose a settings toggle.
 *
 * The Activity lens never special-cases verbs — it always looks them
 * up here. New verbs render correctly with zero lens-body code edits.
 *
 * Three concerns live in one config object so adding a verb is one
 * declarative change instead of three forks across icon mapping,
 * router mapping, and copy mapping:
 *
 *   - `category` — INBOX / SIGNALS / JOURNAL → which chip filter the
 *     row appears under, and which row primitive renders it.
 *   - `glyph` + `tint` — the visual identity of the verb.
 *   - `copy` — the row's body text. Returns a structured tuple so the
 *     row primitive can render bold actor names / italic muted prefixes
 *     etc. without each verb's copy hard-coding its own JSX.
 *   - `route` — where tap navigates. Falls back to the actor profile
 *     if the verb's primary object can't be resolved.
 *   - `accessibilityLabel` — flat string for screen readers.
 */

import type { ComponentType } from 'react';
import {
  Bell,
  MessageSquare,
  PencilLine,
  Radar,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserPlus,
} from 'lucide-react-native';
import type { Href } from 'expo-router';

import { COLORS } from '@vitrine/design-tokens';
import { CollectibleIcon, ShowcaseIcon } from '@/components/vault/icons';

import type { NotificationType, PreferenceSection } from '@/lib/api/notifications';
import type { JournalVerb } from '@/lib/api/activity';

/**
 * Every verb the Activity surface knows how to render — both
 * notification-feed verbs and journal verbs.
 */
export type ActivityVerb = NotificationType | JournalVerb;

/**
 * Minimal, normalized payload the lens hands to each config function.
 * Callers normalize raw FeedActivity / JournalEntry shapes into this
 * shared type so verb configs don't need to know about either source.
 */
export interface VerbContext {
  actorId?: string;
  actorName?: string;
  actorUsername?: string;
  actorAvatar?: string;
  collectibleId?: string;
  collectibleTitle?: string;
  collectibleImage?: string;
  showcaseId?: string;
  showcaseTitle?: string;
  showcaseImage?: string;
  channelId?: string;
  newStatus?: string;
  prevValue?: unknown;
  newValue?: unknown;
  changedFields?: string[];
  compId?: string;
  compTitle?: string;
  compImage?: string;
  compMatchPercent?: number;
  viewCount?: number;
  viewWindow?: string;
  viewMilestone?: number;
  /** When >1 the row should pluralize ("3 collectors"). */
  actorCount?: number;
  /** Object the action targets — collectible | showcase | profile. */
  objectType?: 'collectible' | 'showcase' | 'profile';
  /** Activity owner — fallback profile target for some verbs. */
  ownerId?: string;
}

/**
 * Body copy shape — three optional segments so the row primitive can
 * style each one differently. Concatenation order is [lead, mid, tail].
 *
 * Example for `someone_tracked_your_item`:
 *   { lead: 'Mariah', mid: ' tracked ', tail: '1962 Topps Mantle' }
 *
 * The row paints `lead` and `tail` bold, `mid` muted — totally
 * declarative, no per-verb JSX.
 */
export interface VerbBodyCopy {
  lead?: string;
  mid?: string;
  tail?: string;
}

/**
 * Category used by the Tracking ACTIVITY lens chip filter.
 * Maps a verb to one of the three tracking-specific chips.
 * Verbs without this field are not shown in the Tracking lens.
 */
export type TrackingChipCategory = 'STATUS' | 'VALUE' | 'COMPS';

export interface VerbConfig {
  category: PreferenceSection; // 'INBOX' | 'SIGNALS' | 'JOURNAL'
  glyph: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  tint: string;
  copy: (ctx: VerbContext) => VerbBodyCopy;
  /** Default push behavior (used to seed the settings toggle). */
  pushDefault: boolean;
  /** Returns the screen tap should open. `null` = no navigation. */
  route: (ctx: VerbContext) => Href | null;
  accessibilityLabel: (ctx: VerbContext) => string;
  /**
   * Whether the row should preview a right-side thumbnail of the
   * triggering object (collectible photo, showcase cover, etc).
   */
  hasRightThumb?: boolean;
  /**
   * Which chip this verb appears under in the Tracking hub's ACTIVITY lens.
   * Omitting this field excludes the verb from the tracking activity surface
   * (e.g. `new_follower`, `you_created_showcase` are not tracking-relevant).
   */
  trackingCategory?: TrackingChipCategory;
}

// ───────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────

const actorLabel = (ctx: VerbContext): string => {
  if ((ctx.actorCount ?? 1) > 1) {
    const others = (ctx.actorCount ?? 1) - 1;
    return `${ctx.actorName || 'Someone'} and ${others} other${others === 1 ? '' : 's'}`;
  }
  return ctx.actorName || 'Someone';
};

const collectibleHref = (id?: string): Href | null =>
  id ? (`/collectible/${id}` as Href) : null;

const showcaseHref = (id?: string): Href | null =>
  id ? (`/showcase/${id}` as Href) : null;

const profileHref = (id?: string): Href | null =>
  id ? (`/profile/${id}` as Href) : null;

const channelHref = (id?: string): Href | null =>
  id ? (`/messages/${encodeURIComponent(id)}` as Href) : null;

// ───────────────────────────────────────────────────────────────────────
// Config map
// ───────────────────────────────────────────────────────────────────────

export const VERB_CONFIG: Record<ActivityVerb, VerbConfig> = {
  // ════════════════════════════════════════════════════════════════════
  // INBOX — social signals from one user to another
  // ════════════════════════════════════════════════════════════════════

  new_follower: {
    category: 'INBOX',
    glyph: UserPlus,
    tint: COLORS.brandVolt,
    pushDefault: true,
    copy: (ctx) => ({ lead: actorLabel(ctx), mid: ' followed you' }),
    route: (ctx) => profileHref(ctx.actorId),
    accessibilityLabel: (ctx) => `${actorLabel(ctx)} followed you`,
  },

  someone_tracked_your_item: {
    category: 'INBOX',
    glyph: Target,
    tint: COLORS.semanticBlue,
    pushDefault: true,
    hasRightThumb: true,
    copy: (ctx) => ({
      lead: actorLabel(ctx),
      mid: ' tracked ',
      tail: ctx.collectibleTitle || 'your collectible',
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `${actorLabel(ctx)} tracked ${ctx.collectibleTitle || 'your collectible'}`,
  },

  status_change: {
    category: 'INBOX',
    glyph: Sparkles,
    tint: COLORS.semanticOrange,
    pushDefault: true,
    hasRightThumb: true,
    trackingCategory: 'STATUS',
    copy: (ctx) => ({
      lead: ctx.collectibleTitle || 'A tracked item',
      mid: ' is now ',
      tail: (ctx.newStatus || '').toUpperCase(),
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `${ctx.collectibleTitle || 'A tracked item'} status changed to ${ctx.newStatus || 'updated'}`,
  },

  value_change: {
    category: 'INBOX',
    glyph: TrendingUp,
    tint: COLORS.brandVolt,
    pushDefault: true,
    hasRightThumb: true,
    trackingCategory: 'VALUE',
    copy: (ctx) => ({
      lead: ctx.collectibleTitle || 'A tracked item',
      mid: ' value updated',
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `${ctx.collectibleTitle || 'A tracked item'} value changed`,
  },

  metadata_change: {
    category: 'INBOX',
    glyph: PencilLine,
    tint: COLORS.textSecondary,
    pushDefault: false,
    hasRightThumb: true,
    copy: (ctx) => ({
      lead: ctx.collectibleTitle || 'A tracked item',
      mid: ' was edited',
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `${ctx.collectibleTitle || 'A tracked item'} metadata changed`,
  },

  new_item_from_followed: {
    category: 'INBOX',
    glyph: CollectibleIcon,
    tint: COLORS.semanticGreen,
    pushDefault: true,
    hasRightThumb: true,
    copy: (ctx) => ({
      lead: actorLabel(ctx),
      mid: ' added ',
      tail: ctx.collectibleTitle || 'a new collectible',
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `${actorLabel(ctx)} added ${ctx.collectibleTitle || 'a new collectible'}`,
  },

  new_showcase_from_followed: {
    category: 'INBOX',
    glyph: ShowcaseIcon,
    tint: COLORS.semanticGreen,
    pushDefault: true,
    hasRightThumb: true,
    copy: (ctx) => ({
      lead: actorLabel(ctx),
      mid: ' published ',
      tail: ctx.showcaseTitle || 'a new showcase',
    }),
    route: (ctx) => showcaseHref(ctx.showcaseId),
    accessibilityLabel: (ctx) =>
      `${actorLabel(ctx)} published ${ctx.showcaseTitle || 'a new showcase'}`,
  },

  share_initiated: {
    category: 'INBOX',
    glyph: Share2,
    tint: COLORS.brandVolt,
    pushDefault: true,
    hasRightThumb: true,
    copy: (ctx) => {
      const tail =
        ctx.objectType === 'showcase'
          ? ctx.showcaseTitle || 'your showcase'
          : ctx.objectType === 'profile'
          ? 'your profile'
          : ctx.collectibleTitle || 'your collectible';
      return { lead: actorLabel(ctx), mid: ' shared ', tail };
    },
    route: (ctx) => {
      if (ctx.objectType === 'showcase') return showcaseHref(ctx.showcaseId);
      if (ctx.objectType === 'profile') return profileHref(ctx.actorId);
      return collectibleHref(ctx.collectibleId);
    },
    accessibilityLabel: (ctx) => `${actorLabel(ctx)} shared your ${ctx.objectType || 'item'}`,
  },

  vitrine_attached_to_chat: {
    category: 'INBOX',
    glyph: MessageSquare,
    tint: COLORS.semanticBlue,
    pushDefault: false,
    hasRightThumb: true,
    copy: (ctx) => {
      const tail =
        ctx.objectType === 'showcase'
          ? ctx.showcaseTitle || 'your showcase'
          : ctx.collectibleTitle || 'your collectible';
      return { lead: actorLabel(ctx), mid: ' shared ', tail: `${tail} in chat` };
    },
    route: (ctx) =>
      channelHref(ctx.channelId) ||
      (ctx.objectType === 'showcase'
        ? showcaseHref(ctx.showcaseId)
        : collectibleHref(ctx.collectibleId)),
    accessibilityLabel: (ctx) =>
      `${actorLabel(ctx)} shared your ${ctx.objectType || 'item'} in a chat`,
  },

  // Legacy alias — old clients may still surface this verb. Treat it
  // identically to status_change so existing rows render cleanly.
  tracking_alert: {
    category: 'INBOX',
    glyph: Sparkles,
    tint: COLORS.semanticOrange,
    pushDefault: false,
    hasRightThumb: true,
    trackingCategory: 'STATUS',
    copy: (ctx) => ({
      lead: ctx.collectibleTitle || 'A tracked item',
      mid: ' has an update',
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `${ctx.collectibleTitle || 'A tracked item'} has an update`,
  },

  // ════════════════════════════════════════════════════════════════════
  // SIGNALS — system-discovered events
  // ════════════════════════════════════════════════════════════════════

  comp_alert: {
    category: 'SIGNALS',
    glyph: Radar,
    tint: COLORS.brandVolt,
    pushDefault: true,
    hasRightThumb: true,
    trackingCategory: 'COMPS',
    copy: (ctx) => ({
      lead: 'Strong match',
      mid: ' for ',
      tail: ctx.collectibleTitle || 'a tracked collectible',
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `Strong comparable match found for ${ctx.collectibleTitle || 'a tracked collectible'}`,
  },

  view_milestone: {
    category: 'SIGNALS',
    glyph: Trophy,
    tint: COLORS.semanticOrange,
    pushDefault: false,
    hasRightThumb: true,
    copy: (ctx) => {
      const milestone = ctx.viewMilestone
        ? ctx.viewMilestone >= 1000
          ? `${(ctx.viewMilestone / 1000).toFixed(0)}K`
          : String(ctx.viewMilestone)
        : '';
      const what =
        ctx.objectType === 'showcase'
          ? ctx.showcaseTitle || 'a showcase'
          : ctx.objectType === 'profile'
          ? 'your profile'
          : ctx.collectibleTitle || 'a collectible';
      return { lead: `${milestone} views`, mid: ' on ', tail: what };
    },
    route: (ctx) => {
      if (ctx.objectType === 'showcase') return showcaseHref(ctx.showcaseId);
      if (ctx.objectType === 'profile') return profileHref(ctx.ownerId);
      return collectibleHref(ctx.collectibleId);
    },
    accessibilityLabel: (ctx) =>
      `View milestone of ${ctx.viewMilestone ?? '?'} reached on your ${ctx.objectType || 'item'}`,
  },

  weekly_view_digest: {
    category: 'SIGNALS',
    glyph: TrendingUp,
    tint: COLORS.semanticBlue,
    pushDefault: true,
    copy: (ctx) => ({
      lead: `${ctx.viewCount ?? 0} views`,
      mid: ' this week across your stuff',
    }),
    route: (ctx) => profileHref(ctx.ownerId),
    accessibilityLabel: (ctx) =>
      `${ctx.viewCount ?? 0} views this week across your collection, showcases, and profile`,
  },

  // ════════════════════════════════════════════════════════════════════
  // JOURNAL — your own actions (read-only)
  // ════════════════════════════════════════════════════════════════════

  you_listed_collectible: {
    category: 'JOURNAL',
    glyph: CollectibleIcon,
    tint: COLORS.textTertiary,
    pushDefault: false,
    hasRightThumb: true,
    copy: (ctx) => ({
      lead: 'You added',
      mid: ' ',
      tail: ctx.collectibleTitle || 'a collectible',
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `You added ${ctx.collectibleTitle || 'a collectible'} to your collection`,
  },

  you_created_showcase: {
    category: 'JOURNAL',
    glyph: ShowcaseIcon,
    tint: COLORS.textTertiary,
    pushDefault: false,
    copy: (ctx) => ({
      lead: 'You created',
      mid: ' ',
      tail: ctx.showcaseTitle || 'a showcase',
    }),
    route: (ctx) => showcaseHref(ctx.showcaseId),
    accessibilityLabel: (ctx) =>
      `You created ${ctx.showcaseTitle || 'a showcase'}`,
  },

  you_changed_status: {
    category: 'JOURNAL',
    glyph: Sparkles,
    tint: COLORS.textTertiary,
    pushDefault: false,
    hasRightThumb: true,
    copy: (ctx) => ({
      lead: 'You changed status',
      mid: ' on ',
      tail: ctx.collectibleTitle || 'a collectible',
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `You changed the status of ${ctx.collectibleTitle || 'a collectible'}`,
  },

  you_changed_value: {
    category: 'JOURNAL',
    glyph: TrendingUp,
    tint: COLORS.textTertiary,
    pushDefault: false,
    hasRightThumb: true,
    copy: (ctx) => ({
      lead: 'You updated value',
      mid: ' on ',
      tail: ctx.collectibleTitle || 'a collectible',
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `You updated the value of ${ctx.collectibleTitle || 'a collectible'}`,
  },
};

/**
 * Look up a verb config with a safe Bell-icon fallback. Unknown verbs
 * (older client, future server-side verb additions) render with a
 * generic glyph and a "New activity" copy line so the row never blanks
 * out.
 */
export function getVerbConfig(verb: string | undefined | null): VerbConfig {
  const v = (verb || '') as ActivityVerb;
  const config = VERB_CONFIG[v];
  if (config) return config;
  return {
    category: 'INBOX',
    glyph: Bell,
    tint: COLORS.textSecondary,
    pushDefault: false,
    copy: () => ({ lead: 'New activity' }),
    route: () => null,
    accessibilityLabel: () => 'New activity',
  };
}

/**
 * Categorize a raw verb string. Used by the chip filter to bucket
 * rows; falls back to INBOX when unknown.
 */
export function getVerbCategory(verb: string | undefined | null): PreferenceSection {
  return getVerbConfig(verb).category;
}

/**
 * Return the Tracking ACTIVITY lens chip category for a verb, or `null`
 * if the verb is not tracking-relevant (e.g. new_follower, you_created_showcase).
 *
 * Used by TrackingActivityLens to pre-filter the notification stream before
 * applying the chip filter, so non-tracking verbs never appear in the lens.
 */
export function getTrackingCategory(verb: string | undefined | null): TrackingChipCategory | null {
  const config = VERB_CONFIG[(verb || '') as ActivityVerb];
  return config?.trackingCategory ?? null;
}
