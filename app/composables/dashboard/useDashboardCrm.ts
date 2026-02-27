/**
 * Composable for the CRM (contacts management) dashboard page.
 * Extracts all contact CRUD logic, filters, form state, and modal management.
 * Does NOT call onMounted — lifecycle hooks remain in the page.
 * Plan gate: Basic+ (free plan sees upgrade prompt).
 */

// ============ TYPES ============

export type ContactType = 'client' | 'provider' | 'transporter' | 'other'

export interface ContactFormData {
  contact_type: ContactType
  company: string
  contact_name: string
  phone: string
  email: string
  location: string
  vertical: string
  notes: string
  last_contact_date: string
}

export interface Contact extends ContactFormData {
  id: string
  dealer_id: string
  created_at: string
  updated_at: string
}

export interface ContactFilters {
  contact_type?: ContactType | null
  search?: string
}

export interface ContactTypeConfig {
  value: ContactType
  labelKey: string
  color: string
}

// ============ CONSTANTS ============

export const CONTACT_TYPES: ContactTypeConfig[] = [
  { value: 'client', labelKey: 'dashboard.crm.typeClient', color: '#0ea5e9' },
  { value: 'provider', labelKey: 'dashboard.crm.typeProvider', color: '#8b5cf6' },
  { value: 'transporter', labelKey: 'dashboard.crm.typeTransporter', color: '#f59e0b' },
  { value: 'other', labelKey: 'dashboard.crm.typeOther', color: '#64748b' },
]

const EMPTY_FORM: ContactFormData = {
  contact_type: 'client',
  company: '',
  contact_name: '',
  phone: '',
  email: '',
  location: '',
  vertical: '',
  notes: '',
  last_contact_date: '',
}

const PAGE_SIZE = 100

// ============ COMPOSABLE ============

export function useDashboardCrm() {
  const supabase = useSupabaseClient()
  const { t } = useI18n()

  // ── Contact CRUD state ──
  const contacts = ref<Contact[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  // ── Filters ──
  const filters = ref<ContactFilters>({
    contact_type: null,
    search: '',
  })

  // ── Modal state ──
  const activeModal = ref<'form' | 'delete' | null>(null)
  const editingContact = ref<Contact | null>(null)
  const formData = ref<ContactFormData>({ ...EMPTY_FORM })
  const deleteConfirmText = ref('')
  const deletingContact = ref<Contact | null>(null)

  // ── CRUD operations ──

  async function fetchContacts(
    dealerId: string | null,
    filterOverride?: ContactFilters,
  ): Promise<void> {
    if (!dealerId) return
    loading.value = true
    error.value = null
    const appliedFilters = filterOverride ?? filters.value
    try {
      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('dealer_id', dealerId)
        .order('company', { ascending: true })
        .limit(PAGE_SIZE)

      if (appliedFilters.contact_type) {
        query = query.eq('contact_type', appliedFilters.contact_type)
      }

      if (appliedFilters.search) {
        const term = `%${appliedFilters.search}%`
        query = query.or(
          `company.ilike.${term},contact_name.ilike.${term},email.ilike.${term},vertical.ilike.${term}`,
        )
      }

      const { data, error: err, count } = await query
      if (err) throw err

      contacts.value = (data as unknown as Contact[]) || []
      total.value = count || 0
    } catch (err: unknown) {
      error.value = (err as { message?: string })?.message || t('dashboard.crm.errorLoading')
      contacts.value = []
    } finally {
      loading.value = false
    }
  }

  async function createContact(dealerId: string | null): Promise<string | null> {
    if (!dealerId) return null
    saving.value = true
    error.value = null
    try {
      const payload = {
        ...formData.value,
        dealer_id: dealerId,
        last_contact_date: formData.value.last_contact_date || null,
      }
      const { data, error: err } = await supabase
        .from('contacts')
        .insert(payload as never)
        .select('id')
        .single()

      if (err) throw err
      return (data as { id: string } | null)?.id || null
    } catch (err: unknown) {
      error.value = (err as { message?: string })?.message || t('dashboard.crm.errorCreating')
      return null
    } finally {
      saving.value = false
    }
  }

  async function updateContact(id: string): Promise<boolean> {
    saving.value = true
    error.value = null
    try {
      const payload = {
        ...formData.value,
        last_contact_date: formData.value.last_contact_date || null,
        updated_at: new Date().toISOString(),
      }
      const { error: err } = await supabase
        .from('contacts')
        .update(payload as never)
        .eq('id', id)

      if (err) throw err
      return true
    } catch (err: unknown) {
      error.value = (err as { message?: string })?.message || t('dashboard.crm.errorUpdating')
      return false
    } finally {
      saving.value = false
    }
  }

  async function deleteContact(id: string): Promise<boolean> {
    saving.value = true
    error.value = null
    try {
      const { error: err } = await supabase.from('contacts').delete().eq('id', id)

      if (err) throw err

      contacts.value = contacts.value.filter((c) => c.id !== id)
      total.value--
      return true
    } catch (err: unknown) {
      error.value = (err as { message?: string })?.message || t('dashboard.crm.errorDeleting')
      return false
    } finally {
      saving.value = false
    }
  }

  // ── Modal management ──

  function openCreateModal(): void {
    editingContact.value = null
    formData.value = { ...EMPTY_FORM }
    activeModal.value = 'form'
  }

  function openEditModal(contact: Contact): void {
    editingContact.value = contact
    formData.value = {
      contact_type: contact.contact_type,
      company: contact.company || '',
      contact_name: contact.contact_name,
      phone: contact.phone || '',
      email: contact.email || '',
      location: contact.location || '',
      vertical: contact.vertical || '',
      notes: contact.notes || '',
      last_contact_date: contact.last_contact_date || '',
    }
    activeModal.value = 'form'
  }

  function openDeleteModal(contact: Contact): void {
    deletingContact.value = contact
    deleteConfirmText.value = ''
    activeModal.value = 'delete'
  }

  function closeModal(): void {
    activeModal.value = null
    editingContact.value = null
    deletingContact.value = null
  }

  async function submitForm(dealerId: string | null): Promise<void> {
    if (!formData.value.contact_name.trim()) return

    if (editingContact.value) {
      const ok = await updateContact(editingContact.value.id)
      if (ok) {
        closeModal()
        await fetchContacts(dealerId)
      }
    } else {
      const id = await createContact(dealerId)
      if (id) {
        closeModal()
        await fetchContacts(dealerId)
      }
    }
  }

  async function executeDelete(dealerId: string | null): Promise<void> {
    const confirmWord = t('dashboard.crm.deleteTypeWord')
    if (
      !deletingContact.value ||
      deleteConfirmText.value.toLowerCase() !== confirmWord.toLowerCase()
    )
      return
    const ok = await deleteContact(deletingContact.value.id)
    if (ok) {
      closeModal()
      if (dealerId) {
        // contacts already updated in deleteContact, no extra fetch needed
      }
    }
  }

  function updateFormData(updated: ContactFormData): void {
    formData.value = updated
  }

  function updateFilters(updated: ContactFilters): void {
    filters.value = updated
  }

  function setDeleteConfirmText(value: string): void {
    deleteConfirmText.value = value
  }

  // ── Helpers ──

  function getTypeLabel(type: ContactType): string {
    const ct = CONTACT_TYPES.find((c) => c.value === type)
    return ct ? t(ct.labelKey) : type
  }

  function getTypeColor(type: ContactType): string {
    return CONTACT_TYPES.find((c) => c.value === type)?.color || '#64748b'
  }

  return {
    // State
    contacts: readonly(contacts),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    total: readonly(total),
    filters,
    activeModal: readonly(activeModal),
    editingContact: readonly(editingContact),
    formData: readonly(formData),
    deleteConfirmText: readonly(deleteConfirmText),
    deletingContact: readonly(deletingContact),

    // CRUD
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,

    // Modal management
    openCreateModal,
    openEditModal,
    openDeleteModal,
    closeModal,
    submitForm,
    executeDelete,

    // State updaters
    updateFormData,
    updateFilters,
    setDeleteConfirmText,

    // Helpers
    getTypeLabel,
    getTypeColor,
  }
}
