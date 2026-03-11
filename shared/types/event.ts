/**
 * Event sourcing domain types — shared between client and server.
 *
 * Used by server/utils/eventStore.ts and tests.
 */

import type { ISODateString } from './common'

/** Supported aggregate types for event sourcing */
export type AggregateType = 'payment' | 'auction' | 'vehicle' | 'reservation'

/** Event to append to the event store */
export interface DomainEvent {
  aggregateType: AggregateType
  aggregateId: string
  eventType: string
  eventData: Record<string, unknown>
  metadata?: Record<string, unknown>
  schemaVersion?: number
}

/** Event as stored in the database */
export interface StoredEvent extends DomainEvent {
  id: number
  version: number
  schemaVersion: number
  createdAt: ISODateString
}

/** Handler invoked during event replay */
export type ReplayHandler = (event: StoredEvent) => void | Promise<void>

/** Options for filtering events during replay */
export interface ReplayOptions {
  eventTypes?: string[]
  fromVersion?: number
  toVersion?: number
  after?: ISODateString
  before?: ISODateString
}

/** Dead letter queue entry */
export interface DeadLetterEntry {
  id: number
  eventId: number | null
  eventType: string
  eventData: Record<string, unknown>
  errorMessage: string
  status: 'pending' | 'retrying' | 'resolved' | 'exhausted'
  retryCount: number
  maxRetries: number
  nextRetryAt: ISODateString | null
  createdAt: ISODateString
  resolvedAt: ISODateString | null
}
