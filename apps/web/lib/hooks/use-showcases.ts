"use client"

import { useEffect, useState, useCallback } from "react"
import { getClientApi } from "@/lib/api-client"
import type { UserShowcase } from "@vitrine/api"

interface UseShowcasesOptions {
  userId?: string
  limit?: number
}

export function useShowcases({ userId, limit }: UseShowcasesOptions = {}) {
  const [showcases, setShowcases] = useState<UserShowcase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const api = getClientApi()
      const result = await api.showcases.getUserShowcases(userId)
      setShowcases(limit ? result.slice(0, limit) : result)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [userId, limit])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { showcases, loading, error, refetch }
}
