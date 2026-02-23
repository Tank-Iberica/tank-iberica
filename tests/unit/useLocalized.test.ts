import { describe, it, expect } from 'vitest'
import { localizedField } from '../../app/composables/useLocalized'

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
