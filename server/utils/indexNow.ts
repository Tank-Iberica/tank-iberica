/**
 * IndexNow utility — notify search engines (Bing, Yandex) about new/updated URLs.
 *
 * Requires env vars:
 *   INDEXNOW_KEY     — random string you own (e.g. a UUID)
 *   NUXT_PUBLIC_SITE_URL — canonical origin, e.g. "https://tracciona.com"
 *
 * Key must be served at: {siteUrl}/api/indexnow-key (see server/api/indexnow-key.get.ts)
 *
 * Spec: https://www.indexnow.org/documentation
 */

import { getSiteUrl } from './siteConfig'

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

export interface IndexNowResult {
  ok: boolean
  status?: number
  urlCount: number
  skipped?: boolean
}

export async function sendIndexNow(urls: string[]): Promise<IndexNowResult> {
  const key = process.env.INDEXNOW_KEY
  const siteUrl = getSiteUrl()

  if (!key) {
    // No key configured — skip silently (not an error in dev)
    return { ok: true, skipped: true, urlCount: 0 }
  }

  if (!urls.length) {
    return { ok: true, urlCount: 0 }
  }

  const host = new URL(siteUrl).host
  const keyLocation = `${siteUrl}/api/indexnow-key`

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key, keyLocation, urlList: urls }),
    })

    // 200 = accepted, 202 = accepted (async), 422 = key mismatch
    return {
      ok: res.status === 200 || res.status === 202,
      status: res.status,
      urlCount: urls.length,
    }
  } catch {
    // Network error — don't fail the parent operation
    return { ok: false, urlCount: urls.length }
  }
}

/** Build a full vehicle URL from its slug */
export function vehicleUrl(slug: string, siteUrl: string): string {
  return `${siteUrl}/vehiculo/${slug}`
}

/** Build a full article URL from its slug */
export function articleUrl(slug: string, siteUrl: string): string {
  return `${siteUrl}/noticias/${slug}`
}
