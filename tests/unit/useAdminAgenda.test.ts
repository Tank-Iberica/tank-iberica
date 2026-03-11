import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAdminAgenda } from '../../app/composables/admin/useAdminAgenda'

// ─── Hoisted mock functions (available inside vi.mock factory) ────────────

const { mockFetchContacts, mockCreateContact, mockUpdateContact, mockDeleteContact } = vi.hoisted(
  () => ({
    mockFetchContacts: vi.fn().mockResolvedValue(undefined),
    mockCreateContact: vi.fn().mockResolvedValue('new-id'),
    mockUpdateContact: vi.fn().mockResolvedValue(true),
    mockDeleteContact: vi.fn().mockResolvedValue(true),
  }),
)

// ─── Mock useAdminContacts dependency ────────────────────────────────────

vi.mock('~/composables/admin/useAdminContacts', () => ({
  CONTACT_TYPES: [
    { value: 'provider', label: 'Proveedor', color: '#8b5cf6' },
    { value: 'client', label: 'Cliente', color: '#0ea5e9' },
    { value: 'other', label: 'Otro', color: '#64748b' },
  ],
  useAdminContacts: () => ({
    contacts: { value: [] },
    loading: { value: false },
    saving: { value: false },
    error: { value: null },
    total: { value: 0 },
    fetchContacts: mockFetchContacts,
    createContact: mockCreateContact,
    updateContact: mockUpdateContact,
    deleteContact: mockDeleteContact,
  }),
}))

// ─── Fixtures ─────────────────────────────────────────────────────────────

function makeContact(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c-1',
    contact_type: 'client' as const,
    company: 'Empresa SA',
    contact_name: 'Ana García',
    phone: '612345678',
    email: 'ana@empresa.com',
    location: 'Madrid',
    products: 'Camiones',
    notes: '',
    created_at: '2026-01-01',
    ...overrides,
  }
}

// ─── Setup ────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── getTypeLabel / getTypeColor ──────────────────────────────────────────

describe('getTypeLabel', () => {
  it('returns label for "client"', () => {
    const c = useAdminAgenda()
    expect(c.getTypeLabel('client')).toBe('Cliente')
  })

  it('returns label for "provider"', () => {
    const c = useAdminAgenda()
    expect(c.getTypeLabel('provider')).toBe('Proveedor')
  })

  it('falls back to the type string for unknown type', () => {
    const c = useAdminAgenda()
    expect(c.getTypeLabel('unknown' as never)).toBe('unknown')
  })
})

describe('getTypeColor', () => {
  it('returns color for "client"', () => {
    const c = useAdminAgenda()
    expect(c.getTypeColor('client')).toBe('#0ea5e9')
  })

  it('returns default color (#64748b) for unknown type', () => {
    const c = useAdminAgenda()
    expect(c.getTypeColor('unknown' as never)).toBe('#64748b')
  })
})

// ─── Initial state ────────────────────────────────────────────────────────

describe('initial state', () => {
  it('activeModal starts as null', () => {
    const c = useAdminAgenda()
    expect(c.activeModal.value).toBeNull()
  })

  it('editingContact starts as null', () => {
    const c = useAdminAgenda()
    expect(c.editingContact.value).toBeNull()
  })

  it('deleteConfirmText starts as empty string', () => {
    const c = useAdminAgenda()
    expect(c.deleteConfirmText.value).toBe('')
  })

  it('deletingContact starts as null', () => {
    const c = useAdminAgenda()
    expect(c.deletingContact.value).toBeNull()
  })
})

// ─── openCreateModal ──────────────────────────────────────────────────────

describe('openCreateModal', () => {
  it('sets activeModal to "form"', () => {
    const c = useAdminAgenda()
    c.openCreateModal()
    expect(c.activeModal.value).toBe('form')
  })

  it('clears editingContact', () => {
    const c = useAdminAgenda()
    c.editingContact.value = makeContact() as never
    c.openCreateModal()
    expect(c.editingContact.value).toBeNull()
  })

  it('resets formData contact_name to empty string', () => {
    const c = useAdminAgenda()
    c.formData.value.contact_name = 'Someone'
    c.openCreateModal()
    expect(c.formData.value.contact_name).toBe('')
  })

  it('resets formData contact_type to "client"', () => {
    const c = useAdminAgenda()
    c.openCreateModal()
    expect(c.formData.value.contact_type).toBe('client')
  })
})

// ─── openEditModal ────────────────────────────────────────────────────────

describe('openEditModal', () => {
  it('sets activeModal to "form"', () => {
    const c = useAdminAgenda()
    c.openEditModal(makeContact() as never)
    expect(c.activeModal.value).toBe('form')
  })

  it('sets editingContact to the given contact', () => {
    const c = useAdminAgenda()
    const contact = makeContact({ id: 'c-42' })
    c.openEditModal(contact as never)
    expect(c.editingContact.value?.id).toBe('c-42')
  })

  it('populates formData.contact_name from contact', () => {
    const c = useAdminAgenda()
    c.openEditModal(makeContact({ contact_name: 'Ana García' }) as never)
    expect(c.formData.value.contact_name).toBe('Ana García')
  })

  it('populates formData.email from contact', () => {
    const c = useAdminAgenda()
    c.openEditModal(makeContact({ email: 'ana@empresa.com' }) as never)
    expect(c.formData.value.email).toBe('ana@empresa.com')
  })
})

// ─── openDeleteModal ──────────────────────────────────────────────────────

describe('openDeleteModal', () => {
  it('sets activeModal to "delete"', () => {
    const c = useAdminAgenda()
    c.openDeleteModal(makeContact() as never)
    expect(c.activeModal.value).toBe('delete')
  })

  it('sets deletingContact to the given contact', () => {
    const c = useAdminAgenda()
    const contact = makeContact({ id: 'c-99' })
    c.openDeleteModal(contact as never)
    expect(c.deletingContact.value?.id).toBe('c-99')
  })

  it('clears deleteConfirmText', () => {
    const c = useAdminAgenda()
    c.deleteConfirmText.value = 'borrar'
    c.openDeleteModal(makeContact() as never)
    expect(c.deleteConfirmText.value).toBe('')
  })
})

// ─── closeModal ───────────────────────────────────────────────────────────

describe('closeModal', () => {
  it('resets activeModal to null', () => {
    const c = useAdminAgenda()
    c.openCreateModal()
    c.closeModal()
    expect(c.activeModal.value).toBeNull()
  })

  it('clears editingContact', () => {
    const c = useAdminAgenda()
    c.editingContact.value = makeContact() as never
    c.closeModal()
    expect(c.editingContact.value).toBeNull()
  })

  it('clears deletingContact', () => {
    const c = useAdminAgenda()
    c.deletingContact.value = makeContact() as never
    c.closeModal()
    expect(c.deletingContact.value).toBeNull()
  })
})

// ─── executeDelete ────────────────────────────────────────────────────────

describe('executeDelete', () => {
  it('does nothing when deletingContact is null', async () => {
    const c = useAdminAgenda()
    await c.executeDelete()
    expect(mockDeleteContact).not.toHaveBeenCalled()
  })

  it('does nothing when deleteConfirmText is not "borrar"', async () => {
    const c = useAdminAgenda()
    c.openDeleteModal(makeContact() as never)
    c.deleteConfirmText.value = 'delete'
    await c.executeDelete()
    expect(mockDeleteContact).not.toHaveBeenCalled()
  })

  it('accepts case-insensitive "BORRAR"', async () => {
    const c = useAdminAgenda()
    c.openDeleteModal(makeContact({ id: 'c-1' }) as never)
    c.deleteConfirmText.value = 'BORRAR'
    await c.executeDelete()
    expect(mockDeleteContact).toHaveBeenCalledWith('c-1')
  })

  it('calls deleteContact with the correct id', async () => {
    const c = useAdminAgenda()
    c.openDeleteModal(makeContact({ id: 'c-42' }) as never)
    c.deleteConfirmText.value = 'borrar'
    await c.executeDelete()
    expect(mockDeleteContact).toHaveBeenCalledWith('c-42')
  })

  it('closes modal when deleteContact returns true', async () => {
    mockDeleteContact.mockResolvedValueOnce(true)
    const c = useAdminAgenda()
    c.openDeleteModal(makeContact() as never)
    c.deleteConfirmText.value = 'borrar'
    await c.executeDelete()
    expect(c.activeModal.value).toBeNull()
  })

  it('does NOT close modal when deleteContact returns false', async () => {
    mockDeleteContact.mockResolvedValueOnce(false)
    const c = useAdminAgenda()
    c.openDeleteModal(makeContact() as never)
    c.deleteConfirmText.value = 'borrar'
    await c.executeDelete()
    expect(c.activeModal.value).toBe('delete')
  })
})

// ─── submitForm ───────────────────────────────────────────────────────────

describe('submitForm', () => {
  it('returns early when contact_name is empty', async () => {
    const c = useAdminAgenda()
    c.formData.value.contact_name = '   '
    await c.submitForm()
    expect(mockCreateContact).not.toHaveBeenCalled()
    expect(mockUpdateContact).not.toHaveBeenCalled()
  })

  it('calls createContact when editingContact is null', async () => {
    const c = useAdminAgenda()
    c.formData.value.contact_name = 'Carlos Ruiz'
    await c.submitForm()
    expect(mockCreateContact).toHaveBeenCalledWith(
      expect.objectContaining({ contact_name: 'Carlos Ruiz' }),
    )
  })

  it('closes modal and fetches contacts after successful create', async () => {
    mockCreateContact.mockResolvedValueOnce('new-id')
    const c = useAdminAgenda()
    c.openCreateModal()
    c.formData.value.contact_name = 'Carlos Ruiz'
    await c.submitForm()
    expect(c.activeModal.value).toBeNull()
    expect(mockFetchContacts).toHaveBeenCalled()
  })

  it('does NOT close modal when createContact returns null', async () => {
    mockCreateContact.mockResolvedValueOnce(null)
    const c = useAdminAgenda()
    c.openCreateModal()
    c.formData.value.contact_name = 'Carlos Ruiz'
    await c.submitForm()
    expect(c.activeModal.value).toBe('form')
  })

  it('calls updateContact when editingContact is set', async () => {
    mockUpdateContact.mockResolvedValueOnce(true)
    const c = useAdminAgenda()
    c.editingContact.value = makeContact({ id: 'c-1' }) as never
    c.formData.value.contact_name = 'Updated Name'
    await c.submitForm()
    expect(mockUpdateContact).toHaveBeenCalledWith(
      'c-1',
      expect.objectContaining({ contact_name: 'Updated Name' }),
    )
  })

  it('closes modal after successful update', async () => {
    mockUpdateContact.mockResolvedValueOnce(true)
    const c = useAdminAgenda()
    c.editingContact.value = makeContact({ id: 'c-1' }) as never
    c.formData.value.contact_name = 'Updated Name'
    await c.submitForm()
    expect(c.activeModal.value).toBeNull()
  })
})

// ─── updateFormField ──────────────────────────────────────────────────────

describe('updateFormField', () => {
  it('updates contact_name field', () => {
    const c = useAdminAgenda()
    c.updateFormField('contact_name', 'Pedro Sánchez')
    expect(c.formData.value.contact_name).toBe('Pedro Sánchez')
  })

  it('updates email field', () => {
    const c = useAdminAgenda()
    c.updateFormField('email', 'pedro@test.com')
    expect(c.formData.value.email).toBe('pedro@test.com')
  })

  it('updates notes field', () => {
    const c = useAdminAgenda()
    c.updateFormField('notes', 'Important client')
    expect(c.formData.value.notes).toBe('Important client')
  })
})
