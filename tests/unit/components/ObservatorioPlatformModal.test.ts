/**
 * Tests for app/components/dashboard/observatorio/ObservatorioPlatformModal.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ObservatorioPlatformModal from '../../../app/components/dashboard/observatorio/ObservatorioPlatformModal.vue'

const platforms = [
  { id: 'p1', name: 'Wallapop', is_default: true },
  { id: 'p2', name: 'MilAnuncios', is_default: false },
  { id: 'p3', name: 'AutoScout24', is_default: false },
]

describe('ObservatorioPlatformModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ObservatorioPlatformModal, {
      props: {
        visible: true,
        platforms,
        activePlatformIds: new Set(['p1', 'p2']),
        ...overrides,
      },
      global: {
        stubs: { Teleport: true },
        mocks: { $t: (k: string) => k },
      },
    })

  it('hides when not visible', () => {
    expect(factory({ visible: false }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows when visible', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h2').text()).toBeTruthy()
  })

  it('shows description', () => {
    expect(factory().find('.platform-desc').exists()).toBe(true)
  })

  it('renders 3 platform items', () => {
    expect(factory().findAll('.platform-item')).toHaveLength(3)
  })

  it('shows platform names', () => {
    const names = factory().findAll('.platform-name')
    expect(names[0].text()).toBe('Wallapop')
    expect(names[1].text()).toBe('MilAnuncios')
  })

  it('shows default badge on default platform', () => {
    expect(factory().findAll('.platform-default')).toHaveLength(1)
  })

  it('checks active platforms', () => {
    const checkboxes = factory().findAll('input[type="checkbox"]')
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
    expect((checkboxes[1].element as HTMLInputElement).checked).toBe(true)
    expect((checkboxes[2].element as HTMLInputElement).checked).toBe(false)
  })

  it('emits toggle on checkbox change', async () => {
    const w = factory()
    await w.findAll('input[type="checkbox"]')[2].trigger('change')
    expect(w.emitted('toggle')?.[0]?.[0]).toBe('p3')
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on close button', async () => {
    const w = factory()
    await w.find('.btn-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on done button', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
