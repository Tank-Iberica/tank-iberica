/**
 * Tests for app/components/dashboard/pipeline/PipelineKanbanColumn.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import PipelineKanbanColumn from '../../../app/components/dashboard/pipeline/PipelineKanbanColumn.vue'

describe('PipelineKanbanColumn', () => {
  const items = [
    { id: 'p-1', title: 'Deal A', contact_name: 'Juan', estimated_value: 50000, stage: 'lead' },
    { id: 'p-2', title: 'Deal B', contact_name: null, estimated_value: null, stage: 'lead' },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(PipelineKanbanColumn, {
      props: {
        stage: 'lead' as const,
        items,
        total: 50000,
        stageColor: '#3b82f6',
        isDragOver: false,
        isExpanded: true,
        dragItemId: null,
        formatCurrency: (v: number | null | undefined) => (v ? `${v} €` : '—'),
        ...overrides,
      },
    })

  it('renders kanban column', () => {
    expect(factory().find('.kanban-column').exists()).toBe(true)
  })

  it('shows column header', () => {
    expect(factory().find('.column-header').exists()).toBe(true)
  })

  it('shows stage dot with color', () => {
    const dot = factory().find('.stage-dot')
    expect(dot.attributes('style')).toContain('background-color: #3b82f6')
  })

  it('shows item count', () => {
    expect(factory().find('.column-count').text()).toBe('2')
  })

  it('shows formatted total', () => {
    expect(factory().find('.column-total').text()).toBe('50000 €')
  })

  it('shows add button', () => {
    expect(factory().find('.btn-add').exists()).toBe(true)
  })

  it('applies drag-over class', () => {
    const w = factory({ isDragOver: true })
    expect(w.find('.kanban-column').classes()).toContain('drag-over')
  })

  it('applies expanded class', () => {
    expect(factory().find('.kanban-column').classes()).toContain('expanded')
  })

  it('emits toggle-stage on header click', async () => {
    const w = factory()
    await w.find('.column-header').trigger('click')
    expect(w.emitted('toggle-stage')).toBeTruthy()
  })

  it('emits add-item on add button click', async () => {
    const w = factory()
    await w.find('.btn-add').trigger('click')
    expect(w.emitted('add-item')).toBeTruthy()
  })

  it('shows empty message when no items', () => {
    const w = factory({ items: [] })
    expect(w.find('.column-empty').exists()).toBe(true)
  })
})
