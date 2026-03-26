/**
 * Vary headers middleware
 *
 * Adds correct Vary: Accept-Encoding, Accept-Language headers to all responses.
 * This instructs CDN (Cloudflare) to cache separate variants per encoding and language,
 * preventing compressed/uncompressed or EN/ES response collisions in cache.
 *
 * Applied to:
 *   - HTML pages: Vary: Accept-Encoding, Accept-Language
 *   - Public API responses: Vary: Accept-Encoding, Accept-Language
 *   - Static assets (/_nuxt/): Vary: Accept-Encoding only (language-agnostic)
 *
 * #145 Bloque 18
 */
import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
  const path = event.path || ''
  const res = event.node.res

  if (res.headersSent) return

  if (path.startsWith('/_nuxt/')) {
    // Static bundles: language-agnostic, encoding varies
    res.setHeader('Vary', 'Accept-Encoding')
    return
  }

  // HTML pages and API endpoints: both encoding and language vary
  res.setHeader('Vary', 'Accept-Encoding, Accept-Language')
})
