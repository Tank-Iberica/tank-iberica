export function useImageUrl() {
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

      if (parts.length > 0 && knownVariants.includes(parts[parts.length - 1])) {
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

  return { getImageUrl }
}
