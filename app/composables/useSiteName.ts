/**
 * useSiteName — Returns the canonical site name.
 * Uses useRuntimeConfig() with try/catch so it's safe to call
 * inside computed(), watch(), or any reactive context.
 * Fallback defined in nuxt.config.ts via NUXT_PUBLIC_SITE_NAME.
 */
export function useSiteName(): string {
  try {
    return useRuntimeConfig().public.siteName || ''
  } catch {
    return process.env.NUXT_PUBLIC_SITE_NAME || ''
  }
}
