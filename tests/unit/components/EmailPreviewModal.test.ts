/**
 * Tests for app/components/admin/config/emails/EmailPreviewModal.vue
 */
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'

beforeAll(() => {
  vi.stubGlobal('useSanitize', () => ({
    sanitize: (html: string) => html,
  }))
})

import EmailPreviewModal from '../../../app/components/admin/config/emails/EmailPreviewModal.vue'

describe('EmailPreviewModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(EmailPreviewModal, {
      props: {
        show: true,
        previewHtml: '<p>Preview</p>',
        sendingTest: false,
        testSent: false,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
        stubs: { Teleport: true },
      },
    })

  it('renders modal when show is true', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('hides modal when show is false', () => {
    expect(factory({ show: false }).find('.modal-overlay').exists()).toBe(false)
  })

  it('shows title', () => {
    expect(factory().find('.modal-header h3').text()).toBe('admin.emails.previewTitle')
  })

  it('renders preview html', () => {
    expect(factory().find('.preview-container').html()).toContain('<p>Preview</p>')
  })

  it('shows send test button', () => {
    expect(factory().find('.btn-primary').text()).toBe('admin.emails.sendTest')
  })

  it('shows sending text when sendingTest', () => {
    expect(factory({ sendingTest: true }).find('.btn-primary').text()).toBe('admin.emails.sending')
  })

  it('disables send button when sendingTest', () => {
    expect(factory({ sendingTest: true }).find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('emits close on close button', async () => {
    const w = factory()
    await w.find('.modal-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on secondary button', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits send-test on primary button', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('send-test')).toBeTruthy()
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})
