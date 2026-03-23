/**
 * Composable for FAQ page (F55).
 *
 * Fetches published FAQ entries from the database,
 * grouped by category with client-side search.
 */

export interface FaqEntry {
  id: string
  category: string
  question: Record<string, string>
  answer: Record<string, string>
  sort_order: number
}

export function useFaq() {
  const supabase = useSupabaseClient()

  const loading = ref(false)
  const error = ref<string | null>(null)
  const entries = ref<FaqEntry[]>([])
  const searchQuery = ref('')

  /**
   * Fetch all published FAQ entries.
   */
  async function fetchFaq(): Promise<FaqEntry[]> {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('faq_entries')
        .select('id, category, question, answer, sort_order')
        .eq('published', true)
        .order('category')
        .order('sort_order', { ascending: true })

      if (err) throw err

      entries.value = (data ?? []) as unknown as FaqEntry[]
      return entries.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading FAQ'
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Categories derived from entries.
   */
  const categories = computed(() => {
    const cats = new Set<string>()
    for (const entry of entries.value) {
      cats.add(entry.category)
    }
    return [...cats].sort()
  })

  /**
   * Filtered entries based on search query.
   * Searches across all localized question and answer text.
   */
  const filteredEntries = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return entries.value

    return entries.value.filter((entry) => {
      const questionText = Object.values(entry.question).join(' ').toLowerCase()
      const answerText = Object.values(entry.answer).join(' ').toLowerCase()
      return questionText.includes(q) || answerText.includes(q)
    })
  })

  /**
   * Entries grouped by category.
   */
  const groupedByCategory = computed(() => {
    const groups: Record<string, FaqEntry[]> = {}
    for (const entry of filteredEntries.value) {
      const cat = entry.category
      groups[cat] ??= []
      groups[cat]!.push(entry)
    }
    return groups
  })

  return {
    loading: readonly(loading),
    error,
    entries: readonly(entries),
    searchQuery,
    categories,
    filteredEntries,
    groupedByCategory,
    fetchFaq,
  }
}
