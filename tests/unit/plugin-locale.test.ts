/**
 * Tests for app/plugins/locale-by-country.client.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const { mockGetLocaleFallback } = vi.hoisted(() => ({
  mockGetLocaleFallback: vi.fn().mockReturnValue('es'),
}))

vi.mock('~/utils/geoData', () => ({
  getLocaleFallbackForCountry: mockGetLocaleFallback,
}))

vi.stubGlobal('defineNuxtPlugin', (fn: Function) => fn)

const mockSetLocale = vi.fn().mockResolvedValue(undefined)
const mockFetchProfile = vi.fn()
let mockProfile: { value: { lang?: string } | null } = { value: null }
let mockLangCookieValue: string | null = null

vi.stubGlobal('useNuxtApp', () => ({
  $i18n: {
    locale: { value: 'es' },
    setLocale: mockSetLocale,
  },
}))

vi.stubGlobal('useAuth', () => ({
  profile: mockProfile,
  fetchProfile: mockFetchProfile,
}))

vi.stubGlobal('useCookie', () => ({
  get value() { return mockLangCookieValue },
  set value(v: string | null) { mockLangCookieValue = v },
}))

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// ── Dynamic import (after stubs) ──────────────────────────────────────────────

let pluginFn: Function

beforeAll(async () => {
  pluginFn = (await import('../../app/plugins/locale-by-country.client')).default
})

// ══ Tests ═════════════════════════════════════════════════════════════════════

describe('locale-by-country plugin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProfile = { value: null }
    mockLangCookieValue = null
    mockFetchProfile.mockResolvedValue(null)
    mockFetch.mockResolvedValue({ country: 'ES' })
    mockGetLocaleFallback.mockReturnValue('es')
  })

  it('sets locale from logged-in user lang when profile has lang', async () => {
    mockProfile = { value: { lang: 'en' } }
    vi.stubGlobal('useNuxtApp', () => ({
      $i18n: { locale: { value: 'es' }, setLocale: mockSetLocale },
    }))
    await pluginFn()
    expect(mockSetLocale).toHaveBeenCalledWith('en')
    expect(mockLangCookieValue).toBe('en')
  })

  it('does not call setLocale if locale already matches profile lang', async () => {
    mockProfile = { value: { lang: 'es' } }
    vi.stubGlobal('useNuxtApp', () => ({
      $i18n: { locale: { value: 'es' }, setLocale: mockSetLocale },
    }))
    await pluginFn()
    expect(mockSetLocale).not.toHaveBeenCalled()
    expect(mockLangCookieValue).toBe('es')
  })

  it('fetches profile when profile.value is null', async () => {
    mockProfile = { value: null }
    mockFetchProfile.mockResolvedValue(null)
    await pluginFn()
    expect(mockFetchProfile).toHaveBeenCalled()
  })

  it('returns early when cookie lang is already set (no geo call)', async () => {
    mockProfile = { value: null }
    mockFetchProfile.mockResolvedValue(null)
    mockLangCookieValue = 'en'
    await pluginFn()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('auto-detects locale by IP country when no profile or cookie', async () => {
    mockProfile = { value: null }
    mockFetchProfile.mockResolvedValue(null)
    mockLangCookieValue = null
    mockFetch.mockResolvedValue({ country: 'US' })
    mockGetLocaleFallback.mockReturnValue('en')
    vi.stubGlobal('useNuxtApp', () => ({
      $i18n: { locale: { value: 'es' }, setLocale: mockSetLocale },
    }))
    await pluginFn()
    expect(mockFetch).toHaveBeenCalledWith('/api/geo')
    expect(mockSetLocale).toHaveBeenCalledWith('en')
    expect(mockLangCookieValue).toBe('en')
  })

  it('handles geo fetch error gracefully without throwing', async () => {
    mockProfile = { value: null }
    mockFetchProfile.mockResolvedValue(null)
    mockLangCookieValue = null
    mockFetch.mockRejectedValue(new Error('Network error'))
    await expect(pluginFn()).resolves.toBeUndefined()
  })

  it('uses fetchProfile result when profile.value is null', async () => {
    mockProfile = { value: null }
    mockFetchProfile.mockResolvedValue({ lang: 'en' })
    vi.stubGlobal('useAuth', () => ({
      profile: { value: null },
      fetchProfile: mockFetchProfile,
    }))
    vi.stubGlobal('useNuxtApp', () => ({
      $i18n: { locale: { value: 'es' }, setLocale: mockSetLocale },
    }))
    await pluginFn()
    expect(mockSetLocale).toHaveBeenCalledWith('en')
  })
})
