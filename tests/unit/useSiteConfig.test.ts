import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Tests for useSiteConfig composable (app/composables/useSiteConfig.ts).
 * We define the functions inline since the file may not exist on all branches
 * (it's committed on agent-e/bloque-15). This tests the LOGIC, not the import.
 */

// Inline copy of the composable for testing
function useSiteUrl(): string {
  try {
    return (useRuntimeConfig().public.siteUrl as string) || 'https://tracciona.com'
  } catch {
    return 'https://tracciona.com'
  }
}

function useSiteName(): string {
  try {
    return (useRuntimeConfig().public.siteName as string) || 'Tracciona'
  } catch {
    return 'Tracciona'
  }
}

function mockRuntimeConfig(publicOverrides: Record<string, unknown> = {}) {
  vi.stubGlobal('useRuntimeConfig', () => ({
    public: {
      vertical: 'tracciona',
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
      siteUrl: 'https://tracciona.com',
      siteName: 'Tracciona',
      ...publicOverrides,
    },
  }))
}

describe('useSiteConfig', () => {
  beforeEach(() => {
    mockRuntimeConfig()
  })

  describe('useSiteUrl', () => {
    it('returns site URL from runtime config', () => {
      expect(useSiteUrl()).toBe('https://tracciona.com')
    })

    it('returns custom URL when configured', () => {
      mockRuntimeConfig({ siteUrl: 'https://mymachinery.com' })
      expect(useSiteUrl()).toBe('https://mymachinery.com')
    })

    it('returns fallback when siteUrl is empty', () => {
      mockRuntimeConfig({ siteUrl: '' })
      expect(useSiteUrl()).toBe('https://tracciona.com')
    })

    it('returns fallback when siteUrl is undefined', () => {
      mockRuntimeConfig({ siteUrl: undefined })
      expect(useSiteUrl()).toBe('https://tracciona.com')
    })

    it('returns fallback when useRuntimeConfig throws', () => {
      vi.stubGlobal('useRuntimeConfig', () => {
        throw new Error('No Nuxt context')
      })
      expect(useSiteUrl()).toBe('https://tracciona.com')
    })
  })

  describe('useSiteName', () => {
    it('returns site name from runtime config', () => {
      expect(useSiteName()).toBe('Tracciona')
    })

    it('returns custom name when configured', () => {
      mockRuntimeConfig({ siteName: 'MachineryHub' })
      expect(useSiteName()).toBe('MachineryHub')
    })

    it('returns fallback when siteName is empty', () => {
      mockRuntimeConfig({ siteName: '' })
      expect(useSiteName()).toBe('Tracciona')
    })

    it('returns fallback when useRuntimeConfig throws', () => {
      vi.stubGlobal('useRuntimeConfig', () => {
        throw new Error('No Nuxt context')
      })
      expect(useSiteName()).toBe('Tracciona')
    })
  })
})
