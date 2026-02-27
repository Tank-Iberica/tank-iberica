/**
 * Admin Noticias Index Composable
 * Extracted from app/pages/admin/noticias/index.vue
 * Manages list view: filters, sorting, delete modal, status changes
 */
import { useAdminNews, type AdminNewsFilters } from '~/composables/admin/useAdminNews'
import { calculateMiniSeoScore } from '~/composables/admin/useSeoScore'
import type { News } from '~/composables/useNews'

export type SortField = 'created_at' | 'published_at' | 'title_es' | 'views'

export interface DeleteTarget {
  id: string
  title_es: string
}

export interface StatusOption {
  value: string | null
  label: string
}

export interface CategoryOption {
  value: string | null
  label: string
}

export function useAdminNoticiasIndex() {
  const router = useRouter()

  const { news, loading, error, total, fetchNews, deleteNews, updateStatus } = useAdminNews()

  // ── Filters ──────────────────────────────────────────────
  const filters = ref<AdminNewsFilters>({
    status: null,
    category: null,
    search: '',
  })

  const statusOptions: StatusOption[] = [
    { value: null, label: 'Todos' },
    { value: 'draft', label: 'Borrador' },
    { value: 'published', label: 'Publicado' },
    { value: 'archived', label: 'Archivado' },
  ]

  const categoryOptions: CategoryOption[] = [
    { value: null, label: 'Todas' },
    { value: 'prensa', label: 'Prensa' },
    { value: 'eventos', label: 'Eventos' },
    { value: 'destacados', label: 'Destacados' },
    { value: 'general', label: 'General' },
  ]

  const categoryLabels: Record<string, string> = {
    prensa: 'Prensa',
    eventos: 'Eventos',
    destacados: 'Destacados',
    general: 'General',
  }

  const hasActiveFilters = computed(
    () =>
      filters.value.status ||
      filters.value.category ||
      (filters.value.search && filters.value.search.length > 0),
  )

  function clearFilters() {
    filters.value = { status: null, category: null, search: '' }
  }

  // ── Sorting ──────────────────────────────────────────────
  const sortField = ref<SortField>('created_at')
  const sortOrder = ref<'asc' | 'desc'>('desc')

  function toggleSort(field: SortField) {
    if (sortField.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortField.value = field
      sortOrder.value = 'desc'
    }
  }

  function getSortIcon(field: SortField): string {
    if (sortField.value !== field) return '\u21D5'
    return sortOrder.value === 'asc' ? '\u2191' : '\u2193'
  }

  const sortedNews = computed(() => {
    const items = [...news.value]
    items.sort((a, b) => {
      let va: string | number = ''
      let vb: string | number = ''

      switch (sortField.value) {
        case 'title_es':
          va = a.title_es.toLowerCase()
          vb = b.title_es.toLowerCase()
          break
        case 'views':
          va = a.views || 0
          vb = b.views || 0
          break
        case 'published_at':
          va = a.published_at || ''
          vb = b.published_at || ''
          break
        case 'created_at':
        default:
          va = a.created_at || ''
          vb = b.created_at || ''
      }

      if (va < vb) return sortOrder.value === 'asc' ? -1 : 1
      if (va > vb) return sortOrder.value === 'asc' ? 1 : -1
      return 0
    })
    return items
  })

  // ── Delete modal ─────────────────────────────────────────
  const deleteModal = ref(false)
  const deleteTarget = ref<DeleteTarget | null>(null)
  const deleteConfirmText = ref('')

  function openDeleteModal(item: DeleteTarget) {
    deleteTarget.value = item
    deleteConfirmText.value = ''
    deleteModal.value = true
  }

  function closeDeleteModal() {
    deleteModal.value = false
    deleteTarget.value = null
    deleteConfirmText.value = ''
  }

  async function executeDelete() {
    if (!deleteTarget.value || deleteConfirmText.value !== 'borrar') return
    await deleteNews(deleteTarget.value.id)
    closeDeleteModal()
  }

  // ── Status change ────────────────────────────────────────
  async function handleStatusChange(item: { id: string; status: string }, event: Event) {
    const select = event.target as HTMLSelectElement
    const newStatus = select.value
    const ok = await updateStatus(item.id, newStatus)
    if (!ok) {
      select.value = item.status
    } else {
      await fetchNews(filters.value)
    }
  }

  // ── SEO mini score ───────────────────────────────────────
  function getSeoScore(item: News) {
    return calculateMiniSeoScore({
      title_es: item.title_es,
      content_es: item.content_es,
      slug: item.slug,
      image_url: item.image_url,
      hashtags: [...(item.hashtags || [])],
    })
  }

  // ── Format date ──────────────────────────────────────────
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '\u2014'
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  // ── Navigate to item ────────────────────────────────────
  function navigateToItem(id: string) {
    router.push(`/admin/noticias/${id}`)
  }

  // ── Watchers ─────────────────────────────────────────────
  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  watch(
    () => filters.value.search,
    () => {
      if (searchTimeout) clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => fetchNews(filters.value), 300)
    },
  )

  watch([() => filters.value.status, () => filters.value.category], () => {
    fetchNews(filters.value)
  })

  // ── Init (replaces onMounted) ────────────────────────────
  function init() {
    fetchNews()
  }

  return {
    // State
    news,
    loading,
    error,
    total,
    filters,
    sortField,
    sortOrder,
    sortedNews,
    hasActiveFilters,
    deleteModal,
    deleteTarget,
    deleteConfirmText,

    // Options / labels
    statusOptions,
    categoryOptions,
    categoryLabels,

    // Actions
    init,
    clearFilters,
    toggleSort,
    getSortIcon,
    openDeleteModal,
    closeDeleteModal,
    executeDelete,
    handleStatusChange,
    getSeoScore,
    formatDate,
    navigateToItem,
  }
}
