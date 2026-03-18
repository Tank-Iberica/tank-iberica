<script setup lang="ts" generic="T extends Record<string, unknown>">
/**
 * UiDataTable — Generic data table with sort, filter, pagination.
 *
 * Designed for admin pages. Provides consistent table layout with
 * column sorting, text filtering, pagination, loading, and empty states.
 *
 * Backlog #N60 — UiDataTable.vue genérico admin
 *
 * @example
 * <UiDataTable
 *   :data="users"
 *   :columns="[{ key: 'name', label: 'Name', sortable: true }]"
 *   :loading="isLoading"
 *   :page-size="20"
 *   filterable
 * >
 *   <template #cell-name="{ row }">{{ row.name }}</template>
 * </UiDataTable>
 */

export interface DataTableColumn {
  /** Unique column key (must match a key in data rows) */
  key: string
  /** Display label */
  label: string
  /** Whether column is sortable */
  sortable?: boolean
  /** Column width (CSS value) */
  width?: string
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
}

const props = withDefaults(
  defineProps<{
    /** Array of data rows */
    data: T[]
    /** Column definitions */
    columns: DataTableColumn[]
    /** Whether the table is loading */
    loading?: boolean
    /** Enable text filter input */
    filterable?: boolean
    /** Filter placeholder text */
    filterPlaceholder?: string
    /** Rows per page (0 = no pagination) */
    pageSize?: number
    /** Row key field for :key binding */
    rowKey?: string
    /** Empty state message */
    emptyText?: string
    /** Loading text */
    loadingText?: string
  }>(),
  {
    loading: false,
    filterable: false,
    filterPlaceholder: '',
    pageSize: 0,
    rowKey: 'id',
    emptyText: '',
    loadingText: '',
  },
)

defineEmits<{
  'row-click': [row: T]
}>()

const { t } = useI18n()

// Filter
const filterQuery = ref('')

// Sort
const sortKey = ref<string | null>(null)
const sortOrder = ref<'asc' | 'desc'>('asc')

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortOrder.value = 'asc'
  }
  currentPage.value = 1
}

// Filtered + sorted data
const processedData = computed(() => {
  let result = [...props.data]

  // Filter
  if (filterQuery.value.trim()) {
    const q = filterQuery.value.toLowerCase()
    result = result.filter((row) =>
      props.columns.some((col) => {
        const val = row[col.key]
        return val != null && String(val).toLowerCase().includes(q)
      }),
    )
  }

  // Sort
  if (sortKey.value) {
    const key = sortKey.value
    const dir = sortOrder.value === 'asc' ? 1 : -1
    result.sort((a, b) => {
      const va = a[key]
      const vb = b[key]
      if (va == null && vb == null) return 0
      if (va == null) return 1
      if (vb == null) return -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
      return String(va).localeCompare(String(vb)) * dir
    })
  }

  return result
})

// Pagination
const currentPage = ref(1)

const totalPages = computed(() => {
  if (!props.pageSize || props.pageSize <= 0) return 1
  return Math.max(1, Math.ceil(processedData.value.length / props.pageSize))
})

const paginatedData = computed(() => {
  if (!props.pageSize || props.pageSize <= 0) return processedData.value
  const start = (currentPage.value - 1) * props.pageSize
  return processedData.value.slice(start, start + props.pageSize)
})

function goToPage(page: number) {
  currentPage.value = Math.max(1, Math.min(page, totalPages.value))
}

// Reset page when filter changes
watch(filterQuery, () => {
  currentPage.value = 1
})
</script>

<template>
  <div class="data-table-wrapper">
    <!-- Filter -->
    <div v-if="filterable" class="data-table-filter">
      <input
        v-model="filterQuery"
        type="search"
        class="data-table-filter__input"
        :placeholder="filterPlaceholder || t('common.filter', 'Filtrar...')"
        :aria-label="filterPlaceholder || t('common.filter', 'Filtrar...')"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="data-table-loading" role="status">
      <span class="data-table-loading__spinner" aria-hidden="true" />
      <span>{{ loadingText || t('common.loading', 'Cargando...') }}</span>
    </div>

    <!-- Table -->
    <div v-else-if="paginatedData.length > 0" class="data-table-scroll">
      <table class="data-table" role="grid">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :style="col.width ? { width: col.width } : undefined"
              :class="[
                'data-table__th',
                `data-table__th--${col.align || 'left'}`,
                { 'data-table__th--sortable': col.sortable },
              ]"
              :aria-sort="
                col.sortable && sortKey === col.key
                  ? sortOrder === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : undefined
              "
              @click="col.sortable ? toggleSort(col.key) : undefined"
            >
              {{ col.label }}
              <span v-if="col.sortable && sortKey === col.key" class="data-table__sort-icon">
                {{ sortOrder === 'asc' ? '▲' : '▼' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in paginatedData"
            :key="String((row as Record<string, unknown>)[rowKey] ?? '')"
            class="data-table__row"
            @click="$emit('row-click', row)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="[
                'data-table__td',
                `data-table__td--${col.align || 'left'}`,
              ]"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                {{ row[col.key] ?? '' }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Empty state -->
    <div v-else class="data-table-empty">
      <slot name="empty">
        <p>{{ emptyText || t('common.noResults', 'No hay resultados') }}</p>
      </slot>
    </div>

    <!-- Pagination -->
    <nav
      v-if="pageSize > 0 && totalPages > 1"
      class="data-table-pagination"
      :aria-label="t('common.pagination', 'Paginación')"
    >
      <button
        class="data-table-pagination__btn"
        :disabled="currentPage <= 1"
        :aria-label="t('common.previous', 'Anterior')"
        @click="goToPage(currentPage - 1)"
      >
        ←
      </button>
      <span class="data-table-pagination__info">
        {{ currentPage }} / {{ totalPages }}
      </span>
      <button
        class="data-table-pagination__btn"
        :disabled="currentPage >= totalPages"
        :aria-label="t('common.next', 'Siguiente')"
        @click="goToPage(currentPage + 1)"
      >
        →
      </button>
    </nav>
  </div>
</template>

<style scoped>
.data-table-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.data-table-filter__input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-gray-200, #e2e8f0);
  border-radius: var(--border-radius, 0.375rem);
  font-size: 0.875rem;
}

.data-table-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.data-table__th {
  padding: 0.625rem 0.75rem;
  text-align: left;
  font-weight: 600;
  background: var(--bg-secondary, #f8f9fa);
  border-bottom: 2px solid var(--color-gray-200, #e2e8f0);
  white-space: nowrap;
  user-select: none;
}

.data-table__th--center { text-align: center; }
.data-table__th--right { text-align: right; }

.data-table__th--sortable {
  cursor: pointer;
}

@media (hover: hover) {
  .data-table__th--sortable:hover {
    background: var(--color-gray-100, #f1f3f5);
  }
}

.data-table__sort-icon {
  margin-inline-start: 0.25rem;
  font-size: 0.625rem;
}

.data-table__td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-gray-100, #f1f3f5);
  vertical-align: middle;
}

.data-table__td--center { text-align: center; }
.data-table__td--right { text-align: right; }

.data-table__row {
  transition: background 0.1s;
}

@media (hover: hover) {
  .data-table__row:hover {
    background: var(--bg-hover, #f8f9fa);
  }
}

.data-table-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 2rem;
  color: var(--text-secondary, #4a524e);
}

.data-table-loading__spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: dt-spin 0.6s linear infinite;
}

@keyframes dt-spin {
  to { transform: rotate(360deg); }
}

.data-table-empty {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary, #4a524e);
}

.data-table-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.data-table-pagination__btn {
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-gray-200, #e2e8f0);
  border-radius: var(--border-radius, 0.375rem);
  background: white;
  cursor: pointer;
  font-size: 1rem;
}

.data-table-pagination__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.data-table-pagination__info {
  font-size: 0.875rem;
  color: var(--text-secondary, #4a524e);
}

/* Mobile: horizontal scroll hint */
@media (max-width: 767px) {
  .data-table-scroll {
    margin-inline: -0.75rem;
    padding-inline: 0.75rem;
  }
}
</style>
