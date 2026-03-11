/**
 * Tests for app/components/dashboard/vehiculos/VehiculoFormActions.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import VehiculoFormActions from '../../../app/components/dashboard/vehiculos/VehiculoFormActions.vue'

const NuxtLinkStub = { template: '<a :href="to"><slot /></a>', props: ['to'] }

describe('VehiculoFormActions', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(VehiculoFormActions, {
      props: {
        saving: false,
        ...overrides,
      },
      global: {
        stubs: { NuxtLink: NuxtLinkStub },
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders form actions', () => {
    expect(factory().find('.form-actions').exists()).toBe(true)
  })

  it('shows cancel link to vehiculos list', () => {
    const cancel = factory().find('.btn-secondary')
    expect(cancel.attributes('href')).toBe('/dashboard/vehiculos')
    expect(cancel.text()).toBe('common.cancel')
  })

  it('shows save button', () => {
    expect(factory().find('.btn-primary').text()).toBe('common.save')
  })

  it('disables save button when saving', () => {
    const btn = factory({ saving: true }).find('.btn-primary')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('shows loading text when saving', () => {
    expect(factory({ saving: true }).find('.btn-primary').text()).toBe('common.loading')
  })

  it('save button is type submit', () => {
    expect(factory().find('.btn-primary').attributes('type')).toBe('submit')
  })
})
