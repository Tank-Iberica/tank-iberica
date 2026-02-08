import { ref } from 'vue'
import { useSupabaseClient } from '#imports'

export interface News {
  id: string
  title_es: string
  title_en: string | null
  slug: string
  category: string
  image_url: string | null
  content_es: string
  content_en: string | null
  hashtags: string[]
  views: number
  status: string
  published_at: string | null
  created_at: string
  updated_at: string
}

const PAGE_SIZE = 12

export function useNews() {
  const supabase = useSupabaseClient()

  const news = ref<News[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)
  const page = ref(0)
  const total = ref(0)

  function buildQuery(category?: string) {
    let query = supabase
      .from('news')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    return query
  }

  async function fetchNews(category?: string) {
    loading.value = true
    error.value = null
    page.value = 0

    try {
      const { data, error: err, count } = await buildQuery(category).range(0, PAGE_SIZE - 1)

      if (err) throw err

      news.value = (data as News[]) || []
      total.value = count || 0
      hasMore.value = news.value.length < total.value
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching news'
      news.value = []
    }
    finally {
      loading.value = false
    }
  }

  async function fetchMore(category?: string) {
    if (!hasMore.value || loadingMore.value) return

    loadingMore.value = true

    try {
      page.value++
      const from = page.value * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const { data, error: err } = await buildQuery(category).range(from, to)

      if (err) throw err

      const newItems = (data as News[]) || []
      news.value = [...news.value, ...newItems]
      hasMore.value = news.value.length < total.value
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching more news'
      page.value--
    }
    finally {
      loadingMore.value = false
    }
  }

  async function fetchBySlug(slug: string): Promise<News | null> {
    const { data, error: err } = await supabase
      .from('news')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (err) {
      error.value = err.message
      return null
    }

    return data as News
  }

  function reset() {
    news.value = []
    page.value = 0
    hasMore.value = true
    error.value = null
    total.value = 0
  }

  return {
    news,
    loading,
    loadingMore,
    error,
    hasMore,
    total,
    fetchNews,
    fetchMore,
    fetchBySlug,
    reset,
  }
}
