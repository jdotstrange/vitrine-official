import type { Metadata } from "next"
import { supabase } from "@/lib/supabase"
import { ShareLanding, ShareNotFound } from "@/components/share/share-landing"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getProfile(id: string) {
  const { data, error } = await supabase
    .from("users")
    .select("id, display_name, username, avatar, bio, followers_count, following_count")
    .eq("id", id)
    .single()

  if (error || !data) return null

  const { count: itemCount } = await supabase
    .from("collectibles")
    .select("id", { count: "exact", head: true })
    .eq("user_id", id)
    .eq("visibility", "public")
    .not("published_at", "is", null)

  return { ...(data as any), itemCount: itemCount ?? 0 }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const profile = await getProfile(id)

  if (!profile) {
    return { title: "Collector Not Found" }
  }

  const name = profile.display_name || profile.username || "Collector"
  const handle = profile.username ? `@${profile.username}` : ""
  const title = handle ? `${name} (${handle})` : name
  const desc = profile.bio
    || `${name} on Vitrine — ${profile.itemCount} collectibles`

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      type: "profile",
      siteName: "Vitrine",
      ...(profile.avatar && {
        images: [{ url: profile.avatar, width: 400, height: 400, alt: name }],
      }),
    },
    twitter: {
      card: "summary",
      title,
      description: desc,
      ...(profile.avatar && { images: [profile.avatar] }),
    },
  }
}

export default async function ProfileSharePage({ params }: PageProps) {
  const { id } = await params
  const profile = await getProfile(id)

  if (!profile) {
    return <ShareNotFound type="profile" />
  }

  const name = profile.display_name || profile.username || "Collector"
  const handle = profile.username ? `@${profile.username}` : null

  const stats: { label: string; value: string }[] = [
    { label: "Items", value: String(profile.itemCount) },
  ]
  if (profile.followers_count > 0) {
    stats.push({ label: "Followers", value: String(profile.followers_count) })
  }

  return (
    <ShareLanding
      type="profile"
      title={name}
      subtitle={handle ?? undefined}
      description={profile.bio}
      imageUrl={profile.avatar}
      stats={stats}
    />
  )
}
