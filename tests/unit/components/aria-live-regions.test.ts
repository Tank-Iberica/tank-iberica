/**
 * Tests for ARIA live regions across dynamic content components.
 * Verifies aria-live attributes exist on error/success/loading elements.
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// ─── FacturaMessages ─────────────────────────────────────────────────────────

import FacturaMessages from '../../../app/components/dashboard/herramientas/factura/FacturaMessages.vue'

describe('FacturaMessages — aria-live', () => {
  it('error message has role="alert" and aria-live="assertive"', () => {
    const wrapper = mount(FacturaMessages, {
      props: { errorMessage: 'Something went wrong', successMessage: null },
    })
    const errorDiv = wrapper.find('.message--error')
    expect(errorDiv.attributes('role')).toBe('alert')
    expect(errorDiv.attributes('aria-live')).toBe('assertive')
  })

  it('success message has aria-live="polite"', () => {
    const wrapper = mount(FacturaMessages, {
      props: { errorMessage: null, successMessage: 'Saved!' },
    })
    const successDiv = wrapper.find('.message--success')
    expect(successDiv.attributes('aria-live')).toBe('polite')
  })

  it('both messages hidden when null', () => {
    const wrapper = mount(FacturaMessages, {
      props: { errorMessage: null, successMessage: null },
    })
    expect(wrapper.find('.message--error').exists()).toBe(false)
    expect(wrapper.find('.message--success').exists()).toBe(false)
  })
})

// ─── UiCharCounter (existing aria-live) ──────────────────────────────────────

import UiCharCounter from '../../../app/components/ui/UiCharCounter.vue'

describe('UiCharCounter — aria-live', () => {
  it('has aria-live="polite"', () => {
    const wrapper = mount(UiCharCounter, {
      props: { current: 50, max: 100 },
    })
    expect(wrapper.attributes('aria-live')).toBe('polite')
  })
})

// ─── SubscribeModal — error text aria-live ───────────────────────────────────

describe('SubscribeModal error text — aria-live', () => {
  it('error text template includes role="alert" and aria-live="assertive"', async () => {
    // Read the source file to verify the attribute is present
    const fs = await import('node:fs')
    const source = fs.readFileSync('app/components/modals/SubscribeModal.vue', 'utf-8')
    expect(source).toContain('aria-live="assertive"')
    expect(source).toContain('class="error-text"')
  })

  it('success message template includes aria-live="polite"', async () => {
    const fs = await import('node:fs')
    const source = fs.readFileSync('app/components/modals/SubscribeModal.vue', 'utf-8')
    expect(source).toContain('class="success-message" aria-live="polite"')
  })
})

// ─── ReportModal — success state aria-live ───────────────────────────────────

describe('ReportModal success state — aria-live', () => {
  it('success div includes aria-live="polite"', async () => {
    const fs = await import('node:fs')
    const source = fs.readFileSync('app/components/modals/ReportModal.vue', 'utf-8')
    expect(source).toContain('class="report-success" aria-live="polite"')
  })
})

// ─── ConversationPanel — messages area ───────────────────────────────────────

describe('ConversationPanel messages area — aria-live', () => {
  it('messages area includes aria-live="polite"', async () => {
    const fs = await import('node:fs')
    const source = fs.readFileSync('app/components/conversation/ConversationPanel.vue', 'utf-8')
    expect(source).toContain('class="messages-area" aria-live="polite"')
  })
})

// ─── ImageUploader — error ───────────────────────────────────────────────────

describe('ImageUploader error — aria-live', () => {
  it('error paragraph includes role="alert" and aria-live', async () => {
    const fs = await import('node:fs')
    const source = fs.readFileSync('app/components/shared/ImageUploader.vue', 'utf-8')
    expect(source).toContain('class="uploader-error" role="alert" aria-live="assertive"')
  })
})

// ─── DashboardPhotoUpload — error ────────────────────────────────────────────

describe('DashboardPhotoUpload error — aria-live', () => {
  it('error div includes aria-live="assertive"', async () => {
    const fs = await import('node:fs')
    const source = fs.readFileSync('app/components/dashboard/DashboardPhotoUpload.vue', 'utf-8')
    expect(source).toContain('class="upload-error" role="alert" aria-live="assertive"')
  })
})
