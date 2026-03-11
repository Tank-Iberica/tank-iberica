/**
 * Shared types package — client + server.
 *
 * Domain types used by both app/ composables and server/ routes/services.
 * Import with: import type { Vehicle, DealerRow } from '~/shared/types'
 *
 * Rules:
 * - Only domain-level types (entities, value objects, enums)
 * - No Vue/Nuxt-specific types (those stay in app/types/)
 * - No implementation details — pure data shapes
 */

export * from './vehicle'
export * from './dealer'
export * from './auction'
export * from './event'
export * from './subscription'
export * from './common'
