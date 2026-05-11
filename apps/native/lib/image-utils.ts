import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { IMAGE_UPLOAD } from './constants';
import { supabase } from './supabase';
import { logger } from './logger';

const log = logger.create('ImageUtils');

/**
 * Read a file URI as an ArrayBuffer using expo-file-system.
 * This is the React-Native-safe replacement for `fetch(uri).blob()`,
 * which returns zero-byte blobs on RN and silently uploads empty files.
 */
async function readUriAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const file = new File(uri);
  return await file.arrayBuffer();
}

/** Preset widths for common display contexts */
export const IMAGE_SIZES = {
  thumbnail: 200,
  card: 400,
  detail: 800,
  full: 1200,
} as const;

const VARIANT_WIDTHS = [
  IMAGE_SIZES.thumbnail,
  IMAGE_SIZES.card,
  IMAGE_SIZES.detail,
] as const;

/**
 * Compress and resize an image before uploading to storage.
 * Ensures the longest dimension is at most MAX_DIMENSION px,
 * and the output is JPEG at the configured quality.
 */
export async function compressImage(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: IMAGE_UPLOAD.maxDimension } }],
      {
        compress: IMAGE_UPLOAD.jpegQuality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    log.debug('Compressed image:', {
      original: uri.slice(-30),
      compressed: result.uri.slice(-30),
    });

    return result.uri;
  } catch (err) {
    log.warn('Image compression failed, using original:', err);
    return uri;
  }
}

/**
 * Resize an image to a specific width.
 */
async function resizeImage(uri: string, width: number): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width } }],
    {
      compress: IMAGE_UPLOAD.jpegQuality,
      format: ImageManipulator.SaveFormat.JPEG,
    }
  );
  return result.uri;
}

/**
 * Insert a size suffix before the file extension.
 * e.g. "user123/abc.jpg" -> "user123/abc_400.jpg"
 */
function variantPath(basePath: string, width: number): string {
  const lastDot = basePath.lastIndexOf('.');
  if (lastDot === -1) return `${basePath}_${width}`;
  return `${basePath.slice(0, lastDot)}_${width}${basePath.slice(lastDot)}`;
}

/**
 * Normalize an upload path to end in `.jpg`, regardless of the caller's
 * original filename. We always produce JPEG bytes via compressImage/resizeImage,
 * so the storage object must carry the matching extension to keep URL-based
 * image decoders happy.
 */
function normalizeJpgExtension(basePath: string): string {
  const lastDot = basePath.lastIndexOf('.');
  const lastSlash = basePath.lastIndexOf('/');
  if (lastDot === -1 || lastDot < lastSlash) return `${basePath}.jpg`;
  return `${basePath.slice(0, lastDot)}.jpg`;
}

/**
 * Upload an image and all size variants to a Supabase Storage bucket.
 * Returns the public URL of the original (full-size) image.
 *
 * Variant files are stored alongside the original with a _<width> suffix
 * so getOptimizedUrl can resolve them without hitting the transform endpoint.
 *
 * IMPORTANT: The storage path is always normalized to end in `.jpg` since
 * this pipeline always produces JPEG bytes.
 */
export async function uploadWithVariants(
  bucket: string,
  basePath: string,
  imageUri: string,
  options?: { upsert?: boolean },
): Promise<{ url: string; storagePath: string }> {
  const jpgPath = normalizeJpgExtension(basePath);

  const compressedUri = await compressImage(imageUri);

  const bytes = await readUriAsArrayBuffer(compressedUri);
  if (bytes.byteLength === 0) {
    log.error('Upload aborted: 0-byte file for', compressedUri);
    throw new Error('Image produced zero bytes; refusing to upload empty file');
  }

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(jpgPath, bytes, {
      contentType: 'image/jpeg',
      upsert: options?.upsert ?? false,
    });

  if (uploadError) {
    log.error('Error uploading original:', uploadError);
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(jpgPath);
  const publicUrl = urlData.publicUrl;

  log.info('Original uploaded:', jpgPath, `${bytes.byteLength}B`);

  // Generate and upload variants in parallel (best-effort)
  const variantJobs = VARIANT_WIDTHS.map(async (width) => {
    try {
      const resizedUri = await resizeImage(compressedUri, width);
      const variantBytes = await readUriAsArrayBuffer(resizedUri);
      if (variantBytes.byteLength === 0) {
        log.warn(`Variant ${width}px produced 0 bytes, skipping`);
        return;
      }
      const vPath = variantPath(jpgPath, width);

      const { error } = await supabase.storage
        .from(bucket)
        .upload(vPath, variantBytes, {
          contentType: 'image/jpeg',
          upsert: options?.upsert ?? false,
        });

      if (error) {
        log.warn(`Variant ${width}px upload failed:`, error.message);
      } else {
        log.debug(`Variant ${width}px uploaded:`, vPath, `${variantBytes.byteLength}B`);
      }
    } catch (err) {
      log.warn(`Variant ${width}px generation failed:`, err);
    }
  });

  await Promise.allSettled(variantJobs);

  return { url: publicUrl, storagePath: uploadData.path };
}

/**
 * Upload only the compressed original — no variants. Returns the compressedUri
 * so the caller can fire generateVariantsBackground() separately without
 * re-compressing.
 */
export async function uploadOriginalOnly(
  bucket: string,
  basePath: string,
  imageUri: string,
  options?: { upsert?: boolean },
): Promise<{ url: string; storagePath: string; compressedUri: string }> {
  const jpgPath = normalizeJpgExtension(basePath);
  const compressedUri = await compressImage(imageUri);

  const bytes = await readUriAsArrayBuffer(compressedUri);
  if (bytes.byteLength === 0) {
    log.error('Upload aborted: 0-byte file for', compressedUri);
    throw new Error('Image produced zero bytes; refusing to upload empty file');
  }

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(jpgPath, bytes, {
      contentType: 'image/jpeg',
      upsert: options?.upsert ?? false,
    });

  if (uploadError) {
    log.error('Error uploading original:', uploadError);
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(jpgPath);
  log.info('Original uploaded (fast path):', jpgPath, `${bytes.byteLength}B`);

  return { url: urlData.publicUrl, storagePath: jpgPath, compressedUri };
}

/**
 * Generate and upload size variants for an already-compressed image.
 * Fire-and-forget — logs failures but never throws.
 */
export function generateVariantsBackground(
  bucket: string,
  storagePath: string,
  compressedUri: string,
  options?: { upsert?: boolean },
): void {
  const variantJobs = VARIANT_WIDTHS.map(async (width) => {
    try {
      const resizedUri = await resizeImage(compressedUri, width);
      const variantBytes = await readUriAsArrayBuffer(resizedUri);
      if (variantBytes.byteLength === 0) {
        log.warn(`Variant ${width}px produced 0 bytes, skipping`);
        return;
      }
      const vPath = variantPath(storagePath, width);

      const { error } = await supabase.storage
        .from(bucket)
        .upload(vPath, variantBytes, {
          contentType: 'image/jpeg',
          upsert: options?.upsert ?? false,
        });

      if (error) {
        log.warn(`BG variant ${width}px upload failed:`, error.message);
      } else {
        log.debug(`BG variant ${width}px uploaded:`, vPath);
      }
    } catch (err) {
      log.warn(`BG variant ${width}px generation failed:`, err);
    }
  });

  Promise.allSettled(variantJobs).then(() => {
    log.info('Background variants complete for:', storagePath);
  });
}

/**
 * Resolve the best pre-generated variant URL for a given display width.
 * Falls back to the original URL if it's not a Supabase storage URL,
 * if requesting full size, or if the image wasn't uploaded through
 * the variant pipeline.
 *
 * Images uploaded via uploadWithVariants() have filenames like
 * {userId}/{timestamp}-{rand}.jpg — we only rewrite those.
 * All other Supabase storage URLs (e.g. mock data, legacy migrated/)
 * are returned as-is to avoid 404s.
 */
export function getOptimizedUrl(
  url: string,
  width: number,
  _quality?: number,
): string {
  if (!url) return url;

  const isSupabaseStorage = url.includes('/storage/v1/object/public/');
  if (!isSupabaseStorage) return url;

  if (width >= IMAGE_SIZES.full) return url;

  // Only rewrite URLs that match the uploadWithVariants naming pattern:
  // .../{userId}/{timestamp}-{randomChars}.{ext}
  // or .../{userId}/{timestamp}.{ext} (avatars)
  const filenameMatch = url.match(/\/([^/]+\/\d{13,}[^/]*)\.[^.]+$/);
  if (!filenameMatch) return url;

  const bestWidth = VARIANT_WIDTHS.find((w) => w >= width) ?? VARIANT_WIDTHS[VARIANT_WIDTHS.length - 1];

  const lastDot = url.lastIndexOf('.');
  if (lastDot === -1) return url;

  return `${url.slice(0, lastDot)}_${bestWidth}${url.slice(lastDot)}`;
}
