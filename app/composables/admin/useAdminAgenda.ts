import {
  useAdminContacts,
  CONTACT_TYPES,
  type Contact,
  type ContactType,
  type ContactFormData,
  type ContactFilters,
} from '~/composables/admin/useAdminContacts'

export type { Contact, ContactType, ContactFormData, ContactFilters }
export { CONTACT_TYPES }

export type AgendaModal = 'form' | 'delete' | null

const EMPTY_FORM: ContactFormData = {
  contact_type: 'client',
  company: '',
  contact_name: '',
  phone: '',
  email: '',
  location: '',
  products: '',
  notes: '',
}

export function useAdminAgenda() {
  const {
    contacts,
    loading,
    saving,
    error,
    total,
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  } = useAdminContacts()

  // Filters
  const filters = ref<ContactFilters>({
    contact_type: null,
    search: '',
  })

  // Modals
  const activeModal = ref<AgendaModal>(null)
  const editingContact = ref<Contact | null>(null)
  const formData = ref<ContactFormData>({ ...EMPTY_FORM })
  const deleteConfirmText = ref('')
  const deletingContact = ref<Contact | null>(null)

  function openCreateModal() {
    editingContact.value = null
    formData.value = { ...EMPTY_FORM }
    activeModal.value = 'form'
  }

  function openEditModal(contact: Contact) {
    editingContact.value = contact
    formData.value = {
      contact_type: contact.contact_type,
      company: contact.company || '',
      contact_name: contact.contact_name,
      phone: contact.phone || '',
      email: contact.email || '',
      location: contact.location || '',
      products: contact.products || '',
      notes: contact.notes || '',
    }
    activeModal.value = 'form'
  }

  function openDeleteModal(contact: Contact) {
    deletingContact.value = contact
    deleteConfirmText.value = ''
    activeModal.value = 'delete'
  }

  function closeModal() {
    activeModal.value = null
    editingContact.value = null
    deletingContact.value = null
  }

  async function submitForm() {
    if (!formData.value.contact_name.trim()) return

    if (editingContact.value) {
      const ok = await updateContact(editingContact.value.id, formData.value)
      if (ok) {
        closeModal()
        await fetchContacts(filters.value)
      }
    } else {
      const id = await createContact(formData.value)
      if (id) {
        closeModal()
        await fetchContacts(filters.value)
      }
    }
  }

  async function executeDelete() {
    if (!deletingContact.value || deleteConfirmText.value.toLowerCase() !== 'borrar') return
    const ok = await deleteContact(deletingContact.value.id)
    if (ok) closeModal()
  }

  function updateFormField(field: keyof ContactFormData, value: string) {
    formData.value[field] = value as never
  }

  function getTypeLabel(type: ContactType): string {
    return CONTACT_TYPES.find((t) => t.value === type)?.label || type
  }

  function getTypeColor(type: ContactType): string {
    return CONTACT_TYPES.find((t) => t.value === type)?.color || '#64748b'
  }

  // Init replaces onMounted
  function init() {
    fetchContacts(filters.value)
    watch(filters, () => fetchContacts(filters.value), { deep: true })
  }

  return {
    // State
    contacts,
    loading,
    saving,
    error,
    total,
    filters,
    activeModal,
    editingContact,
    formData,
    deleteConfirmText,
    deletingContact,
    // Actions
    openCreateModal,
    openEditModal,
    openDeleteModal,
    closeModal,
    submitForm,
    executeDelete,
    updateFormField,
    getTypeLabel,
    getTypeColor,
    init,
  }
}
