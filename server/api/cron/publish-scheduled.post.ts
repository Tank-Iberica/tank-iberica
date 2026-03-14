/**
 * Cron endpoint: Publishes scheduled content that is ready to go live.
 *
 * Handles two types of scheduled content:
 * 1. News articles (news table): status='scheduled' AND scheduled_at <= now
 * 2. Vehicles (vehicles table): status='draft' AND scheduled_publish_at <= now
 *
 * Protected by a secret header: x-cron-secret.
 * Called by an external cron job or Cloudflare Worker.
 *
 * POST /api/cron/publish-scheduled
 * Header: x-cron-secret: <CRON_SECRET>
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { sendIndexNow, vehicleUrl, articleUrl } from '../../utils/indexNow'
import { getSiteUrl } from '../../utils/siteConfig'
import { purgeVehicleCache } from '../../utils/cfPurge'

interface ScheduledArticle {
  id: string
  title_es: string
  slug: string
}

interface ScheduledVehicle {
  id: string
  title_es: string
  slug: string
}

export default defineEventHandler(async (event) => {
  // Verify cron secret
  verifyCronSecret(event)

  const supabase = serverSupabaseServiceRole(event)
  const now = new Date().toISOString()

  // ── 1. Publish scheduled news articles ──────────────────────────────────

  const { data: articles, error: fetchArticleErr } = await supabase
    .from('news')
    .select('id, title_es, slug')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)

  if (fetchArticleErr) {
    throw safeError(500, `Fetch scheduled articles failed: ${fetchArticleErr.message}`)
  }

  let publishedArticles = 0
  if (articles && articles.length > 0) {
    const typedArticles = articles as ScheduledArticle[]
    const ids = typedArticles.map((a) => a.id)
    const { error: updateErr } = await supabase
      .from('news')
      .update({ status: 'published', published_at: now, updated_at: now })
      .in('id', ids)

    if (updateErr) {
      throw safeError(500, `Update scheduled articles failed: ${updateErr.message}`)
    }
    publishedArticles = typedArticles.length
  }

  // ── 2. Publish scheduled vehicles ────────────────────────────────────────

  const { data: vehicles, error: fetchVehicleErr } = await supabase
    .from('vehicles')
    .select('id, title_es, slug')
    .eq('status', 'draft')
    .not('scheduled_publish_at', 'is', null)
    .lte('scheduled_publish_at', now)

  if (fetchVehicleErr) {
    throw safeError(500, `Fetch scheduled vehicles failed: ${fetchVehicleErr.message}`)
  }

  let publishedVehicles = 0
  if (vehicles && vehicles.length > 0) {
    const typedVehicles = vehicles as ScheduledVehicle[]
    const ids = typedVehicles.map((v) => v.id)
    const { error: updateErr } = await supabase
      .from('vehicles')
      .update({
        status: 'published',
        published_at: now,
        updated_at: now,
        scheduled_publish_at: null,
      })
      .in('id', ids)

    if (updateErr) {
      throw safeError(500, `Update scheduled vehicles failed: ${updateErr.message}`)
    }
    publishedVehicles = typedVehicles.length
  }

  // ── 3. Purge Cloudflare cache for newly published vehicles ────────────────
  if (vehicles && vehicles.length > 0) {
    for (const v of vehicles as ScheduledVehicle[]) {
      purgeVehicleCache(v.slug)
    }
  }

  // ── 4. Notify IndexNow for all newly published content ────────────────────
  const siteUrl = getSiteUrl()

  const indexNowUrls: string[] = [
    ...((articles as ScheduledArticle[] | null) ?? []).map((a) => articleUrl(a.slug, siteUrl)),
    ...((vehicles as ScheduledVehicle[] | null) ?? []).map((v) => vehicleUrl(v.slug, siteUrl)),
  ]

  if (indexNowUrls.length > 0) {
    await sendIndexNow(indexNowUrls)
  }

  return {
    articles: { published: publishedArticles },
    vehicles: { published: publishedVehicles },
    total: publishedArticles + publishedVehicles,
  }
})
