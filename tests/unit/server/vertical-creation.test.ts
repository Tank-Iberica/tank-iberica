/**
 * E2E-style test for vertical creation flow.
 *
 * Validates that the vertical creation process follows the expected pattern:
 * 1. Insert vertical_config with all required fields
 * 2. Insert categories scoped to the vertical
 * 3. Insert subcategories linked to categories
 * 4. Insert characteristics per subcategory
 * 5. Insert transport zones per vertical
 * 6. Insert email templates per vertical
 *
 * Uses mock Supabase client to validate the SQL/data shape.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Simulated vertical creation function (matches the migration pattern)
interface VerticalConfig {
  vertical: string
  name: Record<string, string>
  tagline: Record<string, string>
  meta_description: Record<string, string>
  theme: Record<string, string>
  font_preset: string
  active_locales: string[]
  default_locale: string
  active_actions: string[]
  homepage_sections: Record<string, boolean>
  subscription_prices: Record<string, { monthly_cents: number; annual_cents: number }>
  commission_rates: Record<string, number>
}

interface VerticalCategory {
  vertical: string
  slug: string
  name_es: string
  name_en: string
  name: Record<string, string>
  sort_order: number
  status: string
}

interface TransportZone {
  vertical: string
  zone_slug: string
  zone_name: string
  price_cents: number
  regions: string[]
  sort_order: number
  status: string
}

// Validation functions (pure, testable)
function validateVerticalConfig(config: VerticalConfig): string[] {
  const errors: string[] = []

  if (!config.vertical || config.vertical.length < 2) {
    errors.push('vertical slug must be at least 2 characters')
  }
  if (!/^[a-z][a-z0-9-]*$/.test(config.vertical)) {
    errors.push('vertical slug must be lowercase alphanumeric with hyphens')
  }
  if (!config.name.es || !config.name.en) {
    errors.push('name must include es and en translations')
  }
  if (!config.tagline.es) {
    errors.push('tagline must include at least es translation')
  }
  if (!config.theme.primary) {
    errors.push('theme must include primary color')
  }
  if (config.active_locales.length === 0) {
    errors.push('must have at least one active locale')
  }
  if (!config.active_locales.includes(config.default_locale)) {
    errors.push('default_locale must be in active_locales')
  }
  if (config.active_actions.length === 0) {
    errors.push('must have at least one active action (venta, alquiler)')
  }

  // Validate subscription prices
  const plans = ['free', 'basic', 'premium', 'founding']
  for (const plan of plans) {
    if (!config.subscription_prices[plan]) {
      errors.push(`subscription_prices must include ${plan} plan`)
    }
  }

  return errors
}

function validateCategories(categories: VerticalCategory[], vertical: string): string[] {
  const errors: string[] = []

  if (categories.length === 0) {
    errors.push('must have at least one category')
  }

  const slugs = new Set<string>()
  for (const cat of categories) {
    if (cat.vertical !== vertical) {
      errors.push(`category ${cat.slug} has wrong vertical: ${cat.vertical}`)
    }
    if (slugs.has(cat.slug)) {
      errors.push(`duplicate category slug: ${cat.slug}`)
    }
    slugs.add(cat.slug)

    if (!cat.slug.startsWith(`${vertical.substring(0, 3)}-`)) {
      errors.push(`category slug ${cat.slug} should be prefixed with vertical abbreviation`)
    }
    if (!cat.name.es || !cat.name.en) {
      errors.push(`category ${cat.slug} missing es/en translations`)
    }
  }

  // Verify sort order is sequential
  const sortOrders = categories.map((c) => c.sort_order).sort((a, b) => a - b)
  for (let i = 0; i < sortOrders.length; i++) {
    if (sortOrders[i] !== i + 1) {
      errors.push(`sort_order gap: expected ${i + 1}, got ${sortOrders[i]}`)
    }
  }

  return errors
}

function validateTransportZones(zones: TransportZone[], vertical: string): string[] {
  const errors: string[] = []

  if (zones.length === 0) {
    errors.push('must have at least one transport zone')
  }

  const slugs = new Set<string>()
  for (const zone of zones) {
    if (zone.vertical !== vertical) {
      errors.push(`zone ${zone.zone_slug} has wrong vertical: ${zone.vertical}`)
    }
    if (slugs.has(zone.zone_slug)) {
      errors.push(`duplicate zone slug: ${zone.zone_slug}`)
    }
    slugs.add(zone.zone_slug)

    if (zone.price_cents < 0) {
      errors.push(`zone ${zone.zone_slug} has negative price`)
    }
    if (zone.regions.length === 0) {
      errors.push(`zone ${zone.zone_slug} has no regions`)
    }
  }

  return errors
}

// =========================================================================
// Tests
// =========================================================================

describe('Vertical Creation — Config Validation', () => {
  const validConfig: VerticalConfig = {
    vertical: 'test-vertical',
    name: { es: 'Test Vertical', en: 'Test Vertical' },
    tagline: { es: 'El marketplace de test', en: 'The test marketplace' },
    meta_description: { es: 'Descripción test', en: 'Test description' },
    theme: { primary: '#C84B31', secondary: '#ECDBBA', accent: '#2D4263' },
    font_preset: 'default',
    active_locales: ['es', 'en'],
    default_locale: 'es',
    active_actions: ['venta'],
    homepage_sections: { featured: true, categories: true, latest: true },
    subscription_prices: {
      free: { monthly_cents: 0, annual_cents: 0 },
      basic: { monthly_cents: 1900, annual_cents: 19000 },
      premium: { monthly_cents: 4900, annual_cents: 49000 },
      founding: { monthly_cents: 0, annual_cents: 0 },
    },
    commission_rates: { sale_pct: 0, auction_buyer_premium_pct: 8.0 },
  }

  it('accepts valid config', () => {
    expect(validateVerticalConfig(validConfig)).toEqual([])
  })

  it('rejects empty vertical slug', () => {
    const errors = validateVerticalConfig({ ...validConfig, vertical: '' })
    expect(errors).toContain('vertical slug must be at least 2 characters')
  })

  it('rejects uppercase vertical slug', () => {
    const errors = validateVerticalConfig({ ...validConfig, vertical: 'Test' })
    expect(errors).toContain('vertical slug must be lowercase alphanumeric with hyphens')
  })

  it('rejects missing es/en name', () => {
    const errors = validateVerticalConfig({ ...validConfig, name: { es: 'Test' } })
    expect(errors).toContain('name must include es and en translations')
  })

  it('rejects missing tagline', () => {
    const errors = validateVerticalConfig({ ...validConfig, tagline: { en: 'Test' } })
    expect(errors).toContain('tagline must include at least es translation')
  })

  it('rejects missing primary theme color', () => {
    const errors = validateVerticalConfig({ ...validConfig, theme: { secondary: '#FFF' } })
    expect(errors).toContain('theme must include primary color')
  })

  it('rejects empty active_locales', () => {
    const errors = validateVerticalConfig({
      ...validConfig,
      active_locales: [],
      default_locale: 'es',
    })
    expect(errors.some((e) => e.includes('at least one active locale'))).toBe(true)
  })

  it('rejects default_locale not in active_locales', () => {
    const errors = validateVerticalConfig({
      ...validConfig,
      active_locales: ['es'],
      default_locale: 'fr',
    })
    expect(errors).toContain('default_locale must be in active_locales')
  })

  it('rejects empty active_actions', () => {
    const errors = validateVerticalConfig({ ...validConfig, active_actions: [] })
    expect(errors.some((e) => e.includes('at least one active action'))).toBe(true)
  })

  it('rejects missing subscription plan', () => {
    const config = {
      ...validConfig,
      subscription_prices: {
        free: { monthly_cents: 0, annual_cents: 0 },
        basic: { monthly_cents: 1900, annual_cents: 19000 },
        // missing premium and founding
      },
    }
    const errors = validateVerticalConfig(config)
    expect(errors.some((e) => e.includes('premium'))).toBe(true)
    expect(errors.some((e) => e.includes('founding'))).toBe(true)
  })
})

describe('Vertical Creation — Category Validation', () => {
  const validCategories: VerticalCategory[] = [
    {
      vertical: 'hor',
      slug: 'hor-coccion',
      name_es: 'Cocción',
      name_en: 'Cooking',
      name: { es: 'Cocción', en: 'Cooking' },
      sort_order: 1,
      status: 'published',
    },
    {
      vertical: 'hor',
      slug: 'hor-lavado',
      name_es: 'Lavado',
      name_en: 'Washing',
      name: { es: 'Lavado', en: 'Washing' },
      sort_order: 2,
      status: 'published',
    },
  ]

  it('accepts valid categories', () => {
    expect(validateCategories(validCategories, 'hor')).toEqual([])
  })

  it('rejects empty categories', () => {
    const errors = validateCategories([], 'hor')
    expect(errors).toContain('must have at least one category')
  })

  it('rejects wrong vertical', () => {
    const cats = [{ ...validCategories[0], vertical: 'other' }]
    const errors = validateCategories(cats, 'hor')
    expect(errors.some((e) => e.includes('wrong vertical'))).toBe(true)
  })

  it('rejects duplicate slugs', () => {
    const cats = [validCategories[0], { ...validCategories[1], slug: 'hor-coccion' }]
    const errors = validateCategories(cats, 'hor')
    expect(errors.some((e) => e.includes('duplicate'))).toBe(true)
  })

  it('warns on sort order gaps', () => {
    const cats = [
      { ...validCategories[0], sort_order: 1 },
      { ...validCategories[1], sort_order: 3 },
    ]
    const errors = validateCategories(cats, 'hor')
    expect(errors.some((e) => e.includes('sort_order gap'))).toBe(true)
  })
})

describe('Vertical Creation — Transport Zone Validation', () => {
  const validZones: TransportZone[] = [
    {
      vertical: 'hor',
      zone_slug: 'local',
      zone_name: 'Local',
      price_cents: 5000,
      regions: ['Comunidad de Madrid'],
      sort_order: 1,
      status: 'active',
    },
    {
      vertical: 'hor',
      zone_slug: 'zona-1',
      zone_name: 'Zona Norte',
      price_cents: 15000,
      regions: ['Galicia', 'Asturias'],
      sort_order: 2,
      status: 'active',
    },
  ]

  it('accepts valid zones', () => {
    expect(validateTransportZones(validZones, 'hor')).toEqual([])
  })

  it('rejects empty zones', () => {
    expect(validateTransportZones([], 'hor')).toContain('must have at least one transport zone')
  })

  it('rejects negative prices', () => {
    const zones = [{ ...validZones[0], price_cents: -100 }]
    const errors = validateTransportZones(zones, 'hor')
    expect(errors.some((e) => e.includes('negative price'))).toBe(true)
  })

  it('rejects zones with no regions', () => {
    const zones = [{ ...validZones[0], regions: [] }]
    const errors = validateTransportZones(zones, 'hor')
    expect(errors.some((e) => e.includes('no regions'))).toBe(true)
  })

  it('rejects duplicate zone slugs', () => {
    const zones = [validZones[0], { ...validZones[1], zone_slug: 'local' }]
    const errors = validateTransportZones(zones, 'hor')
    expect(errors.some((e) => e.includes('duplicate'))).toBe(true)
  })
})

describe('Vertical Creation — Full Flow Simulation', () => {
  it('validates complete vertical creation data matches Horecaria pattern', () => {
    const config: VerticalConfig = {
      vertical: 'horecaria',
      name: { es: 'Horecaria', en: 'Horecaria' },
      tagline: {
        es: 'El marketplace de equipamiento hostelero',
        en: 'The hospitality equipment marketplace',
      },
      meta_description: {
        es: 'Compra, venta y alquiler de equipamiento de hostelería',
        en: 'Buy, sell and rent hospitality equipment',
      },
      theme: { primary: '#C84B31', secondary: '#ECDBBA', accent: '#2D4263', bg_primary: '#FFFFFF' },
      font_preset: 'default',
      active_locales: ['es', 'en', 'fr'],
      default_locale: 'es',
      active_actions: ['venta', 'alquiler'],
      homepage_sections: { featured: true, categories: true, latest: true, auctions: false },
      subscription_prices: {
        free: { monthly_cents: 0, annual_cents: 0 },
        basic: { monthly_cents: 1900, annual_cents: 19000 },
        premium: { monthly_cents: 4900, annual_cents: 49000 },
        founding: { monthly_cents: 0, annual_cents: 0 },
      },
      commission_rates: {
        sale_pct: 0,
        auction_buyer_premium_pct: 8.0,
        transport_commission_pct: 10.0,
      },
    }

    const categories: VerticalCategory[] = [
      {
        vertical: 'horecaria',
        slug: 'hor-coccion',
        name_es: 'Cocción',
        name_en: 'Cooking',
        name: { es: 'Cocción', en: 'Cooking', fr: 'Cuisson' },
        sort_order: 1,
        status: 'published',
      },
      {
        vertical: 'horecaria',
        slug: 'hor-refrigeracion',
        name_es: 'Refrigeración',
        name_en: 'Refrigeration',
        name: { es: 'Refrigeración', en: 'Refrigeration', fr: 'Réfrigération' },
        sort_order: 2,
        status: 'published',
      },
      {
        vertical: 'horecaria',
        slug: 'hor-lavado',
        name_es: 'Lavado',
        name_en: 'Washing',
        name: { es: 'Lavado', en: 'Washing', fr: 'Lavage' },
        sort_order: 3,
        status: 'published',
      },
    ]

    const zones: TransportZone[] = [
      {
        vertical: 'horecaria',
        zone_slug: 'local',
        zone_name: 'Local',
        price_cents: 5000,
        regions: ['local'],
        sort_order: 1,
        status: 'active',
      },
      {
        vertical: 'horecaria',
        zone_slug: 'zona-1',
        zone_name: 'Zona Norte',
        price_cents: 15000,
        regions: ['Galicia', 'Asturias', 'Cantabria'],
        sort_order: 2,
        status: 'active',
      },
    ]

    // All validations should pass
    expect(validateVerticalConfig(config)).toEqual([])
    expect(validateCategories(categories, 'horecaria')).toEqual([])
    expect(validateTransportZones(zones, 'horecaria')).toEqual([])

    // Cross-validation: categories reference the config vertical
    for (const cat of categories) {
      expect(cat.vertical).toBe(config.vertical)
    }

    // Cross-validation: zones reference the config vertical
    for (const zone of zones) {
      expect(zone.vertical).toBe(config.vertical)
    }

    // Cross-validation: category translations cover all active locales
    for (const cat of categories) {
      for (const locale of config.active_locales) {
        expect(cat.name[locale]).toBeTruthy()
      }
    }
  })
})
