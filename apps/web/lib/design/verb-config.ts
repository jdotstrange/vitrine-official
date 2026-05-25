/**
 * Activity verb config — web mirror of apps/native/lib/design/activity-verbs.ts.
 *
 * Same shape, same verbs, same copy, same tints. Web swaps:
 *   - lucide-react-native → lucide-react
 *   - expo-router Href → string route paths under /v/...
 *
 * Visual DNA: identical to native (icons, tints, copy).
 */

import type { ComponentType } from "react"
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
  Boxes,
  Layers,
  type LucideIcon,
} from "lucide-react"

import type {
  NotificationType,
  PreferenceSection,
} from "@vitrine/api"
import type { JournalVerb } from "@vitrine/types"

export type ActivityVerb = NotificationType | JournalVerb

export interface VerbContext {
  actorId?: string
  actorName?: string
  actorUsername?: string
  actorAvatar?: string
  collectibleId?: string
  collectibleTitle?: string
  collectibleImage?: string
  showcaseId?: string
  showcaseTitle?: string
  showcaseImage?: string
  channelId?: string
  newStatus?: string
  prevValue?: unknown
  newValue?: unknown
  changedFields?: string[]
  compId?: string
  compTitle?: string
  compImage?: string
  compMatchPercent?: number
  viewCount?: number
  viewWindow?: string
  viewMilestone?: number
  actorCount?: number
  objectType?: "collectible" | "showcase" | "profile"
  ownerId?: string
}

export interface VerbBodyCopy {
  lead?: string
  mid?: string
  tail?: string
}

export type TrackingChipCategory = "STATUS" | "VALUE" | "COMPS"

export interface VerbConfig {
  category: PreferenceSection
  glyph: LucideIcon | ComponentType<{ size?: number; color?: string }>
  tint: string
  copy: (ctx: VerbContext) => VerbBodyCopy
  pushDefault: boolean
  route: (ctx: VerbContext) => string | null
  accessibilityLabel: (ctx: VerbContext) => string
  hasRightThumb?: boolean
  trackingCategory?: TrackingChipCategory
}

const actorLabel = (ctx: VerbContext): string => {
  if ((ctx.actorCount ?? 1) > 1) {
    const others = (ctx.actorCount ?? 1) - 1
    return `${ctx.actorName || "Someone"} and ${others} other${others === 1 ? "" : "s"}`
  }
  return ctx.actorName || "Someone"
}

const collectibleHref = (id?: string) => (id ? `/v/collectible/${id}` : null)
const showcaseHref = (id?: string) => (id ? `/v/showcase/${id}` : null)
const profileHref = (id?: string) => (id ? `/v/profile/${id}` : null)
const channelHref = (id?: string) =>
  id ? `/v/messages/${encodeURIComponent(id)}` : null

// Tints reference CSS vars to stay theme-aware on web.
const T = {
  brandVolt: "var(--brand-volt)",
  semanticBlue: "var(--semantic-blue)",
  semanticGreen: "var(--semantic-green)",
  semanticOrange: "var(--semantic-orange)",
  textSecondary: "var(--fg2)",
  textTertiary: "var(--fg3)",
} as const

export const VERB_CONFIG: Record<ActivityVerb, VerbConfig> = {
  // INBOX
  new_follower: {
    category: "INBOX",
    glyph: UserPlus,
    tint: T.brandVolt,
    pushDefault: true,
    copy: (ctx) => ({ lead: actorLabel(ctx), mid: " followed you" }),
    route: (ctx) => profileHref(ctx.actorId),
    accessibilityLabel: (ctx) => `${actorLabel(ctx)} followed you`,
  },
  someone_tracked_your_item: {
    category: "INBOX",
    glyph: Target,
    tint: T.semanticBlue,
    pushDefault: true,
    hasRightThumb: true,
    copy: (ctx) => ({
      lead: actorLabel(ctx),
      mid: " tracked ",
      tail: ctx.collectibleTitle || "your collectible",
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `${actorLabel(ctx)} tracked ${ctx.collectibleTitle || "your collectible"}`,
  },
  status_change: {
    category: "INBOX",
    glyph: Sparkles,
    tint: T.semanticOrange,
    pushDefault: true,
    hasRightThumb: true,
    trackingCategory: "STATUS",
    copy: (ctx) => ({
      lead: ctx.collectibleTitle || "A tracked item",
      mid: " is now ",
      tail: (ctx.newStatus || "").toUpperCase(),
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `${ctx.collectibleTitle || "A tracked item"} status changed to ${ctx.newStatus || "updated"}`,
  },
  value_change: {
    category: "INBOX",
    glyph: TrendingUp,
    tint: T.brandVolt,
    pushDefault: true,
    hasRightThumb: true,
    trackingCategory: "VALUE",
    copy: (ctx) => ({
      lead: ctx.collectibleTitle || "A tracked item",
      mid: " value updated",
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `${ctx.collectibleTitle || "A tracked item"} value changed`,
  },
  metadata_change: {
    category: "INBOX",
    glyph: PencilLine,
    tint: T.textSecondary,
    pushDefault: false,
    hasRightThumb: true,
    copy: (ctx) => ({
      lead: ctx.collectibleTitle || "A tracked item",
      mid: " was edited",
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `${ctx.collectibleTitle || "A tracked item"} metadata changed`,
  },
  new_item_from_followed: {
    category: "INBOX",
    glyph: Boxes,
    tint: T.semanticGreen,
    pushDefault: true,
    hasRightThumb: true,
    copy: (ctx) => ({
      lead: actorLabel(ctx),
      mid: " added ",
      tail: ctx.collectibleTitle || "a new collectible",
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `${actorLabel(ctx)} added ${ctx.collectibleTitle || "a new collectible"}`,
  },
  new_showcase_from_followed: {
    category: "INBOX",
    glyph: Layers,
    tint: T.semanticGreen,
    pushDefault: true,
    hasRightThumb: true,
    copy: (ctx) => ({
      lead: actorLabel(ctx),
      mid: " published ",
      tail: ctx.showcaseTitle || "a new showcase",
    }),
    route: (ctx) => showcaseHref(ctx.showcaseId),
    accessibilityLabel: (ctx) =>
      `${actorLabel(ctx)} published ${ctx.showcaseTitle || "a new showcase"}`,
  },
  share_initiated: {
    category: "INBOX",
    glyph: Share2,
    tint: T.brandVolt,
    pushDefault: true,
    hasRightThumb: true,
    copy: (ctx) => {
      const tail =
        ctx.objectType === "showcase"
          ? ctx.showcaseTitle || "your showcase"
          : ctx.objectType === "profile"
            ? "your profile"
            : ctx.collectibleTitle || "your collectible"
      return { lead: actorLabel(ctx), mid: " shared ", tail }
    },
    route: (ctx) => {
      if (ctx.objectType === "showcase") return showcaseHref(ctx.showcaseId)
      if (ctx.objectType === "profile") return profileHref(ctx.actorId)
      return collectibleHref(ctx.collectibleId)
    },
    accessibilityLabel: (ctx) =>
      `${actorLabel(ctx)} shared your ${ctx.objectType || "item"}`,
  },
  vitrine_attached_to_chat: {
    category: "INBOX",
    glyph: MessageSquare,
    tint: T.semanticBlue,
    pushDefault: false,
    hasRightThumb: true,
    copy: (ctx) => {
      const tail =
        ctx.objectType === "showcase"
          ? ctx.showcaseTitle || "your showcase"
          : ctx.collectibleTitle || "your collectible"
      return {
        lead: actorLabel(ctx),
        mid: " shared ",
        tail: `${tail} in chat`,
      }
    },
    route: (ctx) =>
      channelHref(ctx.channelId) ||
      (ctx.objectType === "showcase"
        ? showcaseHref(ctx.showcaseId)
        : collectibleHref(ctx.collectibleId)),
    accessibilityLabel: (ctx) =>
      `${actorLabel(ctx)} shared your ${ctx.objectType || "item"} in a chat`,
  },
  tracking_alert: {
    category: "INBOX",
    glyph: Sparkles,
    tint: T.semanticOrange,
    pushDefault: false,
    hasRightThumb: true,
    trackingCategory: "STATUS",
    copy: (ctx) => ({
      lead: ctx.collectibleTitle || "A tracked item",
      mid: " has an update",
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `${ctx.collectibleTitle || "A tracked item"} has an update`,
  },

  // SIGNALS
  comp_alert: {
    category: "SIGNALS",
    glyph: Radar,
    tint: T.brandVolt,
    pushDefault: true,
    hasRightThumb: true,
    trackingCategory: "COMPS",
    copy: (ctx) => ({
      lead: "Strong match",
      mid: " for ",
      tail: ctx.collectibleTitle || "a tracked collectible",
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `Strong comparable match found for ${ctx.collectibleTitle || "a tracked collectible"}`,
  },
  view_milestone: {
    category: "SIGNALS",
    glyph: Trophy,
    tint: T.semanticOrange,
    pushDefault: false,
    hasRightThumb: true,
    copy: (ctx) => {
      const milestone = ctx.viewMilestone
        ? ctx.viewMilestone >= 1000
          ? `${(ctx.viewMilestone / 1000).toFixed(0)}K`
          : String(ctx.viewMilestone)
        : ""
      const what =
        ctx.objectType === "showcase"
          ? ctx.showcaseTitle || "a showcase"
          : ctx.objectType === "profile"
            ? "your profile"
            : ctx.collectibleTitle || "a collectible"
      return { lead: `${milestone} views`, mid: " on ", tail: what }
    },
    route: (ctx) => {
      if (ctx.objectType === "showcase") return showcaseHref(ctx.showcaseId)
      if (ctx.objectType === "profile") return profileHref(ctx.ownerId)
      return collectibleHref(ctx.collectibleId)
    },
    accessibilityLabel: (ctx) =>
      `View milestone of ${ctx.viewMilestone ?? "?"} reached on your ${ctx.objectType || "item"}`,
  },
  weekly_view_digest: {
    category: "SIGNALS",
    glyph: TrendingUp,
    tint: T.semanticBlue,
    pushDefault: true,
    copy: (ctx) => ({
      lead: `${ctx.viewCount ?? 0} views`,
      mid: " this week across your stuff",
    }),
    route: (ctx) => profileHref(ctx.ownerId),
    accessibilityLabel: (ctx) =>
      `${ctx.viewCount ?? 0} views this week across your collection, showcases, and profile`,
  },

  // JOURNAL
  you_listed_collectible: {
    category: "JOURNAL",
    glyph: Boxes,
    tint: T.textTertiary,
    pushDefault: false,
    hasRightThumb: true,
    copy: (ctx) => ({
      lead: "You added",
      mid: " ",
      tail: ctx.collectibleTitle || "a collectible",
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `You added ${ctx.collectibleTitle || "a collectible"} to your collection`,
  },
  you_created_showcase: {
    category: "JOURNAL",
    glyph: Layers,
    tint: T.textTertiary,
    pushDefault: false,
    copy: (ctx) => ({
      lead: "You created",
      mid: " ",
      tail: ctx.showcaseTitle || "a showcase",
    }),
    route: (ctx) => showcaseHref(ctx.showcaseId),
    accessibilityLabel: (ctx) =>
      `You created ${ctx.showcaseTitle || "a showcase"}`,
  },
  you_changed_status: {
    category: "JOURNAL",
    glyph: Sparkles,
    tint: T.textTertiary,
    pushDefault: false,
    hasRightThumb: true,
    copy: (ctx) => ({
      lead: "You changed status",
      mid: " on ",
      tail: ctx.collectibleTitle || "a collectible",
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `You changed the status of ${ctx.collectibleTitle || "a collectible"}`,
  },
  you_changed_value: {
    category: "JOURNAL",
    glyph: TrendingUp,
    tint: T.textTertiary,
    pushDefault: false,
    hasRightThumb: true,
    copy: (ctx) => ({
      lead: "You updated value",
      mid: " on ",
      tail: ctx.collectibleTitle || "a collectible",
    }),
    route: (ctx) => collectibleHref(ctx.collectibleId),
    accessibilityLabel: (ctx) =>
      `You updated the value of ${ctx.collectibleTitle || "a collectible"}`,
  },
}

export function getVerbConfig(verb: string | undefined | null): VerbConfig {
  const v = (verb || "") as ActivityVerb
  const config = VERB_CONFIG[v]
  if (config) return config
  return {
    category: "INBOX",
    glyph: Bell,
    tint: T.textSecondary,
    pushDefault: false,
    copy: () => ({ lead: "New activity" }),
    route: () => null,
    accessibilityLabel: () => "New activity",
  }
}

export function getVerbCategory(
  verb: string | undefined | null,
): PreferenceSection {
  return getVerbConfig(verb).category
}

export function getTrackingCategory(
  verb: string | undefined | null,
): TrackingChipCategory | null {
  const config = VERB_CONFIG[(verb || "") as ActivityVerb]
  return config?.trackingCategory ?? null
}
