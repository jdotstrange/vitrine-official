import { useState, useEffect, useCallback } from 'react';
import {
  getCollectibleComps,
  type CompItem,
} from '@/lib/api/comps';
import { logger } from '@/lib/logger';

const log = logger.create('useComps');

export function useComps(sourceId: string | undefined, limit = 30) {
  const [items, setItems] = useState<CompItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchComps = useCallback(async () => {
    if (!sourceId) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getCollectibleComps(sourceId, limit);
      setItems(data);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      log.error('useComps:', err.message);
      setError(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [sourceId, limit]);

  useEffect(() => {
    void fetchComps();
  }, [fetchComps]);

  return { items, loading, error, refetch: fetchComps };
}
