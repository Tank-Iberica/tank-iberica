/**
 * Tests for app/pages/[...slug].vue
 * Catch-all page — loading, 404, landing, dealer portal branches.
 */
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import {
  ref,
  computed,
  watch,
  defineComponent,
  h,
  Suspense,
  reactive,
  readonly,
  unref,
  toValue,
  nextTick,
} from 'vue'

// Restore real Vue reactivity primitives that setup.ts stubs out
beforeAll(() => {
  vi.stubGlobal('ref', ref)
  vi.stubGlobal('computed', computed)
  vi.stubGlobal('watch', watch)
  vi.stubGlobal('reactive', reactive)
  vi.stubGlobal('readonly', readonly)
  vi.stubGlobal('unref', unref)
  vi.stubGlobal('toValue', toValue)
  vi.stubGlobal('nextTick', nextTick)
})

// --- Mocks ---

vi.mock('~/utils/reserved-slugs', () => ({
  RESERVED_SLUGS: ['admin', 'dashboard', 'login', 'noticias', 'vehiculo'],
}))
vi.mock('~/utils/faqSchema', () => ({
  buildFaqPageSchema: vi.fn(() => null),
}))
vi.mock('~/utils/itemListSchema', () => ({
  buildItemListSchema: vi.fn(() => null),
}))

vi.stubGlobal('usePageSeo', vi.fn())
vi.stubGlobal('useHead', vi.fn())
vi.stubGlobal('useJsonLd', vi.fn())
vi.stubGlobal('useSiteUrl', () => 'https://tracciona.es')
vi.stubGlobal('navigateTo', vi.fn())

// createError: in the component, `throw createError(...)` is used.
// We make it return an error object, but the component's `throw` will propagate it.
// For tests where the throw happens, we handle it via onErrorCaptured in the Suspense wrapper.
vi.stubGlobal('createError', (opts: Record<string, unknown>) => {
  const err = new Error(String(opts.statusMessage))
  ;(err as unknown as Record<string, unknown>).statusCode = opts.statusCode
  return err
})

// Stubs for child components
const componentStubs = {
  NuxtLink: { template: '<a><slot /></a>' },
  UiBreadcrumbNav: { template: '<nav />' },
  DealerPortal: { template: '<div class="dealer-portal-stub" />', props: ['dealer'] },
}

// Globals
let mockResolved: ReturnType<typeof ref>
let mockStatus: ReturnType<typeof ref>
let mockRouteSlug: string | string[]

let useAsyncDataCallCount = 0
vi.stubGlobal('useAsyncData', (_key: string, _fn: () => unknown) => {
  useAsyncDataCallCount++
  // First call = slug resolution (returns mockResolved)
  // Subsequent calls = child landings, landing vehicles (return empty)
  if (useAsyncDataCallCount === 1) {
    return Promise.resolve({ data: mockResolved, status: mockStatus })
  }
  return Promise.resolve({ data: ref([]), status: ref('success') })
})

vi.stubGlobal('useRoute', () => ({
  params: { slug: mockRouteSlug },
  query: {},
}))

const mockLocale = ref('es')
vi.stubGlobal('useI18n', () => ({
  locale: mockLocale,
  t: (key: string) => key,
}))

// Chainable Supabase mock — not actually called since useAsyncData is mocked
const supabaseChain: Record<string, unknown> = {}
for (const m of ['select', 'eq', 'order', 'limit', 'single', 'in', 'gte', 'lte']) {
  supabaseChain[m] = () => supabaseChain
}
supabaseChain.single = () => Promise.resolve({ data: null, error: null })
supabaseChain.then = (r: (v: unknown) => void) =>
  Promise.resolve({ data: null, error: null }).then(r)
vi.stubGlobal('useSupabaseClient', () => ({
  from: () => supabaseChain,
}))

// Import after mocks
import PageCatchAll from '../../../app/pages/[...slug].vue'

// --- Helpers ---
function makeLanding(overrides: Record<string, unknown> = {}) {
  return {
    type: 'landing' as const,
    data: {
      id: 'l-1',
      slug: 'camiones-usados',
      vertical: 'tracciona',
      vehicle_count: 42,
      is_active: true,
      parent_slug: null,
      meta_title_es: 'Camiones Usados',
      meta_title_en: 'Used Trucks',
      meta_description_es: 'Mejores camiones usados',
      meta_description_en: 'Best used trucks',
      intro_text_es: 'Descubre nuestros camiones',
      intro_text_en: 'Discover our trucks',
      breadcrumb: [{ label: 'Camiones' }],
      schema_data: null,
      ...overrides,
    },
  }
}

function makeDealer(overrides: Record<string, unknown> = {}) {
  return {
    type: 'dealer' as const,
    data: {
      id: 'd-1',
      slug: 'automax',
      company_name: { es: 'AutoMax', en: 'AutoMax' },
      logo_url: null,
      cover_image_url: null,
      theme: null,
      bio: null,
      phone: '+34600123456',
      whatsapp: null,
      email: 'info@automax.com',
      website: null,
      location_data: null,
      address: 'Madrid, Spain',
      badge: null,
      subscription_type: 'pro',
      social_links: null,
      certifications: null,
      pinned_vehicles: null,
      catalog_sort: null,
      contact_config: null,
      active_listings: 10,
      total_leads: 50,
      rating: 4.5,
      created_at: '2025-06-01T00:00:00Z',
      ...overrides,
    },
  }
}

/**
 * Factory wraps the async component in a Suspense boundary.
 * When the component throws createError (for non-reserved, non-loading, null result),
 * onErrorCaptured catches it to prevent unhandled rejections.
 */
async function factory(
  resolved: unknown = null,
  status = 'success',
  slug: string | string[] = ['camiones-usados'],
  locale = 'es',
) {
  useAsyncDataCallCount = 0
  mockResolved = ref(resolved)
  mockStatus = ref(status)
  mockRouteSlug = slug
  mockLocale.value = locale

  const capturedErrors: Error[] = []

  const wrapper = mount(
    defineComponent({
      setup() {
        return () =>
          h(Suspense, null, {
            default: () => h(PageCatchAll as ReturnType<typeof defineComponent>),
            fallback: () => h('div', { class: 'suspense-fallback' }, 'Loading...'),
          })
      },
    }),
    {
      global: {
        mocks: { $t: (key: string) => key },
        stubs: componentStubs,
        config: {
          errorHandler: (err: unknown) => {
            capturedErrors.push(err as Error)
          },
        },
      },
    },
  )

  await flushPromises()
  return { wrapper, capturedErrors }
}

// --- Tests ---
describe('PageCatchAll ([...slug])', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocale.value = 'es'
  })

  // ---- Loading state ----
  describe('loading state', () => {
    it('shows loading skeleton when status is pending', async () => {
      const { wrapper: w } = await factory(null, 'pending')
      expect(w.find('.landing-loading').exists()).toBe(true)
    })

    it('renders 6 skeleton cards', async () => {
      const { wrapper: w } = await factory(null, 'pending')
      expect(w.findAll('.skeleton-card')).toHaveLength(6)
    })

    it('hides 404 and content while loading', async () => {
      const { wrapper: w } = await factory(null, 'pending')
      expect(w.find('.landing-not-found').exists()).toBe(false)
      expect(w.find('.landing-container').exists()).toBe(false)
      expect(w.find('.dealer-portal-stub').exists()).toBe(false)
    })
  })

  // ---- 404 / not-found ----
  describe('not-found state', () => {
    // For non-reserved slugs with null result, the component throws createError.
    // The 404 UI template is shown when resolvedType is null (which also covers reserved slugs).
    // Use a reserved slug so the throw is bypassed and the template 404 UI renders.
    it('shows 404 UI for reserved slugs that resolve to nothing', async () => {
      // 'admin' is in RESERVED_SLUGS, so isReserved=true, throw is bypassed
      const { wrapper: w } = await factory(null, 'success', ['admin'])
      expect(w.find('.landing-not-found').exists()).toBe(true)
      expect(w.find('.landing-not-found h1').text()).toBe('404')
    })

    it('shows error description for reserved slug 404', async () => {
      const { wrapper: w } = await factory(null, 'success', ['admin'])
      expect(w.text()).toContain('seo.errorDescription')
    })

    it('renders home link for reserved slug 404', async () => {
      const { wrapper: w } = await factory(null, 'success', ['admin'])
      const link = w.find('.back-link')
      expect(link.exists()).toBe(true)
      expect(link.text()).toContain('nav.home')
    })

    it('throws createError for non-reserved slug with no result', async () => {
      const { capturedErrors } = await factory(null, 'success', ['unknown-page'])
      expect(capturedErrors.length).toBeGreaterThan(0)
      expect(capturedErrors[0].message).toBe('Page not found')
      expect((capturedErrors[0] as unknown as Record<string, unknown>).statusCode).toBe(404)
    })
  })

  // ---- Dealer portal ----
  describe('dealer portal branch', () => {
    it('renders DealerPortal when resolvedType is dealer', async () => {
      const { wrapper: w } = await factory(makeDealer(), 'success', ['automax'])
      expect(w.find('.dealer-portal-stub').exists()).toBe(true)
    })

    it('does not render landing content for dealer', async () => {
      const { wrapper: w } = await factory(makeDealer(), 'success', ['automax'])
      expect(w.find('.landing-container').exists()).toBe(false)
      expect(w.find('.landing-not-found').exists()).toBe(false)
    })
  })

  // ---- Landing page ----
  describe('landing page branch', () => {
    it('renders landing container when resolvedType is landing', async () => {
      const { wrapper: w } = await factory(makeLanding(), 'success')
      expect(w.find('.landing-container').exists()).toBe(true)
    })

    it('displays landing title in ES', async () => {
      const { wrapper: w } = await factory(makeLanding())
      expect(w.find('.landing-title').text()).toBe('Camiones Usados')
    })

    it('displays landing title in EN when locale is en', async () => {
      const { wrapper: w } = await factory(makeLanding(), 'success', ['camiones-usados'], 'en')
      expect(w.find('.landing-title').text()).toBe('Used Trucks')
    })

    it('falls back to slug-based title when meta_title_es is null', async () => {
      const { wrapper: w } = await factory(
        makeLanding({ meta_title_es: null, meta_title_en: null, slug: 'gruas-moviles' }),
      )
      expect(w.find('.landing-title').text()).toBe('gruas moviles')
    })

    it('shows description when present', async () => {
      const { wrapper: w } = await factory(makeLanding())
      expect(w.find('.landing-description').exists()).toBe(true)
      expect(w.find('.landing-description').text()).toBe('Mejores camiones usados')
    })

    it('hides description when meta_description_es is empty', async () => {
      const { wrapper: w } = await factory(
        makeLanding({ meta_description_es: '', meta_description_en: '' }),
      )
      expect(w.find('.landing-description').exists()).toBe(false)
    })

    it('displays vehicle count when present', async () => {
      const { wrapper: w } = await factory(makeLanding({ vehicle_count: 17 }))
      expect(w.find('.landing-count').exists()).toBe(true)
    })

    it('hides vehicle count when zero', async () => {
      const { wrapper: w } = await factory(makeLanding({ vehicle_count: 0 }))
      expect(w.find('.landing-count').exists()).toBe(false)
    })

    it('renders intro text when present', async () => {
      const { wrapper: w } = await factory(makeLanding())
      expect(w.find('.landing-intro').exists()).toBe(true)
      expect(w.find('.landing-intro').text()).toBe('Descubre nuestros camiones')
    })

    it('hides intro text when empty', async () => {
      const { wrapper: w } = await factory(makeLanding({ intro_text_es: '', intro_text_en: '' }))
      expect(w.find('.landing-intro').exists()).toBe(false)
    })

    it('shows EN intro text when locale is en', async () => {
      const { wrapper: w } = await factory(makeLanding(), 'success', ['camiones-usados'], 'en')
      expect(w.find('.landing-intro').text()).toBe('Discover our trucks')
    })

    it('renders catalog section', async () => {
      // #63: placeholder was replaced with actual catalog grid (loading/grid/empty states)
      const { wrapper: w } = await factory(makeLanding())
      const hasCatalog =
        w.find('.landing-catalog-loading').exists() ||
        w.find('.landing-catalog-grid').exists() ||
        w.find('.landing-catalog-empty').exists()
      expect(hasCatalog).toBe(true)
    })
  })

  // ---- Breadcrumbs ----
  describe('breadcrumbs', () => {
    it('renders breadcrumbs for landing page', async () => {
      const { wrapper: w } = await factory(makeLanding())
      expect(w.find('nav').exists()).toBe(true)
    })

    it('uses custom breadcrumb from landing data when available', async () => {
      const customCrumbs = [{ label: 'Vehiculos', to: '/vehiculos' }, { label: 'Camiones' }]
      const { wrapper: w } = await factory(makeLanding({ breadcrumb: customCrumbs }))
      expect(w.find('nav').exists()).toBe(true)
    })

    it('falls back to default breadcrumb when landing.breadcrumb is null', async () => {
      const { wrapper: w } = await factory(makeLanding({ breadcrumb: null }))
      expect(w.find('nav').exists()).toBe(true)
    })
  })

  // ---- v-if branches ----
  describe('v-if branch coverage', () => {
    it('loading=true: only loading shown', async () => {
      const { wrapper: w } = await factory(null, 'pending')
      expect(w.find('.landing-loading').exists()).toBe(true)
      expect(w.find('.landing-not-found').exists()).toBe(false)
      expect(w.find('.dealer-portal-stub').exists()).toBe(false)
      expect(w.find('.landing-container').exists()).toBe(false)
    })

    it('reserved slug + null resolved: shows 404 UI', async () => {
      const { wrapper: w } = await factory(null, 'success', ['admin'])
      expect(w.find('.landing-loading').exists()).toBe(false)
      expect(w.find('.landing-not-found').exists()).toBe(true)
      expect(w.find('.dealer-portal-stub').exists()).toBe(false)
      expect(w.find('.landing-container').exists()).toBe(false)
    })

    it('dealer resolved: dealer portal only', async () => {
      const { wrapper: w } = await factory(makeDealer(), 'success', ['automax'])
      expect(w.find('.landing-loading').exists()).toBe(false)
      expect(w.find('.landing-not-found').exists()).toBe(false)
      expect(w.find('.dealer-portal-stub').exists()).toBe(true)
      expect(w.find('.landing-container').exists()).toBe(false)
    })

    it('landing resolved: landing only', async () => {
      const { wrapper: w } = await factory(makeLanding(), 'success')
      expect(w.find('.landing-loading').exists()).toBe(false)
      expect(w.find('.landing-not-found').exists()).toBe(false)
      expect(w.find('.dealer-portal-stub').exists()).toBe(false)
      expect(w.find('.landing-container').exists()).toBe(true)
    })
  })

  // ---- EN locale landing ----
  describe('EN locale for landing', () => {
    it('shows EN description when locale is en', async () => {
      const { wrapper: w } = await factory(makeLanding(), 'success', ['camiones-usados'], 'en')
      expect(w.find('.landing-description').text()).toBe('Best used trucks')
    })

    it('falls back to ES description when EN is missing', async () => {
      const { wrapper: w } = await factory(
        makeLanding({ meta_description_en: null }),
        'success',
        ['camiones-usados'],
        'en',
      )
      expect(w.find('.landing-description').text()).toBe('Mejores camiones usados')
    })

    it('falls back to ES intro when EN is missing', async () => {
      const { wrapper: w } = await factory(
        makeLanding({ intro_text_en: null }),
        'success',
        ['camiones-usados'],
        'en',
      )
      expect(w.find('.landing-intro').text()).toBe('Descubre nuestros camiones')
    })
  })

  // ---- Edge cases ----
  describe('edge cases', () => {
    it('handles landing with all nulls gracefully', async () => {
      const { wrapper: w } = await factory(
        makeLanding({
          meta_title_es: null,
          meta_title_en: null,
          meta_description_es: null,
          meta_description_en: null,
          intro_text_es: null,
          intro_text_en: null,
          vehicle_count: 0,
          breadcrumb: null,
        }),
      )
      expect(w.find('.landing-container').exists()).toBe(true)
      expect(w.find('.landing-description').exists()).toBe(false)
      expect(w.find('.landing-intro').exists()).toBe(false)
      expect(w.find('.landing-count').exists()).toBe(false)
    })

    it('throws 404 for empty slug array (non-reserved)', async () => {
      // Empty slug → fullSlug is '', isReserved is false, resolved is null
      // → createError is thrown
      const { capturedErrors } = await factory(null, 'success', [])
      expect(capturedErrors.length).toBeGreaterThan(0)
    })
  })
})
