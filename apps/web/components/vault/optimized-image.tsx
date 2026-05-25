/**
 * OptimizedImage — picks the best size variant for the rendered width.
 *
 * Mirrors apps/native/components/optimized-image.tsx but uses `srcset`
 * to let the browser do variant resolution.
 *
 * If a URL like `https://.../foo.jpg` exists, `_200`, `_400`, `_800`
 * variants should also exist (uploaded by image.ts uploadVariants).
 * If they don't, the browser falls back to the original automatically.
 */

"use client"

import type { ImgHTMLAttributes } from "react"

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "srcSet"> {
  src?: string | null
  /** Approximate render width in CSS pixels — used to pick the variant. */
  width?: number
  /** Whether to fall back gracefully if no variants exist. Default: true */
  variants?: boolean
}

function deriveVariant(originalUrl: string, width: 200 | 400 | 800): string {
  if (!originalUrl) return originalUrl
  const lastDot = originalUrl.lastIndexOf(".")
  if (lastDot < 0) return originalUrl
  const stem = originalUrl.slice(0, lastDot)
  const ext = originalUrl.slice(lastDot)
  return `${stem}_${width}${ext}`
}

export function OptimizedImage({
  src,
  width,
  alt = "",
  variants = true,
  ...rest
}: OptimizedImageProps) {
  if (!src) {
    return (
      <div
        className="bg-frost-border/10 flex items-center justify-center"
        style={{ width: rest.style?.width, height: rest.style?.height }}
      >
        <span className="text-fg3 font-mono text-2xl">—</span>
      </div>
    )
  }

  const useVariants = variants && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(src)
  const srcSet = useVariants
    ? `${deriveVariant(src, 200)} 200w, ${deriveVariant(src, 400)} 400w, ${deriveVariant(src, 800)} 800w`
    : undefined

  // Default sizes: pick the smallest variant whose width covers `width`.
  const sizes = width ? `${Math.ceil(width)}px` : undefined

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        // If the variant set fails, retry with the original only
        const img = e.currentTarget
        if (img.srcset) {
          img.srcset = ""
          img.src = src
        }
      }}
      {...rest}
    />
  )
}
