<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

// Types
interface CommentArticle {
  id: string
  title_es: string
  slug: string
}

interface Comment {
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

type CommentStatus = 'pending' | 'approved' | 'spam' | 'rejected'

interface StatusConfig {
  value: CommentStatus | null
  label: string
  color: string
}

const STATUS_TABS: StatusConfig[] = [
  { value: null, label: 'Todos', color: '#6b7280' },
  { value: 'pending', label: 'Pendientes', color: '#f59e0b' },
  { value: 'approved', label: 'Aprobados', color: '#22c55e' },
  { value: 'spam', label: 'Spam', color: '#f97316' },
  { value: 'rejected', label: 'Rechazados', color: '#ef4444' },
]

const STATUS_COLORS: Record<CommentStatus, string> = {
  pending: '#f59e0b',
  approved: '#22c55e',
  spam: '#f97316',
  rejected: '#ef4444',
}

const STATUS_LABELS: Record<CommentStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  spam: 'Spam',
  rejected: 'Rechazado',
}

// State
const supabase = useSupabaseClient()
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

const PAGE_SIZE = 20

// Delete confirmation
const deleteModal = ref({
  show: false,
  comment: null as Comment | null,
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
async function confirmDelete(comment: Comment) {
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

// Initial fetch
onMounted(() => {
  fetchComments()
})
</script>

<template>
  <div class="admin-comentarios">
    <!-- Header -->
    <div class="section-header">
      <div class="header-left">
        <h2>Comentarios</h2>
        <span class="total-badge">{{ totalCount }} total</span>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="filters-bar">
      <div class="filter-group status-filter">
        <button
          v-for="tab in STATUS_TABS"
          :key="tab.label"
          class="filter-btn"
          :class="{ active: activeFilter === tab.value }"
          :style="
            activeFilter === tab.value && tab.value !== null
              ? { backgroundColor: tab.color, color: 'white', borderColor: tab.color }
              : {}
          "
          @click="activeFilter = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Buscar por contenido o autor..."
        class="filter-search"
      >
    </div>

    <!-- Error -->
    <div v-if="error" class="error-banner">
      {{ error }}
      <button class="error-dismiss" @click="error = null">x</button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="skeleton-list">
      <div v-for="i in 5" :key="i" class="skeleton-card">
        <div class="skeleton-header">
          <div class="skeleton-line skeleton-short" />
          <div class="skeleton-line skeleton-badge" />
        </div>
        <div class="skeleton-line skeleton-long" />
        <div class="skeleton-line skeleton-medium" />
        <div class="skeleton-actions">
          <div class="skeleton-line skeleton-btn" />
          <div class="skeleton-line skeleton-btn" />
          <div class="skeleton-line skeleton-btn" />
        </div>
      </div>
    </div>

    <!-- Comments list -->
    <div v-else-if="filteredComments.length > 0" class="comments-list">
      <div
        v-for="comment in filteredComments"
        :key="comment.id"
        class="comment-card"
        :class="{ 'comment-pending': comment.status === 'pending' }"
      >
        <!-- Card header -->
        <div class="comment-header">
          <div class="comment-author-info">
            <div class="author-avatar">
              {{ (comment.author_name || 'A').charAt(0).toUpperCase() }}
            </div>
            <div class="author-details">
              <span class="author-name">{{ comment.author_name || 'Anonimo' }}</span>
              <span v-if="comment.author_email" class="author-email">{{
                comment.author_email
              }}</span>
            </div>
          </div>
          <div class="comment-meta">
            <span
              class="status-badge"
              :style="{
                backgroundColor: STATUS_COLORS[comment.status] + '1a',
                color: STATUS_COLORS[comment.status],
              }"
            >
              {{ STATUS_LABELS[comment.status] }}
            </span>
            <span class="comment-date">{{ relativeDate(comment.created_at) }}</span>
          </div>
        </div>

        <!-- Reply indicator -->
        <div v-if="comment.parent_id" class="reply-indicator">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="9 14 4 9 9 4" />
            <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
          </svg>
          Respuesta a otro comentario
        </div>

        <!-- Article link -->
        <div class="comment-article">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span class="article-title">{{ getArticleTitle(comment) }}</span>
        </div>

        <!-- Content -->
        <div
          class="comment-content"
          :class="{ 'content-expanded': expandedComments.has(comment.id) }"
        >
          {{ comment.content }}
        </div>
        <button
          v-if="comment.content.length > 200"
          class="expand-btn"
          @click="toggleExpand(comment.id)"
        >
          {{ expandedComments.has(comment.id) ? 'Ver menos' : 'Ver mas...' }}
        </button>

        <!-- Actions -->
        <div class="comment-actions">
          <button
            v-if="comment.status !== 'approved'"
            class="action-btn action-approve"
            :disabled="actionLoading === comment.id"
            @click="updateStatus(comment.id, 'approved')"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Aprobar
          </button>
          <button
            v-if="comment.status !== 'rejected'"
            class="action-btn action-reject"
            :disabled="actionLoading === comment.id"
            @click="updateStatus(comment.id, 'rejected')"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Rechazar
          </button>
          <button
            v-if="comment.status !== 'spam'"
            class="action-btn action-spam"
            :disabled="actionLoading === comment.id"
            @click="updateStatus(comment.id, 'spam')"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Spam
          </button>
          <button
            class="action-btn action-delete"
            :disabled="actionLoading === comment.id"
            @click="confirmDelete(comment)"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              />
            </svg>
            Eliminar
          </button>
        </div>
      </div>

      <!-- Load more -->
      <div v-if="hasMore && !searchQuery.trim()" class="load-more-container">
        <button class="btn-load-more" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? 'Cargando...' : 'Cargar mas comentarios' }}
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="empty-state-container">
      <div class="empty-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h3 class="empty-title">Sin comentarios</h3>
      <p class="empty-description">
        {{
          activeFilter
            ? `No hay comentarios con estado "${STATUS_LABELS[activeFilter]}".`
            : searchQuery.trim()
              ? 'No se encontraron comentarios que coincidan con la busqueda.'
              : 'Aun no se han recibido comentarios.'
        }}
      </p>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="deleteModal.show" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal-content modal-small">
          <div class="modal-header">
            <h3>Eliminar comentario</h3>
            <button class="modal-close" @click="closeDeleteModal">x</button>
          </div>
          <div class="modal-body">
            <p>
              Estas seguro de eliminar este comentario de
              <strong>{{ deleteModal.comment?.author_name || 'Anonimo' }}</strong
              >?
            </p>
            <div v-if="deleteModal.comment" class="delete-preview">
              {{
                deleteModal.comment.content.length > 120
                  ? deleteModal.comment.content.substring(0, 120) + '...'
                  : deleteModal.comment.content
              }}
            </div>
            <p class="text-warning">
              Esta accion no se puede deshacer. Si el comentario tiene respuestas, tambien seran
              eliminadas.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeDeleteModal">Cancelar</button>
            <button
              class="btn-danger"
              :disabled="actionLoading === deleteModal.comment?.id"
              @click="executeDelete"
            >
              {{ actionLoading === deleteModal.comment?.id ? 'Eliminando...' : 'Eliminar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-comentarios {
  padding: 0;
}

/* Header */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #111827;
}

.total-badge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Filters */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  align-items: center;
}

.filter-group {
  display: flex;
  gap: 0;
}

.status-filter {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.filter-btn {
  padding: 8px 14px;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  transition:
    background 0.2s,
    color 0.2s;
  min-height: 44px;
}

.filter-btn:not(:last-child) {
  border-right: 1px solid #e5e7eb;
}

.filter-btn.active {
  background: var(--color-primary, #23424a);
  color: white;
}

.filter-btn:hover:not(.active) {
  background: #f3f4f6;
}

.filter-search {
  flex: 1;
  min-width: 200px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.85rem;
  min-height: 44px;
}

.filter-search:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* Error */
.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-dismiss {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  padding: 4px 8px;
  line-height: 1;
}

/* Skeleton loading */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.skeleton-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.skeleton-line {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
  height: 14px;
}

.skeleton-short {
  width: 120px;
}

.skeleton-badge {
  width: 80px;
  height: 24px;
  border-radius: 12px;
}

.skeleton-long {
  width: 100%;
  margin-bottom: 8px;
}

.skeleton-medium {
  width: 70%;
  margin-bottom: 16px;
}

.skeleton-actions {
  display: flex;
  gap: 8px;
}

.skeleton-btn {
  width: 80px;
  height: 34px;
  border-radius: 6px;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Comment cards */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-card {
  background: white;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s;
}

.comment-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.comment-card.comment-pending {
  border-left: 3px solid #f59e0b;
}

/* Card header */
.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.comment-author-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.author-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary, #23424a);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.author-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.author-name {
  font-weight: 600;
  font-size: 0.9rem;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.author-email {
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.comment-date {
  font-size: 0.75rem;
  color: #9ca3af;
  white-space: nowrap;
}

/* Reply indicator */
.reply-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 8px;
  padding: 4px 10px;
  background: #f3f4f6;
  border-radius: 4px;
  width: fit-content;
}

/* Article link */
.comment-article {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 10px;
}

.article-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Content */
.comment-content {
  font-size: 0.85rem;
  line-height: 1.6;
  color: #374151;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.comment-content.content-expanded {
  display: block;
  -webkit-line-clamp: unset;
  overflow: visible;
}

.expand-btn {
  background: none;
  border: none;
  color: var(--color-primary, #23424a);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  padding: 2px 0;
  margin-bottom: 8px;
}

.expand-btn:hover {
  text-decoration: underline;
}

/* Actions */
.comment-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition:
    background 0.2s,
    border-color 0.2s;
  min-height: 44px;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-approve {
  background: #f0fdf4;
  color: #16a34a;
  border-color: #bbf7d0;
}

.action-approve:hover:not(:disabled) {
  background: #dcfce7;
}

.action-reject {
  background: #fef2f2;
  color: #dc2626;
  border-color: #fecaca;
}

.action-reject:hover:not(:disabled) {
  background: #fee2e2;
}

.action-spam {
  background: #fff7ed;
  color: #ea580c;
  border-color: #fed7aa;
}

.action-spam:hover:not(:disabled) {
  background: #ffedd5;
}

.action-delete {
  background: white;
  color: #dc2626;
  border-color: #fecaca;
}

.action-delete:hover:not(:disabled) {
  background: #fef2f2;
}

/* Load more */
.load-more-container {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.btn-load-more {
  background: white;
  color: var(--color-primary, #23424a);
  border: 1px solid var(--color-primary, #23424a);
  padding: 10px 24px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
  transition: background 0.2s;
}

.btn-load-more:hover:not(:disabled) {
  background: #f0f4f5;
}

.btn-load-more:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Empty state */
.empty-state-container {
  background: white;
  border-radius: 8px;
  padding: 60px 24px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  margin-bottom: 16px;
}

.empty-title {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  color: #374151;
}

.empty-description {
  margin: 0;
  font-size: 0.85rem;
  color: #9ca3af;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-small {
  max-width: 420px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #111827;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #6b7280;
  padding: 4px 8px;
  line-height: 1;
  font-weight: 600;
}

.modal-close:hover {
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.modal-body p {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: #374151;
  line-height: 1.5;
}

.delete-preview {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.5;
  margin-bottom: 12px;
  font-style: italic;
}

.text-warning {
  color: #d97706;
  font-size: 0.8rem;
  background: #fffbeb;
  padding: 8px 12px;
  border-radius: 6px;
  margin: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  min-height: 44px;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.85rem;
  min-height: 44px;
}

.btn-danger:hover:not(:disabled) {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile responsive (480px) */
@media (min-width: 480px) {
  .comment-actions {
    flex-wrap: nowrap;
  }
}

/* Tablet (768px) */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .header-left {
    justify-content: space-between;
  }

  .filters-bar {
    flex-direction: column;
    padding: 12px;
  }

  .status-filter {
    overflow-x: auto;
    width: 100%;
    -webkit-overflow-scrolling: touch;
  }

  .filter-btn {
    white-space: nowrap;
    padding: 8px 12px;
  }

  .filter-search {
    min-width: 100%;
  }

  .comment-header {
    flex-direction: column;
    gap: 8px;
  }

  .comment-meta {
    align-self: flex-start;
  }

  .comment-actions {
    flex-wrap: wrap;
  }

  .action-btn {
    flex: 1;
    min-width: calc(50% - 4px);
    justify-content: center;
  }
}

/* Desktop (1024px) */
@media (min-width: 1024px) {
  .comment-card {
    padding: 20px 24px;
  }

  .comment-actions {
    gap: 10px;
  }
}
</style>
