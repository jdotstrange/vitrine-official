"use client"

import { motion } from "framer-motion"
import Image from "next/image"

interface ProfileRingProps {
  src?: string
  alt?: string
  name?: string
  size?: number
  tier?: "collector" | "elite" | "legend"
  showRings?: boolean
  className?: string
}

const tierColors = {
  collector: "#00d4ff",
  elite: "#ff00aa",
  legend: "#ffb800",
}

/**
 * ProfileRing - Avatar with animated concentric rings
 * 
 * Creates the signature profile display with rotating rings,
 * matching the consumer app's collector-profile.tsx avatar style.
 */
export function ProfileRing({
  src,
  alt = "Profile",
  name,
  size = 80,
  tier = "collector",
  showRings = true,
  className = "",
}: ProfileRingProps) {
  const color = tierColors[tier]
  const ringSize1 = size * 1.6
  const ringSize2 = size * 1.2

  // Generate initials from name
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?"

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: ringSize1, height: ringSize1 }}
    >
      {/* Outer rotating ring */}
      {showRings && (
        <motion.div
          className="absolute rounded-full border"
          style={{
            width: ringSize1,
            height: ringSize1,
            borderColor: `${color}30`,
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* Ring markers */}
          <div 
            className="absolute w-1.5 h-1.5 rounded-full -top-0.5 left-1/2 -translate-x-1/2"
            style={{ backgroundColor: `${color}60` }}
          />
          <div 
            className="absolute w-1 h-1 rounded-full -bottom-0.5 left-1/2 -translate-x-1/2"
            style={{ backgroundColor: `${color}40` }}
          />
        </motion.div>
      )}

      {/* Middle counter-rotating ring */}
      {showRings && (
        <motion.div
          className="absolute rounded-full border"
          style={{
            width: ringSize2,
            height: ringSize2,
            borderColor: `${color}40`,
          }}
          animate={{ rotate: -360 }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {/* Ring markers */}
          <div 
            className="absolute w-1 h-1 rounded-full top-1/2 -right-0.5 -translate-y-1/2"
            style={{ backgroundColor: `${color}50` }}
          />
        </motion.div>
      )}

      {/* Avatar container */}
      <div
        className="relative rounded-full overflow-hidden border-2"
        style={{
          width: size,
          height: size,
          borderColor: `${color}60`,
          boxShadow: `0 0 20px ${color}30`,
        }}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
          />
        ) : (
          // Fallback with gradient initials
          <div
            className="w-full h-full flex items-center justify-center text-lg font-bold"
            style={{
              background: `linear-gradient(135deg, ${color}40 0%, ${color}20 100%)`,
              color: color,
            }}
          >
            {initials}
          </div>
        )}
      </div>

      {/* Tier badge */}
      {tier && (
        <motion.div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: color,
            color: "#05050d",
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          {tier}
        </motion.div>
      )}
    </div>
  )
}
