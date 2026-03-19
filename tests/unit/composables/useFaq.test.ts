import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, readonly, computed } from 'vue'

// ── Globals ──────────────────────────────────────────────────────────────────

vi.stubGlobal('ref', ref)
vi.stubGlobal('readonly', readonly)
vi.stubGlobal('computed', computed)

// ── Supabase mock ────────────────────────────────────────────────────────────

let mockQueryResult: { data: unknown[] | null; error: unknown }

vi.stubGlobal(
  'useSupabaseClient',
  vi.fn(() => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn(),
    }
    // First order returns chain, second order resolves
    let orderCallCount = 0
    chain.order.mockImplementation(() => {
      orderCallCount++
      if (orderCallCount >= 2) {
        return Promise.resolve(mockQueryResult)
      }
      return chain
    })

    return {
      from: vi.fn(() => chain),
      _chain: chain,
    }
  }),
)

import { useFaq, type FaqEntry } from '~/composables/useFaq'

// ── Test data ────────────────────────────────────────────────────────────────

const mockFaqData: FaqEntry[] = [
  {
    id: 'faq-1',
    category: 'cuenta',
    question: { es: '¿Cómo creo una cuenta?', en: 'How do I create an account?' },
    answer: { es: 'Haz clic en Registrarse.', en: 'Click Sign Up.' },
    sort_order: 1,
  },
  {
    id: 'faq-2',
    category: 'cuenta',
    question: { es: '¿Cómo cambio mi contraseña?', en: 'How do I change my password?' },
    answer: { es: 'Ve a Perfil > Seguridad.', en: 'Go to Profile > Security.' },
    sort_order: 2,
  },
  {
    id: 'faq-3',
    category: 'pagos',
    question: { es: '¿Qué métodos de pago aceptan?', en: 'What payment methods?' },
    answer: { es: 'Tarjeta y transferencia.', en: 'Card and bank transfer.' },
    sort_order: 1,
  },
  {
    id: 'faq-4',
    category: 'tecnico',
    question: { es: '¿Qué navegadores son compatibles?', en: 'What browsers are supported?' },
    answer: { es: 'Chrome, Firefox, Safari, Edge.', en: 'Chrome, Firefox, Safari, Edge.' },
    sort_order: 1,
  },
]

// ── Tests ────────────────────────────────────────────────────────────────────

describe('useFaq (F55)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResult = { data: mockFaqData, error: null }
  })

  describe('fetchFaq', () => {
    it('fetches published FAQ entries', async () => {
      const { fetchFaq, entries } = useFaq()
      await fetchFaq()

      expect(entries.value).toHaveLength(4)
    })

    it('sets error on failure', async () => {
      mockQueryResult = { data: null, error: new Error('DB error') }

      const { fetchFaq, error } = useFaq()
      await fetchFaq()

      expect(error.value).toBe('DB error')
    })

    it('manages loading state', async () => {
      const { fetchFaq, loading } = useFaq()

      expect(loading.value).toBe(false)
      const promise = fetchFaq()
      expect(loading.value).toBe(true)
      await promise
      expect(loading.value).toBe(false)
    })

    it('returns empty array on null data', async () => {
      mockQueryResult = { data: null, error: null }

      const { fetchFaq, entries } = useFaq()
      await fetchFaq()

      expect(entries.value).toEqual([])
    })
  })

  describe('categories', () => {
    it('extracts unique sorted categories', async () => {
      const { fetchFaq, categories } = useFaq()
      await fetchFaq()

      expect(categories.value).toEqual(['cuenta', 'pagos', 'tecnico'])
    })
  })

  describe('search', () => {
    it('filters by search query matching question text', async () => {
      const { fetchFaq, searchQuery, filteredEntries } = useFaq()
      await fetchFaq()

      searchQuery.value = 'contraseña'
      expect(filteredEntries.value).toHaveLength(1)
      expect(filteredEntries.value[0].id).toBe('faq-2')
    })

    it('filters by search query matching answer text', async () => {
      const { fetchFaq, searchQuery, filteredEntries } = useFaq()
      await fetchFaq()

      searchQuery.value = 'transferencia'
      expect(filteredEntries.value).toHaveLength(1)
      expect(filteredEntries.value[0].id).toBe('faq-3')
    })

    it('search is case-insensitive', async () => {
      const { fetchFaq, searchQuery, filteredEntries } = useFaq()
      await fetchFaq()

      searchQuery.value = 'NAVEGADORES'
      expect(filteredEntries.value).toHaveLength(1)
      expect(filteredEntries.value[0].id).toBe('faq-4')
    })

    it('searches across English translations', async () => {
      const { fetchFaq, searchQuery, filteredEntries } = useFaq()
      await fetchFaq()

      searchQuery.value = 'payment methods'
      expect(filteredEntries.value).toHaveLength(1)
      expect(filteredEntries.value[0].id).toBe('faq-3')
    })

    it('returns all entries when search is empty', async () => {
      const { fetchFaq, searchQuery, filteredEntries } = useFaq()
      await fetchFaq()

      searchQuery.value = ''
      expect(filteredEntries.value).toHaveLength(4)
    })

    it('returns empty when no match found', async () => {
      const { fetchFaq, searchQuery, filteredEntries } = useFaq()
      await fetchFaq()

      searchQuery.value = 'xyznonexistent'
      expect(filteredEntries.value).toHaveLength(0)
    })
  })

  describe('groupedByCategory', () => {
    it('groups entries by category', async () => {
      const { fetchFaq, groupedByCategory } = useFaq()
      await fetchFaq()

      const groups = groupedByCategory.value
      expect(Object.keys(groups)).toHaveLength(3)
      expect(groups.cuenta).toHaveLength(2)
      expect(groups.pagos).toHaveLength(1)
      expect(groups.tecnico).toHaveLength(1)
    })

    it('respects search filter in groups', async () => {
      const { fetchFaq, searchQuery, groupedByCategory } = useFaq()
      await fetchFaq()

      searchQuery.value = 'contraseña'
      const groups = groupedByCategory.value
      expect(Object.keys(groups)).toHaveLength(1)
      expect(groups.cuenta).toHaveLength(1)
    })
  })

  describe('i18n support', () => {
    it('FAQ entries have ES and EN translations', async () => {
      const { fetchFaq, entries } = useFaq()
      await fetchFaq()

      for (const entry of entries.value) {
        expect(entry.question).toHaveProperty('es')
        expect(entry.question).toHaveProperty('en')
        expect(entry.answer).toHaveProperty('es')
        expect(entry.answer).toHaveProperty('en')
      }
    })
  })
})
