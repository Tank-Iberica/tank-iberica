/**
 * Simple in-process event bus for decoupling domain events.
 *
 * Usage:
 *   import { emit } from '~/server/utils/eventBus'
 *   await emit('vehicle:created', { vehicleId, dealerId })
 *
 * Listeners are registered in server/plugins/events.ts
 */

type EventHandler = (payload: unknown) => Promise<void> | void

const handlers: Map<string, EventHandler[]> = new Map()

/**
 * Register a handler for an event.
 * Multiple handlers can be registered for the same event.
 */
export function on(event: string, handler: EventHandler): void {
  const existing = handlers.get(event) || []
  existing.push(handler)
  handlers.set(event, existing)
}

/**
 * Remove a specific handler for an event.
 */
export function off(event: string, handler: EventHandler): void {
  const existing = handlers.get(event)
  if (!existing) return
  const idx = existing.indexOf(handler)
  if (idx !== -1) existing.splice(idx, 1)
}

/**
 * Emit an event, calling all registered handlers.
 * Handlers run sequentially; errors are logged but don't block others.
 */
export async function emit(event: string, payload: unknown): Promise<void> {
  const list = handlers.get(event)
  if (!list || list.length === 0) return

  for (const handler of list) {
    try {
      await handler(payload)
    } catch (err) {
      // Log but don't propagate — event handlers should not break callers
      console.error(`[eventBus] Error in handler for "${event}":`, err)
    }
  }
}

/**
 * List all registered event names (for debugging/monitoring).
 */
export function listEvents(): string[] {
  return Array.from(handlers.keys())
}
