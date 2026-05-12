import type { Metadata } from "next"
import { getServerApi } from "@/lib/api"
import { ShareLanding, ShareNotFound } from "@/components/share/share-landing"

interface PageProps {
  params: Promise<{ id: string }>
}

async function getShowcase(id: string) {
  const detail = await getServerApi().showcases.getShowcaseById(id)
  if (!detail) return null
  if (detail.visibility === "private") return null

  return {
    title: detail.title,
    description: detail.description,
    owner: detail.owner,
    previewImage: detail.images[0] ?? null,
    itemCount: detail.stats.totalItems,
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const showcase = await getShowcase(id)

  if (!showcase) {
    return { title: "Showcase Not Found" }
  }

  const ownerName = showcase.owner.name || showcase.owner.username || "a collector"
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

  const ownerName = showcase.owner.name || showcase.owner.username || "Collector"

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
