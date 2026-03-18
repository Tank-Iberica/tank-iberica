// server/utils/siteConfig.ts
export function getSiteUrl(): string {
  return process.env.SITE_URL || process.env.NUXT_PUBLIC_SITE_URL || 'https://tracciona.com'
}

export function getSiteName(): string {
  return process.env.SITE_NAME || 'Tracciona'
}

export function getSiteEmail(): string {
  return (
    process.env.SITE_EMAIL || `hola@${getSiteUrl().replace('https://', '').replace('http://', '')}`
  )
}

/**
 * Brand colors for server-side email templates.
 * Future: load from vertical_config table.
 */
export const BRAND_COLORS = {
  primary: process.env.BRAND_COLOR_PRIMARY || '#23424A',
  primaryDark: process.env.BRAND_COLOR_PRIMARY_DARK || '#1a3236',
  accent: process.env.BRAND_COLOR_ACCENT || '#E8A838',
  white: '#ffffff',
  gray100: '#f7fafc',
  gray600: '#718096',
  gray800: '#2d3748',
} as const
