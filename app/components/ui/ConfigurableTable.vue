<script setup lang="ts">
/**
 * ConfigurableTable — Table with toggleable column groups.
 * Reusable across dashboard and admin pages.
 * Supports column group toggling, sorting, localStorage persistence,
 * custom cell rendering via scoped slots, and a loading skeleton state.
 */
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

interface ColumnDef {
  key: string
  label: string
  width?: string
}

interface ColumnGroup {
  key: string
  label: string
  columns: ColumnDef[]
  required?: boolean
}

interface Props {
  groups: ColumnGroup[]
  data: Record<string, unknown>[]
  storageKey?: string
  loading?: boolean
  emptyText?: string
}

const props = withDefaults(defineProps<Props>(), {
  storageKey: 'table-config',
  loading: false,
  emptyText: '',
})

defineSlots<{
  [key: `cell-${string}`]: (props: {
    value: unknown
    row: Record<string, unknown>
    rowIndex: number
  }) => void
  actions: (props: { row: Record<string, unknown>; rowIndex: number }) => void
}>()

const { t } = useI18n()

type SortDirection = 'asc' | 'desc' | null

const visibleGroupKeys = ref<Set<string>>(new Set())
const sortKey = ref<string | null>(null)
const sortDirection = ref<SortDirection>(null)

// Resolve the empty text: use prop or fallback to i18n
const resolvedEmptyText = computed(() => props.emptyText || t('configurableTable.empty'))

// Load visibility state from localStorage
function loadVisibility() {
  const requiredKeys = props.groups.filter((g) => g.required).map((g) => g.key)

  try {
    const stored = localStorage.getItem(props.storageKey)
    if (stored) {
      const parsed = JSON.parse(stored) as string[]
      visibleGroupKeys.value = new Set([...requiredKeys, ...parsed])
      return
    }
  } catch {
    // Ignore parse errors
  }

  // Default: all groups visible
  visibleGroupKeys.value = new Set(props.groups.map((g) => g.key))
}

// Save visibility state to localStorage
function saveVisibility() {
  try {
    const nonRequired = [...visibleGroupKeys.value].filter(
      (key) => !props.groups.find((g) => g.key === key && g.required),
    )
    localStorage.setItem(props.storageKey, JSON.stringify(nonRequired))
  } catch {
    // Ignore storage errors
  }
}

function toggleGroup(groupKey: string) {
  const group = props.groups.find((g) => g.key === groupKey)
  if (group?.required) return

  const newSet = new Set(visibleGroupKeys.value)
  if (newSet.has(groupKey)) {
    newSet.delete(groupKey)
  } else {
    newSet.add(groupKey)
  }
  visibleGroupKeys.value = newSet
  saveVisibility()
}

function isGroupVisible(groupKey: string): boolean {
  return visibleGroupKeys.value.has(groupKey)
}

// Compute the flat list of visible columns
const visibleColumns = computed<ColumnDef[]>(() => {
  const cols: ColumnDef[] = []
  for (const group of props.groups) {
    if (isGroupVisible(group.key)) {
      cols.push(...group.columns)
    }
  }
  return cols
})

// Sorting logic
function handleSort(columnKey: string) {
  if (sortKey.value === columnKey) {
    if (sortDirection.value === 'asc') {
      sortDirection.value = 'desc'
    } else if (sortDirection.value === 'desc') {
      sortKey.value = null
      sortDirection.value = null
    }
  } else {
    sortKey.value = columnKey
    sortDirection.value = 'asc'
  }
}

function getSortAriaLabel(columnKey: string): string {
  if (sortKey.value === columnKey && sortDirection.value === 'asc') {
    return t('configurableTable.sortDesc')
  }
  return t('configurableTable.sortAsc')
}

const sortedData = computed<Record<string, unknown>[]>(() => {
  if (!sortKey.value || !sortDirection.value) {
    return props.data
  }

  const key = sortKey.value
  const dir = sortDirection.value

  return [...props.data].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]

    // Handle null/undefined
    if (aVal == null && bVal == null) return 0
    if (aVal == null) return dir === 'asc' ? -1 : 1
    if (bVal == null) return dir === 'asc' ? 1 : -1

    // Numeric comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return dir === 'asc' ? aVal - bVal : bVal - aVal
    }

    // String comparison
    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()
    const cmp = aStr.localeCompare(bStr)
    return dir === 'asc' ? cmp : -cmp
  })
})

// Skeleton rows for loading state
const skeletonRows = 5

// Assign consistent colors to group chips
const chipColors: readonly string[] = [
  '#23424A',
  '#7FD1C8',
  '#D4A017',
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
]

function getChipColor(index: number): string {
  return chipColors[index % chipColors.length] ?? '#23424A'
}

function getChipTextColor(bgColor: string): string {
  // Simple luminance check for text contrast
  const hex = bgColor.replace('#', '')
  const r = Number.parseInt(hex.substring(0, 2), 16)
  const g = Number.parseInt(hex.substring(2, 4), 16)
  const b = Number.parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#1F2A2A' : '#FFFFFF'
}

onMounted(() => {
  loadVisibility()
})

watch(
  () => props.groups,
  () => {
    loadVisibility()
  },
  { deep: true },
)
</script>

<template>
  <div class="ct-wrapper">
    <!-- Toggle chips -->
    <div class="ct-chips" role="toolbar" :aria-label="t('configurableTable.columns')">
      <button
        v-for="(group, idx) in groups"
        :key="group.key"
        type="button"
        class="ct-chip"
        :class="{
          'ct-chip-active': isGroupVisible(group.key),
          'ct-chip-required': group.required,
        }"
        :style="{
          '--chip-color': getChipColor(idx),
          '--chip-text': getChipTextColor(getChipColor(idx)),
        }"
        :disabled="group.required"
        :aria-pressed="isGroupVisible(group.key)"
        @click="toggleGroup(group.key)"
      >
        {{ group.label }}
      </button>
    </div>

    <!-- Table container with horizontal scroll on mobile -->
    <div class="ct-table-container">
      <!-- Loading skeleton -->
      <table v-if="loading" class="ct-table">
        <thead>
          <tr>
            <th
              v-for="col in visibleColumns"
              :key="col.key"
              :style="col.width ? { width: col.width } : undefined"
            >
              <div class="ct-skeleton ct-skeleton-header" />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in skeletonRows" :key="row">
            <td v-for="col in visibleColumns" :key="col.key">
              <div class="ct-skeleton ct-skeleton-cell" />
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Data table -->
      <table v-else-if="sortedData.length > 0" class="ct-table">
        <thead>
          <tr>
            <th
              v-for="col in visibleColumns"
              :key="col.key"
              :style="col.width ? { width: col.width } : undefined"
              class="ct-th-sortable"
              :aria-sort="
                sortKey === col.key
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              "
              @click="handleSort(col.key)"
            >
              <span class="ct-th-content">
                <span>{{ col.label }}</span>
                <span
                  class="ct-sort-icon"
                  :class="{
                    'ct-sort-active': sortKey === col.key,
                    'ct-sort-desc': sortKey === col.key && sortDirection === 'desc',
                  }"
                  :aria-label="getSortAriaLabel(col.key)"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                </span>
              </span>
            </th>
            <!-- Actions column header (always visible, let parent fill) -->
            <th class="ct-th-actions">
              <span />
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rowIndex) in sortedData" :key="rowIndex" class="ct-row">
            <td
              v-for="col in visibleColumns"
              :key="col.key"
              :style="col.width ? { width: col.width } : undefined"
            >
              <slot
                :name="`cell-${col.key}`"
                :value="row[col.key]"
                :row="row"
                :row-index="rowIndex"
              >
                {{ row[col.key] ?? '' }}
              </slot>
            </td>
            <td class="ct-td-actions">
              <slot name="actions" :row="row" :row-index="rowIndex" />
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Empty state -->
      <div v-else class="ct-empty">
        <svg
          class="ct-empty-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path d="M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7" />
          <rect x="2" y="13" width="20" height="7" rx="2" />
          <line x1="12" y1="10" x2="12" y2="10.01" />
        </svg>
        <p class="ct-empty-text">{{ resolvedEmptyText }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* === Wrapper === */
.ct-wrapper {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3, 0.75rem);
  width: 100%;
}

/* === Toggle chips === */
.ct-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2, 0.5rem);
  padding: var(--spacing-2, 0.5rem) 0;
}

.ct-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 44px;
  padding: var(--spacing-2, 0.5rem) var(--spacing-4, 1rem);
  border-radius: var(--border-radius-full, 9999px);
  font-size: var(--font-size-sm, 0.875rem);
  font-weight: var(--font-weight-medium, 500);
  cursor: pointer;
  border: 2px solid var(--chip-color, var(--color-primary));
  background: transparent;
  color: var(--chip-color, var(--color-primary));
  transition:
    background var(--transition-fast, 150ms ease),
    color var(--transition-fast, 150ms ease),
    opacity var(--transition-fast, 150ms ease);
  white-space: nowrap;
  user-select: none;
}

.ct-chip:hover:not(:disabled) {
  opacity: 0.85;
}

.ct-chip-active {
  background: var(--chip-color, var(--color-primary));
  color: var(--chip-text, white);
}

.ct-chip-required {
  cursor: default;
  opacity: 1;
}

.ct-chip-required:hover {
  opacity: 1;
}

/* === Table container (horizontal scroll on mobile) === */
.ct-table-container {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: var(--border-radius, 8px);
  background: var(--bg-primary, white);
}

/* === Table === */
.ct-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.ct-table thead {
  background: var(--color-gray-50, #f9fafb);
  border-bottom: 2px solid var(--border-color, #d1d5db);
}

.ct-table th {
  padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
  text-align: left;
  font-size: var(--font-size-xs, 0.75rem);
  font-weight: var(--font-weight-semibold, 600);
  color: var(--text-secondary, #4a5a5a);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.ct-th-sortable {
  cursor: pointer;
  user-select: none;
  transition: color var(--transition-fast, 150ms ease);
}

.ct-th-sortable:hover {
  color: var(--color-primary);
}

.ct-th-content {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1, 0.25rem);
}

.ct-sort-icon {
  display: inline-flex;
  align-items: center;
  opacity: 0.3;
  transition:
    opacity var(--transition-fast, 150ms ease),
    transform var(--transition-fast, 150ms ease);
}

.ct-sort-active {
  opacity: 1;
  color: var(--color-primary);
}

.ct-sort-desc {
  transform: rotate(180deg);
}

.ct-th-actions {
  width: 1%;
  white-space: nowrap;
}

.ct-table td {
  padding: var(--spacing-3, 0.75rem) var(--spacing-4, 1rem);
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-primary, #1f2a2a);
  border-bottom: 1px solid var(--border-color-light, #e5e7eb);
  vertical-align: middle;
}

.ct-td-actions {
  width: 1%;
  white-space: nowrap;
  text-align: right;
}

/* === Row hover === */
.ct-row {
  transition: background var(--transition-fast, 150ms ease);
}

.ct-row:hover {
  background: var(--color-gray-50, #f9fafb);
}

.ct-row:last-child td {
  border-bottom: none;
}

/* === Loading skeleton === */
.ct-skeleton {
  background: linear-gradient(
    90deg,
    var(--color-gray-200, #e5e7eb) 25%,
    var(--color-gray-100, #f3f4f6) 50%,
    var(--color-gray-200, #e5e7eb) 75%
  );
  background-size: 200% 100%;
  animation: ct-shimmer 1.5s infinite;
  border-radius: var(--border-radius-sm, 4px);
}

.ct-skeleton-header {
  height: 12px;
  width: 80%;
}

.ct-skeleton-cell {
  height: 16px;
  width: 70%;
}

@keyframes ct-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* === Empty state === */
.ct-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-12, 3rem) var(--spacing-6, 1.5rem);
  text-align: center;
}

.ct-empty-icon {
  width: 48px;
  height: 48px;
  color: var(--text-disabled, #9ca3af);
  margin-bottom: var(--spacing-4, 1rem);
}

.ct-empty-text {
  font-size: var(--font-size-sm, 0.875rem);
  color: var(--text-auxiliary, #7a8a8a);
  margin: 0;
}

/* === Tablet+ (768px) === */
@media (min-width: 768px) {
  .ct-table {
    min-width: unset;
  }

  .ct-table th {
    padding: var(--spacing-3, 0.75rem) var(--spacing-5, 1.25rem);
  }

  .ct-table td {
    padding: var(--spacing-3, 0.75rem) var(--spacing-5, 1.25rem);
  }
}

/* === Desktop (1024px) === */
@media (min-width: 1024px) {
  .ct-chips {
    gap: var(--spacing-3, 0.75rem);
  }
}
</style>
