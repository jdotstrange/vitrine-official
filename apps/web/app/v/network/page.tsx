"use client"

import { useEffect, useState } from "react"
import { Users } from "lucide-react"
import { useUser } from "@/lib/contexts/user-context"
import { useFollow } from "@/lib/hooks/use-follow"
import { getClientApi } from "@/lib/api-client"
import {
  EmptyState,
  LensSelector,
  UserCard,
  type LensItem,
  type UserCardData,
} from "@/components/vault"
import type {
  SuggestedCollector,
  FollowListResult,
} from "@vitrine/api"

type LensKey = "suggested" | "mutual" | "followers" | "following"

const LENSES: LensItem<LensKey>[] = [
  { key: "suggested", label: "Suggested" },
  { key: "mutual", label: "Mutual" },
  { key: "followers", label: "Followers" },
  { key: "following", label: "Following" },
]

export default function NetworkPage() {
  const { profile } = useUser()
  const [lens, setLens] = useState<LensKey>("suggested")

  return (
    <div className="min-h-screen">
      <div className="border-b border-frost-border px-8 py-6">
        <h1
          className="text-fg1 uppercase"
          style={{
            fontFamily: "var(--font-grotesk)",
            fontSize: 28,
            letterSpacing: 1.5,
            fontWeight: 700,
          }}
        >
          Network
        </h1>
        <p className="text-fg2 text-sm mt-1">Your collector graph.</p>
      </div>

      <LensSelector items={LENSES} activeKey={lens} onChange={setLens} />

      <div className="max-w-5xl mx-auto px-8 py-6">
        {profile?.id && lens === "suggested" && <SuggestedList userId={profile.id} />}
        {profile?.id && lens === "mutual" && <MutualList userId={profile.id} />}
        {profile?.id && lens === "followers" && <FollowList userId={profile.id} kind="followers" />}
        {profile?.id && lens === "following" && <FollowList userId={profile.id} kind="following" />}
      </div>
    </div>
  )
}

// ─── Suggested ──────────────────────────────────────────────

function SuggestedList({ userId }: { userId: string }) {
  const [list, setList] = useState<SuggestedCollector[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getClientApi()
      .network.getSuggestedCollectors(userId, { limit: 30 })
      .then(setList)
      .catch((err) => console.warn("[Network] suggested failed", err))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <SkeletonGrid />

  if (list.length === 0) {
    return (
      <EmptyState
        icon={<Users size={20} color="var(--fg2)" />}
        title="No suggestions yet"
        subtitle="As you grow your network, we'll surface collectors with shared taste."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {list.map((c) => (
        <FollowableCard
          key={c.id}
          user={{
            id: c.id,
            displayName: c.displayName,
            username: c.username,
            avatar: c.avatar,
            bio: c.reasonMeta?.label ?? null,
          }}
        />
      ))}
    </div>
  )
}

// ─── Mutual ─────────────────────────────────────────────────

function MutualList({ userId }: { userId: string }) {
  const [list, setList] = useState<UserCardData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getClientApi()
      .network.getMutualFollows(userId, userId, 60, 0)
      .then((users) => {
        setList(
          (users ?? []).map((u: any) => ({
            id: u.id,
            displayName: u.displayName ?? null,
            username: u.username ?? null,
            avatar: u.avatar ?? null,
            bio: null,
          })),
        )
      })
      .catch((err) => console.warn("[Network] mutual failed", err))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <SkeletonGrid />
  if (list.length === 0) {
    return (
      <EmptyState
        icon={<Users size={20} color="var(--fg2)" />}
        title="No mutuals yet"
        subtitle="Mutuals are collectors you follow who follow you back."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {list.map((u) => (
        <FollowableCard key={u.id} user={u} />
      ))}
    </div>
  )
}

// ─── Followers / Following ────────────────────────────────

function FollowList({
  userId,
  kind,
}: {
  userId: string
  kind: "followers" | "following"
}) {
  const [result, setResult] = useState<FollowListResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const api = getClientApi()
    const fn =
      kind === "followers"
        ? api.network.getFollowersWithPrivacy
        : api.network.getFollowingWithPrivacy
    fn(userId, { isOwner: true })
      .then(setResult)
      .catch((err) => console.warn(`[Network] ${kind} failed`, err))
      .finally(() => setLoading(false))
  }, [userId, kind])

  if (loading) return <SkeletonGrid />

  if (!result || result.visibility === "private") {
    return (
      <EmptyState
        icon={<Users size={20} color="var(--fg2)" />}
        title="List is private"
        subtitle={`This collector has hidden their ${kind} list.`}
      />
    )
  }

  if (result.users.length === 0) {
    return (
      <EmptyState
        icon={<Users size={20} color="var(--fg2)" />}
        title={`No ${kind} yet`}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {result.users.map((u: any) => (
        <FollowableCard
          key={u.id}
          user={{
            id: u.id,
            displayName: u.displayName ?? null,
            username: u.username ?? null,
            avatar: u.avatar ?? null,
            bio: null,
          }}
        />
      ))}
    </div>
  )
}

// ─── Followable card with hook-driven follow state ────────

function FollowableCard({ user }: { user: UserCardData }) {
  const { isFollowing, toggle, pending } = useFollow(user.id)
  return (
    <UserCard
      user={user}
      variant="card"
      isFollowing={isFollowing}
      onFollowToggle={() => !pending && toggle()}
    />
  )
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-frost-border bg-frost-border/[0.05] h-48 animate-pulse"
        />
      ))}
    </div>
  )
}
