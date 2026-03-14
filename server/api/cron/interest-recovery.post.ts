/**
 * Cron endpoint: Re-engagement for abandoned interest
 *
 * Finds users who viewed a vehicle (via views_count increments / analytics)
 * but never contacted the seller, and sends a recovery email
 * up to 48h after the last view.
 *
 * Logic (simplified — no dedicated view tracking table yet):
 * Uses leads table: leads created but not responded to in 48h
 * → sends a "¿Todavía te interesa?" email.
 *
 * POST /api/cron/interest-recovery
 * Header: x-cron-secret: <CRON_SECRET>
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseServiceRole } from '#supabase/server'
import { verifyCronSecret } from '../../utils/verifyCronSecret'
import { sendEmail } from '../../services/notifications'
import { logger } from '../../utils/logger'

interface LeadWithVehicle {
  id: string
  user_email: string | null
  user_name: string | null
  vehicle_id: string
  vehicle_title: string
  vehicle_slug: string
  created_at: string
}

export default defineEventHandler(async (event) => {
  verifyCronSecret(event)

  const supabase = serverSupabaseServiceRole(event)
  const now = new Date()
  const cutoff24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()

  // Find leads that are still pending after 24h (but not older than 48h)
  const { data: leads, error } = await supabase
    .from('leads')
    .select(
      `id, user_email, user_name, vehicle_id, created_at,
       vehicles!leads_vehicle_id_fkey (title_es, slug)`,
    )
    .eq('status', 'pending')
    .gte('created_at', cutoff48h)
    .lte('created_at', cutoff24h)
    .is('recovery_sent_at', null)
    .limit(50)

  if (error) {
    logger.error('[interest-recovery] fetch error', { error: error.message })
    return { sent: 0, error: 'Database error' }
  }

  if (!leads || leads.length === 0) {
    return { sent: 0 }
  }

  let sent = 0

  for (const lead of leads as unknown as LeadWithVehicle[]) {
    if (!lead.user_email) continue

    try {
      await sendEmail({
        to: lead.user_email,
        subject: `¿Todavía te interesa ${lead.vehicle_title}?`,
        html: `
          <p>Hola${lead.user_name ? ` ${lead.user_name}` : ''},</p>
          <p>Hace unos días mostraste interés en <strong>${lead.vehicle_title}</strong>.</p>
          <p>El vehículo sigue disponible. ¿Te gustaría retomar el contacto?</p>
          <p><a href="${process.env.NUXT_PUBLIC_SITE_URL}/vehiculo/${lead.vehicle_slug}">Ver vehículo</a></p>
          <p>El equipo de Tracciona</p>
        `,
      })

      // Mark recovery email as sent
      await supabase.from('leads').update({ recovery_sent_at: now.toISOString() }).eq('id', lead.id)

      sent++
    } catch (e) {
      logger.error('[interest-recovery] email error', { leadId: lead.id, error: String(e) })
    }
  }

  logger.info('[interest-recovery] completed', { sent, total: leads.length })
  return { sent, total: leads.length }
})
