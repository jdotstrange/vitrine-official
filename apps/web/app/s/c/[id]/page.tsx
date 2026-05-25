import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { ShareLanding, ShareNotFound } from "@/components/share/share-landing"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getCollectible(id: string) {
  const { data, error } = await supabase
    .from("collectibles")
    .select(
      "id, title, description, photos, category, value, user_id, users!collectibles_user_id_fkey(display_name, username)"
    )
    .eq("id", id)
    .eq("visibility", "public")
    .not("published_at", "is", null)
    .single()

  if (error || !data) return null
  return data as any
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const item = await getCollectible(id)

  if (!item) {
    return { title: "Collectible Not Found" }
  }

  const owner = item.users ?? {}
  const ownerName = owner.display_name || owner.username || "a collector"
  const image = item.photos?.[0] ?? null
  const value = item.value ? `$${parseFloat(String(item.value)).toLocaleString()}` : null
  const desc = item.description
    || `${item.title}${value ? ` · ${value}` : ""} — by ${ownerName} on Vitrine`

  return {
    title: item.title,
    description: desc,
    openGraph: {
      title: item.title,
      description: desc,
      type: "website",
      siteName: "Vitrine",
      ...(image && {
        images: [{ url: image, width: 800, height: 800, alt: item.title }],
      }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: item.title,
      description: desc,
      ...(image && { images: [image] }),
    },
  }
}

export default async function CollectibleSharePage({ params }: PageProps) {
  const { id } = await params
  const item = await getCollectible(id)

  if (!item) {
    return <ShareNotFound type="collectible" />
  }

  const owner = item.users ?? {}
  const ownerName = owner.display_name || owner.username || "Collector"
  const image = item.photos?.[0] ?? null
  const value = item.value ? parseFloat(String(item.value)) : null
  const category = item.category
    ? item.category.charAt(0).toUpperCase() + item.category.slice(1)
    : null

  const stats: { label: string; value: string }[] = []
  if (value && value > 0) stats.push({ label: "Value", value: `$${value.toLocaleString()}` })
  if (category) stats.push({ label: "Category", value: category })

  return (
    <ShareLanding
      type="collectible"
      title={item.title}
      subtitle={`by ${ownerName}`}
      description={item.description}
      imageUrl={image}
      stats={stats}
    />
  )
}
