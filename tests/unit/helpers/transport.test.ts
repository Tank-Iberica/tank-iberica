import { describe, it, expect } from 'vitest'
import {
  resolveZoneFromPostalCode,
  getProvinceFromPostalCode,
  formatCents,
  SPANISH_POSTAL_PREFIXES,
  REGION_TO_ZONE,
} from '../../../app/utils/transport.helpers'

describe('transport.helpers — resolveZoneFromPostalCode', () => {
  it('resolves Madrid postal code to zona-2', () => {
    expect(resolveZoneFromPostalCode('28001')).toBe('zona-2')
  })

  it('resolves Barcelona postal code to zona-1', () => {
    expect(resolveZoneFromPostalCode('08001')).toBe('zona-1')
  })

  it('resolves Sevilla postal code to zona-3', () => {
    expect(resolveZoneFromPostalCode('41001')).toBe('zona-3')
  })

  it('resolves Baleares as personalizado', () => {
    expect(resolveZoneFromPostalCode('07001')).toBe('personalizado')
  })

  it('resolves Portuguese 4-digit postal code', () => {
    expect(resolveZoneFromPostalCode('1000')).toBe('portugal')
  })

  it('resolves Portuguese 7-digit postal code', () => {
    expect(resolveZoneFromPostalCode('1000001')).toBe('portugal')
  })

  it('resolves Portuguese CP with dash format', () => {
    expect(resolveZoneFromPostalCode('1000-001')).toBe('portugal')
  })

  it('resolves French southern département', () => {
    // 31xxx is Navarra in Spain, so use a prefix that's not in SPANISH_POSTAL_PREFIXES
    // French prefix 81 = Tarn (southern France), not a Spanish province
    expect(resolveZoneFromPostalCode('81000')).toBe('francia-sur')
    expect(resolveZoneFromPostalCode('66000')).toBe('francia-sur')
  })

  it('returns null for unrecognized postal code', () => {
    expect(resolveZoneFromPostalCode('XXXXX')).toBeNull()
    expect(resolveZoneFromPostalCode('99999')).toBeNull()
  })

  it('handles whitespace and dashes', () => {
    expect(resolveZoneFromPostalCode(' 28 001 ')).toBe('zona-2')
  })
})

describe('transport.helpers — getProvinceFromPostalCode', () => {
  it('returns province for valid Spanish CP', () => {
    expect(getProvinceFromPostalCode('28001')).toBe('Madrid')
    expect(getProvinceFromPostalCode('08015')).toBe('Barcelona')
    expect(getProvinceFromPostalCode('41001')).toBe('Sevilla')
  })

  it('returns null for non-Spanish CP', () => {
    expect(getProvinceFromPostalCode('1000')).toBeNull()
    expect(getProvinceFromPostalCode('ABC')).toBeNull()
  })

  it('returns null for unknown prefix', () => {
    expect(getProvinceFromPostalCode('99999')).toBeNull()
  })
})

describe('transport.helpers — formatCents', () => {
  it('formats cents to EUR string', () => {
    const result = formatCents(150000)
    // toLocaleString may not use thousands separator in test env
    expect(result).toContain('1500')
    expect(result).toContain('€')
  })

  it('formats zero', () => {
    expect(formatCents(0)).toContain('0')
  })
})

describe('transport.helpers — constants', () => {
  it('SPANISH_POSTAL_PREFIXES has 52 entries', () => {
    expect(Object.keys(SPANISH_POSTAL_PREFIXES)).toHaveLength(52)
  })

  it('REGION_TO_ZONE covers major regions', () => {
    expect(REGION_TO_ZONE['Cataluña']).toBe('zona-1')
    expect(REGION_TO_ZONE['Comunidad de Madrid']).toBe('zona-2')
    expect(REGION_TO_ZONE['Andalucía']).toBe('zona-3')
    expect(REGION_TO_ZONE['Canarias']).toBe('personalizado')
  })
})
