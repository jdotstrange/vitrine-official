import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecentSearch {
  query: string;
  searchedAt: string; // ISO 8601
}

const STORAGE_KEY = 'vitrine.market.recent_searches';
const MAX_ENTRIES = 2;
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

async function readRaw(): Promise<RecentSearch[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Returns recent searches filtered for TTL, deduplicated, most-recent first.
 */
export async function getRecentSearches(): Promise<RecentSearch[]> {
  const now = Date.now();
  const all = await readRaw();
  return all.filter((r) => now - new Date(r.searchedAt).getTime() < TTL_MS);
}

/**
 * Adds a query to the recent-searches list.
 * - Normalizes and deduplicates (most-recent timestamp wins).
 * - Keeps only the last MAX_ENTRIES entries.
 */
export async function addRecentSearch(query: string): Promise<void> {
  const normalized = normalize(query);
  if (!normalized) return;

  const existing = await readRaw();
  const now = new Date().toISOString();

  // Remove any prior entry with the same normalized text
  const deduped = existing.filter((r) => normalize(r.query) !== normalized);

  // Prepend the fresh entry
  const next: RecentSearch[] = [
    { query: query.trim(), searchedAt: now },
    ...deduped,
  ].slice(0, MAX_ENTRIES);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

/**
 * Removes a single recent search by query string (matched on normalized form).
 * Returns the resulting list so callers can update local state immediately.
 */
export async function removeRecentSearch(query: string): Promise<RecentSearch[]> {
  const normalized = normalize(query);
  const existing = await readRaw();
  const next = existing.filter((r) => normalize(r.query) !== normalized);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function clearRecentSearches(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
