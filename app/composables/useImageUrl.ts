/**
 * Build a correctly-sized image URL for a given delivery variant.
 *
 * Supports two providers:
 * - **Cloudflare Images** (`imagedelivery.net`) — appends the variant segment.
 * - **Cloudinary** — replaces the transformation segment with preset parameters.
 * - Falls back to the original URL for any other host.
 *
 * @param url - Raw image URL stored in the DB (may be null/undefined).
 * @param variant - Requested size variant. Defaults to `'card'`.
 * @returns A fully-qualified image URL, or `/placeholder-vehicle.svg` for missing images.
 */
function getImageUrl(
  url: string | null | undefined,
  variant: 'thumb' | 'card' | 'gallery' | 'og' = 'card',
): string {
  if (!url) return '/placeholder-vehicle.svg'

  // CF Images: URL contains imagedelivery.net
  // Format: https://imagedelivery.net/{hash}/{image-id}/{variant}
  if (url.includes('imagedelivery.net')) {
    const parts = url.split('/')
    const knownVariants = ['thumb', 'card', 'gallery', 'og', 'public']

    if (parts.length && knownVariants.includes(parts.at(-1)!)) {
      parts[parts.length - 1] = variant
    } else {
      parts.push(variant)
    }

    return parts.join('/')
  }

  // Cloudinary: URL contains cloudinary.com
  // Insert transformation after /upload/
  if (url.includes('cloudinary.com')) {
    const transformations: Record<string, string> = {
      thumb: 'w_300,h_200,c_fill,g_auto,q_auto,f_webp',
      card: 'w_600,h_400,c_fill,g_auto,q_auto,f_webp',
      gallery: 'w_1200,h_800,c_fill,g_auto,q_auto,f_webp',
      og: 'w_1200,h_630,c_fill,g_auto,q_auto,f_webp',
    }

    const transformation = transformations[variant]

    if (transformation && url.includes('/upload/')) {
      return url.replace('/upload/', `/upload/${transformation}/`)
    }

    return url
  }

  // Fallback: return as-is
  return url
}
function getVersionedUrl(url: string, version: string | number): string {
  if (!url || url === '/placeholder-vehicle.svg') return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${encodeURIComponent(version)}`
}

export function useImageUrl() {
  /**
   * Append a `?v=` cache-busting parameter to any image URL.
   * The CDNs (Cloudinary, CF Images) handle long-term caching automatically,
   * so this function is only needed for manual invalidation (e.g., after an image is replaced).
   *
   * Usage: getVersionedUrl(getImageUrl(url, 'card'), vehicle.updated_at)
   */
  return { getImageUrl, getVersionedUrl }
}
