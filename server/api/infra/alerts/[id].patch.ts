/**
 * PATCH /api/infra/alerts/:id
 *
 * Admin-only endpoint to acknowledge an infrastructure alert.
 * Sets acknowledged_at and acknowledged_by on the alert record.
 */
import { defineEventHandler } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'
import { safeError } from '../../../utils/safeError'

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserRow {
  role: string | null
}

// ── Handler ────────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  // ── Admin auth check ──────────────────────────────────────────────────────
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw safeError(401, 'Unauthorized')
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  const typedUser = userData as unknown as UserRow | null
  if (typedUser?.role !== 'admin') {
    throw safeError(403, 'Forbidden')
  }

  // ── Get alert ID from route params ────────────────────────────────────────
  const id = event.context.params?.id
  if (!id) {
    throw safeError(400, 'Alert ID is required')
  }

  // ── Validate UUID format ──────────────────────────────────────────────────
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw safeError(400, 'Invalid alert ID format')
  }

  // ── Check alert exists and is not already acknowledged ────────────────────
  const { data: existingAlertRaw, error: fetchError } = await supabase
    .from('infra_alerts')
    .select('id, acknowledged')
    .eq('id', id)
    .single()
  const existingAlert = existingAlertRaw as unknown as {
    id: string
    acknowledged: boolean | null
  } | null

  if (fetchError || !existingAlert) {
    throw safeError(404, 'Alert not found')
  }

  if (existingAlert.acknowledged) {
    return {
      success: true,
      message: 'Alert was already acknowledged',
      alert_id: id,
    }
  }

  // ── Acknowledge the alert ─────────────────────────────────────────────────
  const { error: updateError } = await supabase
    .from('infra_alerts')
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: user.id,
    } as never)
    .eq('id', id)

  if (updateError) {
    throw safeError(500, `Failed to acknowledge alert: ${updateError.message}`)
  }

  return {
    success: true,
    message: 'Alert acknowledged',
    alert_id: id,
    acknowledged_by: user.id,
    acknowledged_at: new Date().toISOString(),
  }
})
