/**
 * ActivityRow — single row in the activity feed.
 *
 * Mirrors apps/native/components/activity/* row primitives.
 *
 * Layout:
 *   - Glyph (16px) on left in a tinted container
 *   - Lead/mid/tail copy with bold lead/tail and muted mid
 *   - Right thumbnail (28px) optional
 *   - Mono timestamp on right (compact relative format)
 */

"use client"

import Link from "next/link"
import { getVerbConfig, type VerbContext } from "@/lib/design"

export interface ActivityRowData {
  id: string
  verb: string
  time: string
  context: VerbContext
  unread?: boolean
}

interface ActivityRowProps {
  activity: ActivityRowData
  onClick?: () => void
}

export function ActivityRow({ activity, onClick }: ActivityRowProps) {
  const config = getVerbConfig(activity.verb)
  const copy = config.copy(activity.context)
  const Glyph = config.glyph
  const route = config.route(activity.context)
  const thumb =
    config.hasRightThumb &&
    (activity.context.collectibleImage ||
      activity.context.showcaseImage ||
      activity.context.compImage ||
      activity.context.actorAvatar)

  const content = (
    <div
      className={`flex items-start gap-3 py-3 px-4 transition-colors hover:bg-frost-border/[0.05] ${
        activity.unread ? "bg-brand-volt/[0.04]" : ""
      }`}
    >
      {/* Glyph */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{
          backgroundColor: `${config.tint}15`,
        }}
      >
        <Glyph size={14} color={config.tint} />
      </div>

      {/* Copy */}
      <div className="flex-1 min-w-0">
        <p className="text-fg1 text-[13px] leading-snug">
          {copy.lead && <span className="font-semibold">{copy.lead}</span>}
          {copy.mid && <span className="text-fg2">{copy.mid}</span>}
          {copy.tail && <span className="font-semibold">{copy.tail}</span>}
        </p>
        <p className="text-fg3 text-[10px] font-mono mt-0.5">
          {formatTimeAgo(activity.time)}
        </p>
      </div>

      {/* Thumbnail */}
      {thumb && (
        <div className="w-10 h-10 rounded-md overflow-hidden bg-void shrink-0">
          <img src={thumb} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Unread indicator */}
      {activity.unread && (
        <span
          className="w-2 h-2 rounded-full shrink-0 mt-1.5"
          style={{ backgroundColor: "var(--brand-volt)" }}
        />
      )}
    </div>
  )

  if (route) {
    return (
      <Link href={route} onClick={onClick} className="block">
        {content}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full text-left"
      >
        {content}
      </button>
    )
  }

  return content
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "now"
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  const wks = Math.floor(days / 7)
  if (wks < 4) return `${wks}w`
  const months = Math.floor(days / 30)
  return `${months}mo`
}
