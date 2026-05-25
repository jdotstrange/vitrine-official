"use client"

import { redirect } from "next/navigation"
import { useEffect } from "react"

export default function TrackingIndex() {
  // Redirect to tracked lens by default
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.location.replace("/v/tracking/tracked")
    }
  }, [])
  return null
}
