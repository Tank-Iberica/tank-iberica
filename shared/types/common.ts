/**
 * Common shared types used across the domain.
 */

/** Vertical identifier for multi-tenant support */
export type Vertical = string

/** Localized JSONB field (key = locale code) */
export type LocalizedField = Record<string, string> | null

/** User roles in the system */
export type UserRole = 'user' | 'dealer' | 'admin'

/** Standard status for entities that go through a lifecycle */
export type EntityStatus = 'published' | 'draft' | 'sold' | 'rented' | 'archived'

/** Pagination parameters for list queries */
export interface PaginationParams {
  page?: number
  pageSize?: number
  offset?: number
  limit?: number
}

/** Standard paginated response wrapper */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

/** ISO 8601 date string */
export type ISODateString = string

/** UUID string */
export type UUID = string
