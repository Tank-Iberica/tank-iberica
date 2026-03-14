/**
 * Admin audit logging utility (§2.4 Plan Maestro).
 *
 * Records admin actions to admin_audit_log table for security audit trail.
 * Fire-and-forget — errors are logged but never thrown (audit must not break the action).
 *
 * Usage:
 *   await logAdminAction(event, 'vehicle.delete', 'vehicle', vehicleId, { brand, model })
 *   await logAdminAction(event, 'dealer.suspend', 'dealer', dealerId)
 *
 * Action naming convention: '<resource>.<verb>'
 *   vehicle.create · vehicle.update · vehicle.delete · vehicle.publish · vehicle.archive
 *   dealer.create  · dealer.suspend · dealer.unsuspend · dealer.upgrade
 *   user.ban       · user.unban     · user.role_change
 *   auction.create · auction.cancel · auction.close
 *   news.publish   · news.unpublish · news.delete
 */
import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from './logger'

export interface AuditLogEntry {
  action: string
  resourceType: string
  resourceId?: string
  metadata?: Record<string, unknown>
  actorId?: string
  actorEmail?: string
}

function getClientIp(event: H3Event): string | undefined {
  const req = event.node.req
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim()
  return req.socket?.remoteAddress
}

function getUserAgent(event: H3Event): string | undefined {
  return event.node.req.headers['user-agent']
}

/**
 * Log an admin action to admin_audit_log.
 *
 * @param supabase  - Service role Supabase client
 * @param event     - H3 event (for extracting IP, user-agent)
 * @param entry     - Audit log entry fields
 */
export async function logAdminAction(
  supabase: SupabaseClient,
  event: H3Event,
  entry: AuditLogEntry,
): Promise<void> {
  try {
    await supabase.from('admin_audit_log').insert({
      actor_id: entry.actorId ?? null,
      actor_email: entry.actorEmail ?? null,
      action: entry.action,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId ?? null,
      metadata: entry.metadata ?? {},
      ip: getClientIp(event) ?? null,
      user_agent: getUserAgent(event) ?? null,
    })
  } catch (err) {
    // Audit log failure must never break the main action
    logger.warn(
      `[auditLog] Failed to write audit entry: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
}
