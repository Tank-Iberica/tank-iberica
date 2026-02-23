/**
 * Generates hreflang link tags for SEO
 * Supports es (default, no prefix) and en (prefix /en/)
 */
export function useHreflang(path: string) {
  const SITE_URL = 'https://tracciona.com'

  // Remove any existing locale prefix from path to get the base path
  const basePath = path.replace(/^\/(en|es)\//, '/').replace(/^\/(en|es)$/, '/')

  // Ensure path starts with /
  const cleanPath = basePath.startsWith('/') ? basePath : `/${basePath}`

  const hreflangLinks = [
    {
      rel: 'alternate',
      hreflang: 'es',
      href: `${SITE_URL}${cleanPath}`,
    },
    {
      rel: 'alternate',
      hreflang: 'en',
      href: `${SITE_URL}/en${cleanPath}`,
    },
    {
      rel: 'alternate',
      hreflang: 'x-default',
      href: `${SITE_URL}${cleanPath}`,
    },
  ]

  useHead({
    link: hreflangLinks,
  })

  return {
    hreflangLinks,
  }
}
