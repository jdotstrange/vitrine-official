/**
 * Category Context
 * Provides category tree data to all components with caching
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCategoryTree, type CategoryTreeResponse } from '../api/categories';
import { getIconForCategory } from '../icon-mapper';
import type { LucideIcon } from 'lucide-react-native';
import { logger } from '@/lib/logger';

// Cache configuration
const CACHE_KEY = 'vitrine_category_tree';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Types
export interface CategoryType {
  id: string;
  code: string;
  title: string;
  thumbnail: string;
  icon: LucideIcon;
  categories: Category[];
}

export interface Category {
  id: string;
  code: string;
  title: string;
  thumbnail: string;
  icon: LucideIcon;
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  code: string;
  title: string;
}

interface CachedData {
  data: CategoryTreeResponse;
  timestamp: number;
}

interface CategoryContextValue {
  // Data
  types: CategoryType[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Actions
  refresh: () => Promise<void>;
  
  // Helpers
  getTypeByCode: (code: string) => CategoryType | undefined;
  getCategoryByCode: (code: string) => Category | undefined;
  getCategoriesForType: (typeCode: string) => Category[];
  getTypeName: (code: string) => string;
  getCategoryName: (code: string) => string;
}

const log = logger.create('Categories');

const CategoryContext = createContext<CategoryContextValue | null>(null);

interface CategoryProviderProps {
  children: ReactNode;
}

export function CategoryProvider({ children }: CategoryProviderProps) {
  const [types, setTypes] = useState<CategoryType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Transform API response to our format with icons
  const transformData = useCallback((data: CategoryTreeResponse): CategoryType[] => {
    log.debug('Transforming data:', {
      hasTypes: !!data?.types,
      typeCount: data?.types?.length || 0,
      rawData: JSON.stringify(data).slice(0, 500),
    });
    
    if (!data?.types || !Array.isArray(data.types)) {
      log.error('Invalid data format - no types array');
      return [];
    }
    
    const result = data.types.map((type) => ({
      id: type.id,
      code: type.code,
      title: type.title,
      thumbnail: type.thumbnail,
      icon: getIconForCategory(type.code),
      categories: Array.isArray(type.categories) ? type.categories.map((cat) => ({
        id: cat.id,
        code: cat.code,
        title: cat.title,
        thumbnail: cat.thumbnail,
        icon: getIconForCategory(cat.code),
        subcategories: cat.subcategories || [],
      })) : [],
    }));
    
    log.debug('Transform complete:', {
      resultCount: result.length,
      firstResult: result[0] ? { code: result[0].code, categoryCount: result[0].categories.length } : null,
    });
    
    return result;
  }, []);

  // Load from cache
  const loadFromCache = useCallback(async (): Promise<CategoryType[] | null> => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsedCache: CachedData = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid
      if (now - parsedCache.timestamp < CACHE_TTL_MS) {
        setLastUpdated(new Date(parsedCache.timestamp));
        return transformData(parsedCache.data);
      }
      
      // Cache expired
      return null;
    } catch (err) {
      log.warn('Failed to load category cache:', err);
      return null;
    }
  }, [transformData]);

  // Save to cache
  const saveToCache = useCallback(async (data: CategoryTreeResponse) => {
    try {
      const cacheData: CachedData = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      setLastUpdated(new Date(cacheData.timestamp));
    } catch (err) {
      log.warn('Failed to save category cache:', err);
    }
  }, []);

  // Fetch from API
  const fetchFromAPI = useCallback(async (): Promise<CategoryType[]> => {
    const response = await getCategoryTree();
    await saveToCache(response);
    return transformData(response);
  }, [transformData, saveToCache]);

  // Load categories (from cache or API)
  const loadCategories = useCallback(async () => {
    log.info('Loading categories...');
    setIsLoading(true);
    setError(null);

    try {
      // Skip cache for now to debug - fetch directly from API
      log.debug('Fetching from API (cache disabled for debugging)');
      const data = await fetchFromAPI();
      log.debug('Fetched data:', { typeCount: data.length });
      
      if (data.length === 0) {
        log.warn('No types returned from API');
        setError('No categories available');
      } else {
        setTypes(data);
      }
    } catch (err: unknown) {
      log.error('Failed to load categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
      
      // Try to use stale cache as fallback
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsedCache: CachedData = JSON.parse(cached);
          const fallback = transformData(parsedCache.data);
          if (fallback.length > 0) {
            setTypes(fallback);
            setError('Using cached data (offline)');
          }
        }
      } catch {
        // No fallback available
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchFromAPI, transformData]);

  // Force refresh
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchFromAPI();
      setTypes(data);
    } catch (err: unknown) {
      log.error('Failed to refresh categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh categories');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFromAPI]);

  // Load on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Helper functions
  const getTypeByCode = useCallback((code: string): CategoryType | undefined => {
    return types.find((t) => t.code === code);
  }, [types]);

  const getCategoryByCode = useCallback((code: string): Category | undefined => {
    for (const type of types) {
      const cat = type.categories.find((c) => c.code === code);
      if (cat) return cat;
    }
    return undefined;
  }, [types]);

  const getCategoriesForType = useCallback((typeCode: string): Category[] => {
    const type = types.find((t) => t.code === typeCode);
    return type?.categories ?? [];
  }, [types]);

  const getTypeName = useCallback((code: string): string => {
    return getTypeByCode(code)?.title ?? code;
  }, [getTypeByCode]);

  const getCategoryName = useCallback((code: string): string => {
    return getCategoryByCode(code)?.title ?? code;
  }, [getCategoryByCode]);

  // Memoize context value
  const value = useMemo<CategoryContextValue>(() => ({
    types,
    isLoading,
    error,
    lastUpdated,
    refresh,
    getTypeByCode,
    getCategoryByCode,
    getCategoriesForType,
    getTypeName,
    getCategoryName,
  }), [
    types,
    isLoading,
    error,
    lastUpdated,
    refresh,
    getTypeByCode,
    getCategoryByCode,
    getCategoriesForType,
    getTypeName,
    getCategoryName,
  ]);

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

// Hook to use category context
export function useCategories(): CategoryContextValue {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}

// Convenience hook for just the types array
export function useCategoryTypes(): { types: CategoryType[]; isLoading: boolean; error: string | null } {
  const { types, isLoading, error } = useCategories();
  return { types, isLoading, error };
}
