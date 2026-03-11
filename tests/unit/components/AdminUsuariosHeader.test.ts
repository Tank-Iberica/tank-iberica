/**
 * Tests for app/components/admin/usuarios/AdminUsuariosHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminUsuariosHeader from '../../../app/components/admin/usuarios/AdminUsuariosHeader.vue'

describe('AdminUsuariosHeader', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminUsuariosHeader, {
      props: {
        total: 42,
        ...overrides,
      },
    })

  it('renders header', () => {
    expect(factory().find('.section-header').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h2').text()).toBe('Usuarios')
  })

  it('shows total badge', () => {
    expect(factory().find('.total-badge').text()).toContain('42')
  })

  it('shows export button', () => {
    expect(factory().find('.btn-export').text()).toContain('Exportar')
  })

  it('emits export on button click', async () => {
    const w = factory()
    await w.find('.btn-export').trigger('click')
    expect(w.emitted('export')).toBeTruthy()
  })
})
