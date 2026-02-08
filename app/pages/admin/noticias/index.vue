<script setup lang="ts">
import {
  useAdminNews,
  type AdminNewsFilters,
} from '~/composables/admin/useAdminNews'
import { calculateMiniSeoScore } from '~/composables/admin/useSeoScore'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const router = useRouter()

const {
  news,
  loading,
  error,
  total,
  fetchNews,
  deleteNews,
  updateStatus,
} = useAdminNews()

// Filters
const filters = ref<AdminNewsFilters>({
  status: null,
  category: null,
  search: '',
})

const statusOptions = [
  { value: null, label: 'Todos' },
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicado' },
  { value: 'archived', label: 'Archivado' },
]

const categoryOptions = [
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

// Sorting
type SortField = 'created_at' | 'published_at' | 'title_es' | 'views'
const sortField = ref<SortField>('created_at')
const sortOrder = ref<'asc' | 'desc'>('desc')

function toggleSort(field: SortField) {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  }
  else {
    sortField.value = field
    sortOrder.value = 'desc'
  }
}

function getSortIcon(field: SortField): string {
  if (sortField.value !== field) return '↕'
  return sortOrder.value === 'asc' ? '↑' : '↓'
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

// Has active filters
const hasActiveFilters = computed(() =>
  filters.value.status || filters.value.category || (filters.value.search && filters.value.search.length > 0),
)

function clearFilters() {
  filters.value = { status: null, category: null, search: '' }
}

// Delete modal
const deleteModal = ref(false)
const deleteTarget = ref<{ id: string; title_es: string } | null>(null)
const deleteConfirmText = ref('')

function openDeleteModal(item: { id: string; title_es: string }) {
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

// Status change
async function handleStatusChange(item: { id: string; status: string }, event: Event) {
  const select = event.target as HTMLSelectElement
  const newStatus = select.value
  const ok = await updateStatus(item.id, newStatus)
  if (!ok) {
    select.value = item.status
  }
  else {
    await fetchNews(filters.value)
  }
}

// SEO mini score
function getSeoScore(item: { title_es: string; content_es: string; slug: string; image_url: string | null; hashtags: readonly string[] }) {
  return calculateMiniSeoScore({
    title_es: item.title_es,
    content_es: item.content_es,
    slug: item.slug,
    image_url: item.image_url,
    hashtags: [...(item.hashtags || [])],
  })
}

// Format date
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(() => filters.value.search, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => fetchNews(filters.value), 300)
})

watch([() => filters.value.status, () => filters.value.category], () => {
  fetchNews(filters.value)
})

onMounted(() => fetchNews())
</script>

<template>
  <div class="noticias-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <h1>Noticias</h1>
        <span class="count-badge">{{ total }}</span>
      </div>
      <NuxtLink to="/admin/noticias/nuevo" class="btn btn-primary">
        + Nueva Noticia
      </NuxtLink>
    </header>

    <!-- Error -->
    <div v-if="error" class="error-msg">{{ error }}</div>

    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-row">
        <div class="search-box">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Buscar por titulo..."
            class="search-input"
          >
        </div>

        <div class="filter-group">
          <select v-model="filters.category" class="filter-select">
            <option v-for="opt in categoryOptions" :key="String(opt.value)" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <select v-model="filters.status" class="filter-select">
            <option v-for="opt in statusOptions" :key="String(opt.value)" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <button v-if="hasActiveFilters" class="btn btn-sm" @click="clearFilters">
          Limpiar
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner" />
      Cargando noticias...
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-title" @click="toggleSort('title_es')">
              Titulo {{ getSortIcon('title_es') }}
            </th>
            <th class="col-category">Categoria</th>
            <th class="col-status">Estado</th>
            <th class="col-views" @click="toggleSort('views')">
              Visitas {{ getSortIcon('views') }}
            </th>
            <th class="col-date" @click="toggleSort('published_at')">
              Fecha {{ getSortIcon('published_at') }}
            </th>
            <th class="col-seo">SEO</th>
            <th class="col-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="sortedNews.length === 0">
            <td colspan="7" class="empty-state">
              <div class="empty-content">
                <span class="empty-icon">📰</span>
                <p>No hay noticias{{ hasActiveFilters ? ' con estos filtros' : '' }}</p>
                <NuxtLink v-if="!hasActiveFilters" to="/admin/noticias/nuevo" class="btn btn-primary btn-sm">
                  Crear primera noticia
                </NuxtLink>
              </div>
            </td>
          </tr>
          <tr
            v-for="item in sortedNews"
            :key="item.id"
            class="news-row"
            @click="router.push(`/admin/noticias/${item.id}`)"
          >
            <td class="col-title">
              <div class="title-cell">
                <strong class="news-title">{{ item.title_es }}</strong>
                <span class="slug-text">/noticias/{{ item.slug }}</span>
              </div>
            </td>
            <td class="col-category">
              <span class="cat-pill" :class="'cat-' + item.category">
                {{ categoryLabels[item.category] || item.category }}
              </span>
            </td>
            <td class="col-status" @click.stop>
              <select
                :value="item.status"
                class="status-select"
                :class="'status-' + item.status"
                @change="handleStatusChange(item, $event)"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="archived">Archivado</option>
              </select>
            </td>
            <td class="col-views">{{ item.views || 0 }}</td>
            <td class="col-date">{{ formatDate(item.published_at || item.created_at) }}</td>
            <td class="col-seo" @click.stop>
              <span class="seo-badge" :class="'seo-' + getSeoScore(item).level">
                {{ getSeoScore(item).score }}
              </span>
            </td>
            <td class="col-actions" @click.stop>
              <div class="action-btns">
                <NuxtLink :to="`/admin/noticias/${item.id}`" class="action-btn" title="Editar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </NuxtLink>
                <a
                  :href="`/noticias/${item.slug}`"
                  target="_blank"
                  class="action-btn"
                  title="Ver en web"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
                <button class="action-btn action-delete" title="Eliminar" @click="openDeleteModal(item)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete Modal -->
    <Teleport to="body">
      <div v-if="deleteModal" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal-content">
          <h3>Eliminar noticia</h3>
          <p>Estas a punto de eliminar:</p>
          <p class="delete-title">{{ deleteTarget?.title_es }}</p>
          <p class="delete-warning">Esta accion no se puede deshacer. Escribe <strong>borrar</strong> para confirmar.</p>
          <input
            v-model="deleteConfirmText"
            type="text"
            placeholder="Escribe 'borrar'"
            class="confirm-input"
            @keydown.enter="executeDelete"
          >
          <div class="modal-actions">
            <button class="btn" @click="closeDeleteModal">Cancelar</button>
            <button
              class="btn btn-danger"
              :disabled="deleteConfirmText !== 'borrar'"
              @click="executeDelete"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.noticias-page {
  max-width: 1200px;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
}

.count-badge {
  background: #f1f5f9;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 12px;
}

/* Error */
.error-msg {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 0.875rem;
}

/* Toolbar */
.toolbar {
  margin-bottom: 16px;
}

.toolbar-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: #94a3b8;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary, #23424A);
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  background: white;
  color: #374151;
  transition: all 0.15s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn:hover { background: #f8fafc; }

.btn-primary {
  background: var(--color-primary, #23424A);
  color: white;
  border-color: var(--color-primary, #23424A);
}

.btn-primary:hover { opacity: 0.9; }

.btn-danger {
  background: #dc2626;
  color: white;
  border-color: #dc2626;
}

.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-sm { padding: 4px 12px; font-size: 0.8rem; }

/* Loading */
.loading-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 40px 0;
  justify-content: center;
  color: #64748b;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424A);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Table */
.table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table thead th {
  background: #f8fafc;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #64748b;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
  cursor: default;
  user-select: none;
}

.data-table thead th:first-child { padding-left: 16px; }

.col-title { min-width: 250px; cursor: pointer !important; }
.col-category { width: 100px; }
.col-status { width: 120px; }
.col-views { width: 80px; text-align: center; }
.col-date { width: 120px; cursor: pointer !important; }
.col-seo { width: 60px; text-align: center; }
.col-actions { width: 110px; }

.data-table tbody td {
  padding: 12px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.data-table tbody td:first-child { padding-left: 16px; }

.news-row {
  cursor: pointer;
  transition: background 0.15s;
}

.news-row:hover { background: #f8fafc; }

/* Title cell */
.title-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.news-title {
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.3;
}

.slug-text {
  font-size: 0.7rem;
  color: #94a3b8;
  font-family: monospace;
}

/* Category pill */
.cat-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.cat-prensa { background: #dbeafe; color: #1d4ed8; }
.cat-eventos { background: #fef3c7; color: #92400e; }
.cat-destacados { background: #dcfce7; color: #166534; }
.cat-general { background: #f1f5f9; color: #475569; }

/* Status select */
.status-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  background: white;
}

.status-draft { color: #92400e; border-color: #fbbf24; }
.status-published { color: #166534; border-color: #22c55e; }
.status-archived { color: #64748b; border-color: #94a3b8; }

/* SEO badge */
.seo-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 24px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 700;
}

.seo-good { background: #dcfce7; color: #166534; }
.seo-warning { background: #fef3c7; color: #92400e; }
.seo-bad { background: #fef2f2; color: #dc2626; }

/* Actions */
.action-btns {
  display: flex;
  gap: 4px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  color: #64748b;
  transition: all 0.15s;
  cursor: pointer;
  border: none;
  background: none;
  text-decoration: none;
}

.action-btn:hover { background: #f1f5f9; color: #1a1a1a; }
.action-btn svg { width: 16px; height: 16px; }
.action-delete:hover { background: #fef2f2; color: #dc2626; }

/* Empty state */
.empty-state {
  text-align: center;
  padding: 40px 20px !important;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-icon { font-size: 2rem; }
.empty-content p { color: #64748b; margin: 0; }

/* Delete Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  padding: 24px;
  max-width: 420px;
  width: 100%;
}

.modal-content h3 {
  margin: 0 0 12px;
  font-size: 1.1rem;
  color: #1a1a1a;
}

.modal-content p { margin: 0 0 8px; color: #64748b; font-size: 0.9rem; }

.delete-title {
  font-weight: 600;
  color: #1a1a1a !important;
}

.delete-warning {
  margin-top: 12px !important;
  color: #dc2626 !important;
  font-size: 0.85rem !important;
}

.confirm-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  margin: 12px 0;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

/* Views column */
.col-views { text-align: center; }

/* Mobile responsive */
@media (max-width: 767px) {
  .toolbar-row {
    flex-direction: column;
  }

  .search-box {
    min-width: auto;
    width: 100%;
  }

  .filter-group {
    width: 100%;
  }

  .filter-select {
    width: 100%;
  }

  .col-views,
  .col-seo,
  .col-date {
    display: none;
  }
}
</style>
