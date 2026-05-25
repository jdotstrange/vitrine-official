/**
 * UserCard — collector profile preview row/card.
 *
 * Mirrors apps/native network-lens cards. Avatar + name + handle + stats +
 * follow button.
 */

"use client"

import Link from "next/link"

export interface UserCardData {
  id: string
  displayName: string | null
  username: string | null
  avatar?: string | null
  bio?: string | null
  followersCount?: number
  collectiblesCount?: number
}

interface UserCardProps {
  user: UserCardData
  isFollowing?: boolean
  onFollowToggle?: () => void
  href?: string
  variant?: "row" | "card"
  showFollowButton?: boolean
}

export function UserCard({
  user,
  isFollowing = false,
  onFollowToggle,
  href,
  variant = "row",
  showFollowButton = true,
}: UserCardProps) {
  const linkHref = href ?? `/v/profile/${user.id}`
  const initial = (user.displayName ?? user.username ?? "U").charAt(0).toUpperCase()

  if (variant === "card") {
    return (
      <div className="rounded-xl border border-frost-border bg-sheet-bg p-4 flex flex-col items-center text-center">
        <Link href={linkHref} className="contents">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-frost-border/20 flex items-center justify-center mb-3">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-fg2 font-grotesk text-xl">{initial}</span>
            )}
          </div>
          <h4 className="font-grotesk font-semibold text-fg1 text-sm truncate max-w-full">
            {user.displayName ?? user.username ?? "Collector"}
          </h4>
          {user.username && (
            <p className="text-fg2 text-[11px] mt-0.5 truncate max-w-full">@{user.username}</p>
          )}
        </Link>
        {user.bio && (
          <p className="text-fg2 text-[11px] mt-2 line-clamp-2">{user.bio}</p>
        )}
        {showFollowButton && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              onFollowToggle?.()
            }}
            className={`mt-3 w-full rounded-md px-3 py-1.5 text-[11px] font-grotesk font-semibold uppercase tracking-wider transition-colors ${
              isFollowing
                ? "border border-frost-border text-fg2 hover:text-fg1"
                : "bg-brand-volt text-text-inverse hover:opacity-90"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </div>
    )
  }

  // row variant
  return (
    <div className="flex items-center gap-3 py-2">
      <Link href={linkHref} className="contents">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-frost-border/20 flex items-center justify-center shrink-0">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-fg2 font-grotesk text-sm">{initial}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-fg1 text-[13px] font-semibold truncate">
            {user.displayName ?? user.username ?? "Collector"}
          </h4>
          {user.username && (
            <p className="text-fg2 text-[11px] truncate">@{user.username}</p>
          )}
        </div>
      </Link>
      {showFollowButton && (
        <button
          type="button"
          onClick={onFollowToggle}
          className={`shrink-0 rounded-md px-3 py-1 text-[10px] font-grotesk font-semibold uppercase tracking-wider transition-colors ${
            isFollowing
              ? "border border-frost-border text-fg2 hover:text-fg1"
              : "bg-brand-volt text-text-inverse hover:opacity-90"
          }`}
        >
          {isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  )
}
