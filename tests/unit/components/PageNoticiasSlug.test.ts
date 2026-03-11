/**
 * Tests for app/pages/noticias/[slug].vue
 * Article detail page — loading, not-found, article rendering, locale, share, SEO.
 */
import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest'
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

// --- Global stubs for Nuxt auto-imports ---

const mockFetchBySlug = vi.fn()
vi.stubGlobal('useNews', () => ({ fetchBySlug: mockFetchBySlug }))

const mockFetchTranslation = vi.fn().mockResolvedValue('')
vi.mock('~/composables/useLocalized', () => ({
  fetchTranslation: (...args: unknown[]) => mockFetchTranslation(...args),
}))

vi.stubGlobal('usePageSeo', vi.fn())
vi.stubGlobal('useHead', vi.fn())
vi.stubGlobal('createError', (opts: Record<string, unknown>) => new Error(String(opts.statusMessage)))

let mockArticle: ReturnType<typeof ref>
let mockStatus: ReturnType<typeof ref>

vi.stubGlobal('useAsyncData', (_key: string, _fn: () => unknown) => {
  return Promise.resolve({ data: mockArticle, status: mockStatus })
})

const mockLocale = ref('es')
vi.stubGlobal('useI18n', () => ({
  locale: mockLocale,
  t: (key: string) => key,
}))

vi.stubGlobal('useRoute', () => ({
  params: { slug: 'test-article' },
  query: {},
}))

// Stub useSanitize — returns content as-is (no DOMPurify in test env)
vi.stubGlobal('useSanitize', () => ({ sanitize: (html: string) => html }))

// Stub useTableOfContents — returns empty state and no-op functions
vi.stubGlobal('useTableOfContents', () => ({
  tocItems: ref([]),
  activeId: ref(''),
  buildToc: vi.fn(),
  scrollToHeading: vi.fn(),
}))

// Component stubs
const componentStubs = {
  NuxtImg: { template: '<img />' },
  NuxtLink: { template: '<a><slot /></a>' },
  UiBreadcrumbNav: { template: '<nav />' },
  UiArticleToc: { template: '<div />' },
}

// Import component after all mocks
import PageNoticiasSlug from '../../../app/pages/noticias/[slug].vue'

// --- Helpers ---
function makeArticle(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a-1',
    title_es: 'Titulo en Espanol',
    title_en: 'Title in English',
    content_es: 'Contenido del articulo en espanol',
    content_en: 'Article content in English',
    description_es: 'Desc ES',
    description_en: 'Desc EN',
    category: 'Mercado',
    published_at: '2026-01-15T10:00:00Z',
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-15T10:00:00Z',
    image_url: 'https://img.example.com/photo.jpg',
    hashtags: ['industria', 'vehiculos'],
    faq_schema: null,
    ...overrides,
  }
}

async function factory(article: unknown = null, status = 'success') {
  mockArticle = ref(article)
  mockStatus = ref(status)

  const wrapper = mount(
    defineComponent({
      setup() {
        return () =>
          h(Suspense, null, {
            default: () => h(PageNoticiasSlug as ReturnType<typeof defineComponent>),
            fallback: () => h('div', { class: 'suspense-fallback' }, 'Loading...'),
          })
      },
    }),
    {
      global: {
        mocks: { $t: (key: string) => key },
        stubs: componentStubs,
      },
    },
  )

  await flushPromises()
  return wrapper
}

// --- Tests ---
describe('PageNoticiasSlug (noticias/[slug])', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocale.value = 'es'
  })

  // ---- Loading state ----
  describe('loading state', () => {
    it('shows skeleton when status is pending', async () => {
      const w = await factory(null, 'pending')
      expect(w.find('.article-loading').exists()).toBe(true)
      expect(w.find('.article-not-found').exists()).toBe(false)
      expect(w.find('.article-content').exists()).toBe(false)
    })

    it('renders skeleton lines and skeleton image', async () => {
      const w = await factory(null, 'pending')
      expect(w.findAll('.skeleton-line').length).toBeGreaterThanOrEqual(3)
      expect(w.find('.skeleton-img').exists()).toBe(true)
    })
  })

  // ---- Not-found state ----
  describe('not-found state', () => {
    it('shows not-found message when article is null and not loading', async () => {
      const w = await factory(null, 'success')
      expect(w.find('.article-not-found').exists()).toBe(true)
      expect(w.text()).toContain('news.notFound')
    })

    it('renders back link', async () => {
      const w = await factory(null, 'success')
      const link = w.find('.back-link')
      expect(link.exists()).toBe(true)
      expect(link.text()).toContain('news.backToNews')
    })

    it('does not render article content when article is null', async () => {
      const w = await factory(null, 'success')
      expect(w.find('.article-content').exists()).toBe(false)
    })
  })

  // ---- Article rendering ----
  describe('article content', () => {
    it('renders the article container when data is present', async () => {
      const w = await factory(makeArticle())
      expect(w.find('.article-container').exists()).toBe(true)
      expect(w.find('.article-content').exists()).toBe(true)
    })

    it('displays article category', async () => {
      const w = await factory(makeArticle({ category: 'Transporte' }))
      expect(w.find('.article-category').text()).toBe('Transporte')
    })

    it('displays formatted date when published_at is present', async () => {
      const w = await factory(makeArticle({ published_at: '2026-03-01T12:00:00Z' }))
      const dateEl = w.find('.article-date')
      expect(dateEl.exists()).toBe(true)
      expect(dateEl.text()).toBeTruthy()
    })

    it('hides date when published_at is missing', async () => {
      const w = await factory(makeArticle({ published_at: null }))
      expect(w.find('.article-date').exists()).toBe(false)
    })

    it('renders article title in ES locale', async () => {
      const w = await factory(makeArticle())
      expect(w.find('.article-title').text()).toBe('Titulo en Espanol')
    })

    it('displays article image when image_url is present', async () => {
      const w = await factory(makeArticle({ image_url: 'https://img.example.com/photo.jpg' }))
      expect(w.find('.article-image').exists()).toBe(true)
    })

    it('hides article image when image_url is absent', async () => {
      const w = await factory(makeArticle({ image_url: null }))
      expect(w.find('.article-image').exists()).toBe(false)
    })

    it('renders article body content', async () => {
      const w = await factory(makeArticle())
      expect(w.find('.article-body').text()).toContain('Contenido del articulo en espanol')
    })
  })

  // ---- Hashtags ----
  describe('hashtags', () => {
    it('renders hashtags when present', async () => {
      const w = await factory(makeArticle({ hashtags: ['camiones', 'gruas'] }))
      const tags = w.findAll('.tag')
      expect(tags).toHaveLength(2)
      expect(tags[0].text()).toContain('#camiones')
      expect(tags[1].text()).toContain('#gruas')
    })

    it('hides tags section when hashtags is empty', async () => {
      const w = await factory(makeArticle({ hashtags: [] }))
      expect(w.find('.article-tags').exists()).toBe(false)
    })

    it('hides tags section when hashtags is null', async () => {
      const w = await factory(makeArticle({ hashtags: null }))
      expect(w.find('.article-tags').exists()).toBe(false)
    })
  })

  // ---- Share buttons ----
  describe('share section', () => {
    it('renders WhatsApp share link', async () => {
      const w = await factory(makeArticle())
      const link = w.find('.share-whatsapp')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toContain('wa.me')
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toBe('noopener')
    })

    it('renders email share link', async () => {
      const w = await factory(makeArticle())
      const link = w.find('.share-email')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toContain('mailto:')
    })

    it('encodes title in email share link', async () => {
      const w = await factory(makeArticle({ title_es: 'Vehiculo & especial' }))
      const link = w.find('.share-email')
      expect(link.attributes('href')).toContain(encodeURIComponent('Vehiculo & especial'))
    })
  })

  // ---- Breadcrumbs ----
  describe('breadcrumbs', () => {
    it('renders breadcrumb nav when article is present', async () => {
      const w = await factory(makeArticle())
      expect(w.find('nav').exists()).toBe(true)
    })
  })

  // ---- v-if branches ----
  describe('v-if branch coverage', () => {
    it('loading=true hides not-found and article', async () => {
      const w = await factory(null, 'pending')
      expect(w.find('.article-loading').exists()).toBe(true)
      expect(w.find('.article-not-found').exists()).toBe(false)
      expect(w.find('.article-container').exists()).toBe(false)
    })

    it('no article + success shows not-found', async () => {
      const w = await factory(null, 'success')
      expect(w.find('.article-loading').exists()).toBe(false)
      expect(w.find('.article-not-found').exists()).toBe(true)
      expect(w.find('.article-container').exists()).toBe(false)
    })

    it('article present shows content', async () => {
      const w = await factory(makeArticle())
      expect(w.find('.article-loading').exists()).toBe(false)
      expect(w.find('.article-not-found').exists()).toBe(false)
      expect(w.find('.article-container').exists()).toBe(true)
    })
  })

  // ---- Locale-aware rendering ----
  describe('locale handling', () => {
    it('shows ES title by default', async () => {
      const w = await factory(makeArticle())
      expect(w.find('.article-title').text()).toBe('Titulo en Espanol')
    })

    it('shows EN title when locale is en', async () => {
      mockLocale.value = 'en'
      const w = await factory(makeArticle())
      expect(w.find('.article-title').text()).toBe('Title in English')
    })

    it('falls back to ES title when EN is missing', async () => {
      mockLocale.value = 'en'
      const w = await factory(makeArticle({ title_en: null }))
      expect(w.find('.article-title').text()).toBe('Titulo en Espanol')
    })

    it('shows ES content in body by default', async () => {
      const w = await factory(makeArticle())
      expect(w.find('.article-body').text()).toContain('Contenido del articulo en espanol')
    })

    it('shows EN content when locale is en', async () => {
      mockLocale.value = 'en'
      const w = await factory(makeArticle())
      expect(w.find('.article-body').text()).toContain('Article content in English')
    })

    it('falls back to ES content when EN is missing', async () => {
      mockLocale.value = 'en'
      const w = await factory(makeArticle({ content_en: null }))
      expect(w.find('.article-body').text()).toContain('Contenido del articulo en espanol')
    })
  })

  // ---- Edge cases ----
  describe('edge cases', () => {
    it('handles article with minimal data', async () => {
      const w = await factory(
        makeArticle({
          image_url: null,
          hashtags: null,
          published_at: null,
          description_es: null,
          description_en: null,
        }),
      )
      expect(w.find('.article-container').exists()).toBe(true)
      expect(w.find('.article-image').exists()).toBe(false)
      expect(w.find('.article-tags').exists()).toBe(false)
      expect(w.find('.article-date').exists()).toBe(false)
    })

    it('renders share section with article present', async () => {
      const w = await factory(makeArticle())
      expect(w.find('.article-share').exists()).toBe(true)
    })
  })
})
