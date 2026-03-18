/**
 * Centralized SEO composable for all public pages
 * Handles: useSeoMeta, canonical URL, Twitter Cards, JSON-LD, hreflang
 */
export function usePageSeo(options: {
  title: string
  description: string
  image?: string
  type?: string
  path: string
  jsonLd?: Record<string, unknown>
}) {
  const { t, locale } = useI18n()
  const SITE_URL = useSiteUrl()
  const canonicalUrl = `${SITE_URL}${options.path}`

  // Read vertical_config for per-vertical OG defaults
  const verticalConfig = useState<Record<string, unknown> | null>('vertical_config')
  const ogImageUrl = (verticalConfig.value?.og_image_url as string) || null
  const verticalName = verticalConfig.value?.name
    ? (verticalConfig.value.name as Record<string, string>)[locale.value] || null
    : null
  const verticalThemeColor = verticalConfig.value?.theme
    ? (verticalConfig.value.theme as Record<string, string>)['color_primary'] || null
    : null
  const DEFAULT_IMAGE = ogImageUrl || `${SITE_URL}/og-default.png`
  const siteName = verticalName || t('site.title')

  useSeoMeta({
    robots: 'index, follow',
    title: options.title,
    description: options.description,
    ogTitle: options.title,
    ogDescription: options.description,
    ogImage: options.image || DEFAULT_IMAGE,
    ogType: (options.type || 'website') as 'website',
    ogUrl: canonicalUrl,
    ogSiteName: siteName,
    twitterCard: 'summary_large_image',
    twitterTitle: options.title,
    twitterDescription: options.description,
    twitterImage: options.image || DEFAULT_IMAGE,
    ...(verticalThemeColor ? { themeColor: verticalThemeColor } : {}),
  })

  // Remove any existing locale prefix from path to get the base path
  const basePath = options.path.replace(/^\/(en|es)\//, '/').replace(/^\/(en|es)$/, '/')
  const cleanPath = basePath.startsWith('/') ? basePath : `/${basePath}`

  const headConfig: {
    link: { rel: string; href: string; hreflang?: string }[]
    script?: { type: string; innerHTML: string }[]
  } = {
    link: [
      { rel: 'canonical', href: canonicalUrl },
      // Hreflang tags
      { rel: 'alternate', hreflang: 'es', href: `${SITE_URL}${cleanPath}` },
      { rel: 'alternate', hreflang: 'en', href: `${SITE_URL}/en${cleanPath}` },
      { rel: 'alternate', hreflang: 'x-default', href: `${SITE_URL}${cleanPath}` },
    ],
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
