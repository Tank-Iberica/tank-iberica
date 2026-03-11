/**
 * Distributed Event Bus — extends the in-process eventBus with
 * Supabase Realtime broadcast channels for cross-instance events.
 *
 * Architecture:
 *   - emit() → in-process handlers + persist to event_channels table
 *   - Supabase Realtime subscription picks up inserts for other instances
 *   - Supports vertical-scoped channels
 *
 * §6.3: Distributed event bus
 */

import { $fetch } from 'ofetch'
import { logger } from './logger'
import { emit as localEmit } from './eventBus'
import type { EventMap, EventName } from './eventBus'

// ---------------------------------------------------------------------------
// Distributed emit: persist + local emit
// ---------------------------------------------------------------------------

/**
 * Emit an event both locally and to the distributed channel.
 * Persists to event_channels table for audit trail.
 */
export async function emitDistributed<K extends EventName>(
  event: K,
  payload: EventMap[K],
  vertical?: string,
): Promise<void> {
  // 1. Local in-process emit (non-blocking)
  localEmit(event, payload).catch((err) => {
    logger.error('[distributedEvents] Local emit error', { event, error: String(err) })
  })

  // 2. Persist to event_channels for audit trail and cross-instance delivery
  const rest = useSupabaseRestHeaders()
  if (!rest) {
    logger.warn('[distributedEvents] No Supabase credentials — skipping distributed emit')
    return
  }

  try {
    await $fetch(`${rest.url}/rest/v1/event_channels`, {
      method: 'POST',
      headers: {
        ...rest.headers,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: {
        channel: `events:${vertical ?? 'global'}`,
        event_name: event,
        payload,
        vertical: vertical ?? null,
      },
    })
  } catch (err) {
    // Don't fail the caller — distributed emit is best-effort
    logger.error('[distributedEvents] Failed to persist event', {
      event,
      error: String(err),
    })
  }
}

// ---------------------------------------------------------------------------
// Cache invalidation helpers
// ---------------------------------------------------------------------------

/**
 * Invalidate caches related to a vehicle change.
 * Emits distributed events that cache layers can subscribe to.
 *
 * §7.3: Event-driven cache invalidation
 */
export async function invalidateVehicleCaches(
  vehicleId: string,
  dealerId: string,
  vertical?: string,
): Promise<void> {
  const rest = useSupabaseRestHeaders()
  if (!rest) return

  // Invalidate specific cache keys via Supabase Realtime broadcast
  try {
    await $fetch(`${rest.url}/rest/v1/event_channels`, {
      method: 'POST',
      headers: {
        ...rest.headers,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: {
        channel: 'cache:invalidation',
        event_name: 'cache:invalidate',
        payload: {
          targets: [
            `vehicle:${vehicleId}`,
            `dealer:${dealerId}:vehicles`,
            `catalog:${vertical ?? 'tracciona'}`,
            'market-report',
            'merchant-feed',
          ],
          timestamp: Date.now(),
        },
        vertical: vertical ?? null,
      },
    })
  } catch (err) {
    logger.error('[distributedEvents] Cache invalidation failed', { error: String(err) })
  }
}

// ---------------------------------------------------------------------------
// Priority constants for job queue
// ---------------------------------------------------------------------------

export const JOB_PRIORITY = {
  CRITICAL: 1, // payments, refunds
  HIGH: 3, // notifications, emails
  NORMAL: 5, // reports, imports
  LOW: 7, // analytics, cleanup
} as const

// ---------------------------------------------------------------------------
// Supabase REST helper (reused from featureFlags pattern)
// ---------------------------------------------------------------------------

function useSupabaseRestHeaders(): { url: string; headers: Record<string, string> } | null {
  const url = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

  if (!url || !key) return null

  return {
    url,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  }
}
