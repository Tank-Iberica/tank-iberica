/**
 * Tests for app/components/precios/PreciosFaq.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import PreciosFaq from '../../../app/components/precios/PreciosFaq.vue'

const baseFaqs = [
  { question: '¿Es gratis publicar?', answer: 'Sí, publicar es 100% gratis.' },
  { question: '¿Puedo cancelar?', answer: 'Sí, sin permanencia.' },
  { question: '¿Qué incluye Pro?', answer: 'Acceso anticipado 24h.' },
]

describe('PreciosFaq', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PreciosFaq, {
      props: { faqs: [...baseFaqs], openIndex: null, ...overrides },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders faq section', () => {
    expect(factory().find('.faq-section').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.faq-title').text()).toBe('pricing.faqTitle')
  })

  it('renders all faq items', () => {
    expect(factory().findAll('.faq-item')).toHaveLength(3)
  })

  it('shows question text', () => {
    const questions = factory().findAll('.faq-question span')
    expect(questions[0].text()).toBe('¿Es gratis publicar?')
  })

  it('shows + icon when closed', () => {
    const icons = factory().findAll('.faq-icon')
    expect(icons[0].text()).toBe('+')
  })

  it('shows − icon when open', () => {
    const w = factory({ openIndex: 0 })
    expect(w.findAll('.faq-icon')[0].text()).toBe('−')
  })

  it('applies open class to open item', () => {
    const w = factory({ openIndex: 1 })
    expect(w.findAll('.faq-item')[1].classes()).toContain('faq-item--open')
  })

  it('shows answer when open', () => {
    const w = factory({ openIndex: 0 })
    expect(w.find('.faq-answer p').text()).toBe('Sí, publicar es 100% gratis.')
  })

  it('hides answer when closed', () => {
    expect(factory().find('.faq-answer').exists()).toBe(false)
  })

  it('emits toggle on question click', async () => {
    const w = factory()
    await w.findAll('.faq-question')[1].trigger('click')
    expect(w.emitted('toggle')?.[0]).toEqual([1])
  })
})
