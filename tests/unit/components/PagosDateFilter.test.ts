/**
 * Tests for app/components/admin/pagos/PagosDateFilter.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PagosDateFilter from '../../../app/components/admin/pagos/PagosDateFilter.vue'

describe('PagosDateFilter', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PagosDateFilter, {
      props: {
        dateRange: 'this_month' as const,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders date range row', () => {
    expect(factory().find('.date-range-row').exists()).toBe(true)
  })

  it('renders 4 date buttons', () => {
    expect(factory().findAll('.date-btn')).toHaveLength(4)
  })

  it('marks active date', () => {
    expect(factory().findAll('.date-btn')[0].classes()).toContain('active')
  })

  it('emits change on click', async () => {
    const w = factory()
    await w.findAll('.date-btn')[1].trigger('click')
    expect(w.emitted('change')?.[0]).toEqual(['last_month'])
  })

  it('applies active to correct button', () => {
    const w = factory({ dateRange: 'all_time' })
    expect(w.findAll('.date-btn')[3].classes()).toContain('active')
  })
})
