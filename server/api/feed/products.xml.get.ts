/**
 * GET /api/feed/products.xml
 *
 * Meta Dynamic Product Ads (DPA) compatible feed.
 * Returns published vehicles in XML format compatible with Meta Commerce Manager.
 *
 * Backlog #73 — Feed DPA compatible con Meta
 */
import { serverSupabaseServiceRole } from '#supabase/server'

interface FeedVehicle {
  id: string
  title: string
  brand: string | null
  model: string | null
  price: number | null
  images: string[] | null
  status: string
  location_province: string | null
  year: number | null
  slug: string | null
  created_at: string
  subcategories: { name_es: string; name_en: string } | null
}

function escapeXml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

export default defineEventHandler(async (event) => {
  const db = serverSupabaseServiceRole(event)
  const siteUrl = getSiteUrl().replace(/\/$/, '')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: vehicles } = await (db as any)
    .from('vehicles')
    .select(
      'id, title, brand, model, price, images, status, location_province, year, slug, created_at, subcategories(name_es, name_en)',
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(5000)

  const items = (vehicles || []) as FeedVehicle[]

  const xmlItems = items.map((v) => {
    const title = escapeXml(v.title || `${v.brand || ''} ${v.model || ''}`.trim() || 'Vehicle')
    const imageUrl = v.images?.[0] || ''
    const link = `${siteUrl}/vehiculo/${v.slug || v.id}`
    const price = v.price ? `${v.price} EUR` : ''
    const condition = 'used'
    const category = v.subcategories?.name_en || v.subcategories?.name_es || 'Vehicle'
    const availability = 'in stock'

    return `  <item>
    <g:id>${escapeXml(v.id)}</g:id>
    <g:title>${title}</g:title>
    <g:description>${title}${v.year ? ` (${v.year})` : ''}${v.location_province ? ` — ${escapeXml(v.location_province)}` : ''}</g:description>
    <g:link>${escapeXml(link)}</g:link>
    <g:image_link>${escapeXml(imageUrl)}</g:image_link>
    <g:condition>${condition}</g:condition>
    <g:availability>${availability}</g:availability>
    <g:price>${price}</g:price>
    <g:brand>${escapeXml(v.brand || 'Unknown')}</g:brand>
    <g:google_product_category>Vehicles &amp; Parts &gt; Vehicles</g:google_product_category>
    <g:product_type>${escapeXml(category)}</g:product_type>
  </item>`
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>${escapeXml(getSiteName())} — Product Feed</title>
  <link>${escapeXml(siteUrl)}</link>
  <description>Vehicle listings from ${escapeXml(getSiteName())}</description>
${xmlItems.join('\n')}
</channel>
</rss>`

  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=3600')

  return xml
})
