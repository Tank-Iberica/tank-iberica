/**
 * useSiteUrl � Returns the canonical site URL from nuxt-site-config.
 * Falls back to NUXT_PUBLIC_SITE_URL env or 'https://tracciona.com'.
 */
export function useSiteUrl(): string {
  const config = useSiteConfig()
  return config.url || 'https://tracciona.com'
}
