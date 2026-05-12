/**
 * Categories API — direct Supabase queries against the L1/L2/L3 category
 * tables (category_types / category_categories / category_subcategories) plus
 * their many-to-many mapping tables.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Logger } from '../logger';

export interface CategoryType {
  id: string;
  code: string;
  title: string;
  thumbnailImage: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

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

export interface Subcategory {
  id: string;
  code: string;
  title: string;
  order: number;
  categoryIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeNode {
  id: string;
  code: string;
  title: string;
  thumbnail?: string;
  categories?: CategoryTreeNode[];
}

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
      subcategories: Array<{ id: string; code: string; title: string }>;
    }>;
  }>;
}

export interface CategoriesApi {
  getCategoryTree(): Promise<CategoryTreeResponse>;
  getCategoryTypes(): Promise<CategoryType[]>;
  getCategories(): Promise<Category[]>;
  getCategoriesByType(typeId: string): Promise<Category[]>;
  getSubcategories(): Promise<Subcategory[]>;
  getSubcategoriesByCategory(categoryId: string): Promise<Subcategory[]>;
  getCategoryTypeByCode(code: string): Promise<CategoryType | null>;
  getCategoryByCode(code: string): Promise<Category | null>;
  getSubcategoryByCode(code: string): Promise<Subcategory | null>;
}

export function createCategoriesApi(supabase: SupabaseClient, logger: Logger): CategoriesApi {
  const log = logger.create('Categories');

  async function getCategoryTree(): Promise<CategoryTreeResponse> {
    log.info('Fetching category tree from Supabase...');

    try {
      const { data: types, error: typesError } = await supabase
        .from('category_types')
        .select('*')
        .order('order', { ascending: true });
      if (typesError) {
        log.error('Error fetching types:', typesError);
        throw new Error(typesError.message);
      }

      const { data: categories, error: categoriesError } = await supabase
        .from('category_categories')
        .select('*')
        .order('order', { ascending: true });
      if (categoriesError) {
        log.error('Error fetching categories:', categoriesError);
        throw new Error(categoriesError.message);
      }

      const { data: subcategories, error: subcategoriesError } = await supabase
        .from('category_subcategories')
        .select('*')
        .order('order', { ascending: true });
      if (subcategoriesError) {
        log.error('Error fetching subcategories:', subcategoriesError);
        throw new Error(subcategoriesError.message);
      }

      const { data: typeCategoryMappings, error: tcMappingsError } = await supabase
        .from('category_type_category_mapping')
        .select('type_id, category_id');
      if (tcMappingsError) {
        log.error('Error fetching type-category mappings:', tcMappingsError);
        throw new Error(tcMappingsError.message);
      }

      const { data: categorySubcategoryMappings, error: csMappingsError } = await supabase
        .from('category_category_subcategory_mapping')
        .select('category_id, subcategory_id');
      if (csMappingsError) {
        log.error('Error fetching category-subcategory mappings:', csMappingsError);
        throw new Error(csMappingsError.message);
      }

      const categoryMap = new Map((categories ?? []).map((c: any) => [c.id, c]));
      const subcategoryMap = new Map((subcategories ?? []).map((s: any) => [s.id, s]));

      const typeToCategoryIds = new Map<string, string[]>();
      (typeCategoryMappings ?? []).forEach((mapping: any) => {
        const existing = typeToCategoryIds.get(mapping.type_id) ?? [];
        existing.push(mapping.category_id);
        typeToCategoryIds.set(mapping.type_id, existing);
      });

      const categoryToSubcategoryIds = new Map<string, string[]>();
      (categorySubcategoryMappings ?? []).forEach((mapping: any) => {
        const existing = categoryToSubcategoryIds.get(mapping.category_id) ?? [];
        existing.push(mapping.subcategory_id);
        categoryToSubcategoryIds.set(mapping.category_id, existing);
      });

      const treeTypes = (types ?? []).map((type: any) => {
        const categoryIds = typeToCategoryIds.get(type.id) ?? [];
        const typeCategories = categoryIds
          .map((catId) => categoryMap.get(catId))
          .filter(Boolean)
          .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0))
          .map((category: any) => {
            const subcategoryIds = categoryToSubcategoryIds.get(category.id) ?? [];
            const categorySubcats = subcategoryIds
              .map((subId) => subcategoryMap.get(subId))
              .filter(Boolean)
              .sort((a: any, b: any) => (a?.order ?? 0) - (b?.order ?? 0))
              .map((subcategory: any) => ({
                id: subcategory.id,
                code: subcategory.code,
                title: subcategory.title,
              }));

            return {
              id: category.id,
              code: category.code,
              title: category.title,
              thumbnail: category.thumbnail_image ?? '',
              subcategories: categorySubcats,
            };
          });

        return {
          id: type.id,
          code: type.code,
          title: type.title,
          thumbnail: type.thumbnail_image ?? '',
          categories: typeCategories,
        };
      });

      log.debug('Tree built:', {
        typeCount: treeTypes.length,
        firstType: treeTypes[0]
          ? { code: treeTypes[0].code, categoryCount: treeTypes[0].categories.length }
          : null,
      });

      return { types: treeTypes };
    } catch (error) {
      log.error('Error building category tree:', error);
      throw error;
    }
  }

  async function getCategoryTypes(): Promise<CategoryType[]> {
    const { data, error } = await supabase
      .from('category_types')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      log.error('Error fetching types:', error);
      throw new Error(error.message);
    }

    return (data ?? []).map((type: any) => ({
      id: type.id,
      code: type.code,
      title: type.title,
      thumbnailImage: type.thumbnail_image ?? '',
      order: type.order,
      createdAt: type.created_at,
      updatedAt: type.updated_at,
    }));
  }

  async function getCategories(): Promise<Category[]> {
    const { data: categories, error: categoriesError } = await supabase
      .from('category_categories')
      .select('*')
      .order('order', { ascending: true });
    if (categoriesError) {
      log.error('Error fetching categories:', categoriesError);
      throw new Error(categoriesError.message);
    }

    const { data: mappings, error: mappingsError } = await supabase
      .from('category_type_category_mapping')
      .select('type_id, category_id');
    if (mappingsError) {
      log.error('Error fetching mappings:', mappingsError);
      throw new Error(mappingsError.message);
    }

    const categoryToTypeIds = new Map<string, string[]>();
    (mappings ?? []).forEach((mapping: any) => {
      const existing = categoryToTypeIds.get(mapping.category_id) ?? [];
      existing.push(mapping.type_id);
      categoryToTypeIds.set(mapping.category_id, existing);
    });

    return (categories ?? []).map((category: any) => ({
      id: category.id,
      code: category.code,
      title: category.title,
      thumbnailImage: category.thumbnail_image ?? '',
      order: category.order,
      typeIds: categoryToTypeIds.get(category.id) ?? [],
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    }));
  }

  async function getCategoriesByType(typeId: string): Promise<Category[]> {
    const { data: mappings, error: mappingsError } = await supabase
      .from('category_type_category_mapping')
      .select('category_id')
      .eq('type_id', typeId);
    if (mappingsError) {
      log.error('Error fetching mappings:', mappingsError);
      throw new Error(mappingsError.message);
    }

    const categoryIds = (mappings ?? []).map((m: any) => m.category_id);
    if (categoryIds.length === 0) return [];

    const { data: categories, error: categoriesError } = await supabase
      .from('category_categories')
      .select('*')
      .in('id', categoryIds)
      .order('order', { ascending: true });
    if (categoriesError) {
      log.error('Error fetching categories:', categoriesError);
      throw new Error(categoriesError.message);
    }

    return (categories ?? []).map((category: any) => ({
      id: category.id,
      code: category.code,
      title: category.title,
      thumbnailImage: category.thumbnail_image ?? '',
      order: category.order,
      typeIds: [typeId],
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    }));
  }

  async function getSubcategories(): Promise<Subcategory[]> {
    const { data: subcategories, error: subcategoriesError } = await supabase
      .from('category_subcategories')
      .select('*')
      .order('order', { ascending: true });
    if (subcategoriesError) {
      log.error('Error fetching subcategories:', subcategoriesError);
      throw new Error(subcategoriesError.message);
    }

    const { data: mappings, error: mappingsError } = await supabase
      .from('category_category_subcategory_mapping')
      .select('category_id, subcategory_id');
    if (mappingsError) {
      log.error('Error fetching mappings:', mappingsError);
      throw new Error(mappingsError.message);
    }

    const subcategoryToCategoryIds = new Map<string, string[]>();
    (mappings ?? []).forEach((mapping: any) => {
      const existing = subcategoryToCategoryIds.get(mapping.subcategory_id) ?? [];
      existing.push(mapping.category_id);
      subcategoryToCategoryIds.set(mapping.subcategory_id, existing);
    });

    return (subcategories ?? []).map((subcategory: any) => ({
      id: subcategory.id,
      code: subcategory.code,
      title: subcategory.title,
      order: subcategory.order,
      categoryIds: subcategoryToCategoryIds.get(subcategory.id) ?? [],
      createdAt: subcategory.created_at,
      updatedAt: subcategory.updated_at,
    }));
  }

  async function getSubcategoriesByCategory(categoryId: string): Promise<Subcategory[]> {
    const { data: mappings, error: mappingsError } = await supabase
      .from('category_category_subcategory_mapping')
      .select('subcategory_id')
      .eq('category_id', categoryId);
    if (mappingsError) {
      log.error('Error fetching mappings:', mappingsError);
      throw new Error(mappingsError.message);
    }

    const subcategoryIds = (mappings ?? []).map((m: any) => m.subcategory_id);
    if (subcategoryIds.length === 0) return [];

    const { data: subcategories, error: subcategoriesError } = await supabase
      .from('category_subcategories')
      .select('*')
      .in('id', subcategoryIds)
      .order('order', { ascending: true });
    if (subcategoriesError) {
      log.error('Error fetching subcategories:', subcategoriesError);
      throw new Error(subcategoriesError.message);
    }

    return (subcategories ?? []).map((subcategory: any) => ({
      id: subcategory.id,
      code: subcategory.code,
      title: subcategory.title,
      order: subcategory.order,
      categoryIds: [categoryId],
      createdAt: subcategory.created_at,
      updatedAt: subcategory.updated_at,
    }));
  }

  async function getCategoryTypeByCode(code: string): Promise<CategoryType | null> {
    const { data, error } = await supabase
      .from('category_types')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      log.error('Error fetching type by code:', error);
      throw new Error(error.message);
    }

    return {
      id: (data as any).id,
      code: (data as any).code,
      title: (data as any).title,
      thumbnailImage: (data as any).thumbnail_image ?? '',
      order: (data as any).order,
      createdAt: (data as any).created_at,
      updatedAt: (data as any).updated_at,
    };
  }

  async function getCategoryByCode(code: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from('category_categories')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      log.error('Error fetching category by code:', error);
      throw new Error(error.message);
    }

    const { data: mappings } = await supabase
      .from('category_type_category_mapping')
      .select('type_id')
      .eq('category_id', (data as any).id);

    return {
      id: (data as any).id,
      code: (data as any).code,
      title: (data as any).title,
      thumbnailImage: (data as any).thumbnail_image ?? '',
      order: (data as any).order,
      typeIds: (mappings ?? []).map((m: any) => m.type_id),
      createdAt: (data as any).created_at,
      updatedAt: (data as any).updated_at,
    };
  }

  async function getSubcategoryByCode(code: string): Promise<Subcategory | null> {
    const { data, error } = await supabase
      .from('category_subcategories')
      .select('*')
      .eq('code', code)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      log.error('Error fetching subcategory by code:', error);
      throw new Error(error.message);
    }

    const { data: mappings } = await supabase
      .from('category_category_subcategory_mapping')
      .select('category_id')
      .eq('subcategory_id', (data as any).id);

    return {
      id: (data as any).id,
      code: (data as any).code,
      title: (data as any).title,
      order: (data as any).order,
      categoryIds: (mappings ?? []).map((m: any) => m.category_id),
      createdAt: (data as any).created_at,
      updatedAt: (data as any).updated_at,
    };
  }

  return {
    getCategoryTree,
    getCategoryTypes,
    getCategories,
    getCategoriesByType,
    getSubcategories,
    getSubcategoriesByCategory,
    getCategoryTypeByCode,
    getCategoryByCode,
    getSubcategoryByCode,
  };
}
