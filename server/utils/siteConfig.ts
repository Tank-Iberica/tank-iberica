// server/utils/siteConfig.ts
export function getSiteUrl(): string {
  return process.env.SITE_URL || process.env.NUXT_PUBLIC_SITE_URL || 'https://tracciona.com'
}

export function getSiteName(): string {
  return process.env.SITE_NAME || 'Tracciona'
}
