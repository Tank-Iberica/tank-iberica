import { describe, it, expect } from 'vitest'
import { buildProductName } from '~/utils/productName'
import type { Vehicle } from '~/composables/useVehicles'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> }

function makeVehicle(overrides: DeepPartial<Vehicle> = {}): Vehicle {
  return overrides as Vehicle
}

function makeCategory(nameEs: string, nameEn?: string) {
  return {
    name_singular: { es: nameEs, en: nameEn ?? nameEs },
    name: { es: nameEs, en: nameEn ?? nameEs },
    name_es: nameEs,
    name_en: nameEn ?? nameEs,
  }
}

// ─── Fallback when no fields ──────────────────────────────────────────────────

describe('buildProductName — empty vehicle', () => {
  it('returns "Vehículo" in es when no fields', () => {
    expect(buildProductName(makeVehicle(), 'es')).toBe('Vehículo')
  })

  it('returns "Vehicle" in en when no fields', () => {
    expect(buildProductName(makeVehicle(), 'en')).toBe('Vehicle')
  })
})

// ─── Brand + Model only ───────────────────────────────────────────────────────

describe('buildProductName — brand and model', () => {
  it('builds "Brand Model" from brand + model only', () => {
    const v = makeVehicle({ brand: 'Volvo', model: 'FH16' })
    expect(buildProductName(v, 'es')).toBe('Volvo FH16')
    expect(buildProductName(v, 'en')).toBe('Volvo FH16')
  })

  it('builds only brand when model is absent', () => {
    const v = makeVehicle({ brand: 'Scania' })
    expect(buildProductName(v, 'es')).toBe('Scania')
  })
})

// ─── With subcategory and category ───────────────────────────────────────────

describe('buildProductName — with subcategory', () => {
  it('includes category name from subcategory_categories', () => {
    const v = makeVehicle({
      brand: 'DAF',
      model: 'XF',
      subcategories: {
        ...makeCategory('Camión', 'Truck'),
        subcategory_categories: [
          { categories: makeCategory('Vehículos industriales', 'Industrial vehicles') },
        ],
      } as Vehicle['subcategories'],
    })
    const result = buildProductName(v, 'es')
    expect(result).toContain('Vehículos industriales')
    expect(result).toContain('Camión')
    expect(result).toContain('DAF')
    expect(result).toContain('XF')
  })

  it('uses English names when locale is en', () => {
    const v = makeVehicle({
      brand: 'MAN',
      model: 'TGX',
      subcategories: {
        ...makeCategory('Camión', 'Truck'),
        subcategory_categories: [
          { categories: makeCategory('Vehículos industriales', 'Industrial vehicles') },
        ],
      } as Vehicle['subcategories'],
    })
    const result = buildProductName(v, 'en')
    expect(result).toContain('Industrial vehicles')
    expect(result).toContain('Truck')
    expect(result).not.toContain('Camión')
  })
})

// ─── Year inclusion ───────────────────────────────────────────────────────────

describe('buildProductName — year', () => {
  it('does not include year by default', () => {
    const v = makeVehicle({ brand: 'Mercedes', model: 'Actros', year: 2020 })
    expect(buildProductName(v, 'es')).toBe('Mercedes Actros')
  })

  it('includes year when includeYear=true', () => {
    const v = makeVehicle({ brand: 'Mercedes', model: 'Actros', year: 2020 })
    expect(buildProductName(v, 'es', true)).toBe('Mercedes Actros (2020)')
  })

  it('does not include year when year is absent even with includeYear=true', () => {
    const v = makeVehicle({ brand: 'Iveco', model: 'Stralis' })
    expect(buildProductName(v, 'es', true)).toBe('Iveco Stralis')
  })
})

// ─── name_singular priority over name ────────────────────────────────────────

describe('buildProductName — name_singular priority', () => {
  it('uses name_singular over name for subcategory', () => {
    const v = makeVehicle({
      brand: 'Renault',
      model: 'T',
      subcategories: {
        name_singular: { es: 'Tractor' },
        name: { es: 'Tractores' },
        subcategory_categories: [],
      } as unknown as Vehicle['subcategories'],
    })
    const result = buildProductName(v, 'es')
    expect(result).toContain('Tractor')
    expect(result).not.toContain('Tractores')
  })
})

// ─── Fallback chain for locale ────────────────────────────────────────────────

describe('buildProductName — locale fallback', () => {
  it('falls back to en when requested locale not present', () => {
    const v = makeVehicle({
      brand: 'Krone',
      subcategories: {
        name_singular: { es: 'Semirremolque', en: 'Semi-trailer' },
        subcategory_categories: [],
      } as unknown as Vehicle['subcategories'],
    })
    // Polish locale not available → falls back to en
    expect(buildProductName(v, 'pl')).toContain('Semi-trailer')
  })

  it('falls back to es name_es legacy column', () => {
    const v = makeVehicle({
      brand: 'Kögel',
      subcategories: {
        name_singular: null,
        name: null,
        name_es: 'Cisterna',
        subcategory_categories: [],
      } as unknown as Vehicle['subcategories'],
    })
    expect(buildProductName(v, 'es')).toContain('Cisterna')
  })
})
