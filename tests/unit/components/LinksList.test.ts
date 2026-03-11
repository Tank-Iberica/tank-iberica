/**
 * Tests for app/components/admin/config/navigation/LinksList.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import LinksList from '../../../app/components/admin/config/navigation/LinksList.vue'

describe('LinksList', () => {
  const links = [
    { label_es: 'Inicio', label_en: 'Home', url: '/', visible: true },
    { label_es: 'Catalogo', label_en: 'Catalog', url: '/catalogo', visible: false },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(LinksList, {
      props: {
        links,
        placeholderEs: 'Label ES',
        placeholderEn: 'Label EN',
        placeholderUrl: '/ruta',
        emptyMessage: 'No hay enlaces',
        ...overrides,
      },
    })

  it('renders table when links exist', () => {
    expect(factory().find('.links-table').exists()).toBe(true)
  })

  it('shows empty message when no links', () => {
    expect(factory({ links: [] }).find('.empty-links').text()).toBe('No hay enlaces')
  })

  it('renders table rows for each link', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('renders mobile cards', () => {
    expect(factory().findAll('.link-card-mobile')).toHaveLength(2)
  })

  it('first move up button is disabled', () => {
    const upBtns = factory().findAll('.order-buttons .btn-icon-sm')
    expect(upBtns[0].attributes('disabled')).toBeDefined()
  })

  it('emits move on up/down click', async () => {
    const w = factory()
    const downBtn = w.findAll('.order-buttons .btn-icon-sm')[1]
    await downBtn.trigger('click')
    expect(w.emitted('move')).toBeTruthy()
    expect(w.emitted('move')![0]).toEqual([0, 1])
  })

  it('emits remove on remove click', async () => {
    const w = factory()
    await w.find('.btn-remove').trigger('click')
    expect(w.emitted('remove')).toBeTruthy()
    expect(w.emitted('remove')![0]).toEqual([0])
  })

  it('shows card index in mobile view', () => {
    expect(factory().find('.link-card-index').text()).toBe('#1')
  })
})
