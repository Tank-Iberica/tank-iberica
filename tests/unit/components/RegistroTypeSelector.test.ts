/**
 * Tests for app/components/auth/RegistroTypeSelector.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import RegistroTypeSelector from '../../../app/components/auth/RegistroTypeSelector.vue'

describe('RegistroTypeSelector', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(RegistroTypeSelector, {
      props: { selectedType: 'buyer', ...overrides },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders type cards', () => {
    expect(factory().findAll('.type-card')).toHaveLength(2)
  })

  it('shows title', () => {
    expect(factory().find('.auth-title').text()).toBe('auth.register')
  })

  it('shows subtitle', () => {
    expect(factory().find('.auth-subtitle').text()).toBe('auth.registerSubtitle')
  })

  it('applies active class to buyer when selectedType=buyer', () => {
    const cards = factory().findAll('.type-card')
    expect(cards[0].classes()).toContain('active')
    expect(cards[1].classes()).not.toContain('active')
  })

  it('applies active class to dealer when selectedType=dealer', () => {
    const cards = factory({ selectedType: 'dealer' }).findAll('.type-card')
    expect(cards[0].classes()).not.toContain('active')
    expect(cards[1].classes()).toContain('active')
  })

  it('emits select buyer on buyer click', async () => {
    const w = factory()
    await w.findAll('.type-card')[0].trigger('click')
    expect(w.emitted('select')?.[0]).toEqual(['buyer'])
  })

  it('emits select dealer on dealer click', async () => {
    const w = factory()
    await w.findAll('.type-card')[1].trigger('click')
    expect(w.emitted('select')?.[0]).toEqual(['dealer'])
  })

  it('shows buyer label', () => {
    expect(factory().findAll('.type-label')[0].text()).toBe('auth.typeBuyer')
  })

  it('shows dealer label', () => {
    expect(factory().findAll('.type-label')[1].text()).toBe('auth.typeDealer')
  })

  it('shows buyer description', () => {
    expect(factory().findAll('.type-desc')[0].text()).toBe('auth.typeBuyerDesc')
  })

  it('shows dealer description', () => {
    expect(factory().findAll('.type-desc')[1].text()).toBe('auth.typeDealerDesc')
  })

  it('renders SVG icons', () => {
    expect(factory().findAll('.type-icon svg')).toHaveLength(2)
  })
})
