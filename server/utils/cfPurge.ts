/**
 * Cloudflare cache purge utility.
 * Purges specific URLs from Cloudflare's edge cache when content changes.
 *
 * Backlog #236 — CDN purge API (vehicle edit → purge URL automático)
 *
 * Requires env vars:
 *   CF_ZONE_ID — Cloudflare zone ID
 *   CF_API_TOKEN — Cloudflare API token with zone.cache_purge permission
 */
import { logger } from './logger'

const CF_API_BASE = 'https://api.cloudflare.com/client/v4'

/**
 * Purge specific URLs from Cloudflare cache.
 * Fire-and-forget: logs errors but never throws.
 */
export async function purgeUrls(urls: string[]): Promise<void> {
  const zoneId = process.env.CF_ZONE_ID
  const apiToken = process.env.CF_API_TOKEN

  if (!zoneId || !apiToken) {
    logger.info('[cfPurge] Skipping: CF_ZONE_ID or CF_API_TOKEN not configured')
    return
  }

  if (urls.length === 0) return

  // CF API supports up to 30 URLs per request
  const BATCH_SIZE = 30
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE)
    try {
      const response = await fetch(`${CF_API_BASE}/zones/${zoneId}/purge_cache`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ files: batch }),
      })

      if (!response.ok) {
        const body = await response.text()
        logger.warn('[cfPurge] Purge failed', { status: response.status, body: body.slice(0, 200) })
      } else {
        logger.info('[cfPurge] Purged URLs', { count: batch.length })
      }
    } catch (err) {
      logger.warn('[cfPurge] Purge error', { error: String(err) })
    }
  }
}

/**
 * Purge cache for a vehicle detail page and related pages.
 * Call this after a vehicle is edited, sold, or deleted.
 */
export function purgeVehicleCache(slug: string): void {
  const siteUrl = getSiteUrl().replace(/\/$/, '')

  const urls = [
    `${siteUrl}/vehiculo/${slug}`,
    `${siteUrl}/catalogo`,
    `${siteUrl}/`,
    `${siteUrl}/api/feed/products.xml`,
  ]

  void purgeUrls(urls)
}
