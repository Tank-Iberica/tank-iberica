/**
 * Tests for app/components/dashboard/herramientas/widget/WidgetEmbedSection.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import WidgetEmbedSection from '../../../app/components/dashboard/herramientas/widget/WidgetEmbedSection.vue'

describe('WidgetEmbedSection', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(WidgetEmbedSection, {
      props: { embedCode: '<iframe src="..."></iframe>', copySuccess: false, ...overrides },
      global: { mocks: { $t: (k: string) => k } },
    })

  it('renders card', () => {
    expect(factory().find('.card').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('.card-title').text()).toBe('dashboard.widget.embedCode')
  })

  it('renders textarea with embed code', () => {
    expect((factory().find('.code-textarea').element as HTMLTextAreaElement).value).toBe(
      '<iframe src="..."></iframe>',
    )
  })

  it('textarea is readonly', () => {
    expect(factory().find('.code-textarea').attributes('readonly')).toBeDefined()
  })

  it('shows copy button text', () => {
    expect(factory().find('.btn-copy').text()).toBe('dashboard.widget.copyCode')
  })

  it('shows copied text on success', () => {
    expect(factory({ copySuccess: true }).find('.btn-copy').text()).toBe('dashboard.widget.copied')
  })

  it('adds success class on copy', () => {
    expect(factory({ copySuccess: true }).find('.btn-copy').classes()).toContain('success')
  })

  it('emits copy on click', async () => {
    const w = factory()
    await w.find('.btn-copy').trigger('click')
    expect(w.emitted('copy')).toBeTruthy()
  })

  it('shows 3 instruction steps', () => {
    expect(factory().findAll('.instructions ol li')).toHaveLength(3)
  })
})
