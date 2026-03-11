/**
 * Tests for app/components/admin/noticias/AdminNewsFaqSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminNewsFaqSection from '../../../app/components/admin/noticias/AdminNewsFaqSection.vue'

describe('AdminNewsFaqSection', () => {
  const faqSchema = [
    { question: 'What is this?', answer: 'A test' },
    { question: 'How does it work?', answer: 'Like this' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminNewsFaqSection, {
      props: {
        faqSchema,
        open: true,
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows toggle button text', () => {
    expect(factory().find('.section-toggle').text()).toContain('FAQ Schema')
  })

  it('shows minus icon when open', () => {
    expect(factory().find('.toggle-icon').text()).toBe('−')
  })

  it('shows plus icon when closed', () => {
    expect(factory({ open: false }).find('.toggle-icon').text()).toBe('+')
  })

  it('shows body when open', () => {
    expect(factory().find('.section-body').exists()).toBe(true)
  })

  it('hides body when closed', () => {
    expect(factory({ open: false }).find('.section-body').exists()).toBe(false)
  })

  it('renders FAQ items', () => {
    expect(factory().findAll('.faq-item')).toHaveLength(2)
  })

  it('shows FAQ item numbers', () => {
    const numbers = factory().findAll('.faq-item-number')
    expect(numbers[0].text()).toBe('1')
    expect(numbers[1].text()).toBe('2')
  })

  it('shows hint text', () => {
    expect(factory().find('.section-hint').text()).toContain('featured snippets')
  })

  it('shows add button', () => {
    expect(factory().find('.btn').text()).toContain('Anadir pregunta')
  })

  it('shows question input values', () => {
    const inputs = factory().findAll('.faq-item input')
    expect((inputs[0].element as HTMLInputElement).value).toBe('What is this?')
    expect((inputs[1].element as HTMLInputElement).value).toBe('How does it work?')
  })

  it('emits update:open on toggle click', async () => {
    const w = factory()
    await w.find('.section-toggle').trigger('click')
    expect(w.emitted('update:open')![0]).toEqual([false])
  })

  it('emits add on add button click', async () => {
    const w = factory()
    await w.find('.btn').trigger('click')
    expect(w.emitted('add')).toBeTruthy()
  })

  it('emits remove on remove button click', async () => {
    const w = factory()
    await w.findAll('.faq-remove')[0].trigger('click')
    expect(w.emitted('remove')![0]).toEqual([0])
  })

  it('emits update:faqSchema on question input', async () => {
    const w = factory()
    const input = w.findAll('.faq-item input')[0]
    Object.defineProperty(input.element, 'value', { value: 'New Q', writable: true })
    await input.trigger('input')
    const emitted = w.emitted('update:faqSchema')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as Array<{ question: string }>)[0].question).toBe('New Q')
  })

  it('emits update:faqSchema on answer input', async () => {
    const w = factory()
    const ta = w.findAll('.faq-item textarea')[0]
    Object.defineProperty(ta.element, 'value', { value: 'New A', writable: true })
    await ta.trigger('input')
    const emitted = w.emitted('update:faqSchema')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as Array<{ answer: string }>)[0].answer).toBe('New A')
  })

  it('handles null faqSchema', () => {
    const w = factory({ faqSchema: null })
    expect(w.findAll('.faq-item')).toHaveLength(0)
  })
})
