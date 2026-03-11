/**
 * Tests for app/components/admin/config/emails/EmailTemplateEditor.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import EmailTemplateEditor from '../../../app/components/admin/config/emails/EmailTemplateEditor.vue'

const definition = {
  key: 'welcome',
  variables: ['{{name}}', '{{url}}'],
  category: 'onboarding',
}

const template = {
  active: true,
  subject: { es: 'Bienvenido', en: 'Welcome' },
  body: { es: 'Hola {{name}}', en: 'Hello {{name}}' },
}

const stats = { sent: 150, opened: 80, clicked: 30 }

describe('EmailTemplateEditor', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(EmailTemplateEditor, {
      props: {
        selectedDefinition: definition,
        selectedTemplateKey: 'welcome',
        currentTemplate: { ...template },
        activeLang: 'es' as const,
        currentStats: stats,
        openRate: '53.3',
        clickRate: '20.0',
        sendingTest: false,
        testSent: false,
        actionLoading: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders editor panel', () => {
    expect(factory().find('.editor-panel').exists()).toBe(true)
  })

  it('shows template key', () => {
    expect(factory().find('.editor-header__key').text()).toBe('welcome')
  })

  it('shows ON toggle when active', () => {
    expect(factory().find('.toggle-icon').text()).toBe('ON')
  })

  it('shows OFF toggle when inactive', () => {
    const w = factory({ currentTemplate: { ...template, active: false } })
    expect(w.find('.toggle-icon').text()).toBe('OFF')
  })

  it('renders 3 stat cards', () => {
    expect(factory().findAll('.stat-card')).toHaveLength(3)
  })

  it('shows sent count', () => {
    expect(factory().findAll('.stat-card__value')[0].text()).toBe('150')
  })

  it('shows open rate', () => {
    expect(factory().findAll('.stat-card__value')[1].text()).toContain('53.3%')
  })

  it('shows click rate', () => {
    expect(factory().findAll('.stat-card__value')[2].text()).toContain('20.0%')
  })

  it('shows variable tags', () => {
    expect(factory().findAll('.variable-tag')).toHaveLength(2)
  })

  it('renders locale switcher with 2 buttons', () => {
    expect(factory().findAll('.locale-btn')).toHaveLength(2)
  })

  it('shows active locale', () => {
    expect(factory().findAll('.locale-btn')[0].classes()).toContain('locale-btn--active')
  })

  it('renders subject input with ES value', () => {
    const input = factory().find('input[type="text"]')
    expect((input.element as HTMLInputElement).value).toBe('Bienvenido')
  })

  it('renders body textarea with ES value', () => {
    const textarea = factory().find('textarea')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Hola {{name}}')
  })

  it('emits toggle-active on toggle click', async () => {
    const w = factory()
    await w.find('.btn-icon').trigger('click')
    expect(w.emitted('toggle-active')).toBeTruthy()
  })

  it('emits update:activeLang on locale click', async () => {
    const w = factory()
    await w.findAll('.locale-btn')[1].trigger('click')
    expect(w.emitted('update:activeLang')?.[0]?.[0]).toBe('en')
  })

  it('emits insert-variable on variable tag click', async () => {
    const w = factory()
    await w.find('.variable-tag').trigger('click')
    expect(w.emitted('insert-variable')?.[0]?.[0]).toBe('{{name}}')
  })

  it('emits reset-default on reset button', async () => {
    const w = factory()
    const btns = w.findAll('.btn-secondary')
    await btns[0].trigger('click')
    expect(w.emitted('reset-default')).toBeTruthy()
  })

  it('emits show-preview on preview button', async () => {
    const w = factory()
    const btns = w.findAll('.btn-secondary')
    await btns[1].trigger('click')
    expect(w.emitted('show-preview')).toBeTruthy()
  })

  it('emits send-test on test button', async () => {
    const w = factory()
    const btns = w.findAll('.btn-secondary')
    await btns[2].trigger('click')
    expect(w.emitted('send-test')).toBeTruthy()
  })

  it('disables test button when sending', () => {
    const w = factory({ sendingTest: true })
    const btns = w.findAll('.btn-secondary')
    expect(btns[2].attributes('disabled')).toBeDefined()
  })

  it('shows sending text', () => {
    const w = factory({ sendingTest: true })
    const btns = w.findAll('.btn-secondary')
    expect(btns[2].text()).toContain('admin.emails.sending')
  })

  it('emits update:subject on subject input', async () => {
    const w = factory()
    await w.find('input[type="text"]').trigger('input')
    expect(w.emitted('update:subject')).toBeTruthy()
  })

  it('emits update:body on body input', async () => {
    const w = factory()
    await w.find('textarea').trigger('input')
    expect(w.emitted('update:body')).toBeTruthy()
  })

  it('emits update:activeLang with es on first locale click', async () => {
    const w = factory()
    await w.findAll('.locale-btn')[0].trigger('click')
    expect(w.emitted('update:activeLang')?.[0]?.[0]).toBe('es')
  })
})
