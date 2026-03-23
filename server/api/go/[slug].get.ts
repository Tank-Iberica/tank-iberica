/**
 * QR / Link redirect with analytics tracking.
 * GET /api/go/:slug?utm_source=qr&utm_medium=...
 * Records the event in analytics_events then redirects to the dealer portal.
 */
import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, message: 'Missing slug' })
  }

  const query = getQuery(event)
  const headers = getHeaders(event)
  const userAgent = headers['user-agent'] || ''

  // Detect device type from UA
  const isMobile = /mobile|android|iphone|ipod/i.test(userAgent)
  const isTablet = /tablet|ipad/i.test(userAgent)
  const deviceType = isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop'

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Look up dealer by slug to get id
    const { data: dealer } = await supabase.from('dealers').select('id').eq('slug', slug).single()

    if (dealer) {
      // Non-blocking insert
      supabase
        .from('analytics_events')
        .insert({
          event_type: query.utm_source === 'qr' ? 'qr_scan' : 'link_click',
          entity_type: 'dealer',
          entity_id: dealer.id,
          utm_source: (query.utm_source as string) || null,
          utm_medium: (query.utm_medium as string) || null,
          utm_campaign: (query.utm_campaign as string) || null,
          utm_content: (query.utm_content as string) || null,
          utm_term: (query.utm_term as string) || null,
          device_type: deviceType,
          metadata: {
            slug,
            referer: headers.referer || null,
          },
          vertical: 'trucks',
        })
        .then(() => {})
    }
  }

  // Redirect to dealer portal
  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl || 'https://tracciona.com'
  return sendRedirect(event, `${siteUrl}/${slug}`, 302)
})
