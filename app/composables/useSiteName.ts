/**
 * useSiteName � Returns the canonical site name from nuxt-site-config.
 * Falls back to 'Tracciona'.
 */
export function useSiteName(): string {
  const config = useSiteConfig()
  return config.name || 'Tracciona'
}
