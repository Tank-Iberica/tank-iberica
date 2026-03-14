import { defineEventHandler, setResponseHeader } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { makeEtag, checkEtag } from '../utils/etag'
import { getSiteUrl, getSiteName } from '../utils/siteConfig'
import { logger } from '../utils/logger'

/**
 * Google Merchant Center feed.
 *
 * Generates an RSS 2.0 feed with Google Shopping namespace
 * for free product listings in Google Shopping tab.
 * Only populates items when there are at least MERCHANT_FEED_MIN_ITEMS valid listings
 * (with image + price) to avoid thin-content penalties in GMC.
 *
 * Docs: https://support.google.com/merchants/answer/7052112
 * Backlog #165 — Google Merchant Center feed activar
 */

export default defineEventHandler(async (event) => {
  /** Minimum valid items required before the feed is populated. Override with MERCHANT_FEED_MIN_ITEMS env var. */
  const feedMinItems = Number(process.env.MERCHANT_FEED_MIN_ITEMS ?? '50')
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    setResponseStatus(event, 500)
    return 'Missing service configuration'
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const now = new Date().toISOString()

  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select(
      'id, slug, brand, model, year, price, description_es, category, vehicle_images(url, position)',
    )
    .eq('status', 'published')
    .or(`visible_from.is.null,visible_from.lte.${now}`)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) {
    logger.error('[merchant-feed] Error fetching vehicles', { error: String(error) })
    setResponseStatus(event, 500)
    return 'Internal server error'
  }

  const siteUrl = getSiteUrl()
  const siteName = getSiteName()

  const escapeXml = (str: string): string => {
    return str
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;')
  }

  const items = (vehicles || [])
    .map((v) => {
      const yearPart = v.year ? ` (${v.year})` : ''
      const title = escapeXml(`${v.brand} ${v.model}${yearPart}`)
      const description = escapeXml(
        v.description_es
          ? v.description_es.substring(0, 5000)
          : `${v.brand} ${v.model} - vehiculo industrial ${v.category}`,
      )
      const link = `${siteUrl}/vehiculo/${v.slug}`
      const images = (v.vehicle_images as Array<{ url: string; position: number }>) || []
      const sortedImages = [...images].sort((a, b) => a.position - b.position)
      const imageLink = sortedImages.length > 0 ? escapeXml(sortedImages[0]!.url) : ''
      const price = v.price ? `${v.price.toFixed(2)} EUR` : ''

      if (!imageLink || !price) return ''

      return `    <item>
      <g:id>${escapeXml(v.id)}</g:id>
      <title>${title}</title>
      <description>${description}</description>
      <link>${link}</link>
      <g:image_link>${imageLink}</g:image_link>
      <g:price>${price}</g:price>
      <g:availability>in stock</g:availability>
      <g:condition>used</g:condition>
      <g:brand>${escapeXml(v.brand)}</g:brand>
    </item>`
    })
    .filter(Boolean)

  // Below minimum threshold: return valid but empty feed to avoid GMC thin-content issues
  const itemsXml = items.length >= feedMinItems ? items.join('\n') : ''

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(siteName)} - Vehiculos Industriales</title>
    <link>${siteUrl}</link>
    <description>Compra, venta y alquiler de vehiculos industriales</description>
${itemsXml}
  </channel>
</rss>`

  if (items.length < feedMinItems) {
    setResponseHeader(
      event,
      'X-Feed-Status',
      `pending-minimum-threshold (${items.length}/${feedMinItems})`,
    )
  }

  setResponseHeader(event, 'Cache-Control', 'public, max-age=43200, s-maxage=43200') // 12h
  const etag = makeEtag(xml)
  if (checkEtag(event, etag)) return ''

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return xml
})
