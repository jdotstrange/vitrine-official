import { useState, useEffect, useCallback } from 'react';
import { getTrackedComps, type TrackedCompItem } from '@/lib/api/comps';
import { logger } from '@/lib/logger';

const log = logger.create('useTrackedComps');

export function useTrackedComps(userId: string | undefined, limit = 30) {
  const [items, setItems] = useState<TrackedCompItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchComps = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getTrackedComps(userId, limit);
      setItems(data);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      log.error('useTrackedComps:', err.message);
      setError(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    void fetchComps();
  }, [fetchComps]);

  return { items, loading, error, refetch: fetchComps };
}
