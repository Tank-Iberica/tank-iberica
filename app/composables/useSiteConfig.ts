/**
 * Client-side site configuration helpers.
 * Mirror of server/utils/siteConfig.ts for use in Vue components and composables.
 * Auto-imported by Nuxt — no explicit import needed.
 */
export function useSiteUrl(): string {
  try {
    return (useRuntimeConfig().public.siteUrl as string) || 'https://tracciona.com'
  } catch {
    return 'https://tracciona.com'
  }
}

export function useSiteName(): string {
  try {
    return (useRuntimeConfig().public.siteName as string) || 'Tracciona'
  } catch {
    return 'Tracciona'
  }
}
