/**
 * Market Report API — GET /api/market-report
 *
 * Generates a quarterly market report in HTML format (for PDF printing via browser print dialog).
 *
 * Query params:
 *   ?public=true  → Returns a summary version (cover + summary + abbreviated price table)
 *   (default)     → Full report (admin-only, includes geographic breakdown + all details)
 *
 * Authentication:
 *   - Full report: requires admin role
 *   - Public summary: accessible without authentication
 */
import { defineEventHandler, getQuery, setHeader } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { generateMarketReport } from '../services/marketReport'
import { safeError } from '../utils/safeError'
import { cfCacheGet, buildCacheKey } from '../utils/cfCache'

// Public report TTL: 24h (quarterly data changes infrequently)
const PUBLIC_CACHE_TTL_SECS = 86_400

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const isPublic = query.public === 'true'
  const locale = typeof query.locale === 'string' && ['es', 'en'].includes(query.locale) ? query.locale : 'es'

  if (!isPublic) {
    // Admin authentication required for full report
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw safeError(401, 'Autenticacion requerida')
    }

    const supabaseAuth = serverSupabaseServiceRole(event)
    const { data: userProfile, error: profileError } = await supabaseAuth
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      throw safeError(500, 'Error al verificar permisos de usuario')
    }

    const role = (userProfile as { role: string }).role
    if (role !== 'admin') {
      throw safeError(403, 'Acceso restringido a administradores')
    }
  }

  const supabase = serverSupabaseServiceRole(event)

  try {
    setHeader(event, 'content-type', 'text/html; charset=utf-8')

    if (isPublic) {
      // Public report: serve from CF Workers Cache when available (saves Supabase queries + report generation)
      setHeader(event, 'Cache-Control', `public, max-age=3600, s-maxage=${PUBLIC_CACHE_TTL_SECS}, stale-while-revalidate=3600`)

      const cacheKey = buildCacheKey('market-report', { locale })
      const html = await cfCacheGet(cacheKey, PUBLIC_CACHE_TTL_SECS, async () => {
        const { html: reportHtml } = await generateMarketReport(supabase, { isPublic: true, locale })
        return reportHtml
      })
      return html
    }

    // Private full report — no caching
    setHeader(event, 'Cache-Control', 'private, no-store')
    const { html } = await generateMarketReport(supabase, { isPublic: false, locale })
    return html
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error generating report'
    throw safeError(500, message)
  }
})
