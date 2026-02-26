import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

/**
 * Google Merchant Center feed.
 *
 * Generates an RSS 2.0 feed with Google Shopping namespace
 * for free product listings in Google Shopping tab.
 *
 * Docs: https://support.google.com/merchants/answer/7052112
 */
export default defineEventHandler(async (event) => {
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
    setResponseStatus(event, 500)
    return `Error fetching vehicles: ${error.message}`
  }

  const siteUrl = 'https://tracciona.com'

  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  const items = (vehicles || [])
    .map((v) => {
      const title = escapeXml(`${v.brand} ${v.model}${v.year ? ` (${v.year})` : ''}`)
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
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Tracciona - Vehiculos Industriales</title>
    <link>${siteUrl}</link>
    <description>Compra, venta y alquiler de vehiculos industriales</description>
${items}
  </channel>
</rss>`

  // Add Cache-Control and ETag headers
  const etag = createHash('md5').update(xml).digest('hex')

  setResponseHeader(event, 'Cache-Control', 'public, max-age=43200, s-maxage=43200') // 12h
  setResponseHeader(event, 'ETag', `"${etag}"`)

  // Check If-None-Match for conditional requests
  const ifNoneMatch = getRequestHeader(event, 'if-none-match')
  if (ifNoneMatch === `"${etag}"`) {
    setResponseStatus(event, 304)
    return ''
  }

  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return xml
})
