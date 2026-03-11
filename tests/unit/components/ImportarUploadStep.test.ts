/**
 * Tests for app/components/dashboard/importar/ImportarUploadStep.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import ImportarUploadStep from '../../../app/components/dashboard/importar/ImportarUploadStep.vue'

describe('ImportarUploadStep', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(ImportarUploadStep, {
      props: {
        file: null,
        error: null,
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders step section', () => {
    expect(factory().find('.step-section').exists()).toBe(true)
  })

  it('shows upload title', () => {
    expect(factory().find('h2').text()).toBe('dashboard.import.uploadFile')
  })

  it('shows supported formats hint', () => {
    expect(factory().find('.hint').text()).toBe('dashboard.import.supportedFormats')
  })

  it('shows choose file label when no file', () => {
    expect(factory().find('.file-label').text()).toContain('dashboard.import.chooseFile')
  })

  it('shows file name when file selected', () => {
    const w = factory({ file: { name: 'data.csv' } })
    expect(w.find('.file-name').text()).toBe('data.csv')
  })

  it('shows download template button', () => {
    expect(factory().find('.btn-secondary').text()).toContain('dashboard.import.downloadTemplate')
  })

  it('hides error when null', () => {
    expect(factory().find('.alert-error').exists()).toBe(false)
  })

  it('shows error when set', () => {
    const w = factory({ error: 'Invalid CSV format' })
    expect(w.find('.alert-error').text()).toBe('Invalid CSV format')
  })

  it('hides preview button when no file', () => {
    expect(factory().find('.btn-primary').exists()).toBe(false)
  })

  it('shows preview button when file selected', () => {
    const w = factory({ file: { name: 'data.csv' } })
    expect(w.find('.btn-primary').text()).toContain('dashboard.import.preview')
  })

  it('emits download-template on template button click', async () => {
    const w = factory()
    await w.find('.btn-secondary').trigger('click')
    expect(w.emitted('download-template')).toBeTruthy()
  })

  it('emits parse on preview button click', async () => {
    const w = factory({ file: { name: 'data.csv' } })
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('parse')).toBeTruthy()
  })

  it('has file input with csv accept', () => {
    expect(factory().find('input[type="file"]').attributes('accept')).toBe('.csv')
  })

  it('emits file-upload on file change', async () => {
    const w = factory()
    await w.find('input[type="file"]').trigger('change')
    expect(w.emitted('file-upload')).toBeTruthy()
  })
})
