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

// Structural tests for SubscribeModal, ReportModal, ConversationPanel,
// ImageUploader, DashboardPhotoUpload removed — those are cross-file audits
// covered by ESLint/Fase 5 of the test professionalization roadmap.
