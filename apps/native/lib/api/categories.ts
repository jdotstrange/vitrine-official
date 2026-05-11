/**
 * Categories API
 * Handles fetching category types, categories, and subcategories
 * 
 * Now uses direct Supabase queries instead of Railway backend
 */

import { supabase } from '@/lib/supabase';
import { logger } from '../logger';

const log = logger.create('Categories');

/**
 * Category Type (L1)
 */
export interface CategoryType {
  id: string;
  code: string;
  title: string;
  thumbnailImage: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Category (L2)
 */
export interface Category {
  id: string;
  code: string;
  title: string;
  thumbnailImage: string;
  order: number;
  typeIds: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Subcategory (L3)
 */
export interface Subcategory {
  id: string;
  code: string;
  title: string;
  order: number;
  categoryIds: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Category Tree Node
 */
export interface CategoryTreeNode {
  id: string;
  code: string;
  title: string;
  thumbnail?: string;
  categories?: CategoryTreeNode[];
}

/**
 * Category Tree Response
 */
export interface CategoryTreeResponse {
  types: Array<{
    id: string;
    code: string;
    title: string;
    thumbnail: string;
    categories: Array<{
      id: string;
      code: string;
      title: string;
      thumbnail: string;
      subcategories: Array<{
        id: string;
        code: string;
        title: string;
      }>;
    }>;
  }>;
}

/**
 * Get full category tree
 * This returns the complete hierarchy: Types -> Categories -> Subcategories
 * Now fetches directly from Supabase PostgreSQL
 */
export async function getCategoryTree(): Promise<CategoryTreeResponse> {
  log.info('Fetching category tree from Supabase...');
  
  try {
    // Fetch all types
    const { data: types, error: typesError } = await supabase
      .from('category_types')
      .select('*')
      .order('order', { ascending: true });

    if (typesError) {
      log.error('Error fetching types:', typesError);
      throw new Error(typesError.message);
    }

    // Fetch all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('category_categories')
      .select('*')
      .order('order', { ascending: true });

    if (categoriesError) {
      log.error('Error fetching categories:', categoriesError);
      throw new Error(categoriesError.message);
    }

    // Fetch all subcategories
    const { data: subcategories, error: subcategoriesError } = await supabase
      .from('category_subcategories')
      .select('*')
      .order('order', { ascending: true });

    if (subcategoriesError) {
      log.error('Error fetching subcategories:', subcategoriesError);
      throw new Error(subcategoriesError.message);
    }

    // Fetch type -> category mappings
    const { data: typeCategoryMappings, error: tcMappingsError } = await supabase
      .from('category_type_category_mapping')
      .select('type_id, category_id');

    if (tcMappingsError) {
      log.error('Error fetching type-category mappings:', tcMappingsError);
      throw new Error(tcMappingsError.message);
    }

    // Fetch category -> subcategory mappings
    const { data: categorySubcategoryMappings, error: csMappingsError } = await supabase
      .from('category_category_subcategory_mapping')
      .select('category_id, subcategory_id');

    if (csMappingsError) {
      log.error('Error fetching category-subcategory mappings:', csMappingsError);
      throw new Error(csMappingsError.message);
    }

    // Build lookup maps
    const categoryMap = new Map(categories?.map(c => [c.id, c]) || []);
    const subcategoryMap = new Map(subcategories?.map(s => [s.id, s]) || []);

    // Build type -> category IDs map
    const typeToCategoryIds = new Map<string, string[]>();
    typeCategoryMappings?.forEach(mapping => {
      const existing = typeToCategoryIds.get(mapping.type_id) || [];
      existing.push(mapping.category_id);
      typeToCategoryIds.set(mapping.type_id, existing);
    });

    // Build category -> subcategory IDs map
    const categoryToSubcategoryIds = new Map<string, string[]>();
    categorySubcategoryMappings?.forEach(mapping => {
      const existing = categoryToSubcategoryIds.get(mapping.category_id) || [];
      existing.push(mapping.subcategory_id);
      categoryToSubcategoryIds.set(mapping.category_id, existing);
    });

    // Build the tree response
    const treeTypes = (types || []).map(type => {
      const categoryIds = typeToCategoryIds.get(type.id) || [];
      const typeCategories = categoryIds
        .map(catId => categoryMap.get(catId))
        .filter(Boolean)
        .sort((a, b) => (a?.order || 0) - (b?.order || 0))
        .map(category => {
          const subcategoryIds = categoryToSubcategoryIds.get(category!.id) || [];
          const categorySubcats = subcategoryIds
            .map(subId => subcategoryMap.get(subId))
            .filter(Boolean)
            .sort((a, b) => (a?.order || 0) - (b?.order || 0))
            .map(subcategory => ({
              id: subcategory!.id,
              code: subcategory!.code,
              title: subcategory!.title,
            }));

          return {
            id: category!.id,
            code: category!.code,
            title: category!.title,
            thumbnail: category!.thumbnail_image || '',
            subcategories: categorySubcats,
          };
        });

      return {
        id: type.id,
        code: type.code,
        title: type.title,
        thumbnail: type.thumbnail_image || '',
        categories: typeCategories,
      };
    });

    log.debug('Tree built:', {
      typeCount: treeTypes.length,
      firstType: treeTypes[0] ? {
        code: treeTypes[0].code,
        categoryCount: treeTypes[0].categories.length,
      } : null,
    });

    return { types: treeTypes };
  } catch (error) {
    log.error('Error building category tree:', error);
    throw error;
  }
}

/**
 * Get all category types
 */
export async function getCategoryTypes(): Promise<CategoryType[]> {
  const { data, error } = await supabase
    .from('category_types')
    .select('*')
    .order('order', { ascending: true });

  if (error) {
    log.error('Error fetching types:', error);
    throw new Error(error.message);
  }

  return (data || []).map(type => ({
    id: type.id,
    code: type.code,
    title: type.title,
    thumbnailImage: type.thumbnail_image || '',
    order: type.order,
    createdAt: type.created_at,
    updatedAt: type.updated_at,
  }));
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  // Get categories
  const { data: categories, error: categoriesError } = await supabase
    .from('category_categories')
    .select('*')
    .order('order', { ascending: true });

  if (categoriesError) {
    log.error('Error fetching categories:', categoriesError);
    throw new Error(categoriesError.message);
  }

  // Get mappings to determine which types each category belongs to
  const { data: mappings, error: mappingsError } = await supabase
    .from('category_type_category_mapping')
    .select('type_id, category_id');

  if (mappingsError) {
    log.error('Error fetching mappings:', mappingsError);
    throw new Error(mappingsError.message);
  }

  // Build category -> type IDs map
  const categoryToTypeIds = new Map<string, string[]>();
  mappings?.forEach(mapping => {
    const existing = categoryToTypeIds.get(mapping.category_id) || [];
    existing.push(mapping.type_id);
    categoryToTypeIds.set(mapping.category_id, existing);
  });

  return (categories || []).map(category => ({
    id: category.id,
    code: category.code,
    title: category.title,
    thumbnailImage: category.thumbnail_image || '',
    order: category.order,
    typeIds: categoryToTypeIds.get(category.id) || [],
    createdAt: category.created_at,
    updatedAt: category.updated_at,
  }));
}

/**
 * Get categories for a specific type
 * Filters categories that are mapped to the given type
 */
export async function getCategoriesByType(typeId: string): Promise<Category[]> {
  // Get category IDs for this type
  const { data: mappings, error: mappingsError } = await supabase
    .from('category_type_category_mapping')
    .select('category_id')
    .eq('type_id', typeId);

  if (mappingsError) {
    log.error('Error fetching mappings:', mappingsError);
    throw new Error(mappingsError.message);
  }

  const categoryIds = mappings?.map(m => m.category_id) || [];
  
  if (categoryIds.length === 0) {
    return [];
  }

  // Get those categories
  const { data: categories, error: categoriesError } = await supabase
    .from('category_categories')
    .select('*')
    .in('id', categoryIds)
    .order('order', { ascending: true });

  if (categoriesError) {
    log.error('Error fetching categories:', categoriesError);
    throw new Error(categoriesError.message);
  }

  return (categories || []).map(category => ({
    id: category.id,
    code: category.code,
    title: category.title,
    thumbnailImage: category.thumbnail_image || '',
    order: category.order,
    typeIds: [typeId], // We know it belongs to at least this type
    createdAt: category.created_at,
    updatedAt: category.updated_at,
  }));
}

/**
 * Get all subcategories
 */
export async function getSubcategories(): Promise<Subcategory[]> {
  // Get subcategories
  const { data: subcategories, error: subcategoriesError } = await supabase
    .from('category_subcategories')
    .select('*')
    .order('order', { ascending: true });

  if (subcategoriesError) {
    log.error('Error fetching subcategories:', subcategoriesError);
    throw new Error(subcategoriesError.message);
  }

  // Get mappings
  const { data: mappings, error: mappingsError } = await supabase
    .from('category_category_subcategory_mapping')
    .select('category_id, subcategory_id');

  if (mappingsError) {
    log.error('Error fetching mappings:', mappingsError);
    throw new Error(mappingsError.message);
  }

  // Build subcategory -> category IDs map
  const subcategoryToCategoryIds = new Map<string, string[]>();
  mappings?.forEach(mapping => {
    const existing = subcategoryToCategoryIds.get(mapping.subcategory_id) || [];
    existing.push(mapping.category_id);
    subcategoryToCategoryIds.set(mapping.subcategory_id, existing);
  });

  return (subcategories || []).map(subcategory => ({
    id: subcategory.id,
    code: subcategory.code,
    title: subcategory.title,
    order: subcategory.order,
    categoryIds: subcategoryToCategoryIds.get(subcategory.id) || [],
    createdAt: subcategory.created_at,
    updatedAt: subcategory.updated_at,
  }));
}

/**
 * Get subcategories for a specific category
 */
export async function getSubcategoriesByCategory(categoryId: string): Promise<Subcategory[]> {
  // Get subcategory IDs for this category
  const { data: mappings, error: mappingsError } = await supabase
    .from('category_category_subcategory_mapping')
    .select('subcategory_id')
    .eq('category_id', categoryId);

  if (mappingsError) {
    log.error('Error fetching mappings:', mappingsError);
    throw new Error(mappingsError.message);
  }

  const subcategoryIds = mappings?.map(m => m.subcategory_id) || [];
  
  if (subcategoryIds.length === 0) {
    return [];
  }

  // Get those subcategories
  const { data: subcategories, error: subcategoriesError } = await supabase
    .from('category_subcategories')
    .select('*')
    .in('id', subcategoryIds)
    .order('order', { ascending: true });

  if (subcategoriesError) {
    log.error('Error fetching subcategories:', subcategoriesError);
    throw new Error(subcategoriesError.message);
  }

  return (subcategories || []).map(subcategory => ({
    id: subcategory.id,
    code: subcategory.code,
    title: subcategory.title,
    order: subcategory.order,
    categoryIds: [categoryId],
    createdAt: subcategory.created_at,
    updatedAt: subcategory.updated_at,
  }));
}

/**
 * Get category type by code
 */
export async function getCategoryTypeByCode(code: string): Promise<CategoryType | null> {
  const { data, error } = await supabase
    .from('category_types')
    .select('*')
    .eq('code', code)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    log.error('Error fetching type by code:', error);
    throw new Error(error.message);
  }

  return {
    id: data.id,
    code: data.code,
    title: data.title,
    thumbnailImage: data.thumbnail_image || '',
    order: data.order,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Get category by code
 */
export async function getCategoryByCode(code: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('category_categories')
    .select('*')
    .eq('code', code)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    log.error('Error fetching category by code:', error);
    throw new Error(error.message);
  }

  // Get type mappings for this category
  const { data: mappings } = await supabase
    .from('category_type_category_mapping')
    .select('type_id')
    .eq('category_id', data.id);

  return {
    id: data.id,
    code: data.code,
    title: data.title,
    thumbnailImage: data.thumbnail_image || '',
    order: data.order,
    typeIds: mappings?.map(m => m.type_id) || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Get subcategory by code
 */
export async function getSubcategoryByCode(code: string): Promise<Subcategory | null> {
  const { data, error } = await supabase
    .from('category_subcategories')
    .select('*')
    .eq('code', code)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    log.error('Error fetching subcategory by code:', error);
    throw new Error(error.message);
  }

  // Get category mappings for this subcategory
  const { data: mappings } = await supabase
    .from('category_category_subcategory_mapping')
    .select('category_id')
    .eq('subcategory_id', data.id);

  return {
    id: data.id,
    code: data.code,
    title: data.title,
    order: data.order,
    categoryIds: mappings?.map(m => m.category_id) || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
