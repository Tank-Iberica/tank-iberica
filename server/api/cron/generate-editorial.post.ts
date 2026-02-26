/**
 * Weekly editorial content generator.
 *
 * Generates 2 draft articles using AI based on market trends,
 * new vehicles, and industry topics. Requires human review before publishing.
 *
 * POST /api/cron/generate-editorial
 * Protected with CRON_SECRET
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { callAI } from '~~/server/services/aiProvider'
import { isFeatureEnabled } from '~~/server/utils/featureFlags'

interface GeneratedArticle {
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  tags: string[]
}

export default defineEventHandler(async (event) => {
  verifyCronSecret(event)

  // Check feature flag
  const editorialEnabled = await isFeatureEnabled('editorial_ai')
  if (!editorialEnabled) {
    return { success: true, message: 'editorial_ai feature flag is disabled', generated: 0 }
  }

  const supabase = serverSupabaseServiceRole(event)

  // Get recent market context for topic generation
  const { data: recentVehicles } = await supabase
    .from('vehicles')
    .select('brand, model, subcategory_id')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20)

  const brands = [...new Set((recentVehicles || []).map((v: { brand: string }) => v.brand))].slice(
    0,
    5,
  )

  // Get recent search trends (if search_logs table exists)
  let trendingSearches: string[] = []
  try {
    const { data: searches } = await supabase
      .from('search_logs')
      .select('query')
      .order('created_at', { ascending: false })
      .limit(50)

    if (searches) {
      const searchTerms = (searches as Array<{ query: string }>).map((s) => s.query)
      const freq = new Map<string, number>()
      for (const term of searchTerms) {
        freq.set(term, (freq.get(term) || 0) + 1)
      }
      trendingSearches = [...freq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([term]) => term)
    }
  } catch {
    // search_logs may not exist yet
  }

  const contextInfo = [
    brands.length > 0 ? `Popular brands this week: ${brands.join(', ')}` : '',
    trendingSearches.length > 0 ? `Trending searches: ${trendingSearches.join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  // Generate 2 article drafts
  try {
    const response = await callAI(
      {
        messages: [
          {
            role: 'user',
            content: `Generate 2 article ideas for a professional industrial vehicle marketplace blog.

${contextInfo ? `Market context:\n${contextInfo}\n` : ''}
Topics should cover one or more of:
- Buying guides for industrial vehicles
- Market trends and price analysis
- Vehicle maintenance tips
- Industry regulations (EU emissions, safety)
- Technology in commercial vehicles
- Fleet management best practices

For each article, provide:
- title (catchy, SEO-friendly, in Spanish)
- slug (URL-safe, lowercase, no accents)
- excerpt (2-3 sentence summary in Spanish)
- content (full article in Spanish, 500-800 words, with markdown formatting)
- category (one of: guias, mercado, mantenimiento, normativa, tecnologia, flota)
- tags (3-5 relevant tags in Spanish)

Return as a JSON array of 2 articles.`,
          },
        ],
        maxTokens: 4096,
        system:
          'You are a professional content writer specializing in commercial and industrial vehicles. Write in Spanish. Always return valid JSON only.',
      },
      'deferred',
      'content',
    )

    const jsonMatch = response.text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return { success: false, message: 'AI did not return valid JSON', generated: 0 }
    }

    const articles = JSON.parse(jsonMatch[0]) as GeneratedArticle[]
    let generated = 0

    for (const article of articles) {
      if (!article.title || !article.content) continue

      const slug =
        article.slug ||
        article.title
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036F]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')

      const { error: insertError } = await supabase.from('articles').insert({
        title: { es: article.title },
        slug: `${slug}-${Date.now()}`,
        excerpt: { es: article.excerpt || '' },
        content: { es: article.content },
        category: article.category || 'guias',
        tags: article.tags || [],
        status: 'draft',
        author: 'AI Assistant',
        ai_generated: true,
      })

      if (!insertError) generated++
    }

    return {
      success: true,
      generated,
      message: `${generated} draft article(s) created. Review in admin before publishing.`,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[generate-editorial] AI generation failed: ${msg}`)
    return { success: false, message: 'AI generation failed', generated: 0 }
  }
})
