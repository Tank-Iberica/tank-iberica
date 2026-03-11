import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDashboardCrm, CONTACT_TYPES } from '../../app/composables/dashboard/useDashboardCrm'

// ─── Stubs ────────────────────────────────────────────────────────────────────

function makeChain(data: unknown = [], count = 0, error: unknown = null) {
  const chain: Record<string, unknown> = {}
  ;['eq', 'order', 'select', 'insert', 'update', 'delete', 'limit', 'or', 'single'].forEach((m) => {
    chain[m] = () => chain
  })
  const resolved = { data, error, count }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolved).then(resolve)
  chain.catch = (reject: (e: unknown) => void) => Promise.resolve(resolved).catch(reject)
  return chain
}

const sampleContact = {
  id: 'c-1', dealer_id: 'dealer-1', contact_type: 'client' as const,
  company: 'ACME Logistics', contact_name: 'Juan García',
  phone: '+34600000000', email: 'juan@acme.com',
  location: 'Madrid', vertical: 'tracciona', notes: 'VIP client',
  last_contact_date: '2025-01-15', created_at: '2024-01-01', updated_at: '2024-01-01',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('ref', (v: unknown) => {
    let _v = v
    return { get value() { return _v }, set value(x) { _v = x } }
  })
  vi.stubGlobal('readonly', (r: unknown) => r)
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))
  vi.stubGlobal('useSupabaseClient', () => ({
    from: () => makeChain([sampleContact], 1),
  }))
})

// ─── CONTACT_TYPES constant ───────────────────────────────────────────────────

describe('CONTACT_TYPES', () => {
  it('has 4 contact types', () => {
    expect(CONTACT_TYPES).toHaveLength(4)
  })

  it('includes client, provider, transporter, other', () => {
    const values = CONTACT_TYPES.map((c) => c.value)
    expect(values).toContain('client')
    expect(values).toContain('provider')
    expect(values).toContain('transporter')
    expect(values).toContain('other')
  })

  it('each type has a color', () => {
    CONTACT_TYPES.forEach((ct) => {
      expect(ct.color).toBeTruthy()
      expect(ct.color).toMatch(/^#/)
    })
  })
})

// ─── Initial state ─────────────────────────────────────────────────────────────

describe('initial state', () => {
  it('contacts starts as empty array', () => {
    const c = useDashboardCrm()
    expect(c.contacts.value).toHaveLength(0)
  })

  it('loading starts as false', () => {
    const c = useDashboardCrm()
    expect(c.loading.value).toBe(false)
  })

  it('saving starts as false', () => {
    const c = useDashboardCrm()
    expect(c.saving.value).toBe(false)
  })

  it('error starts as null', () => {
    const c = useDashboardCrm()
    expect(c.error.value).toBeNull()
  })

  it('activeModal starts as null', () => {
    const c = useDashboardCrm()
    expect(c.activeModal.value).toBeNull()
  })

  it('editingContact starts as null', () => {
    const c = useDashboardCrm()
    expect(c.editingContact.value).toBeNull()
  })

  it('formData.contact_type starts as client', () => {
    const c = useDashboardCrm()
    expect(c.formData.value.contact_type).toBe('client')
  })
})

// ─── getTypeLabel / getTypeColor ─────────────────────────────────────────────

describe('getTypeLabel', () => {
  it('returns translated label key for valid type', () => {
    const c = useDashboardCrm()
    const label = c.getTypeLabel('client')
    expect(label).toBeTruthy()
  })

  it('falls back to type string for unknown type', () => {
    const c = useDashboardCrm()
    const label = c.getTypeLabel('unknown' as never)
    expect(label).toBe('unknown')
  })
})

// ─── Modal management ─────────────────────────────────────────────────────────

describe('openCreateModal', () => {
  it('sets activeModal to form', () => {
    const c = useDashboardCrm()
    c.openCreateModal()
    expect(c.activeModal.value).toBe('form')
  })

  it('clears editingContact', () => {
    const c = useDashboardCrm()
    c.editingContact.value = sampleContact
    c.openCreateModal()
    expect(c.editingContact.value).toBeNull()
  })
})

describe('openEditModal', () => {
  it('sets activeModal to form', () => {
    const c = useDashboardCrm()
    c.openEditModal(sampleContact)
    expect(c.activeModal.value).toBe('form')
  })

  it('sets editingContact to provided contact', () => {
    const c = useDashboardCrm()
    c.openEditModal(sampleContact)
    expect(c.editingContact.value?.id).toBe('c-1')
  })

  it('populates formData with contact values', () => {
    const c = useDashboardCrm()
    c.openEditModal(sampleContact)
    expect(c.formData.value.company).toBe('ACME Logistics')
    expect(c.formData.value.contact_name).toBe('Juan García')
  })
})

describe('openDeleteModal', () => {
  it('sets activeModal to delete', () => {
    const c = useDashboardCrm()
    c.openDeleteModal(sampleContact)
    expect(c.activeModal.value).toBe('delete')
  })

  it('sets deletingContact', () => {
    const c = useDashboardCrm()
    c.openDeleteModal(sampleContact)
    expect(c.deletingContact.value?.id).toBe('c-1')
  })

  it('clears deleteConfirmText', () => {
    const c = useDashboardCrm()
    c.deleteConfirmText.value = 'borrar'
    c.openDeleteModal(sampleContact)
    expect(c.deleteConfirmText.value).toBe('')
  })
})

describe('closeModal', () => {
  it('resets activeModal, editingContact, deletingContact', () => {
    const c = useDashboardCrm()
    c.openEditModal(sampleContact)
    c.closeModal()
    expect(c.activeModal.value).toBeNull()
    expect(c.editingContact.value).toBeNull()
    expect(c.deletingContact.value).toBeNull()
  })
})

// ─── State updaters ───────────────────────────────────────────────────────────

describe('updateFormData', () => {
  it('replaces formData', () => {
    const c = useDashboardCrm()
    const newForm = { ...c.formData.value, company: 'New Corp' }
    c.updateFormData(newForm)
    expect(c.formData.value.company).toBe('New Corp')
  })
})

describe('updateFilters', () => {
  it('replaces filters', () => {
    const c = useDashboardCrm()
    c.updateFilters({ contact_type: 'provider', search: 'test' })
    expect(c.filters.value.contact_type).toBe('provider')
    expect(c.filters.value.search).toBe('test')
  })
})

describe('setDeleteConfirmText', () => {
  it('updates deleteConfirmText', () => {
    const c = useDashboardCrm()
    c.setDeleteConfirmText('borrar')
    expect(c.deleteConfirmText.value).toBe('borrar')
  })
})

// ─── fetchContacts ────────────────────────────────────────────────────────────

describe('fetchContacts', () => {
  it('does nothing when dealerId is null', async () => {
    const c = useDashboardCrm()
    await c.fetchContacts(null)
    expect(c.contacts.value).toHaveLength(0)
    expect(c.loading.value).toBe(false)
  })

  it('loads contacts and sets total', async () => {
    const c = useDashboardCrm()
    await c.fetchContacts('dealer-1')
    expect(c.contacts.value).toHaveLength(1)
    expect(c.contacts.value[0].company).toBe('ACME Logistics')
    expect(c.total.value).toBe(1)
    expect(c.loading.value).toBe(false)
  })

  it('sets error on DB failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => makeChain([], 0, { message: 'DB error' }),
    }))
    const c = useDashboardCrm()
    await c.fetchContacts('dealer-1')
    expect(c.error.value).toBeTruthy()
    expect(c.contacts.value).toHaveLength(0)
  })
})

// ─── submitForm validation ────────────────────────────────────────────────────

describe('submitForm', () => {
  it('does nothing when contact_name is empty', async () => {
    const c = useDashboardCrm()
    c.formData.value.contact_name = ''
    await c.submitForm('dealer-1')
    // nothing thrown, no modal opened
    expect(c.activeModal.value).toBeNull()
  })
})

// ─── executeDelete ────────────────────────────────────────────────────────────

describe('executeDelete', () => {
  it('does nothing when deletingContact is null', async () => {
    const c = useDashboardCrm()
    c.deleteConfirmText.value = 'dashboard.crm.deleteTypeWord'
    await c.executeDelete('dealer-1')
    // no error
    expect(c.error.value).toBeNull()
  })

  it('does nothing when confirmText does not match', async () => {
    const c = useDashboardCrm()
    c.openDeleteModal(sampleContact)
    c.deleteConfirmText.value = 'wrong-word'
    await c.executeDelete('dealer-1')
    expect(c.activeModal.value).toBe('delete') // still open
  })

  it('deletes contact and closes modal when confirmText matches', async () => {
    const deleteFn = vi.fn(() => ({ eq: () => Promise.resolve({ data: null, error: null }) }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        ...makeChain([sampleContact], 1),
        delete: deleteFn,
      }),
    }))
    const c = useDashboardCrm()
    // Load contacts first
    await c.fetchContacts('dealer-1')
    expect(c.contacts.value).toHaveLength(1)
    c.openDeleteModal(sampleContact)
    // t('dashboard.crm.deleteTypeWord') returns 'dashboard.crm.deleteTypeWord' (identity mock)
    c.setDeleteConfirmText('dashboard.crm.deleteTypeWord')
    await c.executeDelete('dealer-1')
    expect(c.activeModal.value).toBeNull()
    expect(c.contacts.value).toHaveLength(0)
  })
})

// ─── createContact ───────────────────────────────────────────────────────────

describe('createContact', () => {
  it('returns null when dealerId is null', async () => {
    const c = useDashboardCrm()
    const result = await c.createContact(null)
    expect(result).toBeNull()
  })

  it('returns created id on success', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        ...makeChain([sampleContact], 1),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: { id: 'new-contact-id' }, error: null }),
          }),
        }),
      }),
    }))
    const c = useDashboardCrm()
    c.updateFormData({ ...c.formData.value, contact_name: 'Test Person', company: 'Test Corp' })
    const result = await c.createContact('dealer-1')
    expect(result).toBe('new-contact-id')
    expect(c.saving.value).toBe(false)
  })

  it('sets error on DB failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        ...makeChain([sampleContact], 1),
        insert: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: { message: 'Insert failed' } }),
          }),
        }),
      }),
    }))
    const c = useDashboardCrm()
    const result = await c.createContact('dealer-1')
    expect(result).toBeNull()
    expect(c.error.value).toBeTruthy()
    expect(c.saving.value).toBe(false)
  })
})

// ─── updateContact ───────────────────────────────────────────────────────────

describe('updateContact', () => {
  it('returns true on success', async () => {
    const updateFn = vi.fn(() => ({ eq: () => Promise.resolve({ data: null, error: null }) }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        ...makeChain([sampleContact], 1),
        update: updateFn,
      }),
    }))
    const c = useDashboardCrm()
    const result = await c.updateContact('c-1')
    expect(result).toBe(true)
    expect(c.saving.value).toBe(false)
  })

  it('returns false and sets error on failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        ...makeChain([sampleContact], 1),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Update failed' } }) }),
      }),
    }))
    const c = useDashboardCrm()
    const result = await c.updateContact('c-1')
    expect(result).toBe(false)
    expect(c.error.value).toBeTruthy()
  })
})

// ─── deleteContact ───────────────────────────────────────────────────────────

describe('deleteContact', () => {
  it('removes contact from local state on success', async () => {
    const deleteFn = vi.fn(() => ({ eq: () => Promise.resolve({ data: null, error: null }) }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        ...makeChain([sampleContact], 1),
        delete: deleteFn,
      }),
    }))
    const c = useDashboardCrm()
    await c.fetchContacts('dealer-1')
    expect(c.contacts.value).toHaveLength(1)
    const result = await c.deleteContact('c-1')
    expect(result).toBe(true)
    expect(c.contacts.value).toHaveLength(0)
    expect(c.total.value).toBe(0)
  })

  it('returns false and sets error on failure', async () => {
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        ...makeChain([sampleContact], 1),
        delete: () => ({ eq: () => Promise.resolve({ data: null, error: { message: 'Delete failed' } }) }),
      }),
    }))
    const c = useDashboardCrm()
    const result = await c.deleteContact('c-1')
    expect(result).toBe(false)
    expect(c.error.value).toBeTruthy()
  })
})

// ─── submitForm — editing path ───────────────────────────────────────────────

describe('submitForm — editing', () => {
  it('calls updateContact when editingContact is set', async () => {
    const updateFn = vi.fn(() => ({ eq: () => Promise.resolve({ data: null, error: null }) }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        ...makeChain([sampleContact], 1),
        update: updateFn,
      }),
    }))
    const c = useDashboardCrm()
    c.openEditModal(sampleContact)
    await c.submitForm('dealer-1')
    // Update was called and modal should close on success
    expect(updateFn).toHaveBeenCalled()
    expect(c.activeModal.value).toBeNull()
  })

  it('calls createContact when editingContact is null', async () => {
    const insertFn = vi.fn(() => ({
      select: () => ({
        single: () => Promise.resolve({ data: { id: 'new-id' }, error: null }),
      }),
    }))
    vi.stubGlobal('useSupabaseClient', () => ({
      from: () => ({
        ...makeChain([sampleContact], 1),
        insert: insertFn,
      }),
    }))
    const c = useDashboardCrm()
    c.openCreateModal()
    c.updateFormData({ ...c.formData.value, contact_name: 'New Contact' })
    await c.submitForm('dealer-1')
    expect(insertFn).toHaveBeenCalled()
    expect(c.activeModal.value).toBeNull()
  })
})

// ─── fetchContacts with filters ──────────────────────────────────────────────

describe('fetchContacts with filters', () => {
  it('applies contact_type filter', async () => {
    const spyEq = vi.fn().mockReturnThis()
    const chain = makeChain([sampleContact], 1)
    chain.eq = spyEq.mockReturnValue(chain)
    vi.stubGlobal('useSupabaseClient', () => ({ from: () => chain }))
    const c = useDashboardCrm()
    await c.fetchContacts('dealer-1', { contact_type: 'provider' })
    expect(spyEq).toHaveBeenCalledWith('contact_type', 'provider')
  })

  it('applies search filter with OR', async () => {
    const spyOr = vi.fn().mockReturnThis()
    const chain = makeChain([sampleContact], 1)
    chain.or = spyOr.mockReturnValue(chain)
    vi.stubGlobal('useSupabaseClient', () => ({ from: () => chain }))
    const c = useDashboardCrm()
    await c.fetchContacts('dealer-1', { search: 'ACME' })
    expect(spyOr).toHaveBeenCalled()
  })
})

// ─── getTypeColor ────────────────────────────────────────────────────────────

describe('getTypeColor', () => {
  it('returns correct color for client', () => {
    const c = useDashboardCrm()
    expect(c.getTypeColor('client')).toBe('#0ea5e9')
  })

  it('returns fallback color for unknown type', () => {
    const c = useDashboardCrm()
    expect(c.getTypeColor('unknown' as never)).toBe('#64748b')
  })
})
