"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Gem, 
  Watch, 
  Trophy, 
  Gamepad2, 
  Palette, 
  Music,
  Camera,
  Car
} from "lucide-react"

interface Category {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  glowColor: string
  count: string
}

const categories: Category[] = [
  { id: "cards", label: "Cards", icon: Gem, glowColor: "#00d4ff", count: "2.4M" },
  { id: "sneakers", label: "Kicks", icon: Trophy, glowColor: "#ff6600", count: "890K" },
  { id: "watches", label: "Watches", icon: Watch, glowColor: "#00ff88", count: "340K" },
  { id: "sports", label: "Sports", icon: Trophy, glowColor: "#ff6600", count: "1.2M" },
  { id: "gaming", label: "Gaming", icon: Gamepad2, glowColor: "#6b46c1", count: "670K" },
  { id: "art", label: "Art", icon: Palette, glowColor: "#ff00aa", count: "450K" },
  { id: "vinyl", label: "Vinyl", icon: Music, glowColor: "#ffb800", count: "280K" },
  { id: "cameras", label: "Cameras", icon: Camera, glowColor: "#00d4ff", count: "120K" },
]

interface CategoryOrbsProps {
  className?: string
  onCategorySelect?: (categoryId: string) => void
}

/**
 * CategoryOrbs - Visual category browser with glowing orbs
 * 
 * Matches the consumer app's category-orbs.tsx component with
 * interactive glow effects and category counts.
 */
export function CategoryOrbs({ className = "", onCategorySelect }: CategoryOrbsProps) {
  const [activeOrb, setActiveOrb] = useState<string | null>(null)

  return (
    <div className={className}>
      {/* Horizontal scrolling container */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 px-1">
        {categories.map((cat) => {
          const Icon = cat.icon
          const isActive = activeOrb === cat.id

          return (
            <motion.button
              key={cat.id}
              className="flex flex-col items-center gap-2 min-w-[80px] group"
              onMouseEnter={() => setActiveOrb(cat.id)}
              onMouseLeave={() => setActiveOrb(null)}
              onClick={() => onCategorySelect?.(cat.id)}
              whileTap={{ scale: 0.95 }}
            >
              {/* Orb container */}
              <div className="relative">
                {/* Glow effect */}
                <motion.div
                  className="absolute -inset-2 rounded-2xl blur-xl"
                  style={{ backgroundColor: cat.glowColor }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isActive ? 0.4 : 0 }}
                  transition={{ duration: 0.3 }}
                />

                {/* Card/Orb */}
                <motion.div
                  className="relative w-20 h-28 rounded-2xl overflow-hidden border-2 flex items-center justify-center"
                  style={{ 
                    borderColor: isActive ? cat.glowColor : "rgba(255,255,255,0.1)",
                    background: `linear-gradient(135deg, ${cat.glowColor}15 0%, transparent 50%, ${cat.glowColor}10 100%)`,
                  }}
                  animate={{ 
                    scale: isActive ? 1.05 : 1,
                    borderColor: isActive ? cat.glowColor : "rgba(255,255,255,0.1)",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Glass inner */}
                  <div className="absolute inset-0 bg-void-deep/60 backdrop-blur-sm" />
                  
                  {/* Icon container */}
                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <motion.div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ 
                        backgroundColor: `${cat.glowColor}20`,
                      }}
                      animate={{
                        boxShadow: isActive 
                          ? `0 0 20px ${cat.glowColor}40` 
                          : "none",
                      }}
                    >
                      <Icon 
                        className="w-5 h-5 transition-colors duration-300"
                        style={{ color: isActive ? cat.glowColor : "#9999aa" }}
                      />
                    </motion.div>
                    
                    {/* Count badge */}
                    <span 
                      className="font-mono text-[10px] transition-colors duration-300"
                      style={{ color: isActive ? cat.glowColor : "#666680" }}
                    >
                      {cat.count}
                    </span>
                  </div>
                </motion.div>

                {/* Active particles */}
                {isActive && (
                  <>
                    <motion.div
                      className="absolute top-1 left-1/2 w-1 h-1 rounded-full"
                      style={{ backgroundColor: cat.glowColor }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                    <motion.div
                      className="absolute bottom-1 right-2 w-1 h-1 rounded-full"
                      style={{ backgroundColor: cat.glowColor }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                    />
                  </>
                )}
              </div>

              {/* Label */}
              <motion.span
                className="text-xs font-medium transition-colors duration-300"
                style={{ color: isActive ? "#f0f4fa" : "#9999aa" }}
              >
                {cat.label}
              </motion.span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
