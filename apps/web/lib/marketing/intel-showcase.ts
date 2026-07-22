import type { PillVariant } from "@/components/marketing/primitives"

export interface LiveIntelShowcase {
  id: string
  photos: string[]
  classification: string
  traits: { label: string; variant: PillVariant }[]
  fields: { label: string; value: string }[]
  listingTitle: string
  confidence: string
}

const SKIP_KEYS_AI = new Set(["notes", "customizations"])
const SKIP_KEYS_TRAIT = new Set(["item_type", "authentications", "verification_url"])

function humanizeKey(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

function capitalizeFirst(str: string): string {
  if (!str) return str
  const first = str.charAt(0)
  const upper = first.toUpperCase()
  return first === upper ? str : upper + str.slice(1)
}

function stripParenthetical(value: string): string {
  return value.replace(/\s*\([^)]*\)\s*$/, "").trim()
}

function isPopulated(v: unknown): boolean {
  if (v === null || v === undefined) return false
  if (typeof v === "string" && v.trim() === "") return false
  if (Array.isArray(v) && v.length === 0) return false
  return true
}

function formatScalar(v: unknown): string | null {
  if (typeof v === "boolean") return v ? "Yes" : "No"
  if (typeof v === "number") return String(v)
  if (typeof v === "string") return v
  if (Array.isArray(v)) {
    const parts = v.map(formatScalar).filter((p): p is string => !!p)
    return parts.length ? parts.join(", ") : null
  }
  return null
}

function traitVariant(trait: string): PillVariant {
  const t = trait.toLowerCase()
  if (t.includes("sign") || t.includes("auto")) return "signed"
  if (t.includes("grad")) return "graded"
  if (t.includes("rookie")) return "rookie"
  if (t.includes("game")) return "game_used"
  return "pro"
}

function formatClassification(row: {
  collectible_type?: string | null
  category?: string | null
  subcategory?: string | null
  classification?: string | null
}): string {
  const parts: string[] = []
  if (row.collectible_type) parts.push(capitalizeFirst(row.collectible_type))
  if (row.category && row.category !== "pending") {
    parts.push(capitalizeFirst(humanizeKey(row.category)))
  }
  const tail = row.subcategory || row.classification
  if (tail) parts.push(capitalizeFirst(tail))
  return parts.join(" › ") || "Collectible"
}

function buildFields(row: {
  ai_metadata?: Record<string, unknown> | null
  trait_metadata?: Record<string, unknown> | null
  field_schema?: Record<string, { type: string; description?: string }> | null
}): { label: string; value: string }[] {
  const fields: { label: string; value: string }[] = []

  for (const [key] of Object.entries(row.field_schema || {})) {
    if (SKIP_KEYS_AI.has(key.toLowerCase())) continue
    const value = row.ai_metadata?.[key]
    if (!isPopulated(value)) continue
    const display = formatScalar(value)
    if (!display) continue
    const label = capitalizeFirst(stripParenthetical(humanizeKey(key)))
    fields.push({ label, value: capitalizeFirst(display) })
  }

  for (const [key, value] of Object.entries(row.trait_metadata || {})) {
    if (SKIP_KEYS_TRAIT.has(key.toLowerCase())) continue
    if (!isPopulated(value)) continue
    const display = formatScalar(value)
    if (!display) continue
    fields.push({ label: capitalizeFirst(humanizeKey(key)), value: capitalizeFirst(display) })
  }

  return fields.slice(0, 10)
}

export function photosForTheater(photos: string[]): string[] {
  if (photos.length === 0) return []
  return [0, 1, 2, 3].map((i) => photos[i % photos.length]!)
}

export function scoreIntelRow(row: {
  photos?: string[] | null
  listing_title?: string | null
  traits?: string[] | null
  ai_metadata?: Record<string, unknown> | null
  trait_metadata?: Record<string, unknown> | null
  field_schema?: Record<string, { type: string; description?: string }> | null
}): number {
  const photoCount = Array.isArray(row.photos) ? row.photos.length : 0
  const fieldCount = buildFields(row).length
  let score = photoCount * 2 + fieldCount * 3
  if (row.listing_title?.trim()) score += 4
  if (row.traits?.length) score += row.traits.length
  return score
}

export function mapIntelShowcase(row: {
  id: string
  photos?: string[] | null
  listing_title?: string | null
  title?: string | null
  category?: string | null
  subcategory?: string | null
  classification?: string | null
  collectible_type?: string | null
  confidence?: string | null
  traits?: string[] | null
  ai_metadata?: Record<string, unknown> | null
  trait_metadata?: Record<string, unknown> | null
  field_schema?: Record<string, { type: string; description?: string }> | null
}): LiveIntelShowcase | null {
  const photos = (row.photos ?? []).filter(Boolean)
  if (photos.length === 0) return null

  const fields = buildFields(row)
  if (fields.length === 0 && !row.listing_title?.trim()) return null

  const traits = (row.traits ?? []).slice(0, 3).map((trait) => ({
    label: humanizeKey(trait).toUpperCase(),
    variant: traitVariant(trait),
  }))

  return {
    id: String(row.id),
    photos: photosForTheater(photos),
    classification: formatClassification(row),
    traits,
    fields: fields.length > 0 ? fields : [{ label: "Title", value: row.title || "Untitled" }],
    listingTitle: row.listing_title?.trim() || row.title?.trim() || "Untitled",
    confidence: (row.confidence || "medium").toUpperCase(),
  }
}

export const MOCK_INTEL_SHOWCASE: LiveIntelShowcase = {
  id: "mock-luis-robert",
  photos: ["", "", "", ""],
  classification: "Signed Memorabilia › Baseball › OBL · Auto",
  traits: [
    { label: "AUTOGRAPHED", variant: "signed" },
    { label: "AUTHENTICATED", variant: "graded" },
    { label: "ROOKIE-ERA", variant: "rookie" },
  ],
  fields: [
    { label: "Subject", value: "Luis Robert" },
    { label: "Signer", value: "Luis Robert Jr." },
    { label: "Signature count", value: "1" },
    { label: "Ink color", value: "Blue ballpoint" },
    { label: "Placement", value: "Sweet spot" },
    { label: "Inscription", value: '"24"' },
    { label: "Auth company", value: "PSA/DNA" },
    { label: "Cert #", value: "AZ58051" },
    { label: "Ball type", value: "Official Carolina League" },
    { label: "Physical COA", value: "Yes · visible" },
  ],
  listingTitle: "Luis Robert Signed Official Carolina League Baseball (PSA/DNA)",
  confidence: "HIGH",
}
