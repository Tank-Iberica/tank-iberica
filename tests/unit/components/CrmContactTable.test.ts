/**
 * Tests for app/components/dashboard/crm/CrmContactTable.vue
 */
import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import CrmContactTable from '../../../app/components/dashboard/crm/CrmContactTable.vue'

const baseContacts = [
  {
    id: 'c1',
    contact_type: 'client' as const,
    company: 'Transportes García',
    contact_name: 'Juan García',
    phone: '600111222',
    email: 'juan@garcia.es',
    location: 'Madrid',
    vertical: 'tracciona',
  },
  {
    id: 'c2',
    contact_type: 'supplier' as const,
    company: '',
    contact_name: 'Ana López',
    phone: '',
    email: '',
    location: '',
    vertical: '',
  },
]

describe('CrmContactTable', () => {
  const factory = (overrides: Record<string, unknown> = {}) =>
    shallowMount(CrmContactTable, {
      props: {
        contacts: baseContacts,
        getTypeLabel: (t: string) => t === 'client' ? 'Cliente' : 'Proveedor',
        getTypeColor: (t: string) => t === 'client' ? '#22c55e' : '#3b82f6',
        ...overrides,
      },
      global: {
        mocks: { $t: (k: string) => k },
      },
    })

  it('renders table container', () => {
    expect(factory().find('.table-container').exists()).toBe(true)
  })

  it('renders data table', () => {
    expect(factory().find('.data-table').exists()).toBe(true)
  })

  it('renders 8 header columns', () => {
    expect(factory().findAll('th')).toHaveLength(8)
  })

  it('renders rows for each contact', () => {
    expect(factory().findAll('tbody tr')).toHaveLength(2)
  })

  it('shows type pill with label', () => {
    expect(factory().find('.type-pill').text()).toBe('Cliente')
  })

  it('applies type color to pill style', () => {
    const pill = factory().find('.type-pill')
    expect(pill.attributes('style')).toContain('#22c55e')
  })

  it('shows company name', () => {
    expect(factory().find('strong').text()).toBe('Transportes García')
  })

  it('shows dash for empty company', () => {
    const rows = factory().findAll('tbody tr')
    expect(rows[1].find('strong').text()).toBe('-')
  })

  it('shows contact name', () => {
    expect(factory().html()).toContain('Juan García')
  })

  it('shows phone link', () => {
    const link = factory().find('a[href="tel:600111222"]')
    expect(link.exists()).toBe(true)
    expect(link.text()).toBe('600111222')
  })

  it('shows dash for empty phone', () => {
    const rows = factory().findAll('tbody tr')
    // second row has no phone
    expect(rows[1].findAll('span').some(s => s.text() === '-')).toBe(true)
  })

  it('shows email link', () => {
    const link = factory().find('a[href="mailto:juan@garcia.es"]')
    expect(link.exists()).toBe(true)
  })

  it('shows location', () => {
    expect(factory().html()).toContain('Madrid')
  })

  it('shows vertical', () => {
    expect(factory().html()).toContain('tracciona')
  })

  it('shows action buttons for each row', () => {
    expect(factory().findAll('.action-btn')).toHaveLength(4) // 2 per row
  })

  it('emits edit on edit button click', async () => {
    const w = factory()
    await w.findAll('.action-btn')[0].trigger('click')
    expect(w.emitted('edit')?.[0]).toEqual([baseContacts[0]])
  })

  it('emits delete on delete button click', async () => {
    const w = factory()
    await w.find('.action-btn.delete').trigger('click')
    expect(w.emitted('delete')?.[0]).toEqual([baseContacts[0]])
  })

  it('shows empty state when no contacts', () => {
    const w = factory({ contacts: [] })
    expect(w.find('.empty-state').exists()).toBe(true)
  })

  it('emits create on empty state button click', async () => {
    const w = factory({ contacts: [] })
    await w.find('.btn-primary').trigger('click')
    expect(w.emitted('create')).toBeTruthy()
  })
})
