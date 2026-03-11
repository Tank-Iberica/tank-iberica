/**
 * Tests for app/components/admin/facturacion/FacturacionHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import FacturacionHeader from '../../../app/components/admin/facturacion/FacturacionHeader.vue'

describe('FacturacionHeader', () => {
  const factory = () =>
    shallowMount(FacturacionHeader)

  it('renders header', () => {
    expect(factory().find('.page-header').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h1').exists()).toBe(true)
  })

  it('shows export button', () => {
    expect(factory().find('.btn-export').exists()).toBe(true)
  })

  it('emits export on button click', async () => {
    const w = factory()
    await w.find('.btn-export').trigger('click')
    expect(w.emitted('export')).toBeTruthy()
  })
})
