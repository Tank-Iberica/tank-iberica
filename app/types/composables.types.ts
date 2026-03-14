/**
 * Central re-export of composable types.
 *
 * Provides a single import point for all key interfaces and types
 * used across composables. Individual composables continue to export
 * their own types; this file just aggregates them for discoverability.
 *
 * Usage:
 *   import type { FiltersState, VehicleDetail, Auction } from '~/types/composables.types'
 */

// ── Filters ────────────────────────────────────────────────────────────────
export type {
  AttributeDefinition,
  ActiveFilters,
  SliderRange,
  FiltersState,
  VehicleAttrs,
} from '~/composables/shared/filtersTypes'

// ── Vehicles ───────────────────────────────────────────────────────────────
export type {
  Vehicle,
  VehicleImage,
  VehicleStatus,
  VehicleVisibility,
} from '~/composables/shared/vehiclesTypes'

// ── Market data ────────────────────────────────────────────────────────────
export type {
  MarketDataRow,
  MarketDataState,
  DealerDashboardStats,
} from '~/composables/shared/marketDataTypes'

// ── Datos / valoración ─────────────────────────────────────────────────────
export type { DatosState } from '~/composables/shared/datosTypes'
export type { ValoracionState } from '~/composables/shared/valoracionTypes'

// ── Dealer dashboard ────────────────────────────────────────────────────────
export type { DashboardStats } from '~/composables/shared/dealerDashboardTypes'

// ── Conversation ───────────────────────────────────────────────────────────
export type {
  Conversation,
  ConversationMessage,
} from '~/composables/shared/conversationTypes'

// ── Vehicle detail (inline exports in composable) ──────────────────────────
export type { SellerInfo, VehicleDetail } from '~/composables/useVehicleDetail'

// ── Auth ───────────────────────────────────────────────────────────────────
export type { UserType } from '~/composables/useAuth'

// ── Auction ────────────────────────────────────────────────────────────────
export type {
  AuctionStatus,
  Auction,
  AuctionBid,
} from '~/composables/useAuction'

// ── Voice search (new) ─────────────────────────────────────────────────────
export type { UseVoiceSearch } from '~/composables/useVoiceSearch'

// ── Table of contents (new) ────────────────────────────────────────────────
export type { TocItem, UseTableOfContents } from '~/composables/useTableOfContents'
