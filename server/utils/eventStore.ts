/**
 * Event sourcing utility for critical domain events.
 *
 * Appends immutable events to the event_store table.
 * Each event belongs to an aggregate (payment, auction, vehicle, reservation)
 * and is versioned for optimistic concurrency control.
 *
 * Usage:
 *   await appendEvent(client, {
 *     aggregateType: 'payment',
 *     aggregateId: paymentId,
 *     eventType: 'payment.completed',
 *     eventData: { amount: 5000, currency: 'EUR' },
 *     metadata: { actorId: userId, ip: clientIp },
 *   })
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from './logger'
import type { DomainEvent, StoredEvent, ReplayHandler, ReplayOptions } from '~/shared/types/event'

// Re-export domain types from shared package
export type { DomainEvent, StoredEvent, ReplayHandler, ReplayOptions } from '~/shared/types/event'

/**
 * Append a new event to the event store.
 * Automatically increments the version for the aggregate.
 *
 * Returns the stored event or throws on conflict.
 */
export async function appendEvent(
  client: SupabaseClient,
  event: DomainEvent,
): Promise<StoredEvent> {
  // Get the current max version for this aggregate
  const { data: maxVersionData } = await client
    .from('event_store')
    .select('version')
    .eq('aggregate_type', event.aggregateType)
    .eq('aggregate_id', event.aggregateId)
    .order('version', { ascending: false })
    .limit(1)
    .single()

  const nextVersion = (maxVersionData?.version ?? 0) + 1

  const { data, error } = await client
    .from('event_store')
    .insert({
      aggregate_type: event.aggregateType,
      aggregate_id: event.aggregateId,
      event_type: event.eventType,
      event_data: event.eventData,
      metadata: event.metadata ?? {},
      version: nextVersion,
      schema_version: event.schemaVersion ?? 1,
    })
    .select(
      'id, aggregate_type, aggregate_id, event_type, event_data, metadata, version, schema_version, created_at',
    )
    .single()

  if (error) {
    throw new Error(`Failed to append event: ${error.message}`)
  }

  return {
    id: data.id,
    aggregateType: data.aggregate_type,
    aggregateId: data.aggregate_id,
    eventType: data.event_type,
    eventData: data.event_data,
    metadata: data.metadata,
    version: data.version,
    schemaVersion: data.schema_version ?? 1,
    createdAt: data.created_at,
  }
}

/**
 * Get all events for an aggregate, in order.
 */
export async function getEvents(
  client: SupabaseClient,
  aggregateType: string,
  aggregateId: string,
): Promise<StoredEvent[]> {
  const { data, error } = await client
    .from('event_store')
    .select(
      'id, aggregate_type, aggregate_id, event_type, event_data, metadata, version, schema_version, created_at',
    )
    .eq('aggregate_type', aggregateType)
    .eq('aggregate_id', aggregateId)
    .order('version', { ascending: true })

  if (error) {
    throw new Error(`Failed to get events: ${error.message}`)
  }

  return (data ?? []).map(mapStoredEvent)
}

/** Map a raw DB row to StoredEvent */
function mapStoredEvent(e: Record<string, unknown>): StoredEvent {
  return {
    id: e.id as number,
    aggregateType: e.aggregate_type as StoredEvent['aggregateType'],
    aggregateId: e.aggregate_id as string,
    eventType: e.event_type as string,
    eventData: e.event_data as Record<string, unknown>,
    metadata: e.metadata as Record<string, unknown>,
    version: e.version as number,
    schemaVersion: (e.schema_version as number) ?? 1,
    createdAt: e.created_at as string,
  }
}

/**
 * Replay events for an aggregate, invoking a handler for each event.
 * Useful for rebuilding state, debugging, or auditing.
 *
 * Events are always replayed in version order (ascending).
 */
export async function replayEvents(
  client: SupabaseClient,
  aggregateType: string,
  aggregateId: string,
  handler: ReplayHandler,
  options?: ReplayOptions,
): Promise<{ replayed: number; skipped: number }> {
  const events = await getEvents(client, aggregateType, aggregateId)
  let replayed = 0
  let skipped = 0

  for (const event of events) {
    // Apply filters
    if (options?.eventTypes && !options.eventTypes.includes(event.eventType)) {
      skipped++
      continue
    }
    if (options?.fromVersion !== undefined && event.version < options.fromVersion) {
      skipped++
      continue
    }
    if (options?.toVersion !== undefined && event.version > options.toVersion) {
      skipped++
      continue
    }
    if (options?.after && event.createdAt <= options.after) {
      skipped++
      continue
    }
    if (options?.before && event.createdAt >= options.before) {
      skipped++
      continue
    }

    await handler(event)
    replayed++
  }

  return { replayed, skipped }
}

/**
 * Get events across all aggregates of a type (for global replay/audit).
 */
export async function getEventsByType(
  client: SupabaseClient,
  aggregateType: string,
  limit = 100,
  offset = 0,
): Promise<StoredEvent[]> {
  const { data, error } = await client
    .from('event_store')
    .select(
      'id, aggregate_type, aggregate_id, event_type, event_data, metadata, version, schema_version, created_at',
    )
    .eq('aggregate_type', aggregateType)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to get events by type: ${error.message}`)
  }

  return (data ?? []).map(mapStoredEvent)
}

/**
 * Add a failed event to the dead letter queue.
 */
export async function addToDeadLetter(
  client: SupabaseClient,
  eventId: number | null,
  eventType: string,
  eventData: Record<string, unknown>,
  errorMessage: string,
): Promise<void> {
  const retryDelayMinutes = 5
  const nextRetry = new Date(Date.now() + retryDelayMinutes * 60 * 1000).toISOString()

  const { error } = await client.from('event_dead_letter').insert({
    event_id: eventId,
    event_type: eventType,
    event_data: eventData,
    error_message: errorMessage,
    next_retry_at: nextRetry,
  })

  if (error) {
    // Log but don't throw — DLQ insertion failure shouldn't crash the main flow
    logger.error(`[DLQ] Failed to insert: ${error.message}`)
  }
}

/**
 * Get pending dead letter entries ready for retry.
 */
export async function getPendingRetries(
  client: SupabaseClient,
  limit = 10,
): Promise<
  Array<{
    id: number
    eventType: string
    eventData: Record<string, unknown>
    retryCount: number
    maxRetries: number
  }>
> {
  const { data, error } = await client
    .from('event_dead_letter')
    .select('id, event_type, event_data, retry_count, max_retries')
    .in('status', ['pending', 'retrying'])
    .lte('next_retry_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to get pending retries: ${error.message}`)
  }

  return (data ?? []).map((d) => ({
    id: d.id,
    eventType: d.event_type,
    eventData: d.event_data,
    retryCount: d.retry_count,
    maxRetries: d.max_retries,
  }))
}

/**
 * Mark a dead letter entry as resolved.
 */
export async function resolveDeadLetter(client: SupabaseClient, id: number): Promise<void> {
  await client
    .from('event_dead_letter')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', id)
}

/**
 * Increment retry count for a dead letter entry.
 * If max retries exceeded, mark as 'exhausted'.
 */
export async function retryDeadLetter(
  client: SupabaseClient,
  id: number,
  currentRetryCount: number,
  maxRetries: number,
  errorMessage?: string,
): Promise<void> {
  const newCount = currentRetryCount + 1
  const isExhausted = newCount >= maxRetries

  // Exponential backoff: 5min, 25min, 125min
  const delayMinutes = 5 ** newCount
  const nextRetry = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString()

  await client
    .from('event_dead_letter')
    .update({
      retry_count: newCount,
      status: isExhausted ? 'exhausted' : 'retrying',
      next_retry_at: isExhausted ? null : nextRetry,
      error_message: errorMessage ?? null,
    })
    .eq('id', id)
}
