/**
 * Admin News Composable
 * Full CRUD operations for news articles in admin panel
 */
import type { News } from '~/composables/useNews'

export interface AdminNewsFilters {
  status?: string | null
  category?: string | null
  search?: string
}

export interface NewsFormData {
  title_es: string
  title_en: string | null
  slug: string
  category: string
  image_url: string | null
  description_es: string | null
  description_en: string | null
  content_es: string
  content_en: string | null
  hashtags: string[]
  status: string
  published_at: string | null
}

const PAGE_SIZE = 50

export function useAdminNews() {
  const supabase = useSupabaseClient()

  const news = ref<News[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  /**
   * Fetch all news with admin access (all statuses)
   */
  async function fetchNews(filters: AdminNewsFilters = {}) {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('news')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.search) {
        query = query.or(`title_es.ilike.%${filters.search}%,title_en.ilike.%${filters.search}%`)
      }

      const { data, error: err, count } = await query.range(0, PAGE_SIZE - 1)

      if (err) throw err

      news.value = (data as unknown as News[]) || []
      total.value = count || 0
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || (err instanceof Error ? err.message : 'Error fetching news')
      news.value = []
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Fetch single news article by ID
   */
  async function fetchById(id: string): Promise<News | null> {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('news')
        .select('*')
        .eq('id', id)
        .single()

      if (err) throw err

      return data as unknown as News
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || (err instanceof Error ? err.message : 'Error fetching article')
      return null
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Create new news article
   */
  async function createNews(formData: NewsFormData): Promise<string | null> {
    saving.value = true
    error.value = null

    try {
      const slug = formData.slug.trim() || generateSlug(formData.title_es)

      const insertData = {
        ...formData,
        slug,
        published_at: formData.status === 'published' && !formData.published_at
          ? new Date().toISOString()
          : formData.published_at,
      }

      const { data, error: err } = await supabase
        .from('news')
        .insert(insertData as never)
        .select('id')
        .single()

      if (err) throw err

      return (data as { id: string } | null)?.id || null
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string; details?: string; hint?: string }
      error.value = supabaseError?.message || (err instanceof Error ? err.message : 'Error creating article')
      console.error('Create news error:', err)
      return null
    }
    finally {
      saving.value = false
    }
  }

  /**
   * Update existing news article
   */
  async function updateNews(id: string, formData: Partial<NewsFormData>): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const updateData: Record<string, unknown> = {
        ...formData,
        updated_at: new Date().toISOString(),
      }

      // Auto-set published_at when publishing for the first time
      if (formData.status === 'published' && !formData.published_at) {
        updateData.published_at = new Date().toISOString()
      }

      const { error: err } = await supabase
        .from('news')
        .update(updateData as never)
        .eq('id', id)

      if (err) throw err

      return true
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string; details?: string; hint?: string }
      error.value = supabaseError?.message || (err instanceof Error ? err.message : 'Error updating article')
      console.error('Update news error:', err)
      return false
    }
    finally {
      saving.value = false
    }
  }

  /**
   * Delete news article
   */
  async function deleteNews(id: string): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('news')
        .delete()
        .eq('id', id)

      if (err) throw err

      news.value = news.value.filter(n => n.id !== id)
      total.value--

      return true
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || (err instanceof Error ? err.message : 'Error deleting article')
      console.error('Delete news error:', err)
      return false
    }
    finally {
      saving.value = false
    }
  }

  /**
   * Quick status update
   */
  async function updateStatus(id: string, status: string): Promise<boolean> {
    return updateNews(id, { status } as Partial<NewsFormData>)
  }

  return {
    news: readonly(news),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    total: readonly(total),
    fetchNews,
    fetchById,
    createNews,
    updateNews,
    deleteNews,
    updateStatus,
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
