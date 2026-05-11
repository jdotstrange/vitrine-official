"use client"

import { useState, useCallback, useRef, useEffect } from "react"

const AR_DEVIATION_THRESHOLD = 0.25

interface AdaptiveImageProps {
  src: string
  alt: string
  targetAspectRatio?: number
  className?: string
}

/**
 * Web port of the consumer app's AdaptiveImage component.
 * When the source image's aspect ratio deviates >25% from the target,
 * renders a blurred fill behind the contained image to avoid harsh crops.
 */
export function AdaptiveImage({
  src,
  alt,
  targetAspectRatio = 4 / 5,
  className,
}: AdaptiveImageProps) {
  const [needsBlurFill, setNeedsBlurFill] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  const checkAspectRatio = useCallback(
    (img: HTMLImageElement) => {
      if (!img.naturalWidth || !img.naturalHeight) return
      const sourceAR = img.naturalWidth / img.naturalHeight
      const deviation = Math.abs(sourceAR - targetAspectRatio) / targetAspectRatio
      setNeedsBlurFill(deviation > AR_DEVIATION_THRESHOLD)
    },
    [targetAspectRatio]
  )

  useEffect(() => {
    const img = imgRef.current
    if (img && img.complete && img.naturalWidth) {
      checkAspectRatio(img)
    }
  }, [checkAspectRatio])

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      checkAspectRatio(e.currentTarget)
    },
    [checkAspectRatio]
  )

  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        aspectRatio: `${targetAspectRatio}`,
        backgroundColor: "#1E1E22",
      }}
    >
      {needsBlurFill && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover scale-110"
          style={{ filter: "blur(30px)" }}
        />
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onLoad={handleLoad}
        className={`absolute inset-0 w-full h-full ${
          needsBlurFill ? "object-contain" : "object-cover"
        }`}
      />
    </div>
  )
}
