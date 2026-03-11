/**
 * useGlossary — Fetches and searches industry glossary terms.
 *
 * Data comes from the `glossary` table, scoped by vertical.
 * Supports search filtering and category grouping.
 */

import { useSupabaseClient } from '#imports'
import { getVerticalSlug } from '~/composables/useVerticalConfig'

export interface GlossaryTerm {
  id: string
  slug: string
  term: Record<string, string>
  definition: Record<string, string>
  category: string | null
  related_terms: string[]
  status: string
  created_at: string
}

export function useGlossary() {
  const supabase = useSupabaseClient()
  const vertical = getVerticalSlug()

  const terms = ref<GlossaryTerm[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const selectedCategory = ref<string | null>(null)

  /** Fetch all published glossary terms for the current vertical */
  async function fetchTerms(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('glossary')
        .select('id, slug, term, definition, category, related_terms, status, created_at')
        .eq('vertical', vertical)
        .eq('status', 'published')
        .order('slug', { ascending: true })

      if (fetchError) {
        error.value = fetchError.message
        return
      }

      terms.value = (data ?? []) as GlossaryTerm[]
    } finally {
      loading.value = false
    }
  }

  /** Unique categories from loaded terms */
  const categories = computed(() => {
    const cats = new Set<string>()
    for (const t of terms.value) {
      if (t.category) cats.add(t.category)
    }
    return [...cats].sort()
  })

  /** Filtered terms by search query and category */
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

  /** Group terms alphabetically by first letter */
  const groupedByLetter = computed(() => {
    const groups: Record<string, GlossaryTerm[]> = {}
    for (const t of filteredTerms.value) {
      const firstLetter = (t.slug[0] || '#').toUpperCase()
      if (!groups[firstLetter]) groups[firstLetter] = []
      groups[firstLetter].push(t)
    }
    return groups
  })

  /** Find a single term by slug */
  function getTermBySlug(slug: string): GlossaryTerm | undefined {
    return terms.value.find((t) => t.slug === slug)
  }

  return {
    terms,
    loading,
    error,
    searchQuery,
    selectedCategory,
    categories,
    filteredTerms,
    groupedByLetter,
    fetchTerms,
    getTermBySlug,
  }
}
