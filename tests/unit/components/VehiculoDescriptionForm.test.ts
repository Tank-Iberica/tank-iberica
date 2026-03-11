/**
 * Tests for app/components/dashboard/vehiculos/VehiculoDescriptionForm.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import VehiculoDescriptionForm from '../../../app/components/dashboard/vehiculos/VehiculoDescriptionForm.vue'

describe('VehiculoDescriptionForm', () => {
  const factory = (props = {}) =>
    shallowMount(VehiculoDescriptionForm, {
      props: {
        descriptionEs: 'Desc ES',
        descriptionEn: 'Desc EN',
        generatingDesc: false,
        ...props,
      },
      global: {
        mocks: { $t: (key: string) => key },
      },
    })

  it('renders section heading', () => {
    const w = factory()
    expect(w.find('h2').text()).toBe('dashboard.vehicles.sectionDescription')
  })

  it('renders ES textarea with value', () => {
    const w = factory()
    const ta = w.find('#description_es')
    expect(ta.exists()).toBe(true)
    expect((ta.element as HTMLTextAreaElement).value).toBe('Desc ES')
  })

  it('renders EN textarea with value', () => {
    const w = factory()
    const ta = w.find('#description_en')
    expect(ta.exists()).toBe(true)
    expect((ta.element as HTMLTextAreaElement).value).toBe('Desc EN')
  })

  it('emits update with description_es on ES textarea input', async () => {
    const w = factory()
    const ta = w.find('#description_es')
    await ta.setValue('Nueva desc')
    const emitted = w.emitted('update')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual(['description_es', 'Nueva desc'])
  })

  it('emits update with description_en on EN textarea input', async () => {
    const w = factory()
    const ta = w.find('#description_en')
    await ta.setValue('New desc')
    const emitted = w.emitted('update')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual(['description_en', 'New desc'])
  })

  it('emits generate on AI button click', async () => {
    const w = factory()
    await w.find('.btn-ai').trigger('click')
    expect(w.emitted('generate')).toHaveLength(1)
  })

  it('shows generating text when generatingDesc is true', () => {
    const w = factory({ generatingDesc: true })
    expect(w.find('.btn-ai').text()).toBe('dashboard.vehicles.generating')
  })

  it('shows generate text when generatingDesc is false', () => {
    const w = factory({ generatingDesc: false })
    expect(w.find('.btn-ai').text()).toBe('dashboard.vehicles.generateAI')
  })

  it('disables AI button when generating', () => {
    const w = factory({ generatingDesc: true })
    expect(w.find('.btn-ai').attributes('disabled')).toBeDefined()
  })

  it('AI button is not disabled when not generating', () => {
    const w = factory({ generatingDesc: false })
    expect(w.find('.btn-ai').attributes('disabled')).toBeUndefined()
  })
})
