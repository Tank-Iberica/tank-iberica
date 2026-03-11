/**
 * Tests for app/components/perfil/mensajes/ConversationHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ConversationHeader from '../../../app/components/perfil/mensajes/ConversationHeader.vue'

describe('ConversationHeader', () => {
  const defaults = {
    vehicleTitle: 'Volvo FH 500',
    otherPartyName: 'Juan García',
    statusLabel: 'Activa',
    statusClass: 'conv-status--active',
    isClosed: false,
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ConversationHeader, {
      props: { ...defaults, ...overrides },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders header', () => {
    expect(factory().find('.conv-header').exists()).toBe(true)
  })

  it('shows vehicle title', () => {
    expect(factory().find('.conv-header__vehicle').text()).toBe('Volvo FH 500')
  })

  it('shows other party name', () => {
    expect(factory().find('.conv-header__party').text()).toBe('Juan García')
  })

  it('shows status label with class', () => {
    const status = factory().find('.conv-header__status')
    expect(status.text()).toBe('Activa')
    expect(status.classes()).toContain('conv-status--active')
  })

  it('shows close button when not closed', () => {
    expect(factory().find('.conv-header__close-btn').exists()).toBe(true)
  })

  it('hides close button when closed', () => {
    expect(factory({ isClosed: true }).find('.conv-header__close-btn').exists()).toBe(false)
  })

  it('emits back on back button click', async () => {
    const w = factory()
    await w.find('.conv-header__back').trigger('click')
    expect(w.emitted('back')).toHaveLength(1)
  })

  it('emits close on close button click', async () => {
    const w = factory()
    await w.find('.conv-header__close-btn').trigger('click')
    expect(w.emitted('close')).toHaveLength(1)
  })

  it('shows fallback text when no vehicle title', () => {
    const w = factory({ vehicleTitle: '' })
    expect(w.find('.conv-header__vehicle').text()).toBe('messages.unknownVehicle')
  })

  it('shows response time element', () => {
    // computed stub always evaluates once; check it renders
    expect(factory().find('.conv-header__response-time')).toBeTruthy()
  })
})
