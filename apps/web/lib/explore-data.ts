import { supabase } from "./supabase"

export interface ExploreCollectible {
  id: string
  title: string
  image: string
  value: number | null
  status: "FOR SALE" | "FOR TRADE" | "SELL + TRADE" | "NFST"
  category: string
  createdAt: string
  collector: string
  collectorAvatar: string | null
  tracks: number
}

function deriveStatus(forSale: boolean, forTrade: boolean): ExploreCollectible["status"] {
  if (forSale && forTrade) return "SELL + TRADE"
  if (forSale) return "FOR SALE"
  if (forTrade) return "FOR TRADE"
  return "NFST"
}

function formatValue(value: number | null): string {
  if (!value) return ""
  return `$${value.toLocaleString("en-US")}`
}

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Fetch a randomized set of public collectibles with collector info.
 * Over-fetches then shuffles + slices for randomization on every request.
 */
export async function getExploreCollectibles(limit = 24): Promise<ExploreCollectible[]> {
  const poolSize = Math.min(limit * 4, 200)

  const { data, error } = await supabase
    .from("collectibles")
    .select(`
      id, title, photos, value, available_for_sale, available_for_trade,
      category, created_at,
      users!collectibles_user_id_fkey ( display_name, username, avatar )
    `)
    .not("photos", "is", null)
    .gte("value", 200)
    .order("created_at", { ascending: false })
    .limit(poolSize)

  if (error) {
    console.error("Error fetching explore collectibles:", error)
    return []
  }

  interface JoinedRow {
    id: string
    title: string
    photos: string[] | null
    value: number | string | null
    available_for_sale: boolean
    available_for_trade: boolean
    category: string | null
    created_at: string
    users: { display_name: string | null; username: string | null; avatar: string | null } | null
  }

  const rows = (data as JoinedRow[]) || []

  const withImages = rows.filter((r) => r.photos && r.photos.length > 0 && r.photos[0])

  const mapped: ExploreCollectible[] = withImages.map((item) => {
    const user = item.users
    const numericValue = item.value ? parseFloat(String(item.value)) : null

    return {
      id: item.id,
      title: item.title,
      image: item.photos![0],
      value: numericValue,
      formattedValue: formatValue(numericValue),
      status: deriveStatus(item.available_for_sale, item.available_for_trade),
      category: item.category || "Collectible",
      createdAt: item.created_at,
      collector: user?.username || user?.display_name || "Collector",
      collectorAvatar: user?.avatar || null,
      tracks: Math.floor(Math.random() * 3000) + 50,
    }
  })

  return shuffle(mapped).slice(0, limit)
}

/**
 * Fetch a randomized set of collectible image URLs for the homepage mosaic.
 * Uses a round-robin strategy across subcategories for maximum visual variety,
 * then fills remaining slots randomly.
 */
export async function getMosaicImages(limit = 30): Promise<string[]> {
  const { data, error } = await supabase
    .from("collectibles")
    .select("photos, subcategory")
    .not("photos", "is", null)
    .not("subcategory", "is", null)
    .order("created_at", { ascending: false })
    .limit(500)

  if (error) {
    console.error("Error fetching mosaic images:", error)
    return []
  }

  const rows = (data || []) as { photos: string[] | null; subcategory: string }[]
  const valid = rows.filter((r) => r.photos && r.photos.length > 0 && r.photos[0])

  const buckets = new Map<string, string[]>()
  for (const row of valid) {
    const key = row.subcategory
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(row.photos![0])
  }

  for (const [key, urls] of buckets) {
    buckets.set(key, shuffle(urls))
  }

  const picked: string[] = []
  const pickedSet = new Set<string>()
  const subcategoryKeys = shuffle([...buckets.keys()])

  let round = 0
  while (picked.length < limit) {
    let addedAny = false
    for (const key of subcategoryKeys) {
      if (picked.length >= limit) break
      const bucket = buckets.get(key)!
      if (round < bucket.length) {
        const url = bucket[round]
        if (!pickedSet.has(url)) {
          picked.push(url)
          pickedSet.add(url)
          addedAny = true
        }
      }
    }
    if (!addedAny) break
    round++
  }

  return shuffle(picked)
}

/** Get the distinct categories that actually have collectibles with images */
export async function getExploreCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from("collectibles")
    .select("category")
    .not("photos", "is", null)

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }

  const unique = [...new Set((data || []).map((r) => r.category).filter(Boolean))] as string[]
  return unique.sort()
}
