import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from './logger'

/**
 * Attempt to acquire a cron execution lock using the idempotency_keys table.
 *
 * The lock key is derived from the cron name and the current time window.
 * If the same cron fires twice within `windowMs`, the second invocation
 * returns false and should exit immediately to prevent duplicate side-effects
 * (duplicate emails, double-charges, etc.).
 *
 * Uses PostgreSQL unique constraint on idempotency_keys.key:
 *   - Insert succeeds → lock acquired, proceed.
 *   - Insert fails with code 23505 (unique violation) → already ran this window, skip.
 *   - Insert fails for other reasons → log warning and proceed (don't block on DB errors).
 *
 * @param supabase  Service-role Supabase client
 * @param cronName  Stable identifier for the cron job (e.g. 'price-drop-alert')
 * @param windowMs  Lock window in milliseconds (default: 1 hour)
 * @returns true if lock acquired (safe to proceed), false if already ran in this window
 */
export async function acquireDbCronLock(
  supabase: SupabaseClient,
  cronName: string,
  windowMs = 60 * 60 * 1000,
): Promise<boolean> {
  const windowKey = Math.floor(Date.now() / windowMs).toString()
  const key = `cron:${cronName}:${windowKey}`
  const expiresAt = new Date(Date.now() + windowMs * 2).toISOString()

  const { error } = await supabase.from('idempotency_keys').insert({
    key,
    endpoint: `cron:${cronName}`,
    response: { status: 'running', acquired_at: new Date().toISOString() },
    expires_at: expiresAt,
  })

  if (error) {
    // Unique violation → this cron already ran (or is running) in the current window
    if (error.code === '23505') {
      logger.warn(`[cronLock] Skipping ${cronName}: lock already held for window ${windowKey}`)
      return false
    }
    // Other DB errors → proceed rather than block cron on infrastructure issues
    logger.warn(
      `[cronLock] Lock acquisition failed for ${cronName}: ${error.message} — proceeding anyway`,
    )
  }

  return true
}
