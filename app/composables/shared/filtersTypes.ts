/**
 * Shared types for the dynamic filter system.
 * Used by useFilters composable and filter UI components.
 */

export interface AttributeDefinition {
  id: string
  subcategory_id: string | null
  name: string
  type: 'caja' | 'desplegable' | 'desplegable_tick' | 'tick' | 'slider' | 'calc'
  label_es: string | null
  label_en: string | null
  unit: string | null
  options: Record<string, unknown>
  is_extra: boolean
  is_hidden: boolean
  status: string
  sort_order: number
  /** Track source for UI differentiation */
  source?: 'category' | 'subcategory'
}

export interface ActiveFilters {
  [filterName: string]: unknown
}

export interface SliderRange {
  min: number
  max: number
}

export interface FiltersState {
  definitions: AttributeDefinition[]
  categoryFilters: AttributeDefinition[]
  subcategoryFilters: AttributeDefinition[]
  loading: boolean
  error: string | null
  activeFilters: ActiveFilters
  vehicleFilterValues: Record<string, string[]>
  sliderRanges: Record<string, SliderRange>
}

export type VehicleAttrs = { attributes_json: Record<string, unknown> | null }
