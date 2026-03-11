/**
 * Tests for app/components/precios/PreciosBillingToggle.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PreciosBillingToggle from '../../../app/components/precios/PreciosBillingToggle.vue'

describe('PreciosBillingToggle', () => {
  const factory = (interval: string = 'month') =>
    shallowMount(PreciosBillingToggle, {
      props: { interval },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders billing toggle', () => {
    expect(factory().find('.billing-toggle').exists()).toBe(true)
  })

  it('renders two toggle buttons', () => {
    expect(factory().findAll('.toggle-btn')).toHaveLength(2)
  })

  it('marks monthly active when interval=month', () => {
    const btns = factory('month').findAll('.toggle-btn')
    expect(btns[0].classes()).toContain('toggle-btn--active')
    expect(btns[1].classes()).not.toContain('toggle-btn--active')
  })

  it('marks annual active when interval=year', () => {
    const btns = factory('year').findAll('.toggle-btn')
    expect(btns[0].classes()).not.toContain('toggle-btn--active')
    expect(btns[1].classes()).toContain('toggle-btn--active')
  })

  it('emits update month on monthly click', async () => {
    const w = factory('year')
    await w.findAll('.toggle-btn')[0].trigger('click')
    expect(w.emitted('update')?.[0]).toEqual(['month'])
  })

  it('emits update year on annual click', async () => {
    const w = factory('month')
    await w.findAll('.toggle-btn')[1].trigger('click')
    expect(w.emitted('update')?.[0]).toEqual(['year'])
  })

  it('shows save badge on annual button', () => {
    expect(factory().find('.save-badge').text()).toBe('pricing.savePercent')
  })
})
