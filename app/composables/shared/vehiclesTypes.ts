/**
 * Shared types for vehicles and related entities.
 * Used by useVehicles composable, vehicle pages, and tests.
 */

export interface VehicleImage {
  id: string
  url: string
  thumbnail_url: string | null
  position: number
  alt_text: string | null
}

export interface Category {
  id: string
  name: Record<string, string> | null
  name_singular: Record<string, string> | null
  /** @deprecated Use JSONB `name` field instead */
  name_es: string
  /** @deprecated Use JSONB `name` field instead */
  name_en: string | null
  /** @deprecated Use JSONB `name_singular` field instead */
  name_singular_es: string | null
  /** @deprecated Use JSONB `name_singular` field instead */
  name_singular_en: string | null
}

export interface SubcategoryCategoryJunction {
  categories: Category
}

export interface VehicleSubcategory {
  id: string
  name: Record<string, string> | null
  name_singular: Record<string, string> | null
  /** @deprecated Use JSONB `name` field instead */
  name_es: string
  /** @deprecated Use JSONB `name` field instead */
  name_en: string | null
  /** @deprecated Use JSONB `name_singular` field instead */
  name_singular_es: string | null
  /** @deprecated Use JSONB `name_singular` field instead */
  name_singular_en: string | null
  slug: string
  subcategory_categories?: SubcategoryCategoryJunction[]
}

export interface Vehicle {
  id: string
  slug: string
  brand: string
  model: string
  year: number | null
  price: number | null
  rental_price: number | null
  category: 'alquiler' | 'venta' | 'terceros'
  action_id: string | null
  category_id: string | null
  location: string | null
  location_en: string | null
  location_data: Record<string, string> | null
  /** @deprecated Will use content_translations */
  description_es: string | null
  /** @deprecated Will use content_translations */
  description_en: string | null
  attributes_json: Record<string, unknown>
  location_country: string | null
  location_province: string | null
  location_region: string | null
  status: string
  featured: boolean
  highlight_style: string | null
  created_at: string
  updated_at: string
  video_url: string | null
  vehicle_images: VehicleImage[]
  subcategories: VehicleSubcategory | null
}

export interface VehicleFilters {
  category?: 'alquiler' | 'venta' | 'terceros'
  action?: string
  categories?: string[]
  actions?: string[]
  category_id?: string
  subcategory_id?: string
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
  dealer_id?: string
  [key: string]: unknown
}
