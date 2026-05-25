/**
 * Generalized image upload utility.
 *
 * Extracted from app/v/upload/batch-processor.ts so single-item upload,
 * avatar upload, showcase cover, and message attachments can share the
 * same canvas-based optimization + variant generation pipeline.
 *
 * Mirrors apps/native/lib/api/uploadWithVariants but for File / Blob inputs.
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { IMAGE_UPLOAD } from "@vitrine/constants"

const VARIANT_WIDTHS = [200, 400, 800] as const
const MAX_DIMENSION = IMAGE_UPLOAD.maxDimension
const JPEG_QUALITY = IMAGE_UPLOAD.jpegQuality

export interface UploadResult {
  originalUrl: string
  /** Map of variant width to public URL. */
  variants: Record<number, string>
  /** Storage path of the original file (relative to bucket). */
  path: string
}

/**
 * Upload a single image with size variants.
 *
 * @param file - source File (any image format; converted to JPEG)
 * @param supabase - authenticated Supabase client
 * @param bucket - storage bucket name (default: collectible-images)
 * @param pathPrefix - path prefix inside the bucket (e.g., `${userId}`)
 */
export async function uploadImageWithVariants(
  file: File,
  supabase: SupabaseClient,
  options: {
    bucket?: string
    pathPrefix?: string
  } = {},
): Promise<UploadResult> {
  const bucket = options.bucket ?? IMAGE_UPLOAD.storageBucket
  const prefix = options.pathPrefix ? `${options.pathPrefix}/` : ""
  const path = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 9)}.jpg`

  const jpegBlob = await fileToJpegBlob(file)

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, jpegBlob, {
      contentType: "image/jpeg",
      upsert: false,
    })

  if (error) throw new Error(`Image upload failed: ${error.message}`)

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)

  const variants = await uploadVariants(supabase, bucket, path, file)

  return {
    originalUrl: urlData.publicUrl,
    variants,
    path: data.path,
  }
}

/**
 * Upload multiple files in parallel.
 */
export async function uploadImagesWithVariants(
  files: File[],
  supabase: SupabaseClient,
  options: {
    bucket?: string
    pathPrefix?: string
    onProgress?: (done: number, total: number) => void
  } = {},
): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  for (let i = 0; i < files.length; i++) {
    const result = await uploadImageWithVariants(files[i], supabase, options)
    results.push(result)
    options.onProgress?.(i + 1, files.length)
  }
  return results
}

/**
 * Convert a File to a JPEG Blob with the longest dimension capped at
 * MAX_DIMENSION. Matches native behavior.
 */
export function fileToJpegBlob(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const longest = Math.max(img.width, img.height)
      const scale = longest > MAX_DIMENSION ? MAX_DIMENSION / longest : 1
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)

      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        URL.revokeObjectURL(img.src)
        reject(new Error("Canvas 2D context unavailable"))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src)
          if (blob) resolve(blob)
          else reject(new Error("Canvas toBlob returned null"))
        },
        "image/jpeg",
        JPEG_QUALITY,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error("Failed to load image"))
    }
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Resize an image to a given max width.
 */
export function resizeToBlob(file: File, maxWidth: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)

      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        URL.revokeObjectURL(img.src)
        reject(new Error("Canvas 2D context unavailable"))
        return
      }
      ctx.drawImage(img, 0, 0, w, h)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(img.src)
          if (blob) resolve(blob)
          else reject(new Error("Canvas toBlob returned null"))
        },
        "image/jpeg",
        JPEG_QUALITY,
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(img.src)
      reject(new Error("Failed to load image for resize"))
    }
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Upload size variants matching the native naming convention
 * ({stem}_{width}.jpg). Returns a map of width -> publicUrl.
 */
export async function uploadVariants(
  supabase: SupabaseClient,
  bucket: string,
  basePath: string,
  source: File | Blob,
): Promise<Record<number, string>> {
  const lastDot = basePath.lastIndexOf(".")
  const stem = basePath.slice(0, lastDot)
  const ext = basePath.slice(lastDot)

  const file = source instanceof File ? source : new File([source], "src.jpg", { type: "image/jpeg" })

  const variants: Record<number, string> = {}

  await Promise.all(
    VARIANT_WIDTHS.map(async (width) => {
      try {
        const blob = await resizeToBlob(file, width)
        const variantPath = `${stem}_${width}${ext}`
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(variantPath, blob, {
            contentType: "image/jpeg",
            upsert: false,
          })

        if (!error && data) {
          const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
          variants[width] = urlData.publicUrl
        }
      } catch {
        // best-effort
      }
    }),
  )

  return variants
}

/**
 * Get the optimized URL for a given size variant. Mirrors native's
 * getOptimizedUrl helper used by OptimizedImage.
 */
export function getOptimizedUrl(originalUrl: string, width: 200 | 400 | 800): string {
  if (!originalUrl) return originalUrl
  const lastDot = originalUrl.lastIndexOf(".")
  if (lastDot < 0) return originalUrl
  const stem = originalUrl.slice(0, lastDot)
  const ext = originalUrl.slice(lastDot)
  return `${stem}_${width}${ext}`
}
