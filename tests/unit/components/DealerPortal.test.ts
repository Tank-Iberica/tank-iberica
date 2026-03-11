/**
 * Tests for app/components/DealerPortal.vue
 *
 * Covers: rendering, v-if branches, computed properties (companyName, bioText,
 * badgeKey, badgeLabel, sinceYear, contactConfig flags, workingHours,
 * hasSocialLinks), contact form submission, and catalog section stubs.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { computed, ref, reactive, provide, onMounted, onUnmounted } from 'vue'

// Restore real Vue reactivity primitives (setup.ts stubs them for composable tests)
vi.stubGlobal('computed', computed)
vi.stubGlobal('ref', ref)
vi.stubGlobal('reactive', reactive)
vi.stubGlobal('provide', provide)
vi.stubGlobal('onMounted', onMounted)
vi.stubGlobal('onUnmounted', onUnmounted)

// ---- Mock explicitly-imported composables (path-based) ----

const mockApplyDealerTheme = vi.fn()
const mockRestoreVerticalTheme = vi.fn()
vi.mock('~/composables/useDealerTheme', () => ({
  useDealerTheme: () => ({
    applyDealerTheme: mockApplyDealerTheme,
    restoreVerticalTheme: mockRestoreVerticalTheme,
  }),
}))

vi.mock('~/composables/useLocalized', () => ({
  localizedField: (json: Record<string, string> | null | undefined, locale: string) => {
    if (!json) return ''
    return json[locale] || json['en'] || json['es'] || Object.values(json)[0] || ''
  },
}))

// ---- Mock auto-imported composables (Nuxt globals) ----

const mockFetchVehicles = vi.fn().mockResolvedValue(undefined)
const mockFetchMore = vi.fn().mockResolvedValue(undefined)
const mockResetVehicles = vi.fn()
const vehiclesRef = ref([])
const loadingRef = ref(false)
const loadingMoreRef = ref(false)
const hasMoreRef = ref(false)
vi.stubGlobal('useVehicles', () => ({
  vehicles: vehiclesRef,
  loading: loadingRef,
  loadingMore: loadingMoreRef,
  hasMore: hasMoreRef,
  fetchVehicles: mockFetchVehicles,
  fetchMore: mockFetchMore,
  reset: mockResetVehicles,
}))

const mockResetCatalog = vi.fn()
const mockSetSort = vi.fn()
const filtersRef = ref({})
const sortByRef = ref('recommended')
const viewModeRef = ref('grid')
vi.stubGlobal('useCatalogState', () => ({
  filters: filtersRef,
  sortBy: sortByRef,
  viewMode: viewModeRef,
  resetCatalog: mockResetCatalog,
  setSort: mockSetSort,
}))

const mockResetFilters = vi.fn()
vi.stubGlobal('useFilters', () => ({
  reset: mockResetFilters,
}))

// Mock useHead (Nuxt)
vi.stubGlobal('useHead', vi.fn())

// Supabase mock with configurable insert behaviour
let insertResult: { data: null; error: null | { message: string } } = { data: null, error: null }
vi.stubGlobal('useSupabaseClient', () => ({
  from: () => ({
    insert: vi.fn().mockImplementation(() => Promise.resolve(insertResult)),
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  }),
}))

// Import the component AFTER mocks are set up
import DealerPortal from '../../../app/components/DealerPortal.vue'

// ---- Helpers ----

interface DealerOverrides {
  id?: string
  slug?: string
  company_name?: Record<string, string>
  logo_url?: string | null
  cover_image_url?: string | null
  theme?: Record<string, string> | null
  bio?: Record<string, string> | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  website?: string | null
  address?: string | null
  badge?: string | null
  subscription_type?: string | null
  social_links?: Record<string, string> | null
  certifications?: Array<{ label: Record<string, string>; icon: string; verified: boolean }> | null
  pinned_vehicles?: string[] | null
  catalog_sort?: string | null
  contact_config?: Record<string, unknown> | null
  active_listings?: number
  total_leads?: number
  rating?: number | null
  created_at?: string
}

function makeDealer(overrides: DealerOverrides = {}) {
  return {
    id: 'dealer-1',
    slug: 'acme-trucks',
    company_name: { es: 'Acme Camiones', en: 'Acme Trucks' },
    logo_url: null,
    cover_image_url: null,
    theme: null,
    bio: null,
    phone: null,
    whatsapp: null,
    email: null,
    website: null,
    address: null,
    badge: null,
    subscription_type: null,
    social_links: null,
    certifications: null,
    pinned_vehicles: null,
    catalog_sort: null,
    contact_config: null,
    active_listings: 12,
    total_leads: 0,
    rating: null,
    created_at: '2023-06-15T10:00:00Z',
    ...overrides,
  }
}

function factory(dealerOverrides: DealerOverrides = {}) {
  return shallowMount(DealerPortal, {
    props: { dealer: makeDealer(dealerOverrides) },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        NuxtLink: { template: '<a><slot /></a>' },
        CatalogControlsBar: { template: '<div class="catalog-controls-stub" />' },
        CatalogActiveFilters: { template: '<div class="catalog-filters-stub" />' },
        CatalogVehicleGrid: { template: '<div class="catalog-grid-stub" />' },
      },
    },
  })
}

// ---- Test suites ----

describe('DealerPortal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    insertResult = { data: null, error: null }
  })

  // ============================================================
  // 1. Basic rendering
  // ============================================================
  describe('rendering', () => {
    it('renders the root .dealer-portal container', () => {
      const w = factory()
      expect(w.find('.dealer-portal').exists()).toBe(true)
    })

    it('renders dealer name from localized company_name', () => {
      const w = factory({ company_name: { es: 'Mi Empresa', en: 'My Company' } })
      expect(w.find('.dealer-name').text()).toBe('Mi Empresa')
    })

    it('renders active_listings stat value', () => {
      const w = factory({ active_listings: 42 })
      const stats = w.findAll('.stat-value')
      expect(stats[0].text()).toBe('42')
    })

    it('renders since year from created_at', () => {
      const w = factory({ created_at: '2020-01-01T00:00:00Z' })
      const stats = w.findAll('.stat-value')
      expect(stats[1].text()).toBe('2020')
    })

    it('renders empty sinceYear when created_at is empty', () => {
      const w = factory({ created_at: '' })
      const stats = w.findAll('.stat-value')
      expect(stats[1].text()).toBe('')
    })

    it('renders the catalog section with title', () => {
      const w = factory({ active_listings: 5 })
      expect(w.find('.dealer-catalog-title').exists()).toBe(true)
    })

    it('renders the discover-more section', () => {
      const w = factory()
      expect(w.find('.dealer-discover').exists()).toBe(true)
      expect(w.find('.discover-cta').exists()).toBe(true)
    })
  })

  // ============================================================
  // 2. Cover image v-if branches
  // ============================================================
  describe('cover image', () => {
    it('renders cover image when cover_image_url is provided', () => {
      const w = factory({ cover_image_url: 'https://example.com/cover.jpg' })
      expect(w.find('.cover-img').exists()).toBe(true)
      expect(w.find('.cover-gradient').exists()).toBe(false)
    })

    it('renders gradient fallback when cover_image_url is null', () => {
      const w = factory({ cover_image_url: null })
      expect(w.find('.cover-img').exists()).toBe(false)
      expect(w.find('.cover-gradient').exists()).toBe(true)
    })
  })

  // ============================================================
  // 3. Logo v-if branches
  // ============================================================
  describe('logo', () => {
    it('renders logo img when logo_url is provided', () => {
      const w = factory({ logo_url: 'https://example.com/logo.png' })
      const logoImg = w.find('.logo-wrapper img.dealer-logo')
      expect(logoImg.exists()).toBe(true)
      expect(logoImg.attributes('src')).toBe('https://example.com/logo.png')
    })

    it('renders placeholder when logo_url is null', () => {
      const w = factory({ logo_url: null })
      expect(w.find('.dealer-logo-placeholder').exists()).toBe(true)
    })
  })

  // ============================================================
  // 4. Badge computed properties
  // ============================================================
  describe('badge', () => {
    it('shows no badge when badge is null and subscription_type is null', () => {
      const w = factory({ badge: null, subscription_type: null })
      expect(w.find('.dealer-badge').exists()).toBe(false)
    })

    it('falls through badge="none" to subscription_type premium', () => {
      const w = factory({ badge: 'none', subscription_type: 'premium' })
      expect(w.find('.dealer-badge').exists()).toBe(true)
      expect(w.find('.badge-premium').exists()).toBe(true)
    })

    it('shows founding badge from badge field', () => {
      const w = factory({ badge: 'founding' })
      expect(w.find('.badge-founding').exists()).toBe(true)
    })

    it('shows premium badge from badge field', () => {
      const w = factory({ badge: 'premium' })
      expect(w.find('.badge-premium').exists()).toBe(true)
    })

    it('shows verified badge from badge field', () => {
      const w = factory({ badge: 'verified' })
      expect(w.find('.badge-verified').exists()).toBe(true)
    })

    it('falls back to subscription_type founding when badge is null', () => {
      const w = factory({ badge: null, subscription_type: 'founding' })
      expect(w.find('.badge-founding').exists()).toBe(true)
    })

    it('falls back to subscription_type premium when badge is null', () => {
      const w = factory({ badge: null, subscription_type: 'premium' })
      expect(w.find('.badge-premium').exists()).toBe(true)
    })

    it('hides badge for unknown subscription_type', () => {
      const w = factory({ badge: null, subscription_type: 'basic' })
      expect(w.find('.dealer-badge').exists()).toBe(false)
    })
  })

  // ============================================================
  // 5. Address
  // ============================================================
  describe('address', () => {
    it('shows address when provided', () => {
      const w = factory({ address: 'Calle Mayor 10, Madrid' })
      expect(w.find('.dealer-location').exists()).toBe(true)
      expect(w.text()).toContain('Calle Mayor 10, Madrid')
    })

    it('hides address when null', () => {
      const w = factory({ address: null })
      expect(w.find('.dealer-location').exists()).toBe(false)
    })
  })

  // ============================================================
  // 6. Rating
  // ============================================================
  describe('rating', () => {
    it('renders rating stat when rating is a number', () => {
      const w = factory({ rating: 4.567 })
      const stats = w.findAll('.stat-value')
      // active_listings, sinceYear, rating
      expect(stats).toHaveLength(3)
      expect(stats[2].text()).toBe('4.6')
    })

    it('renders rating 0 when rating is 0', () => {
      const w = factory({ rating: 0 })
      const stats = w.findAll('.stat-value')
      expect(stats).toHaveLength(3)
      expect(stats[2].text()).toBe('0.0')
    })

    it('hides rating stat when rating is null', () => {
      const w = factory({ rating: null })
      const stats = w.findAll('.stat-value')
      // Only active_listings and sinceYear
      expect(stats).toHaveLength(2)
    })
  })

  // ============================================================
  // 7. Contact bar
  // ============================================================
  describe('contact bar', () => {
    it('shows phone button when phone is set and showPhone is true (default)', () => {
      const w = factory({ phone: '+34600111222' })
      const callBtn = w.find('.contact-call')
      expect(callBtn.exists()).toBe(true)
      expect(callBtn.attributes('href')).toBe('tel:+34600111222')
    })

    it('hides phone button when phone is null', () => {
      const w = factory({ phone: null })
      expect(w.find('.contact-call').exists()).toBe(false)
    })

    it('hides phone button when contact_config phone_mode is hidden', () => {
      const w = factory({
        phone: '+34600111222',
        contact_config: { phone_mode: 'hidden' },
      })
      expect(w.find('.contact-call').exists()).toBe(false)
    })

    it('shows phone button when phone_mode is "visible"', () => {
      const w = factory({
        phone: '+34600111222',
        contact_config: { phone_mode: 'visible' },
      })
      expect(w.find('.contact-call').exists()).toBe(true)
    })

    it('shows whatsapp button when whatsapp is set', () => {
      const w = factory({ whatsapp: '34600333444' })
      const waBtn = w.find('.contact-whatsapp')
      expect(waBtn.exists()).toBe(true)
      expect(waBtn.attributes('href')).toBe('https://wa.me/34600333444')
    })

    it('hides whatsapp button when whatsapp is null', () => {
      const w = factory({ whatsapp: null })
      expect(w.find('.contact-whatsapp').exists()).toBe(false)
    })

    it('shows email button when email is set and showEmail is true (default)', () => {
      const w = factory({ email: 'info@acme.es' })
      const emailBtn = w.find('.contact-email')
      expect(emailBtn.exists()).toBe(true)
      expect(emailBtn.attributes('href')).toBe('mailto:info@acme.es')
    })

    it('hides email button when email is null', () => {
      const w = factory({ email: null })
      expect(w.find('.contact-email').exists()).toBe(false)
    })

    it('hides email button when contact_config.show_email is false', () => {
      const w = factory({
        email: 'info@acme.es',
        contact_config: { show_email: false },
      })
      expect(w.find('.contact-email').exists()).toBe(false)
    })
  })

  // ============================================================
  // 8. Working hours
  // ============================================================
  describe('working hours', () => {
    it('shows working hours when localized value exists', () => {
      const w = factory({
        contact_config: { working_hours: { es: 'Lun-Vie 9-18h', en: 'Mon-Fri 9-18h' } },
      })
      expect(w.find('.dealer-working-hours').exists()).toBe(true)
      expect(w.find('.dealer-working-hours').text()).toContain('Lun-Vie 9-18h')
    })

    it('falls back to "es" locale for working hours when current locale missing', () => {
      const w = factory({
        contact_config: { working_hours: { es: 'Lun-Sab 8-20h' } },
      })
      expect(w.find('.dealer-working-hours').text()).toContain('Lun-Sab 8-20h')
    })

    it('hides working hours when not configured', () => {
      const w = factory({ contact_config: null })
      expect(w.find('.dealer-working-hours').exists()).toBe(false)
    })

    it('hides working hours when working_hours object is empty', () => {
      const w = factory({ contact_config: { working_hours: {} } })
      expect(w.find('.dealer-working-hours').exists()).toBe(false)
    })
  })

  // ============================================================
  // 9. Bio / about section
  // ============================================================
  describe('about / bio', () => {
    it('shows bio section when bio is provided', () => {
      const w = factory({ bio: { es: 'Somos una empresa...', en: 'We are a company...' } })
      expect(w.find('.dealer-bio').exists()).toBe(true)
      expect(w.text()).toContain('Somos una empresa...')
    })

    it('hides bio section when bio is null', () => {
      const w = factory({ bio: null })
      expect(w.find('.dealer-bio').exists()).toBe(false)
    })

    it('hides bio section when bio has empty strings', () => {
      const w = factory({ bio: { es: '', en: '' } })
      expect(w.find('.dealer-bio').exists()).toBe(false)
    })
  })

  // ============================================================
  // 10. Certifications
  // ============================================================
  describe('certifications', () => {
    it('shows certifications section when certifications are provided', () => {
      const w = factory({
        certifications: [
          { label: { es: 'ISO 9001' }, icon: 'badge', verified: true },
          { label: { es: 'CE' }, icon: 'shield', verified: false },
        ],
      })
      const pills = w.findAll('.certification-pill')
      expect(pills).toHaveLength(2)
    })

    it('marks verified certifications with .verified class', () => {
      const w = factory({
        certifications: [
          { label: { es: 'ISO 9001' }, icon: 'badge', verified: true },
        ],
      })
      expect(w.find('.certification-pill.verified').exists()).toBe(true)
    })

    it('shows cert check icon for verified certifications', () => {
      const w = factory({
        certifications: [
          { label: { es: 'Verified Cert' }, icon: 'badge', verified: true },
        ],
      })
      expect(w.find('.cert-check').exists()).toBe(true)
    })

    it('hides cert check icon for unverified certifications', () => {
      const w = factory({
        certifications: [
          { label: { es: 'Unverified' }, icon: 'badge', verified: false },
        ],
      })
      expect(w.find('.cert-check').exists()).toBe(false)
    })

    it('renders cert icon img when cert.icon is a URL', () => {
      const w = factory({
        certifications: [
          { label: { es: 'Test' }, icon: 'https://example.com/icon.png', verified: false },
        ],
      })
      expect(w.find('.cert-icon').exists()).toBe(true)
    })

    it('hides certifications section when certifications is null', () => {
      const w = factory({ certifications: null })
      expect(w.find('.certifications-list').exists()).toBe(false)
    })

    it('hides certifications section when certifications is empty', () => {
      const w = factory({ certifications: [] })
      expect(w.find('.certifications-list').exists()).toBe(false)
    })
  })

  // ============================================================
  // 11. Social links
  // ============================================================
  describe('social links', () => {
    it('shows social links section when links are provided', () => {
      const w = factory({
        social_links: { facebook: 'https://facebook.com/acme', instagram: 'https://instagram.com/acme' },
      })
      expect(w.find('.social-links').exists()).toBe(true)
      const links = w.findAll('.social-link')
      expect(links).toHaveLength(2)
    })

    it('renders correct href and rel attributes for social links', () => {
      const w = factory({
        social_links: { linkedin: 'https://linkedin.com/company/acme' },
      })
      const link = w.find('.social-link')
      expect(link.attributes('href')).toBe('https://linkedin.com/company/acme')
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toBe('noopener noreferrer')
    })

    it('hides social links section when social_links is null', () => {
      const w = factory({ social_links: null })
      expect(w.find('.social-links').exists()).toBe(false)
    })

    it('hides social links section when social_links is empty object', () => {
      const w = factory({ social_links: {} })
      expect(w.find('.social-links').exists()).toBe(false)
    })

    it('renders all social links when multiple platforms present', () => {
      const w = factory({
        social_links: {
          facebook: 'https://fb.com',
          instagram: 'https://ig.com',
          linkedin: 'https://li.com',
          x: 'https://x.com',
          youtube: 'https://yt.com',
        },
      })
      expect(w.findAll('.social-link')).toHaveLength(5)
    })
  })

  // ============================================================
  // 12. Website link
  // ============================================================
  describe('website link', () => {
    it('shows website link when website is set and showWebsite is true (default)', () => {
      const w = factory({ website: 'https://acme.es' })
      expect(w.find('.dealer-website').exists()).toBe(true)
      const link = w.find('.website-link')
      expect(link.attributes('href')).toBe('https://acme.es')
    })

    it('hides website link when website is null', () => {
      const w = factory({ website: null })
      expect(w.find('.dealer-website').exists()).toBe(false)
    })

    it('hides website link when contact_config.show_website is false', () => {
      const w = factory({
        website: 'https://acme.es',
        contact_config: { show_website: false },
      })
      expect(w.find('.dealer-website').exists()).toBe(false)
    })
  })

  // ============================================================
  // 13. Contact form
  // ============================================================
  describe('contact form', () => {
    it('renders contact form section', () => {
      const w = factory()
      expect(w.find('.contact-form').exists()).toBe(true)
    })

    it('renders name, phone, and message inputs when form not sent', () => {
      const w = factory()
      expect(w.find('input[type="text"]').exists()).toBe(true)
      expect(w.find('input[type="tel"]').exists()).toBe(true)
      expect(w.find('textarea').exists()).toBe(true)
    })

    it('renders submit button in default state', () => {
      const w = factory()
      const btn = w.find('.form-submit')
      expect(btn.exists()).toBe(true)
      expect(btn.attributes('disabled')).toBeUndefined()
    })

    it('does not show form-error by default', () => {
      const w = factory()
      expect(w.find('.form-error').exists()).toBe(false)
    })

    it('does not show form-success by default', () => {
      const w = factory()
      expect(w.find('.form-success').exists()).toBe(false)
    })

    it('submits contact form successfully and shows success message', async () => {
      insertResult = { data: null, error: null }
      const w = factory()

      await w.find('input[type="text"]').setValue('Juan')
      await w.find('input[type="tel"]').setValue('+34600111222')
      await w.find('textarea').setValue('Estoy interesado')

      await w.find('.contact-form').trigger('submit')
      await w.vm.$nextTick()

      expect(w.find('.form-success').exists()).toBe(true)
      // Form inputs should be hidden (v-else branch)
      expect(w.find('input[type="text"]').exists()).toBe(false)
    })

    it('shows error message when form submission fails', async () => {
      insertResult = { data: null, error: { message: 'DB error' } }
      const w = factory()

      await w.find('input[type="text"]').setValue('Juan')
      await w.find('textarea').setValue('Message')
      await w.find('.contact-form').trigger('submit')
      await w.vm.$nextTick()

      expect(w.find('.form-error').exists()).toBe(true)
      expect(w.find('input[type="text"]').exists()).toBe(true)
    })
  })

  // ============================================================
  // 14. Catalog section stubs
  // ============================================================
  describe('catalog section', () => {
    it('renders CatalogControlsBar stub', () => {
      const w = factory()
      expect(w.find('.catalog-controls-stub').exists()).toBe(true)
    })

    it('renders CatalogActiveFilters stub', () => {
      const w = factory()
      expect(w.find('.catalog-filters-stub').exists()).toBe(true)
    })

    it('renders CatalogVehicleGrid stub', () => {
      const w = factory()
      expect(w.find('.catalog-grid-stub').exists()).toBe(true)
    })
  })

  // ============================================================
  // 15. Computed edge cases
  // ============================================================
  describe('computed edge cases', () => {
    it('companyName uses English fallback when es is missing', () => {
      const w = factory({ company_name: { en: 'English Name' } })
      expect(w.find('.dealer-name').text()).toBe('English Name')
    })

    it('badgeLabel returns empty for unknown badge key (no badge rendered)', () => {
      const w = factory({ badge: 'mysterious' })
      // badge='mysterious' is not 'none' so badgeKey='mysterious'
      // but i18nKeys doesn't have it, so badgeLabel=''
      expect(w.find('.dealer-badge').exists()).toBe(false)
    })
  })

  // ============================================================
  // 16. Contact config flag defaults
  // ============================================================
  describe('contact config flags', () => {
    it('showEmail defaults to true when contact_config is null', () => {
      const w = factory({ email: 'test@test.com', contact_config: null })
      expect(w.find('.contact-email').exists()).toBe(true)
    })

    it('showWebsite defaults to true when contact_config is null', () => {
      const w = factory({ website: 'https://test.com', contact_config: null })
      expect(w.find('.dealer-website').exists()).toBe(true)
    })

    it('showPhone defaults to true when contact_config is null', () => {
      const w = factory({ phone: '+34111222333', contact_config: null })
      expect(w.find('.contact-call').exists()).toBe(true)
    })

    it('showPhone is true when phone_mode is click_to_reveal', () => {
      const w = factory({
        phone: '+34111222333',
        contact_config: { phone_mode: 'click_to_reveal' },
      })
      expect(w.find('.contact-call').exists()).toBe(true)
    })
  })

  // ============================================================
  // 17. Contact bar combinations
  // ============================================================
  describe('contact bar combinations', () => {
    it('shows all three contact buttons when all info is provided', () => {
      const w = factory({
        phone: '+34600111222',
        whatsapp: '34600333444',
        email: 'info@test.es',
      })
      expect(w.find('.contact-call').exists()).toBe(true)
      expect(w.find('.contact-whatsapp').exists()).toBe(true)
      expect(w.find('.contact-email').exists()).toBe(true)
    })

    it('shows only whatsapp when phone and email are null', () => {
      const w = factory({ phone: null, whatsapp: '34600333444', email: null })
      expect(w.find('.contact-call').exists()).toBe(false)
      expect(w.find('.contact-whatsapp').exists()).toBe(true)
      expect(w.find('.contact-email').exists()).toBe(false)
    })
  })

  // ============================================================
  // 18. Full dealer with all fields populated
  // ============================================================
  describe('full dealer rendering', () => {
    it('renders all sections when dealer has all fields populated', () => {
      const w = factory({
        cover_image_url: 'https://example.com/cover.jpg',
        logo_url: 'https://example.com/logo.png',
        badge: 'premium',
        address: 'Calle Test 1',
        rating: 4.8,
        phone: '+34600111222',
        whatsapp: '34600333444',
        email: 'info@test.es',
        website: 'https://test.es',
        bio: { es: 'Bio texto', en: 'Bio text' },
        certifications: [{ label: { es: 'ISO' }, icon: 'badge', verified: true }],
        social_links: { facebook: 'https://fb.com' },
        contact_config: {
          working_hours: { es: '9-18h' },
        },
      })

      expect(w.find('.cover-img').exists()).toBe(true)
      expect(w.find('.dealer-logo-placeholder').exists()).toBe(false)
      expect(w.find('.badge-premium').exists()).toBe(true)
      expect(w.find('.dealer-location').exists()).toBe(true)
      expect(w.findAll('.stat-value')).toHaveLength(3)
      expect(w.find('.contact-call').exists()).toBe(true)
      expect(w.find('.contact-whatsapp').exists()).toBe(true)
      expect(w.find('.contact-email').exists()).toBe(true)
      expect(w.find('.dealer-working-hours').exists()).toBe(true)
      expect(w.find('.dealer-bio').exists()).toBe(true)
      expect(w.find('.certifications-list').exists()).toBe(true)
      expect(w.find('.social-links').exists()).toBe(true)
      expect(w.find('.dealer-website').exists()).toBe(true)
    })
  })

  // ============================================================
  // 19. Minimal dealer (all optional fields null)
  // ============================================================
  describe('minimal dealer rendering', () => {
    it('renders correctly with all optional fields null', () => {
      const w = factory()
      expect(w.find('.dealer-portal').exists()).toBe(true)
      expect(w.find('.dealer-name').exists()).toBe(true)
      // Optional sections should be hidden
      expect(w.find('.cover-img').exists()).toBe(false)
      expect(w.find('.dealer-location').exists()).toBe(false)
      expect(w.find('.contact-call').exists()).toBe(false)
      expect(w.find('.contact-whatsapp').exists()).toBe(false)
      expect(w.find('.contact-email').exists()).toBe(false)
      expect(w.find('.dealer-working-hours').exists()).toBe(false)
      expect(w.find('.dealer-bio').exists()).toBe(false)
      expect(w.find('.certifications-list').exists()).toBe(false)
      expect(w.find('.social-links').exists()).toBe(false)
      expect(w.find('.dealer-website').exists()).toBe(false)
    })
  })

  // ============================================================
  // 20. Lifecycle hooks
  // ============================================================
  describe('lifecycle hooks', () => {
    it('calls applyDealerTheme and fetchVehicles on mount', async () => {
      factory({ theme: { primary: '#ff0000' } })
      // Wait for the onMounted async callback
      await vi.waitFor(() => {
        expect(mockApplyDealerTheme).toHaveBeenCalledWith({ primary: '#ff0000' })
        expect(mockFetchVehicles).toHaveBeenCalled()
      })
    })

    it('calls setSort on mount when dealer has catalog_sort', async () => {
      factory({ catalog_sort: 'price_asc' })
      await vi.waitFor(() => {
        expect(mockSetSort).toHaveBeenCalledWith('price_asc')
      })
    })

    it('does not call setSort on mount when catalog_sort is null', async () => {
      factory({ catalog_sort: null })
      await vi.waitFor(() => {
        expect(mockFetchVehicles).toHaveBeenCalled()
      })
      expect(mockSetSort).not.toHaveBeenCalled()
    })

    it('calls restoreVerticalTheme, reset, and resetCatalog on unmount', () => {
      const w = factory()
      w.unmount()
      expect(mockRestoreVerticalTheme).toHaveBeenCalled()
      expect(mockResetVehicles).toHaveBeenCalled()
      expect(mockResetCatalog).toHaveBeenCalled()
    })
  })

  // ============================================================
  // 21. Catalog event handlers (via vm)
  // ============================================================
  describe('catalog event handlers', () => {
    it('onSortChange calls fetchVehicles', async () => {
      const w = factory()
      // Access the component's exposed methods via the component internals
      const vm = w.vm as unknown as {
        onSortChange: () => Promise<void>
        onFilterChange: () => Promise<void>
        onActionChange: () => Promise<void>
        onLoadMore: () => Promise<void>
        onClearFilters: () => Promise<void>
        onSearchChange: () => void
      }

      mockFetchVehicles.mockClear()
      await vm.onSortChange()
      expect(mockFetchVehicles).toHaveBeenCalled()
    })

    it('onFilterChange calls fetchVehicles', async () => {
      const w = factory()
      const vm = w.vm as unknown as { onFilterChange: () => Promise<void> }
      mockFetchVehicles.mockClear()
      await vm.onFilterChange()
      expect(mockFetchVehicles).toHaveBeenCalled()
    })

    it('onActionChange resets filters and calls fetchVehicles', async () => {
      const w = factory()
      const vm = w.vm as unknown as { onActionChange: () => Promise<void> }
      mockResetFilters.mockClear()
      mockFetchVehicles.mockClear()
      await vm.onActionChange()
      expect(mockResetFilters).toHaveBeenCalled()
      expect(mockFetchVehicles).toHaveBeenCalled()
    })

    it('onLoadMore calls fetchMore with dealer_id filter', async () => {
      const w = factory({ id: 'dealer-99' })
      const vm = w.vm as unknown as { onLoadMore: () => Promise<void> }
      mockFetchMore.mockClear()
      await vm.onLoadMore()
      expect(mockFetchMore).toHaveBeenCalledWith(
        expect.objectContaining({ dealer_id: 'dealer-99' }),
      )
    })

    it('onClearFilters resets catalog, filters, and fetches with dealer_id only', async () => {
      const w = factory({ id: 'dealer-42' })
      const vm = w.vm as unknown as { onClearFilters: () => Promise<void> }
      mockResetCatalog.mockClear()
      mockResetFilters.mockClear()
      mockFetchVehicles.mockClear()
      await vm.onClearFilters()
      expect(mockResetCatalog).toHaveBeenCalled()
      expect(mockResetFilters).toHaveBeenCalled()
      expect(mockFetchVehicles).toHaveBeenCalledWith({ dealer_id: 'dealer-42' })
    })

    it('onSearchChange does not call fetchVehicles (client-side only)', () => {
      const w = factory()
      const vm = w.vm as unknown as { onSearchChange: () => void }
      mockFetchVehicles.mockClear()
      vm.onSearchChange()
      expect(mockFetchVehicles).not.toHaveBeenCalled()
    })
  })
})
