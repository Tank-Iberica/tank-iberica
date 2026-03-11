<template>
  <nav
    v-if="totalPages > 1"
    class="ui-pagination"
    :aria-label="$t('pagination.ariaLabel')"
    role="navigation"
  >
    <!-- Previous -->
    <button
      class="ui-pagination__btn ui-pagination__btn--prev"
      :disabled="currentPage <= 1"
      :aria-label="$t('pagination.previous')"
      @click="go(currentPage - 1)"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>

    <!-- Page numbers -->
    <template v-for="item in pages" :key="item.key">
      <span v-if="item.type === 'ellipsis'" class="ui-pagination__ellipsis" aria-hidden="true">…</span>
      <button
        v-else
        class="ui-pagination__btn ui-pagination__btn--page"
        :class="{ 'ui-pagination__btn--active': item.value === currentPage }"
        :aria-label="$t('pagination.goToPage', { page: item.value })"
        :aria-current="item.value === currentPage ? 'page' : undefined"
        @click="go(item.value!)"
      >
        {{ item.value }}
      </button>
    </template>

    <!-- Next -->
    <button
      class="ui-pagination__btn ui-pagination__btn--next"
      :disabled="currentPage >= totalPages"
      :aria-label="$t('pagination.next')"
      @click="go(currentPage + 1)"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>

    <!-- Summary -->
    <span class="ui-pagination__summary" aria-live="polite">
      {{ $t('pagination.summary', { current: currentPage, total: totalPages }) }}
    </span>
  </nav>
</template>

<script setup lang="ts">
interface PageItem {
  type: 'page' | 'ellipsis'
  key: string
  value?: number
}

const props = withDefaults(
  defineProps<{
    /** Total number of items */
    totalItems: number
    /** Items per page (default: 20) */
    pageSize?: number
    /** Currently active page (1-based) */
    currentPage: number
    /** Max page buttons before ellipsis kicks in (default: 7) */
    maxVisible?: number
  }>(),
  {
    pageSize: 20,
    maxVisible: 7,
  },
)

const emit = defineEmits<{
  (e: 'change', page: number): void
}>()

const totalPages = computed(() => Math.ceil(props.totalItems / props.pageSize))

const pages = computed((): PageItem[] => {
  const total = totalPages.value
  const current = props.currentPage
  const max = props.maxVisible

  if (total <= max) {
    return Array.from({ length: total }, (_, i) => ({
      type: 'page' as const,
      key: `p${i + 1}`,
      value: i + 1,
    }))
  }

  const items: PageItem[] = []
  const half = Math.floor((max - 2) / 2) // slots for surrounding pages

  // Always show first page
  items.push({ type: 'page', key: 'p1', value: 1 })

  const leftBound = Math.max(2, current - half)
  const rightBound = Math.min(total - 1, current + half)

  if (leftBound > 2) {
    items.push({ type: 'ellipsis', key: 'el-left' })
  }

  for (let p = leftBound; p <= rightBound; p++) {
    items.push({ type: 'page', key: `p${p}`, value: p })
  }

  if (rightBound < total - 1) {
    items.push({ type: 'ellipsis', key: 'el-right' })
  }

  // Always show last page
  items.push({ type: 'page', key: `p${total}`, value: total })

  return items
})

function go(page: number): void {
  if (page < 1 || page > totalPages.value || page === props.currentPage) return
  emit('change', page)
}
</script>

<style scoped>
.ui-pagination {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  flex-wrap: wrap;
  padding: var(--spacing-4) 0;
}

.ui-pagination__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  min-height: 2.25rem;
  padding: var(--spacing-1) var(--spacing-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  touch-action: manipulation;
}

.ui-pagination__btn:hover:not(:disabled):not(.ui-pagination__btn--active) {
  background: var(--bg-muted);
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.ui-pagination__btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.ui-pagination__btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  cursor: default;
}

.ui-pagination__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.ui-pagination__btn--prev,
.ui-pagination__btn--next {
  padding: var(--spacing-1);
}

.ui-pagination__ellipsis {
  min-width: 2rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  user-select: none;
}

.ui-pagination__summary {
  margin-left: var(--spacing-2);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  white-space: nowrap;
}

/* Mobile: hide summary, compact buttons */
@media (max-width: 480px) {
  .ui-pagination__summary {
    display: none;
  }

  .ui-pagination__btn {
    min-width: 2rem;
    min-height: 2rem;
    padding: var(--spacing-1);
    font-size: var(--font-size-xs);
  }
}
</style>
