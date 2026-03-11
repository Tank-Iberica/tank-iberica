/**
 * Tests for app/components/dashboard/pipeline/PipelineItemModal.vue
 */
import { describe, it, expect, vi } from 'vitest'
import { shallowMount } from '@vue/test-utils'

vi.mock('~/composables/dashboard/useDashboardPipeline', () => ({
  STAGES: ['interested', 'contacted', 'negotiating', 'closed_won', 'closed_lost'],
}))

import PipelineItemModal from '../../../app/components/dashboard/pipeline/PipelineItemModal.vue'

const baseForm = {
  title: 'Test deal',
  contact_name: 'Juan',
  contact_phone: '600000000',
  contact_email: 'j@test.com',
  estimated_value: 50000,
  stage: 'interested' as const,
  notes: 'Some notes',
  close_reason: '',
}

describe('PipelineItemModal', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PipelineItemModal, {
      props: {
        show: true,
        editingItem: null,
        form: { ...baseForm },
        saving: false,
        ...overrides,
      },
      global: {
        stubs: { Teleport: true },
        mocks: { $t: (k: string) => k },
      },
    })

  it('hides modal when show is false', () => {
    const w = factory({ show: false })
    expect(w.find('.modal-overlay').exists()).toBe(false)
  })

  it('shows modal when show is true', () => {
    expect(factory().find('.modal-overlay').exists()).toBe(true)
  })

  it('shows add title when not editing', () => {
    expect(factory().find('h2').text()).toBe('dashboard.pipeline.addItem')
  })

  it('shows edit title when editing', () => {
    const w = factory({ editingItem: { id: 'x' } })
    expect(w.find('h2').text()).toBe('dashboard.pipeline.editItem')
  })

  it('renders title input with value', () => {
    const input = factory().find('#pip-title')
    expect((input.element as HTMLInputElement).value).toBe('Test deal')
  })

  it('renders contact name input', () => {
    const input = factory().find('#pip-contact-name')
    expect((input.element as HTMLInputElement).value).toBe('Juan')
  })

  it('renders contact phone input', () => {
    const input = factory().find('#pip-contact-phone')
    expect((input.element as HTMLInputElement).value).toBe('600000000')
  })

  it('renders contact email input', () => {
    const input = factory().find('#pip-contact-email')
    expect((input.element as HTMLInputElement).value).toBe('j@test.com')
  })

  it('renders estimated value input', () => {
    const input = factory().find('#pip-value')
    expect((input.element as HTMLInputElement).value).toBe('50000')
  })

  it('renders stage select with 5 options', () => {
    const options = factory().find('#pip-stage').findAll('option')
    expect(options).toHaveLength(5)
  })

  it('renders notes textarea', () => {
    const textarea = factory().find('#pip-notes')
    expect((textarea.element as HTMLTextAreaElement).value).toBe('Some notes')
  })

  it('shows close reason field when stage is closed_lost', () => {
    const w = factory({ form: { ...baseForm, stage: 'closed_lost' } })
    expect(w.find('#pip-close-reason').exists()).toBe(true)
  })

  it('hides close reason field for other stages', () => {
    expect(factory().find('#pip-close-reason').exists()).toBe(false)
  })

  it('shows delete button when editing', () => {
    const w = factory({ editingItem: { id: 'x' } })
    expect(w.find('.btn-danger').exists()).toBe(true)
  })

  it('hides delete button when creating', () => {
    expect(factory().find('.btn-danger').exists()).toBe(false)
  })

  it('disables save button when saving', () => {
    const w = factory({ saving: true })
    expect(w.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('disables save button when title is empty', () => {
    const w = factory({ form: { ...baseForm, title: '   ' } })
    expect(w.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('emits close on overlay click', async () => {
    const w = factory()
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on close button click', async () => {
    const w = factory()
    await w.find('.btn-close').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits close on cancel button click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('emits save on form submit', async () => {
    const w = factory()
    await w.find('.modal-form').trigger('submit')
    expect(w.emitted('save')).toBeTruthy()
  })

  it('emits delete on delete button click', async () => {
    const w = factory({ editingItem: { id: 'x' } })
    await w.find('.btn-danger').trigger('click')
    expect(w.emitted('delete')).toBeTruthy()
  })

  it('shows saving text when saving', () => {
    const w = factory({ saving: true })
    expect(w.find('.btn-primary').text()).toContain('common.loading')
  })

  it('shows save text when not saving', () => {
    expect(factory().find('.btn-primary').text()).toContain('common.save')
  })
})
