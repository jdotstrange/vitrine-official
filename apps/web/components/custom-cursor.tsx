"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, useMotionValue, useSpring } from "framer-motion"

interface CustomCursorProps {
  enabled?: boolean
}

/**
 * CustomCursor - Elite reactive cursor
 * 
 * Features:
 * - Cyan ring that follows mouse with spring physics
 * - Expands on hover over interactive elements
 * - Shows contextual text (CLICK, DRAG, etc.)
 * - Subtle trail effect
 * - Blends with ambient colors
 */
export function CustomCursor({ enabled = true }: CustomCursorProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [cursorText, setCursorText] = useState("")
  const [isClicking, setIsClicking] = useState(false)
  
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  
  const springConfig = { damping: 25, stiffness: 400 }
  const smoothX = useSpring(cursorX, springConfig)
  const smoothY = useSpring(cursorY, springConfig)
  
  // Trailing cursor (slower spring)
  const trailConfig = { damping: 35, stiffness: 200 }
  const trailX = useSpring(cursorX, trailConfig)
  const trailY = useSpring(cursorY, trailConfig)
  
  const handleMouseMove = useCallback((e: MouseEvent) => {
    cursorX.set(e.clientX)
    cursorY.set(e.clientY)
    setIsVisible(true)
  }, [cursorX, cursorY])
  
  const handleMouseEnter = useCallback(() => {
    setIsVisible(true)
  }, [])
  
  const handleMouseLeave = useCallback(() => {
    setIsVisible(false)
  }, [])
  
  const handleMouseDown = useCallback(() => {
    setIsClicking(true)
  }, [])
  
  const handleMouseUp = useCallback(() => {
    setIsClicking(false)
  }, [])
  
  useEffect(() => {
    if (!enabled) return
    
    // Detect interactive elements
    const handleElementHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Check for interactive elements
      const isButton = target.closest("button, a, [role='button']")
      const isDraggable = target.closest("[data-draggable]")
      const isVideo = target.closest("video, [data-video]")
      const hasCustomCursor = target.closest("[data-cursor]")
      
      if (hasCustomCursor) {
        const customText = (target.closest("[data-cursor]") as HTMLElement)?.dataset.cursor
        setCursorText(customText || "")
        setIsHovering(true)
      } else if (isDraggable) {
        setCursorText("DRAG")
        setIsHovering(true)
      } else if (isVideo) {
        setCursorText("PLAY")
        setIsHovering(true)
      } else if (isButton) {
        setCursorText("")
        setIsHovering(true)
      } else {
        setCursorText("")
        setIsHovering(false)
      }
    }
    
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mousemove", handleElementHover)
    document.addEventListener("mouseenter", handleMouseEnter)
    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("mousedown", handleMouseDown)
    document.addEventListener("mouseup", handleMouseUp)
    
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mousemove", handleElementHover)
      document.removeEventListener("mouseenter", handleMouseEnter)
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mousedown", handleMouseDown)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [enabled, handleMouseMove, handleMouseEnter, handleMouseLeave, handleMouseDown, handleMouseUp])
  
  if (!enabled) return null
  
  // Hide on touch devices
  if (typeof window !== "undefined" && "ontouchstart" in window) {
    return null
  }
  
  return (
    <>
      {/* Main cursor ring */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: smoothX,
          y: smoothY,
        }}
        animate={{
          scale: isClicking ? 0.8 : isHovering ? 1.5 : 1,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ duration: 0.15 }}
      >
        <div 
          className="relative -translate-x-1/2 -translate-y-1/2"
          style={{
            width: isHovering ? 60 : 24,
            height: isHovering ? 60 : 24,
            transition: "width 0.2s, height 0.2s",
          }}
        >
          {/* Outer ring */}
          <div 
            className="absolute inset-0 rounded-full border-2 border-cyan-glow"
            style={{
              boxShadow: isHovering 
                ? "0 0 20px rgba(0, 212, 255, 0.5), inset 0 0 10px rgba(0, 212, 255, 0.2)" 
                : "0 0 10px rgba(0, 212, 255, 0.3)",
            }}
          />
          
          {/* Inner dot */}
          <motion.div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-glow"
            animate={{
              width: isHovering ? 4 : 4,
              height: isHovering ? 4 : 4,
              opacity: isHovering && cursorText ? 0 : 1,
            }}
          />
          
          {/* Cursor text */}
          {cursorText && (
            <motion.span
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold tracking-wider text-cyan-glow whitespace-nowrap"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {cursorText}
            </motion.span>
          )}
        </div>
      </motion.div>
      
      {/* Trail cursor */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{
          x: trailX,
          y: trailY,
        }}
        animate={{
          opacity: isVisible ? 0.3 : 0,
          scale: isHovering ? 1.2 : 1,
        }}
      >
        <div className="w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-glow/50 blur-sm" />
      </motion.div>
      
      {/* Global style to hide default cursor on desktop */}
      <style jsx global>{`
        @media (hover: hover) and (pointer: fine) {
          body {
            cursor: none !important;
          }
          a, button, [role="button"] {
            cursor: none !important;
          }
        }
      `}</style>
    </>
  )
}
