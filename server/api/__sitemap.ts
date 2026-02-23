import { createClient } from '@supabase/supabase-js'
import { defineSitemapEventHandler } from '#imports'

export default defineSitemapEventHandler(async () => {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    return []
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const urls: {
    loc: string
    lastmod?: string
    priority?: number
    changefreq?: string
    images?: { loc: string; title?: string; caption?: string }[]
  }[] = []

  // Fetch published vehicles with images
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('slug, brand, model, year, updated_at, vehicle_images(url, alt_text)')
    .eq('status', 'published')

  if (vehicles) {
    for (const v of vehicles) {
      const images = (v.vehicle_images as { url: string; alt_text: string | null }[] | null) || []
      urls.push({
        loc: `/vehiculo/${v.slug}`,
        lastmod: v.updated_at,
        priority: 0.8,
        changefreq: 'weekly',
        images: images.map((img) => ({
          loc: img.url,
          title: img.alt_text || `${v.brand} ${v.model} ${v.year || ''} - Tracciona`,
          caption: img.alt_text || `${v.brand} ${v.model} ${v.year || ''}`,
        })),
      })
    }
  }

  // Fetch published news
  const { data: news } = await supabase
    .from('news')
    .select('slug, updated_at, published_at, article_type')
    .eq('status', 'published')

  if (news) {
    for (const n of news) {
      const prefix = n.article_type === 'guia' ? '/guia' : '/noticias'
      urls.push({
        loc: `${prefix}/${n.slug}`,
        lastmod: n.updated_at || n.published_at,
        priority: 0.6,
        changefreq: 'monthly',
      })
    }
  }

  // Fetch active landing pages
  const { data: landings } = await supabase
    .from('active_landings')
    .select('slug, last_calculated')
    .eq('is_active', true)

  if (landings) {
    for (const l of landings) {
      urls.push({
        loc: `/${l.slug}`,
        lastmod: l.last_calculated,
        priority: 0.7,
        changefreq: 'weekly',
      })
    }
  }

  // Fetch active auctions
  const { data: auctions } = await supabase
    .from('auctions')
    .select('id, title, starts_at, ends_at, updated_at')
    .in('status', ['scheduled', 'active'])
    .order('starts_at', { ascending: false })

  if (auctions) {
    for (const a of auctions) {
      urls.push({
        loc: `/subastas/${a.id}`,
        lastmod: a.updated_at || a.starts_at,
        priority: 0.7,
        changefreq: 'daily',
      })
    }
  }

  return urls
})
