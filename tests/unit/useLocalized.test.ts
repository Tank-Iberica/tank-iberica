import { describe, it, expect, vi } from 'vitest'
import { localizedField, localizedName, fetchTranslation } from '../../app/composables/useLocalized'

describe('localizedField', () => {
  it('returns the value for the requested locale', () => {
    const field = { es: 'Camiones', en: 'Trucks', fr: 'Camions' }
    expect(localizedField(field, 'es')).toBe('Camiones')
    expect(localizedField(field, 'en')).toBe('Trucks')
    expect(localizedField(field, 'fr')).toBe('Camions')
  })

  it('falls back to "en" when requested locale is missing', () => {
    const field = { en: 'Trucks', es: 'Camiones' }
    expect(localizedField(field, 'fr')).toBe('Trucks')
  })

  it('falls back to "es" when both requested locale and "en" are missing', () => {
    const field = { es: 'Camiones' }
    expect(localizedField(field, 'fr')).toBe('Camiones')
  })

  it('falls back to the first available value when neither "en" nor "es" exist', () => {
    const field = { fr: 'Camions', de: 'Lastwagen' }
    // Object.values returns values in insertion order, so 'fr' is first
    expect(localizedField(field, 'pt')).toBe('Camions')
  })

  it('returns empty string for null input', () => {
    expect(localizedField(null, 'es')).toBe('')
  })

  it('returns empty string for undefined input', () => {
    expect(localizedField(undefined, 'es')).toBe('')
  })

  it('returns empty string for an empty object', () => {
    expect(localizedField({}, 'es')).toBe('')
  })

  it('works correctly with "es" locale', () => {
    const field = { es: 'Cisternas', en: 'Tankers' }
    expect(localizedField(field, 'es')).toBe('Cisternas')
  })

  it('works correctly with "en" locale', () => {
    const field = { es: 'Cisternas', en: 'Tankers' }
    expect(localizedField(field, 'en')).toBe('Tankers')
  })

  it('works correctly with "fr" locale when present', () => {
    const field = { es: 'Cisternas', en: 'Tankers', fr: 'Citernes' }
    expect(localizedField(field, 'fr')).toBe('Citernes')
  })

  it('prefers exact locale over "en" fallback', () => {
    const field = { es: 'Hola', en: 'Hello', de: 'Hallo' }
    expect(localizedField(field, 'de')).toBe('Hallo')
  })

  it('returns empty string when all values are empty strings', () => {
    // The fallback chain finds empty strings, which are falsy, so it keeps falling through
    // until Object.values()[0] which is '' => returns ''
    const field = { es: '', en: '', fr: '' }
    expect(localizedField(field, 'es')).toBe('')
  })
})

// ─── localizedName ────────────────────────────────────────────────────────────

describe('localizedName', () => {
  it('returns empty string for null item', () => {
    expect(localizedName(null, 'es')).toBe('')
  })

  it('returns empty string for undefined item', () => {
    expect(localizedName(undefined, 'es')).toBe('')
  })

  it('returns JSONB name value when name field has the locale', () => {
    const item = { name: { es: 'Camión', en: 'Truck' } }
    expect(localizedName(item, 'es')).toBe('Camión')
    expect(localizedName(item, 'en')).toBe('Truck')
  })

  it('falls back to name_en when locale is en and no JSONB name', () => {
    const item = { name: null, name_es: 'Camión', name_en: 'Truck' }
    expect(localizedName(item, 'en')).toBe('Truck')
  })

  it('falls back to name_es when locale is es and no JSONB name', () => {
    const item = { name: null, name_es: 'Camión', name_en: 'Truck' }
    expect(localizedName(item, 'es')).toBe('Camión')
  })

  it('falls back to name_es for non-en locale when JSONB is empty', () => {
    const item = { name: null, name_es: 'Camión', name_en: null }
    expect(localizedName(item, 'fr')).toBe('Camión')
  })

  it('returns empty string when no JSONB, no name_en (for en locale), no name_es', () => {
    const item = { name: null }
    expect(localizedName(item, 'en')).toBe('')
  })

  it('prefers JSONB over legacy columns', () => {
    const item = { name: { es: 'Desde JSONB' }, name_es: 'Legacy', name_en: 'Legacy EN' }
    expect(localizedName(item, 'es')).toBe('Desde JSONB')
  })

  it('returns empty string when item has no name fields', () => {
    const item = {}
    expect(localizedName(item, 'es')).toBe('')
  })
})

// ─── fetchTranslation ─────────────────────────────────────────────────────────

describe('fetchTranslation', () => {
  it('returns empty string when no data returned (default mock)', async () => {
    const result = await fetchTranslation('vehicle', 'uuid-1', 'description', 'es')
    expect(result).toBe('')
  })

  it('returns empty string for en locale with no data', async () => {
    const result = await fetchTranslation('article', 'uuid-2', 'body', 'en')
    expect(result).toBe('')
  })

  it('returns value from exact locale match when supabase returns data', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                in: () => ({
                  order: () =>
                    Promise.resolve({
                      data: [
                        { locale: 'es', value: 'Descripción en español' },
                        { locale: 'en', value: 'Description in English' },
                      ],
                      error: null,
                    }),
                }),
              }),
            }),
          }),
        }),
      }),
    }))
    const result = await fetchTranslation('vehicle', 'uuid-3', 'description', 'es')
    expect(result).toBe('Descripción en español')
  })

  it('falls back to en when exact locale not found', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                in: () => ({
                  order: () =>
                    Promise.resolve({
                      data: [{ locale: 'en', value: 'English fallback' }],
                      error: null,
                    }),
                }),
              }),
            }),
          }),
        }),
      }),
    }))
    const result = await fetchTranslation('vehicle', 'uuid-4', 'description', 'fr')
    expect(result).toBe('English fallback')
  })

  it('falls back to es when neither exact locale nor en found', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                in: () => ({
                  order: () =>
                    Promise.resolve({
                      data: [{ locale: 'es', value: 'Fallback español' }],
                      error: null,
                    }),
                }),
              }),
            }),
          }),
        }),
      }),
    }))
    const result = await fetchTranslation('vehicle', 'uuid-5', 'description', 'fr')
    expect(result).toBe('Fallback español')
  })
})
