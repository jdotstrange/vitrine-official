"use client"

import { useState, useEffect, useCallback, type RefObject } from "react"

interface MousePosition {
  x: number
  y: number
  normalizedX: number // -1 to 1
  normalizedY: number // -1 to 1
}

export function useMouseParallax(containerRef?: RefObject<HTMLElement>) {
  const [mousePosition, setMousePosition] = useState<MousePosition>({
    x: 0,
    y: 0,
    normalizedX: 0,
    normalizedY: 0,
  })

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const container = containerRef?.current || document.documentElement
      const rect = container.getBoundingClientRect()

      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Normalize to -1 to 1 range
      const normalizedX = (x / rect.width) * 2 - 1
      const normalizedY = (y / rect.height) * 2 - 1

      setMousePosition({
        x,
        y,
        normalizedX: Math.max(-1, Math.min(1, normalizedX)),
        normalizedY: Math.max(-1, Math.min(1, normalizedY)),
      })
    },
    [containerRef],
  )

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [handleMouseMove])

  return mousePosition
}
