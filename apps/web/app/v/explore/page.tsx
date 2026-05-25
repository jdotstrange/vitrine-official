"use client"

import { useEffect } from "react"

export default function ExploreIndex() {
  useEffect(() => {
    if (typeof window !== "undefined") window.location.replace("/v/explore/hot")
  }, [])
  return null
}
