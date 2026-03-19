import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, computed, watch } from 'vue'

// Override setup.ts stubs with real Vue APIs for SFC component testing
vi.stubGlobal('ref', ref)
vi.stubGlobal('computed', computed)
vi.stubGlobal('watch', watch)

vi.stubGlobal('useI18n', () => ({
  t: (key: string, fallback?: string) => fallback ?? key,
}))

import UiDataTable from '../../../app/components/ui/DataTable.vue'

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'age', label: 'Age', sortable: true },
  { key: 'city', label: 'City' },
]

const data = [
  { id: 1, name: 'Alice', age: 30, city: 'Madrid' },
  { id: 2, name: 'Bob', age: 25, city: 'Barcelona' },
  { id: 3, name: 'Charlie', age: 35, city: 'Valencia' },
  { id: 4, name: 'Diana', age: 28, city: 'Sevilla' },
  { id: 5, name: 'Eve', age: 32, city: 'Bilbao' },
]

function factory(overrides: Record<string, unknown> = {}) {
  return mount(UiDataTable, {
    props: { data, columns, ...overrides },
  })
}

describe('UiDataTable', () => {
  describe('Rendering', () => {
    it('renders table with data rows', () => {
      const wrapper = factory()
      expect(wrapper.findAll('.data-table__row')).toHaveLength(5)
    })

    it('renders column headers', () => {
      const wrapper = factory()
      const headers = wrapper.findAll('.data-table__th')
      expect(headers).toHaveLength(3)
      expect(headers[0].text()).toContain('Name')
      expect(headers[1].text()).toContain('Age')
      expect(headers[2].text()).toContain('City')
    })

    it('renders cell content from data', () => {
      const wrapper = factory()
      const cells = wrapper.findAll('.data-table__td')
      expect(cells[0].text()).toBe('Alice')
      expect(cells[1].text()).toBe('30')
      expect(cells[2].text()).toBe('Madrid')
    })

    it('has role="grid" on table', () => {
      const wrapper = factory()
      expect(wrapper.find('table').attributes('role')).toBe('grid')
    })
  })

  describe('Empty state', () => {
    it('shows empty state when data is empty', () => {
      const wrapper = factory({ data: [] })
      expect(wrapper.find('.data-table-empty').exists()).toBe(true)
    })

    it('uses emptyText prop', () => {
      const wrapper = factory({ data: [], emptyText: 'Nothing here' })
      expect(wrapper.find('.data-table-empty').text()).toContain('Nothing here')
    })

    it('falls back to i18n key', () => {
      const wrapper = factory({ data: [] })
      expect(wrapper.find('.data-table-empty').text()).toContain('No hay resultados')
    })

    it('hides table when empty', () => {
      const wrapper = factory({ data: [] })
      expect(wrapper.find('.data-table').exists()).toBe(false)
    })
  })

  describe('Loading state', () => {
    it('shows loading indicator when loading', () => {
      const wrapper = factory({ loading: true })
      const loading = wrapper.find('.data-table-loading')
      expect(loading.exists()).toBe(true)
      expect(loading.attributes('role')).toBe('status')
    })

    it('shows spinner with aria-hidden', () => {
      const wrapper = factory({ loading: true })
      const spinner = wrapper.find('.data-table-loading__spinner')
      expect(spinner.exists()).toBe(true)
      expect(spinner.attributes('aria-hidden')).toBe('true')
    })

    it('uses loadingText prop', () => {
      const wrapper = factory({ loading: true, loadingText: 'Please wait...' })
      expect(wrapper.find('.data-table-loading').text()).toContain('Please wait...')
    })

    it('hides table when loading', () => {
      const wrapper = factory({ loading: true })
      expect(wrapper.find('.data-table').exists()).toBe(false)
    })
  })

  describe('Sorting', () => {
    it('sortable header has sortable class', () => {
      const wrapper = factory()
      const headers = wrapper.findAll('.data-table__th')
      expect(headers[0].classes()).toContain('data-table__th--sortable')
      expect(headers[2].classes()).not.toContain('data-table__th--sortable')
    })

    it('clicking sortable header sorts ascending', async () => {
      const wrapper = factory()
      await wrapper.findAll('.data-table__th')[1].trigger('click') // Sort by Age
      await flushPromises()
      const firstRow = wrapper.findAll('.data-table__row')[0]
      expect(firstRow.findAll('.data-table__td')[1].text()).toBe('25') // Bob (youngest)
    })

    it('clicking same header again sorts descending', async () => {
      const wrapper = factory()
      const ageHeader = wrapper.findAll('.data-table__th')[1]
      await ageHeader.trigger('click') // asc
      await ageHeader.trigger('click') // desc
      await flushPromises()
      const firstRow = wrapper.findAll('.data-table__row')[0]
      expect(firstRow.findAll('.data-table__td')[1].text()).toBe('35') // Charlie (oldest)
    })

    it('shows aria-sort on sorted column', async () => {
      const wrapper = factory()
      await wrapper.findAll('.data-table__th')[0].trigger('click')
      await flushPromises()
      expect(wrapper.findAll('.data-table__th')[0].attributes('aria-sort')).toBe('ascending')
    })

    it('shows ascending icon ▲', async () => {
      const wrapper = factory()
      await wrapper.findAll('.data-table__th')[0].trigger('click')
      await flushPromises()
      expect(wrapper.find('.data-table__sort-icon').text()).toBe('▲')
    })

    it('shows descending icon ▼ after double click', async () => {
      const wrapper = factory()
      const header = wrapper.findAll('.data-table__th')[0]
      await header.trigger('click')
      await header.trigger('click')
      await flushPromises()
      expect(wrapper.find('.data-table__sort-icon').text()).toBe('▼')
    })

    it('switching to a different column resets to ascending', async () => {
      const wrapper = factory()
      await wrapper.findAll('.data-table__th')[0].trigger('click') // Name asc
      await wrapper.findAll('.data-table__th')[0].trigger('click') // Name desc
      await wrapper.findAll('.data-table__th')[1].trigger('click') // Age asc
      await flushPromises()
      expect(wrapper.findAll('.data-table__th')[1].attributes('aria-sort')).toBe('ascending')
    })

    it('non-sortable column click does nothing', async () => {
      const wrapper = factory()
      await wrapper.findAll('.data-table__th')[2].trigger('click') // City (not sortable)
      await flushPromises()
      expect(wrapper.find('.data-table__sort-icon').exists()).toBe(false)
    })

    it('handles null values in sort', async () => {
      const dataWithNull = [
        { id: 1, name: 'Alice', age: 30, city: 'Madrid' },
        { id: 2, name: null, age: 25, city: 'Barcelona' },
      ]
      const wrapper = factory({ data: dataWithNull })
      await wrapper.findAll('.data-table__th')[0].trigger('click')
      await flushPromises()
      // null sorts to end
      const rows = wrapper.findAll('.data-table__row')
      expect(rows[0].findAll('.data-table__td')[0].text()).toBe('Alice')
    })
  })

  describe('Filtering', () => {
    it('does not show filter input by default', () => {
      const wrapper = factory()
      expect(wrapper.find('.data-table-filter').exists()).toBe(false)
    })

    it('shows filter input when filterable', () => {
      const wrapper = factory({ filterable: true })
      expect(wrapper.find('.data-table-filter__input').exists()).toBe(true)
    })

    it('filter input has type="search"', () => {
      const wrapper = factory({ filterable: true })
      expect(wrapper.find('.data-table-filter__input').attributes('type')).toBe('search')
    })

    it('filter input has aria-label', () => {
      const wrapper = factory({ filterable: true })
      expect(wrapper.find('.data-table-filter__input').attributes('aria-label')).toBeTruthy()
    })

    it('uses custom filterPlaceholder', () => {
      const wrapper = factory({ filterable: true, filterPlaceholder: 'Search users...' })
      expect(wrapper.find('.data-table-filter__input').attributes('placeholder')).toBe(
        'Search users...',
      )
    })

    it('filters data by text input', async () => {
      const wrapper = factory({ filterable: true })
      await wrapper.find('.data-table-filter__input').setValue('alice')
      await flushPromises()
      expect(wrapper.findAll('.data-table__row')).toHaveLength(1)
      expect(wrapper.find('.data-table__row .data-table__td').text()).toBe('Alice')
    })

    it('filters across all columns', async () => {
      const wrapper = factory({ filterable: true })
      await wrapper.find('.data-table-filter__input').setValue('madrid')
      await flushPromises()
      expect(wrapper.findAll('.data-table__row')).toHaveLength(1)
    })

    it('shows empty state when filter matches nothing', async () => {
      const wrapper = factory({ filterable: true })
      await wrapper.find('.data-table-filter__input').setValue('nonexistent')
      await flushPromises()
      expect(wrapper.find('.data-table-empty').exists()).toBe(true)
    })
  })

  describe('Pagination', () => {
    it('no pagination when pageSize is 0', () => {
      const wrapper = factory({ pageSize: 0 })
      expect(wrapper.find('.data-table-pagination').exists()).toBe(false)
    })

    it('no pagination when all rows fit on one page', () => {
      const wrapper = factory({ pageSize: 10 })
      expect(wrapper.find('.data-table-pagination').exists()).toBe(false)
    })

    it('shows pagination when rows exceed pageSize', () => {
      const wrapper = factory({ pageSize: 2 })
      expect(wrapper.find('.data-table-pagination').exists()).toBe(true)
    })

    it('shows correct page info', () => {
      const wrapper = factory({ pageSize: 2 })
      expect(wrapper.find('.data-table-pagination__info').text()).toContain('1 / 3')
    })

    it('first page shows only pageSize rows', () => {
      const wrapper = factory({ pageSize: 2 })
      expect(wrapper.findAll('.data-table__row')).toHaveLength(2)
    })

    it('prev button disabled on first page', () => {
      const wrapper = factory({ pageSize: 2 })
      const btns = wrapper.findAll('.data-table-pagination__btn')
      expect(btns[0].attributes('disabled')).toBeDefined()
    })

    it('next button navigates to page 2', async () => {
      const wrapper = factory({ pageSize: 2 })
      const btns = wrapper.findAll('.data-table-pagination__btn')
      await btns[1].trigger('click') // Next
      await flushPromises()
      expect(wrapper.find('.data-table-pagination__info').text()).toContain('2 / 3')
    })

    it('next button disabled on last page', async () => {
      const wrapper = factory({ pageSize: 2 })
      const btns = wrapper.findAll('.data-table-pagination__btn')
      await btns[1].trigger('click') // page 2
      await btns[1].trigger('click') // page 3
      await flushPromises()
      expect(btns[1].attributes('disabled')).toBeDefined()
    })

    it('pagination nav has aria-label', () => {
      const wrapper = factory({ pageSize: 2 })
      expect(wrapper.find('.data-table-pagination').attributes('aria-label')).toBeTruthy()
    })
  })

  describe('Events', () => {
    it('emits row-click when row is clicked', async () => {
      const wrapper = factory()
      await wrapper.find('.data-table__row').trigger('click')
      expect(wrapper.emitted('row-click')).toHaveLength(1)
      expect(wrapper.emitted('row-click')![0]).toEqual([data[0]])
    })
  })

  describe('Slots', () => {
    it('renders custom cell content via named slot', () => {
      const wrapper = mount(UiDataTable, {
        props: { data: data.slice(0, 1), columns },
        slots: {
          'cell-name': '<strong class="custom">CUSTOM</strong>',
        },
      })
      expect(wrapper.find('.custom').exists()).toBe(true)
      expect(wrapper.find('.custom').text()).toBe('CUSTOM')
    })
  })
})
