/**
 * Tests for app/components/admin/agenda/AdminAgendaTable.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'

import AdminAgendaTable from '../../../app/components/admin/agenda/AdminAgendaTable.vue'

describe('AdminAgendaTable', () => {
  const contacts = [
    {
      id: 'c-1',
      contact_type: 'dealer',
      company: 'Volvo Trucks',
      contact_name: 'Juan García',
      phone: '+34 600 000 000',
      email: 'juan@volvo.com',
      location: 'León',
      products: 'Camiones',
      notes: '',
    },
    {
      id: 'c-2',
      contact_type: 'buyer',
      company: null,
      contact_name: 'María López',
      phone: null,
      email: null,
      location: null,
      products: null,
      notes: '',
    },
  ]

  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(AdminAgendaTable, {
      props: {
        contacts,
        getTypeLabel: (t: string) => t.toUpperCase(),
        getTypeColor: () => '#3b82f6',
        ...overrides,
      },
    })

  it('renders table', () => {
    expect(factory().find('.data-table').exists()).toBe(true)
  })

  it('renders 8 column headers', () => {
    expect(factory().findAll('th')).toHaveLength(8)
  })

  it('renders contact rows', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows type pill', () => {
    expect(factory().find('.type-pill').text()).toBe('DEALER')
  })

  it('shows company name', () => {
    expect(factory().find('strong').text()).toBe('Volvo Trucks')
  })

  it('shows dash for missing company', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[1].find('strong').text()).toBe('-')
  })

  it('shows contact name', () => {
    const cells = factory().findAll('tbody tr')[0].findAll('td')
    expect(cells[2].text()).toBe('Juan García')
  })

  it('shows phone link', () => {
    const link = factory().find('a[href="tel:+34 600 000 000"]')
    expect(link.exists()).toBe(true)
  })

  it('shows dash for missing phone', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[1].findAll('td')[3].text()).toBe('-')
  })

  it('shows email link', () => {
    const link = factory().find('a[href="mailto:juan@volvo.com"]')
    expect(link.exists()).toBe(true)
  })

  it('shows edit and delete buttons', () => {
    expect(factory().findAll('.action-btn')).toHaveLength(4) // 2 per row
  })

  it('emits edit on edit click', async () => {
    const w = factory()
    await w.findAll('.action-btn')[0].trigger('click')
    expect(w.emitted('edit')).toBeTruthy()
  })

  it('emits delete on delete click', async () => {
    const w = factory()
    await w.find('.action-btn.delete').trigger('click')
    expect(w.emitted('delete')).toBeTruthy()
  })

  it('shows empty state when no contacts', () => {
    const w = factory({ contacts: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('emits create from empty state', async () => {
    const w = factory({ contacts: [] })
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('create')).toBeTruthy()
  })
})
