import { describe, it, expect } from 'vitest'
import { parseLocationText } from '~/utils/parseLocation'

// ─── Empty / null input ───────────────────────────────────────────────────────

describe('parseLocationText — empty input', () => {
  it('returns nulls for null input', () => {
    const r = parseLocationText(null)
    expect(r).toEqual({ country: null, province: null, region: null })
  })

  it('returns nulls for empty string', () => {
    const r = parseLocationText('')
    expect(r).toEqual({ country: null, province: null, region: null })
  })

  it('returns nulls for whitespace-only string', () => {
    const r = parseLocationText('   ')
    expect(r).toEqual({ country: null, province: null, region: null })
  })
})

// ─── Spanish cities → province + region ──────────────────────────────────────

describe('parseLocationText — Spanish city resolution', () => {
  it('resolves Madrid → province Madrid, region Comunidad de Madrid', () => {
    const r = parseLocationText('Madrid')
    expect(r.country).toBe('ES')
    expect(r.province).toBe('Madrid')
    expect(r.region).toBeTruthy()
  })

  it('resolves "Madrid, España" with country suffix', () => {
    const r = parseLocationText('Madrid, España')
    expect(r.country).toBe('ES')
    expect(r.province).toBe('Madrid')
  })

  it('resolves Barcelona → province Barcelona', () => {
    const r = parseLocationText('Barcelona')
    expect(r.country).toBe('ES')
    expect(r.province).toBe('Barcelona')
  })

  it('resolves Bilbao → province Vizcaya', () => {
    const r = parseLocationText('Bilbao')
    expect(r.country).toBe('ES')
    expect(r.province).toBe('Vizcaya')
  })

  it('resolves Vitoria → province Álava', () => {
    const r = parseLocationText('Vitoria')
    expect(r.country).toBe('ES')
    expect(r.province).toBe('Álava')
  })

  it('resolves Santander → province Cantabria', () => {
    const r = parseLocationText('Santander')
    expect(r.country).toBe('ES')
    expect(r.province).toBe('Cantabria')
  })

  it('resolves León → province León (accented)', () => {
    const r = parseLocationText('León')
    expect(r.country).toBe('ES')
    expect(r.province).toBe('León')
  })

  it('resolves "leon" (lowercase, no accent) → province León', () => {
    const r = parseLocationText('leon')
    expect(r.country).toBe('ES')
    expect(r.province).toBe('León')
  })

  it('resolves Tenerife → province Santa Cruz de Tenerife', () => {
    const r = parseLocationText('Tenerife')
    expect(r.country).toBe('ES')
    expect(r.province).toBe('Santa Cruz de Tenerife')
  })
})

// ─── Province as city part ────────────────────────────────────────────────────

describe('parseLocationText — province as input', () => {
  it('resolves "Zaragoza" (city = province) → province Zaragoza', () => {
    const r = parseLocationText('Zaragoza')
    expect(r.country).toBe('ES')
    expect(r.province).toBe('Zaragoza')
  })

  it('resolves "Salamanca" (city = province) → province Salamanca', () => {
    const r = parseLocationText('Salamanca')
    expect(r.country).toBe('ES')
    expect(r.province).toBe('Salamanca')
  })
})

// ─── Country code detection ───────────────────────────────────────────────────

describe('parseLocationText — country code detection', () => {
  it('detects ISO 2-letter code "DE" as country (no province)', () => {
    const r = parseLocationText('Berlin, DE')
    expect(r.country).toBe('DE')
    expect(r.province).toBeNull()
  })

  it('detects "FR" as France', () => {
    const r = parseLocationText('Paris, FR')
    expect(r.country).toBe('FR')
  })

  it('detects country name "Francia" → FR', () => {
    const r = parseLocationText('Lyon, Francia')
    // geoData COUNTRY_NAMES should have Francia → FR
    expect(r.country).toBe('FR')
  })
})

// ─── Normalization ────────────────────────────────────────────────────────────

describe('parseLocationText — normalization', () => {
  it('handles uppercase city names', () => {
    const r = parseLocationText('MADRID')
    expect(r.province).toBe('Madrid')
  })

  it('handles extra spaces around commas', () => {
    const r = parseLocationText('  Barcelona  ,  España  ')
    expect(r.country).toBe('ES')
    expect(r.province).toBe('Barcelona')
  })

  it('strips accents from input before lookup', () => {
    // "Malaga" without accent should resolve same as "Málaga"
    const r = parseLocationText('Malaga')
    expect(r.province).toBe('Málaga')
  })
})

// ─── Unknown location ─────────────────────────────────────────────────────────

describe('parseLocationText — unknown location', () => {
  it('returns country null for completely unknown city with no country suffix', () => {
    const r = parseLocationText('Nowhere City XYZ')
    expect(r.country).toBeNull()
    expect(r.province).toBeNull()
  })

  it('returns country only when known country suffix but non-Spanish city', () => {
    const r = parseLocationText('Unknown City, DE')
    expect(r.country).toBe('DE')
    expect(r.province).toBeNull()
  })
})

// ─── Return structure ─────────────────────────────────────────────────────────

describe('parseLocationText — return structure', () => {
  it('always returns object with country, province, region keys', () => {
    const r = parseLocationText('Any text')
    expect(r).toHaveProperty('country')
    expect(r).toHaveProperty('province')
    expect(r).toHaveProperty('region')
  })

  it('region is set when province is resolved for Spanish city', () => {
    const r = parseLocationText('Pamplona')
    expect(r.region).toBeTruthy()
    expect(typeof r.region).toBe('string')
  })
})
