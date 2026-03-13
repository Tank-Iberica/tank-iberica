import { describe, it, expect } from 'vitest'
import { matchesVehicle } from '../../server/utils/alertMatcher'
import type { VehicleForMatching, AlertFilters } from '../../server/utils/alertMatcher'

const baseVehicle: VehicleForMatching = {
  id: 'v-1',
  brand: 'Mercedes-Benz',
  model: 'Actros 1845',
  price: 45000,
  year: 2020,
  km: 280000,
  category_id: 'cat-trucks',
  subcategory_id: 'sub-tractors',
  location_country: 'ES',
  location_region: 'Castilla y León',
  slug: 'mercedes-benz-actros-1845',
}

describe('matchesVehicle', () => {
  it('matches when no filters are set (empty object)', () => {
    expect(matchesVehicle(baseVehicle, {})).toBe(true)
  })

  it('matches when all filters match exactly', () => {
    const filters: AlertFilters = {
      category_id: 'cat-trucks',
      brand: 'Mercedes',
      price_min: 40000,
      price_max: 50000,
      year_min: 2019,
      year_max: 2021,
      km_max: 300000,
      location_country: 'ES',
    }
    expect(matchesVehicle(baseVehicle, filters)).toBe(true)
  })

  it('rejects when category_id does not match', () => {
    expect(matchesVehicle(baseVehicle, { category_id: 'cat-trailers' })).toBe(false)
  })

  it('rejects when subcategory_id does not match', () => {
    expect(matchesVehicle(baseVehicle, { subcategory_id: 'sub-curtains' })).toBe(false)
  })

  it('rejects when price is below price_min', () => {
    expect(matchesVehicle(baseVehicle, { price_min: 50000 })).toBe(false)
  })

  it('rejects when price is above price_max', () => {
    expect(matchesVehicle(baseVehicle, { price_max: 40000 })).toBe(false)
  })

  it('matches when price is exactly at boundary', () => {
    expect(matchesVehicle(baseVehicle, { price_min: 45000 })).toBe(true)
    expect(matchesVehicle(baseVehicle, { price_max: 45000 })).toBe(true)
  })

  it('rejects when vehicle has null price and price_min is set', () => {
    const noPrice = { ...baseVehicle, price: null }
    expect(matchesVehicle(noPrice, { price_min: 10000 })).toBe(false)
  })

  it('rejects when vehicle has null price and price_max is set', () => {
    const noPrice = { ...baseVehicle, price: null }
    expect(matchesVehicle(noPrice, { price_max: 100000 })).toBe(false)
  })

  it('rejects when year is below year_min', () => {
    expect(matchesVehicle(baseVehicle, { year_min: 2021 })).toBe(false)
  })

  it('rejects when year is above year_max', () => {
    expect(matchesVehicle(baseVehicle, { year_max: 2019 })).toBe(false)
  })

  it('rejects when vehicle has null year and year filter is set', () => {
    const noYear = { ...baseVehicle, year: null }
    expect(matchesVehicle(noYear, { year_min: 2020 })).toBe(false)
  })

  it('rejects when km exceeds km_max', () => {
    expect(matchesVehicle(baseVehicle, { km_max: 200000 })).toBe(false)
  })

  it('matches when km is exactly at km_max', () => {
    expect(matchesVehicle(baseVehicle, { km_max: 280000 })).toBe(true)
  })

  it('rejects when vehicle has null km and km_max is set', () => {
    const noKm = { ...baseVehicle, km: null }
    expect(matchesVehicle(noKm, { km_max: 300000 })).toBe(false)
  })

  it('matches brand case-insensitively (partial match)', () => {
    expect(matchesVehicle(baseVehicle, { brand: 'mercedes' })).toBe(true)
    expect(matchesVehicle(baseVehicle, { brand: 'MERCEDES-BENZ' })).toBe(true)
    expect(matchesVehicle(baseVehicle, { brand: 'Merc' })).toBe(true)
  })

  it('rejects when brand does not match', () => {
    expect(matchesVehicle(baseVehicle, { brand: 'Volvo' })).toBe(false)
  })

  it('rejects when vehicle has null brand and brand filter is set', () => {
    const noBrand = { ...baseVehicle, brand: null }
    expect(matchesVehicle(noBrand, { brand: 'Mercedes' })).toBe(false)
  })

  it('matches model case-insensitively (partial match)', () => {
    expect(matchesVehicle(baseVehicle, { model: 'actros' })).toBe(true)
    expect(matchesVehicle(baseVehicle, { model: '1845' })).toBe(true)
  })

  it('rejects when model does not match', () => {
    expect(matchesVehicle(baseVehicle, { model: 'FH16' })).toBe(false)
  })

  it('matches location_country exactly', () => {
    expect(matchesVehicle(baseVehicle, { location_country: 'ES' })).toBe(true)
  })

  it('rejects when location_country does not match', () => {
    expect(matchesVehicle(baseVehicle, { location_country: 'PT' })).toBe(false)
  })

  it('matches location_region case-insensitively', () => {
    expect(matchesVehicle(baseVehicle, { location_region: 'castilla' })).toBe(true)
    expect(matchesVehicle(baseVehicle, { location_region: 'Castilla y León' })).toBe(true)
  })

  it('matches zone filter (alias for location_region)', () => {
    expect(matchesVehicle(baseVehicle, { zone: 'castilla' })).toBe(true)
    expect(matchesVehicle(baseVehicle, { zone: 'Andalucía' })).toBe(false)
  })

  it('rejects when vehicle has null location_region and zone is set', () => {
    const noRegion = { ...baseVehicle, location_region: null }
    expect(matchesVehicle(noRegion, { zone: 'Madrid' })).toBe(false)
  })

  it('applies AND logic: all filters must match', () => {
    // Brand matches but price doesn't
    expect(matchesVehicle(baseVehicle, { brand: 'Mercedes', price_max: 30000 })).toBe(false)
    // Price matches but brand doesn't
    expect(matchesVehicle(baseVehicle, { brand: 'Volvo', price_max: 50000 })).toBe(false)
  })

  it('ignores undefined filter values', () => {
    const filters: AlertFilters = {
      brand: 'Mercedes',
      model: undefined,
      price_min: undefined,
    }
    expect(matchesVehicle(baseVehicle, filters)).toBe(true)
  })

  it('handles vehicle with all null fields and no filters', () => {
    const emptyVehicle: VehicleForMatching = {
      id: 'v-2',
      brand: null,
      model: null,
      price: null,
      year: null,
      km: null,
      category_id: null,
      subcategory_id: null,
      location_country: null,
      location_region: null,
      slug: 'unknown',
    }
    expect(matchesVehicle(emptyVehicle, {})).toBe(true)
  })

  it('handles complex multi-filter scenario', () => {
    const filters: AlertFilters = {
      category_id: 'cat-trucks',
      subcategory_id: 'sub-tractors',
      brand: 'Mercedes',
      model: 'Actros',
      price_min: 30000,
      price_max: 60000,
      year_min: 2018,
      year_max: 2022,
      km_max: 300000,
      location_country: 'ES',
      location_region: 'Castilla',
    }
    expect(matchesVehicle(baseVehicle, filters)).toBe(true)
  })
})
