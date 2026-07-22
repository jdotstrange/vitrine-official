import { MarketingSite } from "@/components/marketing/MarketingSite"
import { supabase } from "@/lib/supabase"
import type { LiveExploreItem } from "@/components/marketing/sections/ExploreSection"
import {
  mapIntelShowcase,
  scoreIntelRow,
  type LiveIntelShowcase,
} from "@/lib/marketing/intel-showcase"

export const dynamic = "force-dynamic"

const FRANK_USERNAME = "fmazza821"

interface ExploreCollectibleRow {
  id: string
  listing_title: string | null
  title: string | null
  value: string | number | null
  photos: string[] | null
  available_for_sale: boolean | null
  available_for_trade: boolean | null
}

function deriveStatus(
  availableForSale: boolean | null,
  availableForTrade: boolean | null
): LiveExploreItem["status"] {
  if (availableForSale && availableForTrade) return "sell_trade"
  if (availableForSale) return "for_sale"
  if (availableForTrade) return "for_trade"
  return "nfst"
}

function formatValue(value: string | number | null): string | null {
  if (value == null) return null
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric) || numeric <= 0) return null
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numeric)
}

async function getFrankExploreItems(): Promise<LiveExploreItem[]> {
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("username", FRANK_USERNAME)
    .single()

  if (!user?.id) return []

  const { data } = await supabase
    .from("collectibles")
    .select(
      "id, listing_title, title, value, photos, available_for_sale, available_for_trade"
    )
    .eq("user_id", user.id)
    .eq("visibility", "public")
    .not("photos", "is", null)
    .not("value", "is", null)
    .not("published_at", "is", null)

  return ((data ?? []) as ExploreCollectibleRow[])
    .filter((row) => Array.isArray(row.photos) && row.photos[0])
    .sort(() => Math.random() - 0.5)
    .slice(0, 8)
    .map((row) => ({
      id: String(row.id),
      photo: String(row.photos?.[0]),
      title: String(row.listing_title || row.title || "Untitled"),
      value: formatValue(row.value),
      status: deriveStatus(row.available_for_sale, row.available_for_trade),
    }))
}

interface IntelCollectibleRow {
  id: string
  listing_title: string | null
  title: string | null
  photos: string[] | null
  category: string | null
  subcategory: string | null
  classification: string | null
  collectible_type: string | null
  confidence: string | null
  traits: string[] | null
  ai_metadata: Record<string, unknown> | null
  trait_metadata: Record<string, unknown> | null
  field_schema: Record<string, { type: string; description?: string }> | null
}

async function getFrankIntelShowcases(): Promise<LiveIntelShowcase[]> {
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("username", FRANK_USERNAME)
    .single()

  if (!user?.id) return []

  const { data } = await supabase
    .from("collectibles")
    .select(
      "id, listing_title, title, photos, category, subcategory, classification, collectible_type, confidence, traits, ai_metadata, trait_metadata, field_schema"
    )
    .eq("user_id", user.id)
    .eq("visibility", "public")
    .not("photos", "is", null)
    .not("published_at", "is", null)
    .eq("extraction_status", "complete")

  return ((data ?? []) as IntelCollectibleRow[])
    .map((row) => ({ row, score: scoreIntelRow(row) }))
    .filter(({ row, score }) => score >= 6 && mapIntelShowcase(row))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)
    .sort(() => Math.random() - 0.5)
    .slice(0, 8)
    .map(({ row }) => mapIntelShowcase(row)!)
}

export default async function Home() {
  const [exploreItems, intelShowcases] = await Promise.all([
    getFrankExploreItems(),
    getFrankIntelShowcases(),
  ])
  return (
    <MarketingSite exploreItems={exploreItems} intelShowcases={intelShowcases} />
  )
}
