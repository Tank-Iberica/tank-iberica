/**
 * useSiteUrl — Returns the canonical site URL.
 * Uses useRuntimeConfig() with try/catch so it's safe to call
 * inside computed(), watch(), or any reactive context.
 * Falls back to NUXT_PUBLIC_SITE_URL env var.
 */
export function useSiteUrl(): string {
  try {
    return (useRuntimeConfig().public.siteUrl as string) || ''
  } catch {
    return process.env.NUXT_PUBLIC_SITE_URL || ''
  }
}
