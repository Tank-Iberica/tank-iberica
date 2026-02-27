// Types
export interface CommentArticle {
  id: string
  title_es: string
  slug: string
}

export interface Comment {
  id: string
  vertical: string
  article_id: string
  user_id: string | null
  author_name: string | null
  author_email: string | null
  content: string
  status: CommentStatus
  parent_id: string | null
  created_at: string
  updated_at: string
  news: CommentArticle | null
}

export type CommentStatus = 'pending' | 'approved' | 'spam' | 'rejected'

export interface StatusConfig {
  value: CommentStatus | null
  label: string
  color: string
}

export interface DeleteModalState {
  show: boolean
  comment: Comment | null
}

// Constants
export const STATUS_TABS: StatusConfig[] = [
  { value: null, label: 'Todos', color: '#6b7280' },
  { value: 'pending', label: 'Pendientes', color: '#f59e0b' },
  { value: 'approved', label: 'Aprobados', color: '#22c55e' },
  { value: 'spam', label: 'Spam', color: '#f97316' },
  { value: 'rejected', label: 'Rechazados', color: '#ef4444' },
]

export const STATUS_COLORS: Record<CommentStatus, string> = {
  pending: '#f59e0b',
  approved: '#22c55e',
  spam: '#f97316',
  rejected: '#ef4444',
}

export const STATUS_LABELS: Record<CommentStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  spam: 'Spam',
  rejected: 'Rechazado',
}

const PAGE_SIZE = 20

export function useAdminComentarios() {
  const supabase = useSupabaseClient()

  // State
  const comments = ref<Comment[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)
  const activeFilter = ref<CommentStatus | null>(null)
  const searchQuery = ref('')
  const page = ref(0)
  const hasMore = ref(true)
  const loadingMore = ref(false)
  const totalCount = ref(0)
  const expandedComments = ref<Set<string>>(new Set())
  const actionLoading = ref<string | null>(null)

  // Delete confirmation
  const deleteModal = ref<DeleteModalState>({
    show: false,
    comment: null,
  })

  // Computed: filtered comments by search
  const filteredComments = computed(() => {
    if (!searchQuery.value.trim()) return comments.value
    const q = searchQuery.value.toLowerCase().trim()
    return comments.value.filter((c) => {
      const matchContent = c.content.toLowerCase().includes(q)
      const matchAuthor = c.author_name?.toLowerCase().includes(q) ?? false
      const matchEmail = c.author_email?.toLowerCase().includes(q) ?? false
      return matchContent || matchAuthor || matchEmail
    })
  })

  // Fetch comments
  async function fetchComments(reset = true) {
    if (reset) {
      page.value = 0
      comments.value = []
      hasMore.value = true
      loading.value = true
    } else {
      loadingMore.value = true
    }

    error.value = null

    try {
      let query = supabase
        .from('comments')
        .select('*, news:article_id(id, title_es, slug)', { count: 'exact' })
        .eq('vertical', getVerticalSlug())
        .order('created_at', { ascending: false })
        .range(page.value * PAGE_SIZE, (page.value + 1) * PAGE_SIZE - 1)

      if (activeFilter.value) {
        query = query.eq('status', activeFilter.value)
      }

      const { data, error: fetchError, count } = await query

      if (fetchError) {
        throw new Error(fetchError.message)
      }

      const fetched = (data ?? []) as unknown as Comment[]

      if (reset) {
        comments.value = fetched
        totalCount.value = count ?? 0
      } else {
        comments.value = [...comments.value, ...fetched]
      }

      hasMore.value = fetched.length === PAGE_SIZE
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al cargar comentarios'
      error.value = message
    } finally {
      loading.value = false
      loadingMore.value = false
    }
  }

  // Load more
  async function loadMore() {
    page.value++
    await fetchComments(false)
  }

  // Watch filter changes
  watch(activeFilter, () => {
    fetchComments()
  })

  // Update comment status
  async function updateStatus(commentId: string, newStatus: CommentStatus) {
    actionLoading.value = commentId

    try {
      const { error: updateError } = await supabase
        .from('comments')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', commentId)

      if (updateError) {
        throw new Error(updateError.message)
      }

      // Update locally
      const idx = comments.value.findIndex((c) => c.id === commentId)
      if (idx !== -1) {
        comments.value[idx] = { ...comments.value[idx], status: newStatus }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar estado'
      error.value = message
    } finally {
      actionLoading.value = null
    }
  }

  // Delete comment
  function confirmDelete(comment: Comment) {
    deleteModal.value = { show: true, comment }
  }

  function closeDeleteModal() {
    deleteModal.value = { show: false, comment: null }
  }

  async function executeDelete() {
    if (!deleteModal.value.comment) return
    const commentId = deleteModal.value.comment.id
    actionLoading.value = commentId

    try {
      const { error: deleteError } = await supabase.from('comments').delete().eq('id', commentId)

      if (deleteError) {
        throw new Error(deleteError.message)
      }

      comments.value = comments.value.filter((c) => c.id !== commentId)
      totalCount.value = Math.max(0, totalCount.value - 1)
      closeDeleteModal()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar comentario'
      error.value = message
    } finally {
      actionLoading.value = null
    }
  }

  // Toggle expand
  function toggleExpand(commentId: string) {
    const expanded = new Set(expandedComments.value)
    if (expanded.has(commentId)) {
      expanded.delete(commentId)
    } else {
      expanded.add(commentId)
    }
    expandedComments.value = expanded
  }

  // Relative date helper
  function relativeDate(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'ahora'
    if (mins < 60) return `hace ${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `hace ${hours}h`
    const days = Math.floor(hours / 24)
    if (days < 30) return `hace ${days}d`
    return new Date(dateStr).toLocaleDateString('es-ES')
  }

  // Get article display
  function getArticleTitle(comment: Comment): string {
    if (comment.news && comment.news.title_es) {
      return comment.news.title_es
    }
    return 'Articulo eliminado'
  }

  return {
    // State
    comments,
    loading,
    error,
    activeFilter,
    searchQuery,
    page,
    hasMore,
    loadingMore,
    totalCount,
    expandedComments,
    actionLoading,
    deleteModal,

    // Computed
    filteredComments,

    // Functions
    fetchComments,
    loadMore,
    updateStatus,
    confirmDelete,
    closeDeleteModal,
    executeDelete,
    toggleExpand,
    relativeDate,
    getArticleTitle,
  }
}
