/**
 * Centralized SEO composable for all public pages
 * Handles: useSeoMeta, canonical URL, Twitter Cards, JSON-LD
 */
export function usePageSeo(options: {
  title: string
  description: string
  image?: string
  type?: string
  path: string
  jsonLd?: Record<string, unknown>
}) {
  const SITE_URL = 'https://tracciona.com'
  const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`
  const canonicalUrl = `${SITE_URL}${options.path}`

  useSeoMeta({
    robots: 'index, follow',
    title: options.title,
    description: options.description,
    ogTitle: options.title,
    ogDescription: options.description,
    ogImage: options.image || DEFAULT_IMAGE,
    ogType: options.type || 'website',
    ogUrl: canonicalUrl,
    ogSiteName: 'Tracciona',
    twitterCard: 'summary_large_image',
    twitterTitle: options.title,
    twitterDescription: options.description,
    twitterImage: options.image || DEFAULT_IMAGE,
  })

  const headConfig: {
    link: { rel: string; href: string }[]
    script?: { type: string; innerHTML: string }[]
  } = {
    link: [{ rel: 'canonical', href: canonicalUrl }],
  }

  if (options.jsonLd) {
    headConfig.script = [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(options.jsonLd),
      },
    ]
  }

  useHead(headConfig)
}
