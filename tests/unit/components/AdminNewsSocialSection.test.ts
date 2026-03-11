/**
 * Tests for app/components/admin/noticias/AdminNewsSocialSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminNewsSocialSection from '../../../app/components/admin/noticias/AdminNewsSocialSection.vue'

describe('AdminNewsSocialSection', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminNewsSocialSection, {
      props: {
        socialPostText: { twitter: 'Tweet text', linkedin: '', facebook: '' },
        open: true,
        ...overrides,
      },
    })

  it('renders section', () => {
    expect(factory().find('.section').exists()).toBe(true)
  })

  it('shows toggle button text', () => {
    expect(factory().find('.section-toggle').text()).toContain('Redes Sociales')
  })

  it('shows minus icon when open', () => {
    expect(factory().find('.toggle-icon').text()).toBe('−')
  })

  it('shows plus icon when closed', () => {
    const w = factory({ open: false })
    expect(w.find('.toggle-icon').text()).toBe('+')
  })

  it('shows 3 textareas when open', () => {
    const textareas = factory().findAll('textarea')
    expect(textareas).toHaveLength(3)
  })

  it('hides body when closed', () => {
    expect(factory({ open: false }).find('.section-body').exists()).toBe(false)
  })

  it('shows twitter value', () => {
    const ta = factory().findAll('textarea')[0]
    expect((ta.element as HTMLTextAreaElement).value).toBe('Tweet text')
  })

  it('shows platform labels', () => {
    const text = factory().text()
    expect(text).toContain('Twitter')
    expect(text).toContain('LinkedIn')
    expect(text).toContain('Facebook')
  })

  it('shows char counts', () => {
    const counts = factory().findAll('.char-count')
    expect(counts).toHaveLength(3)
    expect(counts[0].text()).toContain('/280')
    expect(counts[1].text()).toContain('/700')
    expect(counts[2].text()).toContain('/500')
  })

  it('emits update:open on toggle click', async () => {
    const w = factory()
    await w.find('.section-toggle').trigger('click')
    expect(w.emitted('update:open')![0]).toEqual([false])
  })

  it('emits update:socialPostText on textarea input', async () => {
    const w = factory()
    const ta = w.findAll('textarea')[0]
    Object.defineProperty(ta.element, 'value', { value: 'New tweet', writable: true })
    await ta.trigger('input')
    const emitted = w.emitted('update:socialPostText')
    expect(emitted).toBeTruthy()
    expect((emitted![0][0] as Record<string, string>).twitter).toBe('New tweet')
  })

  it('handles null socialPostText', () => {
    const w = factory({ socialPostText: null })
    const ta = w.findAll('textarea')[0]
    expect((ta.element as HTMLTextAreaElement).value).toBe('')
  })
})
