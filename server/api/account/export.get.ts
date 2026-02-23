/**
 * GET /api/account/export
 *
 * GDPR Right to Data Portability — Export all user data as JSON.
 * Requires authenticated user. Collects data from all relevant tables
 * and returns it as a downloadable JSON file.
 */
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { defineEventHandler, createError, setResponseHeaders } from 'h3'

interface UserProfile {
  id: string
  name: string | null
  apellidos: string | null
  pseudonimo: string | null
  phone: string | null
  email: string | null
  role: string | null
  avatar_url: string | null
  created_at: string | null
}

interface ExportData {
  exportDate: string
  platform: string
  userId: string
  profile: UserProfile | null
  dealer: unknown | null
  vehicles: unknown[]
  leadsReceived: unknown[]
  leadsSent: unknown[]
  favorites: unknown[]
  searchAlerts: unknown[]
  emailPreferences: unknown[]
  consents: unknown[]
  emailLogs: unknown[]
  demands: unknown[]
  advertisements: unknown[]
}

export default defineEventHandler(async (event): Promise<ExportData> => {
  // ── 1. Authenticate user ──────────────────────────────────────────────────
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }

  const userId = user.id
  const supabase = serverSupabaseServiceRole(event)

  // ── 2. Set response headers for file download ─────────────────────────────
  const dateStr = new Date().toISOString().slice(0, 10)
  setResponseHeaders(event, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Disposition': `attachment; filename="tracciona-data-export-${dateStr}.json"`,
    'Cache-Control': 'no-store',
  })

  // ── 3. Collect user profile ───────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('users')
    .select('id, name, apellidos, pseudonimo, phone, email, role, avatar_url, created_at')
    .eq('id', userId)
    .single()

  // ── 4. Collect dealer profile (if exists) ─────────────────────────────────
  const { data: dealer } = await supabase
    .from('dealers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const dealerId = dealer?.id as string | undefined

  // ── 5. Collect vehicles (if dealer) ───────────────────────────────────────
  let vehicles: unknown[] = []
  if (dealerId) {
    const { data: vehicleData } = await supabase
      .from('vehicles')
      .select(
        'id, slug, brand, model, year, price, rental_price, status, category_id, subcategory_id, created_at',
      )
      .eq('dealer_id', dealerId)
    vehicles = vehicleData ?? []
  }

  // ── 6. Collect leads received (as dealer) ─────────────────────────────────
  let leadsReceived: unknown[] = []
  if (dealerId) {
    const { data: leadsData } = await supabase
      .from('leads')
      .select('id, vehicle_id, buyer_name, buyer_email, buyer_phone, message, source, created_at')
      .eq('dealer_id', dealerId)
    leadsReceived = leadsData ?? []
  }

  // ── 7. Collect leads sent (as buyer) ──────────────────────────────────────
  const { data: leadsSent } = await supabase
    .from('leads')
    .select('id, vehicle_id, buyer_name, buyer_email, buyer_phone, message, source, created_at')
    .eq('user_id', userId)

  // ── 8. Collect favorites ──────────────────────────────────────────────────
  const { data: favorites } = await supabase
    .from('favorites')
    .select('id, vehicle_id, created_at')
    .eq('user_id', userId)

  // ── 9. Collect search alerts ──────────────────────────────────────────────
  const { data: searchAlerts } = await supabase
    .from('search_alerts')
    .select('id, filters, frequency, active, created_at')
    .eq('user_id', userId)

  // ── 10. Collect email preferences ─────────────────────────────────────────
  const { data: emailPreferences } = await supabase
    .from('email_preferences')
    .select('id, email_type, enabled, updated_at')
    .eq('user_id', userId)

  // ── 11. Collect consents ──────────────────────────────────────────────────
  const { data: consents } = await supabase
    .from('consents')
    .select('id, consent_type, granted, created_at')
    .eq('user_id', userId)

  // ── 12. Collect email logs ────────────────────────────────────────────────
  const { data: emailLogs } = await supabase
    .from('email_logs')
    .select('id, template_key, subject, status, sent_at')
    .eq('recipient_user_id', userId)

  // ── 13. Collect demands ───────────────────────────────────────────────────
  const { data: demands } = await supabase
    .from('demands')
    .select('id, vehicle_type, brand_preference, specifications, status, created_at')
    .eq('user_id', userId)

  // ── 14. Collect advertisements ────────────────────────────────────────────
  const { data: ads } = await supabase
    .from('advertisements')
    .select('id, brand, model, year, status, created_at')
    .eq('user_id', userId)

  // ── 15. Build export object ───────────────────────────────────────────────
  const exportData: ExportData = {
    exportDate: new Date().toISOString(),
    platform: 'Tracciona',
    userId,
    profile: (profile as UserProfile) ?? null,
    dealer: dealer ?? null,
    vehicles,
    leadsReceived,
    leadsSent: leadsSent ?? [],
    favorites: favorites ?? [],
    searchAlerts: searchAlerts ?? [],
    emailPreferences: emailPreferences ?? [],
    consents: consents ?? [],
    emailLogs: emailLogs ?? [],
    demands: demands ?? [],
    advertisements: ads ?? [],
  }

  // ── 16. Log the export in consents table ──────────────────────────────────
  await supabase.from('consents').insert({
    user_id: userId,
    consent_type: 'data_export',
    granted: true,
    user_agent: event.node.req.headers['user-agent'] ?? null,
  })

  return exportData
})
