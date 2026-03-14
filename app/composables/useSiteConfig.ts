/**
 * Client-side site configuration helpers.
 * Mirror of server/utils/siteConfig.ts for use in Vue components and composables.
 * Auto-imported by Nuxt — no explicit import needed.
 */
/**
 * @deprecated Use useSiteUrl() from ~/composables/useSiteUrl instead.
 * Kept as a no-export internal fallback for backwards compatibility.
 */
function _useSiteUrl(): string {
  try {
    return (useRuntimeConfig().public.siteUrl as string) || ''
  } catch {
    return process.env.NUXT_PUBLIC_SITE_URL || ''
  }
}

/**
 * @deprecated Use useSiteName() from ~/composables/useSiteName instead.
 * Kept as a no-export internal fallback for backwards compatibility.
 */
function _useSiteName(): string {
  try {
    return (useRuntimeConfig().public.siteName as string) || ''
  } catch {
    return process.env.NUXT_PUBLIC_SITE_NAME || ''
  }
}
