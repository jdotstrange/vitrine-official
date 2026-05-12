/**
 * Marketing site photography. Unsplash CDN URLs serve as initial
 * placeholders — swap to brand-shot assets by editing this file alone
 * (no section files reference URLs directly).
 */

export const PHOTOS = {
  watch:
    "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1600&q=80&auto=format&fit=crop",
  vinyl:
    "https://images.unsplash.com/photo-1535992165812-68d1861aa71e?w=1600&q=80&auto=format&fit=crop",
  coin: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=1600&q=80&auto=format&fit=crop",
  sneaker:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=80&auto=format&fit=crop",
  comics:
    "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=1600&q=80&auto=format&fit=crop",
  cards:
    "https://images.unsplash.com/photo-1647892194985-95dcc28cb95b?w=1600&q=80&auto=format&fit=crop",
  camera:
    "https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?w=1600&q=80&auto=format&fit=crop",
  collector:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&q=80&auto=format&fit=crop",
} as const

export type PhotoKey = keyof typeof PHOTOS
