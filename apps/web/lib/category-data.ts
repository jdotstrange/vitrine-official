import { supabase } from "./supabase"

export interface CategoryType {
  id: string
  code: string
  title: string
  thumbnailImage: string
  order: number
  categories: CategoryL2[]
}

export interface CategoryL2 {
  id: string
  code: string
  title: string
  thumbnailImage: string
  order: number
}

export interface FieldExample {
  categoryTitle: string
  fields: string[]
}

/**
 * Fetch all memorabilia types with their L2 categories, ordered.
 */
export async function getCategoryTypes(): Promise<CategoryType[]> {
  const { data: types, error: typesErr } = await supabase
    .from("category_types")
    .select("id, code, title, thumbnail_image, order")
    .order("order")

  if (typesErr || !types) {
    console.error("Error fetching category types:", typesErr)
    return []
  }

  const { data: mappings, error: mapErr } = await supabase
    .from("category_type_category_mapping")
    .select("type_id, category_id, category_categories ( id, code, title, thumbnail_image, order )")
    .order("category_categories(order)")

  if (mapErr || !mappings) {
    console.error("Error fetching type-category mappings:", mapErr)
    return types.map((t) => ({
      id: t.id,
      code: t.code,
      title: t.title,
      thumbnailImage: t.thumbnail_image,
      order: t.order,
      categories: [],
    }))
  }

  interface MappingRow {
    type_id: string
    category_id: string
    category_categories: {
      id: string
      code: string
      title: string
      thumbnail_image: string
      order: number
    } | null
  }

  const rows = mappings as MappingRow[]

  const catsByType = new Map<string, CategoryL2[]>()
  for (const row of rows) {
    const cat = row.category_categories
    if (!cat) continue
    if (!catsByType.has(row.type_id)) catsByType.set(row.type_id, [])
    const existing = catsByType.get(row.type_id)!
    if (!existing.some((c) => c.id === cat.id)) {
      existing.push({
        id: cat.id,
        code: cat.code,
        title: cat.title,
        thumbnailImage: cat.thumbnail_image,
        order: cat.order,
      })
    }
  }

  for (const cats of catsByType.values()) {
    cats.sort((a, b) => a.order - b.order)
  }

  return types.map((t) => ({
    id: t.id,
    code: t.code,
    title: t.title,
    thumbnailImage: t.thumbnail_image,
    order: t.order,
    categories: catsByType.get(t.id) || [],
  }))
}

/**
 * Fetch real field examples for a set of L2 categories (by code).
 * Returns category-specific fields (not section headers), ordered.
 */
export async function getFieldExamples(categoryCodes: string[]): Promise<FieldExample[]> {
  const { data: categories, error: catErr } = await supabase
    .from("category_categories")
    .select("id, code, title")
    .in("code", categoryCodes)

  if (catErr || !categories || categories.length === 0) {
    console.error("Error fetching categories for field examples:", catErr)
    return []
  }

  const catIds = categories.map((c) => c.id)

  const { data: mappings, error: mapErr } = await supabase
    .from("field_category_mappings")
    .select("category_id, field_order, fields ( field_label, field_type )")
    .in("category_id", catIds)
    .order("field_order")

  if (mapErr || !mappings) {
    console.error("Error fetching field mappings:", mapErr)
    return []
  }

  interface FieldRow {
    category_id: string
    field_order: number
    fields: { field_label: string; field_type: string } | null
  }

  const rows = mappings as FieldRow[]

  const idToTitle = new Map(categories.map((c) => [c.id, c.title]))

  const grouped = new Map<string, string[]>()
  for (const row of rows) {
    if (!row.fields || row.fields.field_type === "section") continue
    const title = idToTitle.get(row.category_id) || "Unknown"
    if (!grouped.has(title)) grouped.set(title, [])
    grouped.get(title)!.push(row.fields.field_label)
  }

  return categoryCodes
    .map((code) => {
      const cat = categories.find((c) => c.code === code)
      if (!cat) return null
      const fields = grouped.get(cat.title) || []
      return { categoryTitle: cat.title, fields }
    })
    .filter(Boolean) as FieldExample[]
}
