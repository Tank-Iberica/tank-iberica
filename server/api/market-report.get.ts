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
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { createError } from 'h3'
import { generateMarketReport } from '../services/marketReport'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const isPublic = query.public === 'true'

  if (!isPublic) {
    // Admin authentication required for full report
    const user = await serverSupabaseUser(event)
    if (!user) {
      throw createError({ statusCode: 401, message: 'Autenticacion requerida' })
    }

    const supabaseAuth = serverSupabaseServiceRole(event)
    const { data: userProfile, error: profileError } = await supabaseAuth
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      throw createError({ statusCode: 500, message: 'Error al verificar permisos de usuario' })
    }

    const role = (userProfile as { role: string }).role
    if (role !== 'admin') {
      throw createError({ statusCode: 403, message: 'Acceso restringido a administradores' })
    }
  }

  const supabase = serverSupabaseServiceRole(event)

  try {
    const { html } = await generateMarketReport(supabase, {
      isPublic,
      vertical: 'tracciona',
    })

    setHeader(event, 'content-type', 'text/html; charset=utf-8')
    return html
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error generating report'
    throw createError({ statusCode: 500, message })
  }
})
