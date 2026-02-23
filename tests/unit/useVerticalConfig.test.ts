import { describe, it, expect, beforeEach, vi } from 'vitest'

import { useVerticalConfig } from '../../app/composables/useVerticalConfig'

// Track supabase calls so we can verify caching
let supabaseSingleCallCount = 0

// Mock useSupabaseClient locally to track calls and return specific data
vi.stubGlobal('useSupabaseClient', () => ({
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => {
          supabaseSingleCallCount++
          return Promise.resolve({
            data: {
              id: 'config-1',
              vertical: 'tracciona',
              name: { es: 'Tracciona', en: 'Tracciona' },
              tagline: null,
              meta_description: null,
              logo_url: null,
              logo_dark_url: null,
              favicon_url: null,
              og_image_url: null,
              theme: { primary: '#23424A' },
              font_preset: null,
              header_links: [],
              footer_text: null,
              footer_links: [],
              social_links: {},
              hero_title: null,
              hero_subtitle: null,
              hero_cta_text: null,
              hero_cta_url: null,
              hero_image_url: null,
              homepage_sections: {
                featured_vehicles: true,
                latest_articles: true,
                hero: false,
              },
              active_locales: ['es', 'en'],
              default_locale: 'es',
              active_actions: ['venta', 'alquiler'],
              google_analytics_id: null,
              subscription_prices: {},
              commission_rates: {},
              require_vehicle_approval: false,
              require_article_approval: false,
              auto_translate_on_publish: false,
              auto_publish_social: false,
            },
            error: null,
          })
        },
      }),
    }),
  }),
}))

describe('useVerticalConfig', () => {
  beforeEach(() => {
    // setup.ts clears stateStore each test, so config starts null
    supabaseSingleCallCount = 0
  })

  it('should have initial config as null', () => {
    const { config } = useVerticalConfig()
    expect(config.value).toBeNull()
  })

  it('isSectionActive() returns false when config is null', () => {
    const { isSectionActive } = useVerticalConfig()
    expect(isSectionActive('featured_vehicles')).toBe(false)
    expect(isSectionActive('hero')).toBe(false)
    expect(isSectionActive('nonexistent')).toBe(false)
  })

  it('isLocaleActive() returns false when config is null', () => {
    const { isLocaleActive } = useVerticalConfig()
    expect(isLocaleActive('es')).toBe(false)
    expect(isLocaleActive('fr')).toBe(false)
  })

  it('isActionActive() returns false when config is null', () => {
    const { isActionActive } = useVerticalConfig()
    expect(isActionActive('venta')).toBe(false)
    expect(isActionActive('subasta')).toBe(false)
  })

  it('isSectionActive("featured_vehicles") returns true when config has that section active', async () => {
    const { loadConfig, isSectionActive } = useVerticalConfig()
    await loadConfig()

    expect(isSectionActive('featured_vehicles')).toBe(true)
    expect(isSectionActive('latest_articles')).toBe(true)
  })

  it('isSectionActive("hero") returns false when section is set to false in config', async () => {
    const { loadConfig, isSectionActive } = useVerticalConfig()
    await loadConfig()

    expect(isSectionActive('hero')).toBe(false)
  })

  it('isLocaleActive("es") returns true when "es" is in active_locales', async () => {
    const { loadConfig, isLocaleActive } = useVerticalConfig()
    await loadConfig()

    expect(isLocaleActive('es')).toBe(true)
    expect(isLocaleActive('en')).toBe(true)
  })

  it('isLocaleActive("fr") returns false when "fr" not in active_locales', async () => {
    const { loadConfig, isLocaleActive } = useVerticalConfig()
    await loadConfig()

    expect(isLocaleActive('fr')).toBe(false)
    expect(isLocaleActive('de')).toBe(false)
  })

  it('isActionActive("venta") returns true when in active_actions', async () => {
    const { loadConfig, isActionActive } = useVerticalConfig()
    await loadConfig()

    expect(isActionActive('venta')).toBe(true)
    expect(isActionActive('alquiler')).toBe(true)
  })

  it('isActionActive("subasta") returns false when not in active_actions', async () => {
    const { loadConfig, isActionActive } = useVerticalConfig()
    await loadConfig()

    expect(isActionActive('subasta')).toBe(false)
    expect(isActionActive('terceros')).toBe(false)
  })

  it('loadConfig caches result — second call does not query Supabase again', async () => {
    const { loadConfig } = useVerticalConfig()

    // First call should query Supabase
    await loadConfig()
    expect(supabaseSingleCallCount).toBe(1)

    // Second call should return cached value and NOT query again
    await loadConfig()
    expect(supabaseSingleCallCount).toBe(1)
  })

  it('loadConfig returns the config data', async () => {
    const { loadConfig, config } = useVerticalConfig()
    const result = await loadConfig()

    expect(result).not.toBeNull()
    expect(config.value).not.toBeNull()
    expect(config.value?.vertical).toBe('tracciona')
    expect(config.value?.active_locales).toEqual(['es', 'en'])
    expect(config.value?.active_actions).toEqual(['venta', 'alquiler'])
  })
})
