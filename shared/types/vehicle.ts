/**
 * Vehicle domain types — shared between client and server.
 *
 * Canonical definitions for vehicle entities used across:
 * - app/composables/shared/vehiclesTypes.ts (client)
 * - server/api/cron/*.post.ts (server crons)
 * - server/services/vehicleCreator.ts (server)
 */

import type { ISODateString, LocalizedField, UUID } from './common'

/** Vehicle action category */
export type VehicleAction = 'alquiler' | 'venta' | 'terceros'

/** Vehicle lifecycle status */
export type VehicleStatus = 'published' | 'draft' | 'sold' | 'rented' | 'archived'

/** Vehicle image as stored in vehicle_images table */
export interface VehicleImageRow {
  id: UUID
  url: string
  thumbnail_url: string | null
  position: number
  alt_text: string | null
  cloudinary_public_id?: string | null
}

/** Category row from categories table */
export interface CategoryRow {
  id: UUID
  name: LocalizedField
  name_singular: LocalizedField
  /** @deprecated Use JSONB `name` field */
  name_es: string
  /** @deprecated Use JSONB `name` field */
  name_en: string | null
  /** @deprecated Use JSONB `name_singular` field */
  name_singular_es: string | null
  /** @deprecated Use JSONB `name_singular` field */
  name_singular_en: string | null
}

/** Subcategory row from subcategories table */
export interface SubcategoryRow {
  id: UUID
  name: LocalizedField
  name_singular: LocalizedField
  /** @deprecated Use JSONB `name` field */
  name_es: string
  /** @deprecated Use JSONB `name` field */
  name_en: string | null
  /** @deprecated Use JSONB `name_singular` field */
  name_singular_es: string | null
  /** @deprecated Use JSONB `name_singular` field */
  name_singular_en: string | null
  slug: string
}

/** Vehicle row shape from the vehicles table */
export interface VehicleRow {
  id: UUID
  slug: string
  brand: string
  model: string
  year: number | null
  price: number | null
  rental_price: number | null
  km: number | null
  category: VehicleAction | null
  action_id: UUID | null
  category_id: UUID | null
  subcategory_id: UUID | null
  location: string | null
  location_en: string | null
  location_data: Record<string, string> | null
  location_country: string | null
  location_province: string | null
  location_region: string | null
  /** @deprecated Will use content_translations */
  description_es: string | null
  /** @deprecated Will use content_translations */
  description_en: string | null
  attributes_json: Record<string, unknown>
  status: VehicleStatus
  featured: boolean
  views: number
  dealer_id: UUID | null
  user_id: UUID | null
  vertical: string
  video_url: string | null
  created_at: ISODateString
  updated_at: ISODateString
}

/** Vehicle with joined images (common query result) */
export interface VehicleWithImages extends VehicleRow {
  vehicle_images: VehicleImageRow[]
}

/** Filters for vehicle list queries */
export interface VehicleListFilters {
  category?: VehicleAction
  action?: string
  categories?: string[]
  actions?: string[]
  category_id?: UUID
  subcategory_id?: UUID
  price_min?: number
  price_max?: number
  year_min?: number
  year_max?: number
  brand?: string
  search?: string
  featured?: boolean
  sortBy?: string
  location_countries?: string[]
  location_regions?: string[]
  location_province_eq?: string
  dealer_id?: UUID
  [key: string]: unknown
}

/** Minimal vehicle data used in server crons (price-drop, sold notifications) */
export interface VehicleCronSummary {
  id: UUID
  slug: string
  brand: string
  model: string
  price: number | null
  status: VehicleStatus
  dealer_id: UUID | null
}
