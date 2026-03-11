import { describe, it, expect } from 'vitest'
import {
  getLocaleFallbackForCountry,
  getAvailableLevels,
  getDefaultLevel,
  getCountriesForLevel,
  countryFlag,
  getSortedProvinces,
  getRegionsForLevel,
  getProfileCountries,
  PROVINCE_TO_REGION,
  SOUTHWEST_EUROPE,
  EU_MEMBERS,
  SPANISH_SPEAKING_COUNTRIES,
} from '../../app/utils/geoData'

// ─── getLocaleFallbackForCountry ──────────────────────────────────────────────

describe('getLocaleFallbackForCountry', () => {
  it('returns es for Spanish-speaking country', () => {
    expect(getLocaleFallbackForCountry('ES')).toBe('es')
    expect(getLocaleFallbackForCountry('MX')).toBe('es')
    expect(getLocaleFallbackForCountry('AR')).toBe('es')
  })

  it('returns en for non-Spanish-speaking country', () => {
    expect(getLocaleFallbackForCountry('DE')).toBe('en')
    expect(getLocaleFallbackForCountry('FR')).toBe('en')
    expect(getLocaleFallbackForCountry('GB')).toBe('en')
  })

  it('returns es for null (default to Spanish)', () => {
    expect(getLocaleFallbackForCountry(null)).toBe('es')
  })
})

// ─── getAvailableLevels ───────────────────────────────────────────────────────

describe('getAvailableLevels', () => {
  it('returns 8 levels for Spain', () => {
    expect(getAvailableLevels('ES')).toHaveLength(8)
  })

  it('returns provincia level for Spain', () => {
    expect(getAvailableLevels('ES')).toContain('provincia')
  })

  it('returns 5 levels for non-Spain country', () => {
    expect(getAvailableLevels('DE')).toHaveLength(5)
  })

  it('does not include provincia for non-Spain', () => {
    expect(getAvailableLevels('FR')).not.toContain('provincia')
  })

  it('returns 5 levels for null country', () => {
    expect(getAvailableLevels(null)).toHaveLength(5)
  })
})

// ─── getDefaultLevel ──────────────────────────────────────────────────────────

describe('getDefaultLevel', () => {
  it('returns nacional for Spain', () => {
    expect(getDefaultLevel('ES')).toBe('nacional')
  })

  it('returns nacional for null', () => {
    expect(getDefaultLevel(null)).toBe('nacional')
  })

  it('returns europa for other countries', () => {
    expect(getDefaultLevel('DE')).toBe('europa')
    expect(getDefaultLevel('FR')).toBe('europa')
  })
})

// ─── getCountriesForLevel ─────────────────────────────────────────────────────

describe('getCountriesForLevel', () => {
  it('returns user country for nacional', () => {
    const result = getCountriesForLevel('nacional', 'DE')
    expect(result).toEqual(['DE'])
  })

  it('returns ES by default for nacional with null country', () => {
    const result = getCountriesForLevel('nacional', null)
    expect(result).toEqual(['ES'])
  })

  it('returns SOUTHWEST_EUROPE for suroeste_europeo', () => {
    const result = getCountriesForLevel('suroeste_europeo', 'ES')
    expect(result).toEqual(expect.arrayContaining(['ES', 'PT', 'FR']))
  })

  it('returns null for mundo (no filter)', () => {
    expect(getCountriesForLevel('mundo', 'ES')).toBeNull()
  })

  it('returns EU members for union_europea', () => {
    const result = getCountriesForLevel('union_europea', 'ES')
    expect(result).toContain('DE')
    expect(result).toContain('FR')
  })

  it('returns European countries for europa', () => {
    const result = getCountriesForLevel('europa', 'ES')
    expect(result).toContain('ES')
    expect(result).toContain('GB')
    expect(result!.length).toBeGreaterThan(EU_MEMBERS.length)
  })
})

// ─── countryFlag ──────────────────────────────────────────────────────────────

describe('countryFlag', () => {
  it('returns flag emoji for valid ISO code', () => {
    const flag = countryFlag('ES')
    expect(flag).toBeTruthy()
    expect([...flag].length).toBe(2) // flag emoji = 2 regional indicator chars
  })

  it('returns empty string for invalid ISO code', () => {
    expect(countryFlag('X')).toBe('') // too short
    expect(countryFlag('')).toBe('')
    expect(countryFlag('ESPS')).toBe('') // too long
  })

  it('handles lowercase input', () => {
    const flagLower = countryFlag('es')
    const flagUpper = countryFlag('ES')
    expect(flagLower).toBe(flagUpper)
  })
})

// ─── getSortedProvinces ───────────────────────────────────────────────────────

describe('getSortedProvinces', () => {
  it('returns a non-empty sorted array', () => {
    const provinces = getSortedProvinces()
    expect(provinces.length).toBeGreaterThan(0)
  })

  it('contains Madrid and Barcelona', () => {
    const provinces = getSortedProvinces()
    expect(provinces).toContain('Madrid')
    expect(provinces).toContain('Barcelona')
  })

  it('is sorted alphabetically', () => {
    const provinces = getSortedProvinces()
    const sorted = [...provinces].sort((a, b) => a.localeCompare(b, 'es'))
    expect(provinces).toEqual(sorted)
  })
})

// ─── getRegionsForLevel ───────────────────────────────────────────────────────

describe('getRegionsForLevel', () => {
  it('returns null for mundial level', () => {
    expect(getRegionsForLevel('mundo', 'Cataluña')).toBeNull()
  })

  it('returns null for comunidad without userRegion', () => {
    expect(getRegionsForLevel('comunidad', null)).toBeNull()
  })

  it('returns only user region for comunidad', () => {
    const result = getRegionsForLevel('comunidad', 'Cataluña')
    expect(result).toEqual(['Cataluña'])
  })

  it('returns user region + adjacent regions for limitrofes', () => {
    const result = getRegionsForLevel('limitrofes', 'Cataluña')
    expect(result).not.toBeNull()
    expect(result).toContain('Cataluña')
    expect(result!.length).toBeGreaterThan(1)
  })

  it('returns null for limitrofes without userRegion', () => {
    expect(getRegionsForLevel('limitrofes', null)).toBeNull()
  })
})

// ─── PROVINCE_TO_REGION ───────────────────────────────────────────────────────

describe('PROVINCE_TO_REGION', () => {
  it('maps Madrid to Comunidad de Madrid', () => {
    expect(PROVINCE_TO_REGION['Madrid']).toBe('Comunidad de Madrid')
  })

  it('maps Barcelona to Cataluña', () => {
    expect(PROVINCE_TO_REGION['Barcelona']).toBe('Cataluña')
  })

  it('has entries for all 52 provinces', () => {
    expect(Object.keys(PROVINCE_TO_REGION).length).toBeGreaterThanOrEqual(50)
  })
})

// ─── Constants ────────────────────────────────────────────────────────────────

describe('constants', () => {
  it('SOUTHWEST_EUROPE includes ES, PT, FR, AD', () => {
    expect(SOUTHWEST_EUROPE).toContain('ES')
    expect(SOUTHWEST_EUROPE).toContain('PT')
    expect(SOUTHWEST_EUROPE).toContain('FR')
  })

  it('EU_MEMBERS has at least 27 members', () => {
    expect(EU_MEMBERS.length).toBeGreaterThanOrEqual(27)
  })

  it('SPANISH_SPEAKING_COUNTRIES includes ES, MX, AR', () => {
    expect(SPANISH_SPEAKING_COUNTRIES).toContain('ES')
    expect(SPANISH_SPEAKING_COUNTRIES).toContain('MX')
    expect(SPANISH_SPEAKING_COUNTRIES).toContain('AR')
  })
})

// ─── getProfileCountries ──────────────────────────────────────────────────────

describe('getProfileCountries', () => {
  it('returns priority, europe, and latam groups', () => {
    const result = getProfileCountries('es')
    expect(result).toHaveProperty('priority')
    expect(result).toHaveProperty('europe')
    expect(result).toHaveProperty('latam')
  })

  it('priority includes Spain', () => {
    const result = getProfileCountries('es')
    expect(result.priority.some((c) => c.code === 'ES')).toBe(true)
  })

  it('latam includes Mexico', () => {
    const result = getProfileCountries('es')
    expect(result.latam.some((c) => c.code === 'MX')).toBe(true)
  })
})
