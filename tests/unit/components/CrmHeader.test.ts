/**
 * Tests for app/components/dashboard/crm/CrmHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import CrmHeader from '../../../app/components/dashboard/crm/CrmHeader.vue'

describe('CrmHeader', () => {
  const factory = (total = 42) =>
    shallowMount(CrmHeader, {
      props: { total },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders header', () => {
    expect(factory().find('.page-header').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h1').text()).toBe('dashboard.crm.title')
  })

  it('shows count badge', () => {
    expect(factory().find('.count-badge').text()).toBe('42')
  })

  it('has create button', () => {
    expect(factory().find('.btn-primary').text()).toBe('dashboard.crm.newContact')
  })

  it('emits create on click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('create')).toBeTruthy()
  })
})
