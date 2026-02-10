import { createClient } from '@supabase/supabase-js'
import { defineSitemapEventHandler } from '#imports'

export default defineSitemapEventHandler(async () => {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    return []
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const urls: { loc: string, lastmod?: string, priority?: number, changefreq?: string }[] = []

  // Fetch published vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('slug, updated_at')
    .eq('status', 'published')

  if (vehicles) {
    for (const v of vehicles) {
      urls.push({
        loc: `/vehiculo/${v.slug}`,
        lastmod: v.updated_at,
        priority: 0.8,
        changefreq: 'weekly',
      })
    }
  }

  // Fetch published news
  const { data: news } = await supabase
    .from('news')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')

  if (news) {
    for (const n of news) {
      urls.push({
        loc: `/noticias/${n.slug}`,
        lastmod: n.updated_at || n.published_at,
        priority: 0.6,
        changefreq: 'monthly',
      })
    }
  }

  return urls
})
