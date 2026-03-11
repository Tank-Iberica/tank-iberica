import { defineEventHandler, getRequestHeader, setResponseHeader } from 'h3'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

type SitemapUrl = {
  loc: string
  lastmod?: string
  priority?: number
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  images?: { loc: string; title?: string; caption?: string }[]
}

function buildVehicleUrls(
  vehicles: Array<{
    slug: string
    brand: string
    model: string
    year: number | null
    updated_at: string
    vehicle_images: { url: string; alt_text: string | null }[] | null
  }>,
): SitemapUrl[] {
  return vehicles.map((v) => {
    const images = v.vehicle_images || []
    return {
      loc: `/vehiculo/${v.slug}`,
      lastmod: v.updated_at,
      priority: 0.8,
      changefreq: 'weekly' as const,
      images: images.map((img) => ({
        loc: img.url,
        title: img.alt_text || `${v.brand} ${v.model} ${v.year || ''} - Tracciona`,
        caption: img.alt_text || `${v.brand} ${v.model} ${v.year || ''}`,
      })),
    }
  })
}

function buildNewsUrls(
  news: Array<{
    slug: string
    updated_at: string | null
    published_at: string | null
    section: string | null
  }>,
): SitemapUrl[] {
  return news.map((n) => ({
    loc: `${n.section === 'guia' ? '/guia' : '/noticias'}/${n.slug}`,
    lastmod: n.updated_at || n.published_at || undefined,
    priority: 0.6,
    changefreq: 'monthly' as const,
  }))
}

function buildLandingUrls(
  landings: Array<{ slug: string; last_calculated: string | null }>,
): SitemapUrl[] {
  return landings.map((l) => ({
    loc: `/${l.slug}`,
    lastmod: l.last_calculated || undefined,
    priority: 0.7,
    changefreq: 'weekly' as const,
  }))
}

function buildAuctionUrls(
  auctions: Array<{ id: string; starts_at: string | null; updated_at: string | null }>,
): SitemapUrl[] {
  return auctions.map((a) => ({
    loc: `/subastas/${a.id}`,
    lastmod: a.updated_at || a.starts_at || undefined,
    priority: 0.7,
    changefreq: 'daily' as const,
  }))
}

function buildDealerUrls(
  dealers: Array<{ slug: string | null; updated_at: string | null }>,
): SitemapUrl[] {
  return dealers.map((d) => ({
    loc: `/${d.slug}`,
    lastmod: d.updated_at || new Date().toISOString(),
    changefreq: 'weekly' as const,
    priority: 0.6,
  }))
}

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=21600, s-maxage=21600') // 6h

  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    return []
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const [vehiclesRes, newsRes, landingsRes, auctionsRes, dealersRes] = await Promise.all([
    supabase
      .from('vehicles')
      .select('slug, brand, model, year, updated_at, vehicle_images(url, alt_text)')
      .eq('status', 'published'),
    supabase
      .from('news')
      .select('slug, updated_at, published_at, section')
      .eq('status', 'published'),
    supabase.from('active_landings').select('slug, last_calculated').eq('is_active', true),
    supabase
      .from('auctions')
      .select('id, starts_at, updated_at')
      .in('status', ['scheduled', 'active'])
      .order('starts_at', { ascending: false }),
    supabase.from('dealers').select('slug, updated_at').not('slug', 'is', null),
  ])

  const urls: SitemapUrl[] = [
    ...buildVehicleUrls((vehiclesRes.data || []) as Parameters<typeof buildVehicleUrls>[0]),
    ...buildNewsUrls((newsRes.data || []) as Parameters<typeof buildNewsUrls>[0]),
    ...buildLandingUrls((landingsRes.data || []) as Parameters<typeof buildLandingUrls>[0]),
    ...buildAuctionUrls((auctionsRes.data || []) as Parameters<typeof buildAuctionUrls>[0]),
    ...buildDealerUrls((dealersRes.data || []) as Parameters<typeof buildDealerUrls>[0]),
  ]

  // Generate ETag for conditional requests (304 Not Modified)
  const etag = createHash('md5').update(JSON.stringify(urls)).digest('hex')
  setResponseHeader(event, 'ETag', `"${etag}"`)

  // Check If-None-Match for conditional requests
  const ifNoneMatch = getRequestHeader(event, 'if-none-match')
  if (ifNoneMatch === `"${etag}"`) {
    setResponseStatus(event, 304)
    return []
  }

  return urls
})
