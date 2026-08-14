import * as ImageManipulator from 'expo-image-manipulator';
import { File } from 'expo-file-system';
import { IMAGE_UPLOAD } from '@vitrine/constants';
import { supabase } from './supabase';
import { logger } from './logger';

const log = logger.create('ImageUtils');

/**
 * True only for plain on-disk files. `expo-file-system`'s `File` rejects
 * anything else (remote URLs, photo-library asset references, Live Photo
 * bundles) inside its native `validatePath`, which surfaces as an opaque
 * "wrong type" exception with no mention of the offending URI.
 */
export function isLocalFileUri(uri: string): boolean {
  return typeof uri === 'string' && uri.startsWith('file://');
}

/**
 * Return a readable on-disk `file://` URI. iOS pickers already give us one
 * (no extra work). Android Photo Picker often hands back `content://`, which
 * `expo-file-system` File rejects — copy through the manipulator into cache.
 */
export async function materializeLocalImageUri(uri: string): Promise<string | null> {
  if (isLocalFileUri(uri)) return uri;
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG },
    );
    if (isLocalFileUri(result.uri)) return result.uri;
    log.error('Materialize produced non-file URI:', result.uri);
    return null;
  } catch (err) {
    log.error('Failed to materialize local image:', uri, err);
    return null;
  }
}

/**
 * Read a file URI as an ArrayBuffer using expo-file-system.
 * This is the React-Native-safe replacement for `fetch(uri).blob()`,
 * which returns zero-byte blobs on RN and silently uploads empty files.
 */
async function readUriAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  if (!isLocalFileUri(uri)) {
    throw new Error(`Cannot read image bytes from unsupported URI: ${uri}`);
  }
  const file = new File(uri);
  return await file.arrayBuffer();
}

/**
 * Preset display widths. These are the WIDTHS requested from the Supabase
 * image transform endpoint (see getOptimizedUrl) — not separate stored files.
 */
export const IMAGE_SIZES = {
  thumbnail: 200,
  card: 400,
  detail: 800,
  full: 1200,
} as const;

/**
 * Compress and resize an image before uploading to storage.
 * Ensures the longest dimension is at most maxDimension px,
 * and the output is JPEG at the configured quality.
 *
 * This is also the flattening step for assets that aren't plain JPEGs —
 * iOS Live Photos and HEIC captures included. The manipulator always writes
 * a new file to cache, so a successful call guarantees a readable local file.
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
    // Falling back to the original is only safe when it is itself a readable
    // file. For anything else, failing here names the real problem instead of
    // deferring to an opaque native crash at read time (REACT-NATIVE-12).
    if (!isLocalFileUri(uri)) {
      log.error('Image conversion failed for unsupported source:', uri, err);
      throw new Error(`Unsupported image source: ${uri}`);
    }
    log.warn('Image compression failed, using original:', err);
    return uri;
  }
}

/**
 * Normalize an upload path to end in `.jpg`, regardless of the caller's
 * original filename. We always produce JPEG bytes via compressImage, so the
 * storage object must carry the matching extension to keep URL-based image
 * decoders happy.
 */
function normalizeJpgExtension(basePath: string): string {
  const lastDot = basePath.lastIndexOf('.');
  const lastSlash = basePath.lastIndexOf('/');
  if (lastDot === -1 || lastDot < lastSlash) return `${basePath}.jpg`;
  return `${basePath.slice(0, lastDot)}.jpg`;
}

/**
 * Upload ONE optimized original to a Supabase Storage bucket. All display
 * sizes are derived on demand by Supabase's image transform endpoint via
 * getOptimizedUrl — we no longer pre-generate per-width variant files.
 *
 * Returns the public URL of the stored original and its storage path. The
 * storage path is always normalized to `.jpg` since this pipeline always
 * produces JPEG bytes.
 */
export async function uploadImage(
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
    log.error('Error uploading image:', uploadError);
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(jpgPath);

  log.info('Image uploaded:', jpgPath, `${bytes.byteLength}B`);

  return { url: urlData.publicUrl, storagePath: uploadData.path };
}

const OBJECT_MARKER = '/storage/v1/object/public/';
const RENDER_MARKER = '/storage/v1/render/image/public/';

/**
 * Build a Supabase image-transform URL for the requested display width.
 *
 * Supabase resizes the stored original on demand and caches the result on the
 * CDN, so we store exactly ONE optimized original per image and derive every
 * size from it. Applies to ALL Supabase storage buckets, including legacy
 * `migrated/` paths — every existing item benefits retroactively. Non-Supabase
 * URLs (mock data, remote comps) are returned untouched.
 */
export function getOptimizedUrl(
  url: string,
  width: number,
  quality = 75,
): string {
  if (!url) return url;

  const idx = url.indexOf(OBJECT_MARKER);
  if (idx === -1) return url; // non-Supabase or already a render URL — leave as-is

  const origin = url.slice(0, idx); // e.g. https://<ref>.supabase.co
  const objectPath = url.slice(idx + OBJECT_MARKER.length).split('?')[0]; // {bucket}/{path}
  const w = Math.max(1, Math.round(width));

  return `${origin}${RENDER_MARKER}${objectPath}?width=${w}&quality=${quality}&resize=contain`;
}

/**
 * Strip a transform back to the raw stored original. Used as the onError
 * fallback in image components so a failed/disabled transform never renders
 * blank — we fall back to the full original bytes.
 */
export function getOriginalUrl(url: string): string {
  if (!url) return url;
  const idx = url.indexOf(RENDER_MARKER);
  if (idx === -1) return url;
  const origin = url.slice(0, idx);
  const objectPath = url.slice(idx + RENDER_MARKER.length).split('?')[0];
  return `${origin}${OBJECT_MARKER}${objectPath}`;
}
