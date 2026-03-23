/**
 * Centralized credit cost configuration.
 *
 * All credit costs in one place so they can be adjusted
 * without hunting through individual endpoint files.
 * Future: migrate to database `credit_packs` table.
 */
export const CREDIT_COSTS = {
  /** Unlock early access to a vehicle */
  UNLOCK_VEHICLE: 1,
  /** Advanced comparison report */
  ADVANCED_COMPARISON: 1,
  /** Listing certificate PDF */
  LISTING_CERTIFICATE: 1,
  /** Export catalog to CSV/Excel */
  EXPORT_CATALOG: 1,
  /** AI-generated vehicle description */
  AI_DESCRIPTION: 1,
  /** Highlight vehicle in search results */
  HIGHLIGHT_VEHICLE: 2,
  /** Priority reservation (48h hold) */
  PRIORITY_RESERVE: 2,
  /** Protect vehicle from priority reserves */
  PROTECT_VEHICLE: 2,
  /** Unlock unlimited saved searches */
  UNLOCK_SAVED_SEARCHES: 1,
  /** Unlock unlimited search alerts */
  UNLOCK_ALERTS: 1,
} as const

export type CreditAction = keyof typeof CREDIT_COSTS
