/**
 * Tests for app/components/dashboard/pipeline/PipelineCard.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import PipelineCard from '../../../app/components/dashboard/pipeline/PipelineCard.vue'

describe('PipelineCard', () => {
  const item = {
    id: 'p-1',
    title: 'Volvo FH 500 - Venta',
    contact_name: 'Juan García',
    estimated_value: 85000,
    stage: 'negotiation',
    notes: '',
  }

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PipelineCard, {
      props: {
        item,
        isDragging: false,
        formatCurrency: (v: number | null | undefined) => (v ? `${v} €` : '—'),
        ...overrides,
      },
    })

  it('renders pipeline card', () => {
    expect(factory().find('.pipeline-card').exists()).toBe(true)
  })

  it('is draggable', () => {
    expect(factory().find('.pipeline-card').attributes('draggable')).toBe('true')
  })

  it('shows drag handle', () => {
    expect(factory().find('.card-drag-handle').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('Volvo FH 500 - Venta')
  })

  it('shows contact name', () => {
    expect(factory().find('.card-contact').text()).toBe('Juan García')
  })

  it('hides contact when not available', () => {
    const w = factory({ item: { ...item, contact_name: null } })
    expect(w.find('.card-contact').exists()).toBe(false)
  })

  it('shows formatted value', () => {
    expect(factory().find('.card-value').text()).toBe('85000 €')
  })

  it('hides value when not available', () => {
    const w = factory({ item: { ...item, estimated_value: null } })
    expect(w.find('.card-value').exists()).toBe(false)
  })

  it('applies dragging class when isDragging', () => {
    const w = factory({ isDragging: true })
    expect(w.find('.pipeline-card').classes()).toContain('dragging')
  })

  it('does not apply dragging class by default', () => {
    expect(factory().find('.pipeline-card').classes()).not.toContain('dragging')
  })

  it('emits edit-item on card click', async () => {
    const w = factory()
    await w.find('.pipeline-card').trigger('click')
    expect(w.emitted('edit-item')).toBeTruthy()
  })
})
