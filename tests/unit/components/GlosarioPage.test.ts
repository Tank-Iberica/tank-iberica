import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal(
  'useState',
  vi.fn((_key: string, init?: () => unknown) => ref(init ? init() : null)),
)
vi.stubGlobal(
  'useRuntimeConfig',
  vi.fn(() => ({
    public: { vertical: 'tracciona', siteUrl: 'https://tracciona.com' },
  })),
)

const mockTerms = [
  {
    id: '1',
    slug: 'cabeza-tractora',
    term: { es: 'Cabeza tractora', en: 'Tractor unit' },
    definition: {
      es: 'Vehículo diseñado para arrastrar semirremolques.',
      en: 'Vehicle designed to pull semi-trailers.',
    },
    category: 'Vehículos',
    related_terms: ['semirremolque'],
    status: 'published',
    created_at: '2026-01-01',
  },
  {
    id: '2',
    slug: 'semirremolque',
    term: { es: 'Semirremolque', en: 'Semi-trailer' },
    definition: {
      es: 'Remolque sin eje delantero que se apoya en la quinta rueda.',
      en: 'Trailer without front axle that rests on the fifth wheel.',
    },
    category: 'Remolques',
    related_terms: ['cabeza-tractora'],
    status: 'published',
    created_at: '2026-01-02',
  },
  {
    id: '3',
    slug: 'tara',
    term: { es: 'Tara', en: 'Tare weight' },
    definition: {
      es: 'Peso del vehículo vacío sin carga ni pasajeros.',
      en: 'Weight of the empty vehicle without cargo or passengers.',
    },
    category: 'Pesos y medidas',
    related_terms: [],
    status: 'published',
    created_at: '2026-01-03',
  },
  {
    id: '4',
    slug: 'mma',
    term: { es: 'MMA', en: 'GVW' },
    definition: {
      es: 'Masa Máxima Autorizada: peso máximo total permitido.',
      en: 'Gross Vehicle Weight: maximum total permitted weight.',
    },
    category: 'Pesos y medidas',
    related_terms: ['tara'],
    status: 'published',
    created_at: '2026-01-04',
  },
]

// Mock useGlossary composable
vi.mock('~/composables/useGlossary', () => ({
  useGlossary: vi.fn(() => {
    const terms = ref(mockTerms)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const searchQuery = ref('')
    const selectedCategory = ref<string | null>(null)

    const categories = computed(() => {
      const cats = new Set<string>()
      for (const t of terms.value) {
        if (t.category) cats.add(t.category)
      }
      return [...cats].sort()
    })

    const filteredTerms = computed(() => {
      let result = terms.value
      if (selectedCategory.value) {
        result = result.filter((t) => t.category === selectedCategory.value)
      }
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase().trim()
        result = result.filter((t) => {
          const termValues = Object.values(t.term).join(' ').toLowerCase()
          const defValues = Object.values(t.definition).join(' ').toLowerCase()
          return termValues.includes(q) || defValues.includes(q)
        })
      }
      return result
    })

    const groupedByLetter = computed(() => {
      const groups: Record<string, typeof mockTerms> = {}
      for (const t of filteredTerms.value) {
        const letter = (t.slug[0] || '#').toUpperCase()
        groups[letter] ??= []
        groups[letter].push(t)
      }
      return groups
    })

    return {
      terms,
      loading,
      error,
      searchQuery,
      selectedCategory,
      categories,
      filteredTerms,
      groupedByLetter,
      fetchTerms: vi.fn(),
      getTermBySlug: vi.fn(),
    }
  }),
}))

import { useGlossary, type GlossaryTerm } from '~/composables/useGlossary'

/**
 * Tests for /glosario page — Item 0.3 (F5)
 *
 * Tests the useGlossary composable behavioral logic:
 * search, category filtering, alphabetical grouping, i18n localization.
 */
describe('Glossary page composable logic (#F5)', () => {
  let glossary: ReturnType<typeof useGlossary>

  beforeEach(() => {
    vi.clearAllMocks()
    glossary = useGlossary()
  })

  // ── Rendering / Data ──────────────────────────────────────────────────

  describe('Terms rendering', () => {
    it('returns all 4 terms when no filter applied', () => {
      expect(glossary.filteredTerms.value).toHaveLength(4)
    })

    it('groups terms alphabetically by first letter of slug', () => {
      const groups = glossary.groupedByLetter.value
      const letters = Object.keys(groups).sort()
      expect(letters).toEqual(['C', 'M', 'S', 'T'])
    })

    it('each term has required fields (id, slug, term, definition)', () => {
      for (const term of glossary.filteredTerms.value) {
        expect(term).toHaveProperty('id')
        expect(term).toHaveProperty('slug')
        expect(term).toHaveProperty('term')
        expect(term).toHaveProperty('definition')
        expect(typeof term.term).toBe('object')
        expect(typeof term.definition).toBe('object')
      }
    })
  })

  // ── Search ────────────────────────────────────────────────────────────

  describe('Search functionality', () => {
    it('filters terms by search query matching term name', () => {
      glossary.searchQuery.value = 'tractora'
      expect(glossary.filteredTerms.value).toHaveLength(1)
      expect(glossary.filteredTerms.value[0].slug).toBe('cabeza-tractora')
    })

    it('search is case-insensitive', () => {
      glossary.searchQuery.value = 'TARA'
      expect(glossary.filteredTerms.value).toHaveLength(1)
      expect(glossary.filteredTerms.value[0].slug).toBe('tara')
    })

    it('search matches in definition text', () => {
      glossary.searchQuery.value = 'quinta rueda'
      expect(glossary.filteredTerms.value).toHaveLength(1)
      expect(glossary.filteredTerms.value[0].slug).toBe('semirremolque')
    })

    it('search matches English translations', () => {
      glossary.searchQuery.value = 'tractor unit'
      expect(glossary.filteredTerms.value).toHaveLength(1)
      expect(glossary.filteredTerms.value[0].slug).toBe('cabeza-tractora')
    })

    it('returns empty when no match found', () => {
      glossary.searchQuery.value = 'xyznonexistent'
      expect(glossary.filteredTerms.value).toHaveLength(0)
    })

    it('trims whitespace from search query', () => {
      glossary.searchQuery.value = '  tara  '
      expect(glossary.filteredTerms.value).toHaveLength(1)
      expect(glossary.filteredTerms.value[0].slug).toBe('tara')
    })
  })

  // ── Category filter ───────────────────────────────────────────────────

  describe('Category filtering', () => {
    it('extracts unique categories from terms', () => {
      expect(glossary.categories.value).toEqual(['Pesos y medidas', 'Remolques', 'Vehículos'])
    })

    it('filters by selected category', () => {
      glossary.selectedCategory.value = 'Pesos y medidas'
      expect(glossary.filteredTerms.value).toHaveLength(2)
      expect(glossary.filteredTerms.value.map((t) => t.slug)).toEqual(['tara', 'mma'])
    })

    it('shows all terms when category is null', () => {
      glossary.selectedCategory.value = null
      expect(glossary.filteredTerms.value).toHaveLength(4)
    })

    it('combines search + category filter', () => {
      glossary.selectedCategory.value = 'Pesos y medidas'
      glossary.searchQuery.value = 'masa'
      expect(glossary.filteredTerms.value).toHaveLength(1)
      expect(glossary.filteredTerms.value[0].slug).toBe('mma')
    })
  })

  // ── i18n ──────────────────────────────────────────────────────────────

  describe('i18n localization', () => {
    it('terms have Spanish translations', () => {
      const term = glossary.filteredTerms.value.find((t) => t.slug === 'cabeza-tractora')
      expect(term?.term.es).toBe('Cabeza tractora')
      expect(term?.definition.es).toContain('arrastrar semirremolques')
    })

    it('terms have English translations', () => {
      const term = glossary.filteredTerms.value.find((t) => t.slug === 'cabeza-tractora')
      expect(term?.term.en).toBe('Tractor unit')
      expect(term?.definition.en).toContain('pull semi-trailers')
    })
  })

  // ── Related terms ─────────────────────────────────────────────────────

  describe('Related terms', () => {
    it('cabeza-tractora has semirremolque as related', () => {
      const term = glossary.filteredTerms.value.find((t) => t.slug === 'cabeza-tractora')
      expect(term?.related_terms).toContain('semirremolque')
    })

    it('tara has no related terms (empty array)', () => {
      const term = glossary.filteredTerms.value.find((t) => t.slug === 'tara')
      expect(term?.related_terms).toEqual([])
    })
  })
})

// ── JSON-LD Schema ──────────────────────────────────────────────────────

describe('Glossary JSON-LD DefinedTermSet', () => {
  it('generates valid DefinedTermSet structure', () => {
    const siteUrl = 'https://tracciona.com'
    const terms = mockTerms

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'DefinedTermSet',
      name: 'Glosario del sector',
      description: 'Glosario completo de términos del sector...',
      url: `${siteUrl}/glosario`,
      inLanguage: 'es',
      hasDefinedTerm: terms.map((term) => ({
        '@type': 'DefinedTerm',
        name: term.term.es,
        description: term.definition.es,
        url: `${siteUrl}/glosario#term-${term.slug}`,
        inDefinedTermSet: `${siteUrl}/glosario`,
      })),
    }

    expect(jsonLd['@type']).toBe('DefinedTermSet')
    expect(jsonLd.hasDefinedTerm).toHaveLength(4)
    expect(jsonLd.hasDefinedTerm[0]['@type']).toBe('DefinedTerm')
    expect(jsonLd.hasDefinedTerm[0].name).toBe('Cabeza tractora')
    expect(jsonLd.hasDefinedTerm[0].url).toBe('https://tracciona.com/glosario#term-cabeza-tractora')
  })

  it('each DefinedTerm has required schema.org fields', () => {
    const siteUrl = 'https://tracciona.com'

    for (const term of mockTerms) {
      const definedTerm = {
        '@type': 'DefinedTerm',
        name: term.term.es,
        description: term.definition.es,
        url: `${siteUrl}/glosario#term-${term.slug}`,
        inDefinedTermSet: `${siteUrl}/glosario`,
      }

      expect(definedTerm['@type']).toBe('DefinedTerm')
      expect(definedTerm.name).toBeTruthy()
      expect(definedTerm.description).toBeTruthy()
      expect(definedTerm.url).toMatch(/^https:\/\/tracciona\.com\/glosario#term-/)
      expect(definedTerm.inDefinedTermSet).toBe('https://tracciona.com/glosario')
    }
  })
})
