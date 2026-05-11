import type { Metadata } from "next"
import { supabase } from "@/lib/supabase"
import { ShareLanding, ShareNotFound } from "@/components/share/share-landing"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getShowcase(id: string) {
  const { data: showcase, error } = await supabase
    .from("showcases")
    .select(
      "id, title, description, visibility, user_id, users!showcases_user_id_fkey(display_name, username)"
    )
    .eq("id", id)
    .single()

  if (error || !showcase) return null
  if ((showcase as any).visibility === "private") return null

  const { data: items } = await supabase
    .from("showcase_collectibles")
    .select("collectibles(photos)")
    .eq("showcase_id", id)
    .order("display_order", { ascending: true })
    .limit(1)

  const previewImage = (items?.[0] as any)?.collectibles?.photos?.[0] ?? null

  const { count } = await supabase
    .from("showcase_collectibles")
    .select("id", { count: "exact", head: true })
    .eq("showcase_id", id)

  return {
    ...(showcase as any),
    previewImage,
    itemCount: count ?? 0,
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const showcase = await getShowcase(id)

  if (!showcase) {
    return { title: "Showcase Not Found" }
  }

  const owner = showcase.users ?? {}
  const ownerName = owner.display_name || owner.username || "a collector"
  const desc = showcase.description
    || `${showcase.title} — ${showcase.itemCount} items curated by ${ownerName} on Vitrine`

  return {
    title: showcase.title,
    description: desc,
    openGraph: {
      title: showcase.title,
      description: desc,
      type: "website",
      siteName: "Vitrine",
      ...(showcase.previewImage && {
        images: [{ url: showcase.previewImage, width: 800, height: 800, alt: showcase.title }],
      }),
    },
    twitter: {
      card: showcase.previewImage ? "summary_large_image" : "summary",
      title: showcase.title,
      description: desc,
      ...(showcase.previewImage && { images: [showcase.previewImage] }),
    },
  }
}

export default async function ShowcaseSharePage({ params }: PageProps) {
  const { id } = await params
  const showcase = await getShowcase(id)

  if (!showcase) {
    return <ShareNotFound type="showcase" />
  }

  const owner = showcase.users ?? {}
  const ownerName = owner.display_name || owner.username || "Collector"

  return (
    <ShareLanding
      type="showcase"
      title={showcase.title}
      subtitle={`by ${ownerName}`}
      description={showcase.description}
      imageUrl={showcase.previewImage}
      stats={[
        { label: "Items", value: String(showcase.itemCount) },
      ]}
    />
  )
}
