/**
 * Cron endpoint: Publishes articles with status='scheduled' and scheduled_at <= now.
 * Protected by a secret header: x-cron-secret.
 * Called by an external cron job or Cloudflare Worker.
 *
 * POST /api/cron/publish-scheduled
 * Header: x-cron-secret: <CRON_SECRET>
 */
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'

interface ScheduledArticle {
  id: string
  title_es: string
  slug: string
}

export default defineEventHandler(async (event) => {
  // Verify cron secret
  verifyCronSecret(event)

  const supabase = serverSupabaseServiceRole(event)

  // Find articles ready to publish
  const now = new Date().toISOString()
  const { data: articles, error: fetchErr } = await supabase
    .from('news')
    .select('id, title_es, slug')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)

  if (fetchErr) {
    throw safeError(500, `Fetch scheduled articles failed: ${fetchErr.message}`)
  }

  if (!articles || articles.length === 0) {
    return { published: 0, articles: [] }
  }

  // Update all matching articles to published
  const typedArticles = articles as ScheduledArticle[]
  const ids = typedArticles.map((a) => a.id)
  const { error: updateErr } = await supabase
    .from('news')
    .update({
      status: 'published',
      published_at: now,
      updated_at: now,
    })
    .in('id', ids)

  if (updateErr) {
    throw safeError(500, `Update scheduled articles failed: ${updateErr.message}`)
  }

  return {
    published: typedArticles.length,
    articles: typedArticles.map((a) => ({ id: a.id, slug: a.slug, title: a.title_es })),
  }
})
