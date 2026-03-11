import { logger } from './logger'
/**
 * Typed in-process event bus for decoupling domain events.
 *
 * Usage:
 *   import { emit, on } from '~~/server/utils/eventBus'
 *   await emit('vehicle:created', { vehicleId, dealerId, title })
 *
 * Listeners are registered in server/plugins/events.ts
 *
 * Adding new events:
 *   1. Add the event name + payload type to `EventMap`.
 *   2. Import and use `emit` / `on` in your route or handler.
 *   3. Optionally register a listener in server/plugins/events.ts.
 */

// ── EventMap — single source of truth for all domain events ──────────────────

export interface EventMap {
  /** New vehicle listing published by a dealer */
  'vehicle:created': {
    vehicleId: string
    dealerId: string
    title: string
    vertical?: string
  }
  /** Vehicle marked as sold (transaction recorded) */
  'vehicle:sold': {
    vehicleId: string
    dealerId: string
    title: string
    buyerUserId?: string
  }
  /** New dealer account activated */
  'dealer:registered': {
    dealerId: string
    email: string
    companyName: string
  }
  /** Dealer subscription plan changed */
  'subscription:changed': {
    dealerId: string
    previousPlan: string | null
    newPlan: string
    action: 'created' | 'upgraded' | 'downgraded' | 'cancelled'
  }
  /** Background job exhausted all retries and moved to dead-letter queue */
  'job:dead_letter': {
    jobId: string
    jobType: string
    error: string
  }
}

export type EventName = keyof EventMap

// ── Internal handler registry ────────────────────────────────────────────────

type TypedHandler<K extends EventName> = (payload: EventMap[K]) => Promise<void> | void

// Untyped storage so the Map can hold handlers for all event names
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handlers: Map<EventName, TypedHandler<any>[]> = new Map()

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Register a typed handler for a domain event.
 * Multiple handlers can be registered for the same event.
 *
 * @example
 *   on('vehicle:created', async ({ vehicleId, dealerId }) => { ... })
 */
export function on<K extends EventName>(event: K, handler: TypedHandler<K>): void {
  const existing = handlers.get(event) ?? []
  existing.push(handler)
  handlers.set(event, existing)
}

/**
 * Remove a specific handler for an event.
 */
export function off<K extends EventName>(event: K, handler: TypedHandler<K>): void {
  const existing = handlers.get(event)
  if (!existing) return
  const idx = existing.indexOf(handler)
  if (idx !== -1) existing.splice(idx, 1)
}

/**
 * Emit a typed domain event, calling all registered handlers in order.
 * Handler errors are caught and logged — they never block the caller.
 *
 * @example
 *   await emit('vehicle:created', { vehicleId, dealerId, title })
 */
export async function emit<K extends EventName>(event: K, payload: EventMap[K]): Promise<void> {
  const list = handlers.get(event)
  if (!list || list.length === 0) return

  for (const handler of list) {
    try {
      await handler(payload)
    } catch (err) {
      logger.error(`[eventBus] Error in handler for "${event}":`, { error: String(err) })
    }
  }
}

/**
 * List all registered event names (for debugging / health checks).
 */
export function listEvents(): EventName[] {
  return Array.from(handlers.keys())
}
