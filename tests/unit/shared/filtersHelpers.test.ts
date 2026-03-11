import { describe, it, expect } from 'vitest'
import {
  getAttrValue,
  isValidAttrValue,
  extractFilterValues,
  computeRangeForFilter,
  computeSliderRanges,
  isFilterHiddenByTick,
  isExtraFilterVisible,
  needsDynamicValues,
  getFilterOptions,
  computeVisibleFilters,
} from '../../../app/composables/shared/filtersHelpers'
import type {
  AttributeDefinition,
  VehicleAttrs,
} from '../../../app/composables/shared/filtersTypes'

// ── Fixture helpers ───────────────────────────────────────────────────────────

function makeAttr(overrides: Partial<AttributeDefinition> = {}): AttributeDefinition {
  return {
    id: 'attr-1',
    subcategory_id: null,
    name: 'color',
    type: 'desplegable',
    label_es: 'Color',
    label_en: 'Colour',
    unit: null,
    options: {},
    is_extra: false,
    is_hidden: false,
    status: 'published',
    sort_order: 0,
    ...overrides,
  }
}

function makeVehicle(attrs: Record<string, unknown>): VehicleAttrs {
  return { attributes_json: attrs }
}

// ── getAttrValue ──────────────────────────────────────────────────────────────

describe('getAttrValue', () => {
  it('returns value by filter id', () => {
    const filter = makeAttr({ id: 'attr-1', name: 'color' })
    const v = makeVehicle({ 'attr-1': 'red' })
    expect(getAttrValue(v, filter)).toBe('red')
  })

  it('falls back to filter name when id not present', () => {
    const filter = makeAttr({ id: 'attr-1', name: 'color' })
    const v = makeVehicle({ color: 'blue' })
    expect(getAttrValue(v, filter)).toBe('blue')
  })

  it('returns undefined when neither id nor name present', () => {
    const filter = makeAttr({ id: 'attr-1', name: 'color' })
    expect(getAttrValue(makeVehicle({}), filter)).toBeUndefined()
  })

  it('returns undefined when attributes_json is null', () => {
    const filter = makeAttr()
    expect(getAttrValue({ attributes_json: null }, filter)).toBeUndefined()
  })
})

// ── isValidAttrValue ──────────────────────────────────────────────────────────

describe('isValidAttrValue', () => {
  it('returns true for non-empty string', () => expect(isValidAttrValue('hello')).toBe(true))
  it('returns true for number 0', () => expect(isValidAttrValue(0)).toBe(true))
  it('returns true for false', () => expect(isValidAttrValue(false)).toBe(true))
  it('returns false for null', () => expect(isValidAttrValue(null)).toBe(false))
  it('returns false for undefined', () => expect(isValidAttrValue(undefined)).toBe(false))
  it('returns false for empty string', () => expect(isValidAttrValue('')).toBe(false))
})

// ── extractFilterValues ───────────────────────────────────────────────────────

describe('extractFilterValues', () => {
  it('extracts unique sorted values for a filter', () => {
    const filter = makeAttr({ name: 'color' })
    const vehicles = [makeVehicle({ color: 'red' }), makeVehicle({ color: 'blue' }), makeVehicle({ color: 'red' })]
    const result = extractFilterValues(vehicles, [filter])
    expect(result['color']).toEqual(['blue', 'red'])
  })

  it('ignores null/empty values', () => {
    const filter = makeAttr({ name: 'brand' })
    const vehicles = [makeVehicle({ brand: '' }), makeVehicle({ brand: null }), makeVehicle({ brand: 'Volvo' })]
    const result = extractFilterValues(vehicles, [filter])
    expect(result['brand']).toEqual(['Volvo'])
  })

  it('returns empty array when no matching values', () => {
    const filter = makeAttr({ name: 'fuel' })
    const vehicles = [makeVehicle({})]
    const result = extractFilterValues(vehicles, [filter])
    expect(result['fuel']).toEqual([])
  })

  it('handles multiple filters', () => {
    const f1 = makeAttr({ id: 'a1', name: 'color' })
    const f2 = makeAttr({ id: 'a2', name: 'fuel' })
    const vehicles = [makeVehicle({ color: 'red', fuel: 'diesel' })]
    const result = extractFilterValues(vehicles, [f1, f2])
    expect(result['color']).toEqual(['red'])
    expect(result['fuel']).toEqual(['diesel'])
  })
})

// ── computeRangeForFilter ─────────────────────────────────────────────────────

describe('computeRangeForFilter', () => {
  it('returns min and max', () => {
    const filter = makeAttr({ name: 'km', type: 'slider' })
    const vehicles = [makeVehicle({ km: 10000 }), makeVehicle({ km: 50000 }), makeVehicle({ km: 25000 })]
    const result = computeRangeForFilter(vehicles, filter)
    expect(result).toEqual({ min: 10000, max: 50000 })
  })

  it('returns null when no numeric values', () => {
    const filter = makeAttr({ name: 'km', type: 'slider' })
    const vehicles = [makeVehicle({ km: 'N/A' }), makeVehicle({})]
    expect(computeRangeForFilter(vehicles, filter)).toBeNull()
  })

  it('returns single value when only one vehicle', () => {
    const filter = makeAttr({ name: 'year', type: 'slider' })
    const result = computeRangeForFilter([makeVehicle({ year: 2020 })], filter)
    expect(result).toEqual({ min: 2020, max: 2020 })
  })

  it('ignores NaN values', () => {
    const filter = makeAttr({ name: 'km', type: 'slider' })
    const vehicles = [makeVehicle({ km: 'NaN' }), makeVehicle({ km: 1000 })]
    const result = computeRangeForFilter(vehicles, filter)
    expect(result).toEqual({ min: 1000, max: 1000 })
  })
})

// ── computeSliderRanges ───────────────────────────────────────────────────────

describe('computeSliderRanges', () => {
  it('computes ranges for multiple slider filters', () => {
    const f1 = makeAttr({ name: 'km', type: 'slider' })
    const f2 = makeAttr({ id: 'a2', name: 'year', type: 'slider' })
    const vehicles = [makeVehicle({ km: 50000, year: 2018 }), makeVehicle({ km: 100000, year: 2022 })]
    const result = computeSliderRanges(vehicles, [f1, f2])
    expect(result['km']).toEqual({ min: 50000, max: 100000 })
    expect(result['year']).toEqual({ min: 2018, max: 2022 })
  })

  it('omits filter when no valid data', () => {
    const filter = makeAttr({ name: 'km', type: 'slider' })
    const result = computeSliderRanges([makeVehicle({})], [filter])
    expect(result['km']).toBeUndefined()
  })
})

// ── isFilterHiddenByTick ──────────────────────────────────────────────────────

describe('isFilterHiddenByTick', () => {
  const tickDef = makeAttr({
    name: 'leasing',
    type: 'tick',
    options: { hides: ['km', 'price'] },
  })

  it('returns true when filter is in hides list of active tick', () => {
    const activeTicks = new Set(['leasing'])
    expect(isFilterHiddenByTick('km', [tickDef], activeTicks)).toBe(true)
    expect(isFilterHiddenByTick('price', [tickDef], activeTicks)).toBe(true)
  })

  it('returns false when tick is not active', () => {
    expect(isFilterHiddenByTick('km', [tickDef], new Set())).toBe(false)
  })

  it('returns false when filter not in hides list', () => {
    const activeTicks = new Set(['leasing'])
    expect(isFilterHiddenByTick('brand', [tickDef], activeTicks)).toBe(false)
  })

  it('returns false when no tick definitions', () => {
    expect(isFilterHiddenByTick('km', [], new Set(['leasing']))).toBe(false)
  })
})

// ── isExtraFilterVisible ──────────────────────────────────────────────────────

describe('isExtraFilterVisible', () => {
  const tickDef = makeAttr({
    name: 'financing',
    type: 'tick',
    options: { extra_filters: ['rate', 'months'] },
  })

  it('returns true when extra filter belongs to active tick', () => {
    const activeTicks = new Set(['financing'])
    expect(isExtraFilterVisible('rate', [tickDef], activeTicks)).toBe(true)
    expect(isExtraFilterVisible('months', [tickDef], activeTicks)).toBe(true)
  })

  it('returns false when tick not active', () => {
    expect(isExtraFilterVisible('rate', [tickDef], new Set())).toBe(false)
  })

  it('returns false when filter not in any tick extra_filters', () => {
    expect(isExtraFilterVisible('brand', [tickDef], new Set(['financing']))).toBe(false)
  })
})

// ── needsDynamicValues ────────────────────────────────────────────────────────

describe('needsDynamicValues', () => {
  it('returns true for desplegable with auto source', () => {
    const f = makeAttr({ type: 'desplegable', options: { choices_source: 'auto' } })
    expect(needsDynamicValues(f)).toBe(true)
  })

  it('returns true for desplegable_tick with both source', () => {
    const f = makeAttr({ type: 'desplegable_tick', options: { choices_source: 'both' } })
    expect(needsDynamicValues(f)).toBe(true)
  })

  it('returns false for manual source', () => {
    const f = makeAttr({ type: 'desplegable', options: { choices_source: 'manual' } })
    expect(needsDynamicValues(f)).toBe(false)
  })

  it('returns false for slider type', () => {
    const f = makeAttr({ type: 'slider', options: { choices_source: 'auto' } })
    expect(needsDynamicValues(f)).toBe(false)
  })

  it('returns false for tick type', () => {
    const f = makeAttr({ type: 'tick', options: {} })
    expect(needsDynamicValues(f)).toBe(false)
  })
})

// ── getFilterOptions ──────────────────────────────────────────────────────────

describe('getFilterOptions', () => {
  const vehicleValues = { color: ['blue', 'red', 'white'] }

  it('returns manual choices for manual source', () => {
    const f = makeAttr({ name: 'color', options: { choices_source: 'manual', choices: ['green', 'yellow'] } })
    expect(getFilterOptions(f, vehicleValues)).toEqual(['green', 'yellow'])
  })

  it('returns auto values for auto source', () => {
    const f = makeAttr({ name: 'color', options: { choices_source: 'auto' } })
    expect(getFilterOptions(f, vehicleValues)).toEqual(['blue', 'red', 'white'])
  })

  it('merges and dedupes for both source', () => {
    const f = makeAttr({
      name: 'color',
      options: { choices_source: 'both', choices: ['green', 'red'] },
    })
    const result = getFilterOptions(f, vehicleValues)
    expect(result).toContain('green')
    expect(result).toContain('red')
    expect(result).toContain('blue')
    expect(result).toContain('white')
    expect(result.filter((v) => v === 'red')).toHaveLength(1) // deduped
    expect(result).toEqual([...result].sort())
  })

  it('returns empty array for manual source with no choices', () => {
    const f = makeAttr({ name: 'color', options: {} })
    expect(getFilterOptions(f, {})).toEqual([])
  })
})

// ── computeVisibleFilters ─────────────────────────────────────────────────────

describe('computeVisibleFilters', () => {
  const normalFilter = makeAttr({ id: 'f1', name: 'brand', type: 'desplegable', is_extra: false })
  const extraFilter = makeAttr({
    id: 'f2',
    name: 'rate',
    type: 'desplegable',
    is_extra: true,
  })
  const tickFilter = makeAttr({
    id: 'f3',
    name: 'financing',
    type: 'tick',
    is_extra: false,
    options: { extra_filters: ['rate'], hides: ['brand'] },
  })

  it('shows all non-extra filters when no ticks active', () => {
    const visible = computeVisibleFilters([normalFilter, tickFilter], {})
    expect(visible.map((f) => f.name)).toContain('brand')
    expect(visible.map((f) => f.name)).toContain('financing')
  })

  it('hides extra filter when its tick is not active', () => {
    const visible = computeVisibleFilters([normalFilter, extraFilter, tickFilter], {})
    expect(visible.map((f) => f.name)).not.toContain('rate')
  })

  it('shows extra filter when its tick is active', () => {
    const visible = computeVisibleFilters([normalFilter, extraFilter, tickFilter], {
      financing: true,
    })
    expect(visible.map((f) => f.name)).toContain('rate')
  })

  it('hides filter when active tick specifies it in hides', () => {
    const visible = computeVisibleFilters([normalFilter, extraFilter, tickFilter], {
      financing: true,
    })
    expect(visible.map((f) => f.name)).not.toContain('brand')
  })

  it('returns empty array when definitions is empty', () => {
    expect(computeVisibleFilters([], {})).toEqual([])
  })
})
