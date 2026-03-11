/**
 * Tests for app/components/admin/noticias/AdminNewsFormHeader.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminNewsFormHeader from '../../../app/components/admin/noticias/AdminNewsFormHeader.vue'

describe('AdminNewsFormHeader', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminNewsFormHeader, {
      props: {
        title: 'Editar Noticia',
        slug: 'test-article',
        saving: false,
        isValid: true,
        ...overrides,
      },
    })

  it('renders header', () => {
    expect(factory().find('.nf-header').exists()).toBe(true)
  })

  it('shows title', () => {
    expect(factory().find('h1').text()).toBe('Editar Noticia')
  })

  it('shows view link with slug', () => {
    const link = factory().find('a')
    expect(link.attributes('href')).toBe('/noticias/test-article')
  })

  it('shows save button enabled when valid', () => {
    const btn = factory().find('.btn-primary')
    expect((btn.element as HTMLButtonElement).disabled).toBe(false)
    expect(btn.text()).toBe('Guardar')
  })

  it('disables save when saving', () => {
    const btn = factory({ saving: true }).find('.btn-primary')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
    expect(btn.text()).toBe('Guardando...')
  })

  it('disables save when not valid', () => {
    const btn = factory({ isValid: false }).find('.btn-primary')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('emits cancel on back button click', async () => {
    const w = factory()
    await w.find('.btn-icon').trigger('click')
    expect(w.emitted('cancel')).toBeTruthy()
  })

  it('emits delete on delete button click', async () => {
    const w = factory()
    await w.find('.btn-delete-outline').trigger('click')
    expect(w.emitted('delete')).toBeTruthy()
  })

  it('emits save on save click', async () => {
    const w = factory()
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('save')).toBeTruthy()
  })

  it('emits cancel on cancel click', async () => {
    const w = factory()
    const btns = w.findAll('button.btn')
    // cancel is the button without btn-primary and without btn-delete-outline
    const cancelBtn = btns.find(b => !b.classes().includes('btn-primary') && !b.classes().includes('btn-delete-outline'))
    await cancelBtn!.trigger('click')
    expect(w.emitted('cancel')).toBeTruthy()
  })
})
