/**
 * Tests for app/components/admin/verificaciones/VerificacionLevelGrid.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import VerificacionLevelGrid from '../../../app/components/admin/verificaciones/VerificacionLevelGrid.vue'

describe('VerificacionLevelGrid', () => {
  const getVerificationLevelInfo = (level: string | null) => ({
    cssClass: `level-${level ?? 'none'}`,
    progress: level === 'verified' ? 40 : 0,
    icon: '✓',
    label: level ?? 'Ninguno',
  })

  const vehicleVerificationMap = new Map([
    ['v-1', {
      vehicle: { brand: 'Volvo', model: 'FH 500' },
      verificationLevel: 'verified',
      docs: [
        { id: 'd-1', status: 'verified' },
        { id: 'd-2', status: 'pending' },
      ],
    }],
    ['v-2', {
      vehicle: { brand: 'Scania', model: 'R 450' },
      verificationLevel: null,
      docs: [{ id: 'd-3', status: 'rejected' }],
    }],
  ])

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(VerificacionLevelGrid, {
      props: {
        vehicleVerificationMap,
        getVerificationLevelInfo,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders vehicle levels grid', () => {
    expect(factory().find('.vehicle-levels').exists()).toBe(true)
  })

  it('renders correct number of cards', () => {
    expect(factory().findAll('.vehicle-level-card')).toHaveLength(2)
  })

  it('shows vehicle name', () => {
    expect(factory().findAll('.vlc-name')[0].text()).toBe('Volvo FH 500')
  })

  it('shows docs approved count', () => {
    expect(factory().findAll('.vlc-docs')[0].text()).toContain('1/2')
  })

  it('shows level label', () => {
    expect(factory().findAll('.vlc-level')[0].text()).toContain('verified')
  })

  it('applies level css class to bar', () => {
    expect(factory().findAll('.progress-bar-fill')[0].classes()).toContain('level-verified')
  })

  it('sets bar width from progress', () => {
    expect(factory().findAll('.progress-bar-fill')[0].attributes('style')).toContain('width: 40%')
  })

  it('shows 0 docs for second vehicle', () => {
    expect(factory().findAll('.vlc-docs')[1].text()).toContain('0/1')
  })
})
