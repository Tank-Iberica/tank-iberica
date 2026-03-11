/**
 * Pure helper functions for the dynamic filter system.
 * All functions are side-effect-free and fully testable without mocks.
 */

import type {
  AttributeDefinition,
  ActiveFilters,
  SliderRange,
  VehicleAttrs,
} from './filtersTypes'

// ── Value extraction ──────────────────────────────────────────────────────────

export function getAttrValue(v: VehicleAttrs, filter: AttributeDefinition): unknown {
  return v.attributes_json?.[filter.id] ?? v.attributes_json?.[filter.name]
}

export function isValidAttrValue(val: unknown): boolean {
  return val !== null && val !== undefined && val !== ''
}

// ── Dynamic option values (from vehicle data) ─────────────────────────────────

export function extractFilterValues(
  vehicles: VehicleAttrs[],
  needsValues: AttributeDefinition[],
): Record<string, string[]> {
  const result: Record<string, string[]> = {}
  for (const filter of needsValues) {
    const valuesSet = new Set<string>()
    for (const v of vehicles) {
      const val = getAttrValue(v, filter)
      if (isValidAttrValue(val)) valuesSet.add(String(val))
    }
    result[filter.name] = Array.from(valuesSet).sort((a, b) => a.localeCompare(b))
  }
  return result
}

// ── Slider ranges ─────────────────────────────────────────────────────────────

export function computeRangeForFilter(
  vehicles: VehicleAttrs[],
  filter: AttributeDefinition,
): SliderRange | null {
  let min = Infinity
  let max = -Infinity
  for (const v of vehicles) {
    const val = getAttrValue(v, filter)
    if (!isValidAttrValue(val)) continue
    const num = Number(val)
    if (Number.isNaN(num)) continue
    if (num < min) min = num
    if (num > max) max = num
  }
  return min === Infinity ? null : { min, max }
}

export function computeSliderRanges(
  vehicles: VehicleAttrs[],
  needsRange: AttributeDefinition[],
): Record<string, SliderRange> {
  const result: Record<string, SliderRange> = {}
  for (const filter of needsRange) {
    const range = computeRangeForFilter(vehicles, filter)
    if (range) result[filter.name] = range
  }
  return result
}

// ── Tick-based filter visibility ──────────────────────────────────────────────

export function isFilterHiddenByTick(
  filterName: string,
  definitions: AttributeDefinition[],
  activeTicks: Set<string>,
): boolean {
  for (const tickDef of definitions) {
    if (tickDef.type !== 'tick') continue
    if (!activeTicks.has(tickDef.name)) continue
    const hides = (tickDef.options?.hides as string[]) || []
    if (hides.includes(filterName)) return true
  }
  return false
}

export function isExtraFilterVisible(
  filterName: string,
  definitions: AttributeDefinition[],
  activeTicks: Set<string>,
): boolean {
  for (const tickDef of definitions) {
    if (tickDef.type !== 'tick') continue
    const extras = (tickDef.options?.extra_filters as string[]) || []
    if (extras.includes(filterName)) return activeTicks.has(tickDef.name)
  }
  return false
}

// ── Filter options ────────────────────────────────────────────────────────────

export function needsDynamicValues(f: AttributeDefinition): boolean {
  return (
    (f.type === 'desplegable' || f.type === 'desplegable_tick') &&
    (f.options?.choices_source === 'auto' || f.options?.choices_source === 'both')
  )
}

export function getFilterOptions(
  filter: AttributeDefinition,
  vehicleFilterValues: Record<string, string[]>,
): string[] {
  const source = (filter.options?.choices_source as string) || 'manual'
  const manual = (filter.options?.choices as string[]) || []
  if (source === 'manual') return manual
  const auto = vehicleFilterValues[filter.name] || []
  if (source === 'auto') return auto
  return [...new Set([...manual, ...auto])].sort((a, b) => a.localeCompare(b))
}

// ── Visibility computation ────────────────────────────────────────────────────

export function computeVisibleFilters(
  definitions: AttributeDefinition[],
  activeFilters: ActiveFilters,
): AttributeDefinition[] {
  const activeTicks = new Set<string>()
  for (const def of definitions) {
    if (def.type === 'tick' && activeFilters[def.name]) activeTicks.add(def.name)
  }
  return definitions.filter((def) => {
    if (isFilterHiddenByTick(def.name, definitions, activeTicks)) return false
    if (def.is_extra) return isExtraFilterVisible(def.name, definitions, activeTicks)
    return true
  })
}
