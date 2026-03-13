/**
 * GET /robots.txt
 *
 * Dynamically generated from env vars so each vertical deployment
 * references its own domain in the Sitemap directive.
 * Falls back to tracciona.com if NUXT_PUBLIC_SITE_URL is not set.
 */
import { defineEventHandler, setResponseHeader } from 'h3'

export default defineEventHandler((event) => {
  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=86400, s-maxage=86400')

  const siteUrl = getSiteUrl().replace(/\/$/, '')

  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /auth/',
    'Disallow: /dashboard/',
    'Disallow: /confirm',
    'Disallow: /perfil/',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    '',
  ].join('\n')
})
