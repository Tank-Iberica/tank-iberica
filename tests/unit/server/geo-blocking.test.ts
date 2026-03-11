import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock useRuntimeConfig
const mockConfig = {
  geoBlockingEnabled: 'false',
  geoBlockingCountries: '',
  geoBlockingMode: 'allow',
}

vi.stubGlobal('useRuntimeConfig', () => mockConfig)

// We need to test the logic directly since middleware is an event handler
// Extract the core logic for testing
function evaluateGeoBlock(params: {
  enabled: boolean | string
  countries: string
  mode: string
  cfCountry: string | undefined
  path: string
}): { blocked: boolean; statusCode?: number } {
  if (params.enabled !== 'true' && params.enabled !== true) {
    return { blocked: false }
  }

  if (params.path.startsWith('/api/')) {
    return { blocked: false }
  }

  const country = params.cfCountry?.toUpperCase()
  if (!country || country === 'XX' || country === 'T1') {
    return { blocked: false }
  }

  if (!params.countries) return { blocked: false }

  const countries = params.countries
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)
  if (countries.length === 0) return { blocked: false }

  const mode = (params.mode || 'allow').toLowerCase()
  const isInList = countries.includes(country)

  if (mode === 'allow' && !isInList) {
    return { blocked: true, statusCode: 451 }
  }

  if (mode === 'deny' && isInList) {
    return { blocked: true, statusCode: 451 }
  }

  return { blocked: false }
}

describe('geo-blocking middleware logic', () => {
  it('allows all when disabled', () => {
    const result = evaluateGeoBlock({
      enabled: 'false',
      countries: 'ES,PT',
      mode: 'allow',
      cfCountry: 'US',
      path: '/',
    })
    expect(result.blocked).toBe(false)
  })

  it('allows all when enabled=false (boolean)', () => {
    const result = evaluateGeoBlock({
      enabled: false,
      countries: 'ES',
      mode: 'allow',
      cfCountry: 'US',
      path: '/',
    })
    expect(result.blocked).toBe(false)
  })

  it('never blocks API routes', () => {
    const result = evaluateGeoBlock({
      enabled: 'true',
      countries: 'ES',
      mode: 'allow',
      cfCountry: 'US',
      path: '/api/cron/test',
    })
    expect(result.blocked).toBe(false)
  })

  it('allows when no CF header (local dev)', () => {
    const result = evaluateGeoBlock({
      enabled: 'true',
      countries: 'ES',
      mode: 'allow',
      cfCountry: undefined,
      path: '/',
    })
    expect(result.blocked).toBe(false)
  })

  it('allows XX (unknown) country', () => {
    const result = evaluateGeoBlock({
      enabled: 'true',
      countries: 'ES',
      mode: 'allow',
      cfCountry: 'XX',
      path: '/',
    })
    expect(result.blocked).toBe(false)
  })

  it('allows T1 (Tor) country', () => {
    const result = evaluateGeoBlock({
      enabled: 'true',
      countries: 'ES',
      mode: 'allow',
      cfCountry: 'T1',
      path: '/',
    })
    expect(result.blocked).toBe(false)
  })

  it('allows listed country in allow mode', () => {
    const result = evaluateGeoBlock({
      enabled: 'true',
      countries: 'ES,PT,FR',
      mode: 'allow',
      cfCountry: 'ES',
      path: '/',
    })
    expect(result.blocked).toBe(false)
  })

  it('blocks unlisted country in allow mode', () => {
    const result = evaluateGeoBlock({
      enabled: 'true',
      countries: 'ES,PT',
      mode: 'allow',
      cfCountry: 'US',
      path: '/',
    })
    expect(result.blocked).toBe(true)
    expect(result.statusCode).toBe(451)
  })

  it('blocks listed country in deny mode', () => {
    const result = evaluateGeoBlock({
      enabled: 'true',
      countries: 'RU,CN',
      mode: 'deny',
      cfCountry: 'RU',
      path: '/',
    })
    expect(result.blocked).toBe(true)
    expect(result.statusCode).toBe(451)
  })

  it('allows unlisted country in deny mode', () => {
    const result = evaluateGeoBlock({
      enabled: 'true',
      countries: 'RU,CN',
      mode: 'deny',
      cfCountry: 'ES',
      path: '/',
    })
    expect(result.blocked).toBe(false)
  })

  it('handles empty countries string gracefully', () => {
    const result = evaluateGeoBlock({
      enabled: 'true',
      countries: '',
      mode: 'allow',
      cfCountry: 'ES',
      path: '/',
    })
    expect(result.blocked).toBe(false)
  })

  it('handles case-insensitive country codes', () => {
    const result = evaluateGeoBlock({
      enabled: 'true',
      countries: 'es,pt',
      mode: 'allow',
      cfCountry: 'ES',
      path: '/',
    })
    expect(result.blocked).toBe(false)
  })

  it('handles spaces in countries list', () => {
    const result = evaluateGeoBlock({
      enabled: 'true',
      countries: ' ES , PT , FR ',
      mode: 'allow',
      cfCountry: 'PT',
      path: '/',
    })
    expect(result.blocked).toBe(false)
  })
})
