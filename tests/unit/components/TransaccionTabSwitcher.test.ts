/**
 * Tests for app/components/dashboard/transaccion/TransaccionTabSwitcher.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import TransaccionTabSwitcher from '../../../app/components/dashboard/transaccion/TransaccionTabSwitcher.vue'

describe('TransaccionTabSwitcher', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(TransaccionTabSwitcher, {
      props: {
        activeTab: 'rent',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders tab switcher', () => {
    expect(factory().find('.tab-switcher').exists()).toBe(true)
  })

  it('renders 2 buttons', () => {
    expect(factory().findAll('.tab-btn')).toHaveLength(2)
  })

  it('marks rent as active by default', () => {
    const btns = factory().findAll('.tab-btn')
    expect(btns[0].classes()).toContain('active')
    expect(btns[1].classes()).not.toContain('active')
  })

  it('marks sell as active when selected', () => {
    const btns = factory({ activeTab: 'sell' }).findAll('.tab-btn')
    expect(btns[0].classes()).not.toContain('active')
    expect(btns[1].classes()).toContain('active')
  })

  it('emits select rent on first button click', async () => {
    const w = factory({ activeTab: 'sell' })
    await w.findAll('.tab-btn')[0].trigger('click')
    expect(w.emitted('select')![0]).toEqual(['rent'])
  })

  it('emits select sell on second button click', async () => {
    const w = factory()
    await w.findAll('.tab-btn')[1].trigger('click')
    expect(w.emitted('select')![0]).toEqual(['sell'])
  })
})
