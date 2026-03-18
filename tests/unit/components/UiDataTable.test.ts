import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const ROOT = resolve(__dirname, '../../..')
const COMPONENT = readFileSync(resolve(ROOT, 'app/components/ui/DataTable.vue'), 'utf-8')

describe('UiDataTable', () => {
  describe('Props interface', () => {
    it('accepts data array', () => {
      expect(COMPONENT).toContain('data: T[]')
    })

    it('accepts columns definition', () => {
      expect(COMPONENT).toContain('columns: DataTableColumn[]')
    })

    it('has loading prop', () => {
      expect(COMPONENT).toContain('loading?: boolean')
    })

    it('has filterable prop', () => {
      expect(COMPONENT).toContain('filterable?: boolean')
    })

    it('has pageSize prop for pagination', () => {
      expect(COMPONENT).toContain('pageSize?: number')
    })

    it('has rowKey prop for :key binding', () => {
      expect(COMPONENT).toContain('rowKey?: string')
    })

    it('has emptyText and loadingText props', () => {
      expect(COMPONENT).toContain('emptyText?: string')
      expect(COMPONENT).toContain('loadingText?: string')
    })
  })

  describe('Column interface', () => {
    it('has key, label, sortable fields', () => {
      expect(COMPONENT).toContain('key: string')
      expect(COMPONENT).toContain('label: string')
      expect(COMPONENT).toContain('sortable?: boolean')
    })

    it('supports width and align', () => {
      expect(COMPONENT).toContain('width?: string')
      expect(COMPONENT).toContain("align?: 'left' | 'center' | 'right'")
    })
  })

  describe('Sorting', () => {
    it('tracks sortKey and sortOrder state', () => {
      expect(COMPONENT).toContain("sortKey = ref<string | null>(null)")
      expect(COMPONENT).toContain("sortOrder = ref<'asc' | 'desc'>('asc')")
    })

    it('toggleSort function toggles direction on same key', () => {
      expect(COMPONENT).toContain('function toggleSort(key: string)')
      expect(COMPONENT).toContain("sortOrder.value === 'asc' ? 'desc' : 'asc'")
    })

    it('applies aria-sort on sorted columns', () => {
      expect(COMPONENT).toContain('aria-sort')
      expect(COMPONENT).toContain("'ascending'")
      expect(COMPONENT).toContain("'descending'")
    })

    it('shows sort direction icon', () => {
      expect(COMPONENT).toContain('data-table__sort-icon')
      expect(COMPONENT).toContain("sortOrder === 'asc' ? '▲' : '▼'")
    })

    it('applies sortable class for cursor', () => {
      expect(COMPONENT).toContain('data-table__th--sortable')
      expect(COMPONENT).toContain('cursor: pointer')
    })
  })

  describe('Filtering', () => {
    it('has filter input when filterable is true', () => {
      expect(COMPONENT).toContain('v-if="filterable"')
      expect(COMPONENT).toContain('v-model="filterQuery"')
    })

    it('uses search input type', () => {
      expect(COMPONENT).toContain('type="search"')
    })

    it('filters across all columns', () => {
      expect(COMPONENT).toContain('props.columns.some')
      expect(COMPONENT).toContain('.toLowerCase().includes(q)')
    })

    it('resets to page 1 when filter changes', () => {
      expect(COMPONENT).toContain('watch(filterQuery')
      expect(COMPONENT).toContain('currentPage.value = 1')
    })

    it('has aria-label on filter input', () => {
      expect(COMPONENT).toContain(':aria-label=')
    })
  })

  describe('Pagination', () => {
    it('computes totalPages from data length and pageSize', () => {
      expect(COMPONENT).toContain('Math.ceil(processedData.value.length / props.pageSize)')
    })

    it('slices data for current page', () => {
      expect(COMPONENT).toContain('processedData.value.slice(start, start + props.pageSize)')
    })

    it('has prev/next buttons', () => {
      expect(COMPONENT).toContain('goToPage(currentPage - 1)')
      expect(COMPONENT).toContain('goToPage(currentPage + 1)')
    })

    it('disables prev on first page', () => {
      expect(COMPONENT).toContain(':disabled="currentPage <= 1"')
    })

    it('disables next on last page', () => {
      expect(COMPONENT).toContain(':disabled="currentPage >= totalPages"')
    })

    it('shows page info', () => {
      expect(COMPONENT).toContain('currentPage }} / {{ totalPages')
    })

    it('pagination nav has aria-label', () => {
      expect(COMPONENT).toContain("aria-label")
      expect(COMPONENT).toContain("'Paginación'")
    })
  })

  describe('Slots', () => {
    it('has named cell slots for each column', () => {
      expect(COMPONENT).toContain(':name="`cell-${col.key}`"')
    })

    it('passes row and value to cell slot', () => {
      expect(COMPONENT).toContain(':row="row"')
      expect(COMPONENT).toContain(':value="row[col.key]"')
    })

    it('has empty state slot', () => {
      expect(COMPONENT).toContain('name="empty"')
    })
  })

  describe('Empty state', () => {
    it('shows empty state when no data', () => {
      expect(COMPONENT).toContain('data-table-empty')
    })

    it('uses emptyText prop or i18n fallback', () => {
      expect(COMPONENT).toContain("emptyText || t('common.noResults'")
    })
  })

  describe('Loading state', () => {
    it('shows loading indicator with role="status"', () => {
      expect(COMPONENT).toContain('v-if="loading"')
      expect(COMPONENT).toContain('role="status"')
    })

    it('has loading spinner', () => {
      expect(COMPONENT).toContain('data-table-loading__spinner')
      expect(COMPONENT).toContain('aria-hidden="true"')
    })
  })

  describe('Events', () => {
    it('emits row-click', () => {
      expect(COMPONENT).toContain("'row-click': [row: T]")
      expect(COMPONENT).toContain("$emit('row-click', row)")
    })
  })

  describe('CSS & Mobile', () => {
    it('has horizontal scroll for overflow', () => {
      expect(COMPONENT).toContain('overflow-x: auto')
    })

    it('has mobile media query', () => {
      expect(COMPONENT).toContain('@media (max-width: 767px)')
    })

    it('hover styles only on hover-capable devices', () => {
      const hoverQueries = COMPONENT.match(/@media \(hover: hover\)/g)
      expect(hoverQueries).not.toBeNull()
      expect(hoverQueries!.length).toBeGreaterThanOrEqual(2)
    })
  })
})
