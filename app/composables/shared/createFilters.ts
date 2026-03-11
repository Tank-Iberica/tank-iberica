/**
 * createFilters — factory pattern for the filter system
 *
 * Provides a configured filter state with custom defaults and validation.
 * This factory allows different parts of the app to instantiate filters
 * with their own config without sharing global state.
 *
 * Usage:
 *   const { state, isActive, clearAll } = createFilters({ maxSliders: 5 })
 */

import type { ActiveFilters, FiltersState, AttributeDefinition, SliderRange } from './filtersTypes'

export interface CreateFiltersConfig {
  /** Maximum number of slider-type filters to show (default: 3) */
  maxSliders?: number
  /** Whether to include extra (non-core) filters by default (default: false) */
  includeExtras?: boolean
  /** Initial active filters */
  initialFilters?: ActiveFilters
}

export interface FilterFactory {
  state: FiltersState
  isActive: (filterId: string) => boolean
  clearAll: () => void
  setFilter: (key: string, value: unknown) => void
  removeFilter: (key: string) => void
  visibleDefinitions: (defs: AttributeDefinition[]) => AttributeDefinition[]
}

/** Default filter state factory */
function makeDefaultState(initial: ActiveFilters = {}): FiltersState {
  return {
    definitions: [],
    categoryFilters: [],
    subcategoryFilters: [],
    loading: false,
    error: null,
    activeFilters: { ...initial },
    vehicleFilterValues: {},
    sliderRanges: {},
  }
}

/**
 * Creates a filter state with the given config.
 * Returns a stable object of filter operations.
 */
export function createFilters(config: CreateFiltersConfig = {}): FilterFactory {
  const { maxSliders = 3, includeExtras = false, initialFilters = {} } = config

  const state: FiltersState = makeDefaultState(initialFilters)

  const isActive = (filterId: string): boolean => {
    const val = state.activeFilters[filterId]
    if (val === undefined || val === null || val === '') return false
    if (Array.isArray(val)) return val.length > 0
    return true
  }

  const clearAll = (): void => {
    state.activeFilters = {}
  }

  const setFilter = (key: string, value: unknown): void => {
    state.activeFilters = { ...state.activeFilters, [key]: value }
  }

  const removeFilter = (key: string): void => {
    const next = { ...state.activeFilters }
    delete next[key]
    state.activeFilters = next
  }

  const visibleDefinitions = (defs: AttributeDefinition[]): AttributeDefinition[] => {
    const filtered = includeExtras ? defs : defs.filter((d) => !d.is_extra)
    const sliders = filtered.filter((d) => d.type === 'slider')
    const nonSliders = filtered.filter((d) => d.type !== 'slider')
    return [...nonSliders, ...sliders.slice(0, maxSliders)]
  }

  return { state, isActive, clearAll, setFilter, removeFilter, visibleDefinitions }
}

// ── Utility: build SliderRange from a list of numeric values ──────────────

export function buildSliderRange(values: number[]): SliderRange {
  if (values.length === 0) return { min: 0, max: 0 }
  return { min: Math.min(...values), max: Math.max(...values) }
}
