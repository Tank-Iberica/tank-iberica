/**
 * PATCH /api/infra/alerts/:id
 *
 * Admin-only endpoint to acknowledge an infrastructure alert.
 * Sets acknowledged_at and acknowledged_by on the alert record.
 */
import { defineEventHandler, createError } from 'h3'
import { serverSupabaseUser, serverSupabaseServiceRole } from '#supabase/server'

// ── Types ──────────────────────────────────────────────────────────────────────

interface UserRow {
  role: string | null
}

// ── Handler ────────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  // ── Admin auth check ──────────────────────────────────────────────────────
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

  const typedUser = userData as unknown as UserRow | null
  if (typedUser?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  // ── Get alert ID from route params ────────────────────────────────────────
  const id = event.context.params?.id
  if (!id) {
    throw createError({ statusCode: 400, message: 'Alert ID is required' })
  }

  // ── Validate UUID format ──────────────────────────────────────────────────
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw createError({ statusCode: 400, message: 'Invalid alert ID format' })
  }

  // ── Check alert exists and is not already acknowledged ────────────────────
  const { data: existingAlert, error: fetchError } = await supabase
    .from('infra_alerts')
    .select('id, acknowledged_at')
    .eq('id', id)
    .single()

  if (fetchError || !existingAlert) {
    throw createError({ statusCode: 404, message: 'Alert not found' })
  }

  if (existingAlert.acknowledged_at) {
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
    throw createError({
      statusCode: 500,
      message: `Failed to acknowledge alert: ${updateError.message}`,
    })
  }

  return {
    success: true,
    message: 'Alert acknowledged',
    alert_id: id,
    acknowledged_by: user.id,
    acknowledged_at: new Date().toISOString(),
  }
})
