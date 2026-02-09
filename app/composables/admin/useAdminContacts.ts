export type ContactType = 'provider' | 'client' | 'other'

export interface ContactFormData {
  contact_type: ContactType
  company: string
  contact_name: string
  phone: string
  email: string
  location: string
  products: string
  notes: string
}

export interface Contact extends ContactFormData {
  id: string
  created_at: string
  updated_at: string
}

export interface ContactFilters {
  contact_type?: ContactType | null
  search?: string
}

export const CONTACT_TYPES: { value: ContactType; label: string; color: string }[] = [
  { value: 'provider', label: 'Proveedor', color: '#8b5cf6' },
  { value: 'client', label: 'Cliente', color: '#0ea5e9' },
  { value: 'other', label: 'Otro', color: '#64748b' },
]

const PAGE_SIZE = 100

export function useAdminContacts() {
  const supabase = useSupabaseClient()

  const contacts = ref<Contact[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  async function fetchContacts(filters: ContactFilters = {}) {
    loading.value = true
    error.value = null
    try {
      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .order('company', { ascending: true })
        .limit(PAGE_SIZE)

      if (filters.contact_type) {
        query = query.eq('contact_type', filters.contact_type)
      }

      if (filters.search) {
        const term = `%${filters.search}%`
        query = query.or(`company.ilike.${term},contact_name.ilike.${term},email.ilike.${term},products.ilike.${term}`)
      }

      const { data, error: err, count } = await query
      if (err) throw err

      contacts.value = (data as unknown as Contact[]) || []
      total.value = count || 0
    }
    catch (err: unknown) {
      error.value = (err as { message?: string })?.message || 'Error al cargar contactos'
      contacts.value = []
    }
    finally {
      loading.value = false
    }
  }

  async function createContact(formData: ContactFormData): Promise<string | null> {
    saving.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('contacts')
        .insert(formData as never)
        .select('id')
        .single()

      if (err) throw err
      return (data as { id: string } | null)?.id || null
    }
    catch (err: unknown) {
      error.value = (err as { message?: string })?.message || 'Error al crear contacto'
      return null
    }
    finally {
      saving.value = false
    }
  }

  async function updateContact(id: string, formData: Partial<ContactFormData>): Promise<boolean> {
    saving.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('contacts')
        .update({ ...formData, updated_at: new Date().toISOString() } as never)
        .eq('id', id)

      if (err) throw err
      return true
    }
    catch (err: unknown) {
      error.value = (err as { message?: string })?.message || 'Error al actualizar contacto'
      return false
    }
    finally {
      saving.value = false
    }
  }

  async function deleteContact(id: string): Promise<boolean> {
    saving.value = true
    error.value = null
    try {
      const { error: err } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id)

      if (err) throw err

      contacts.value = contacts.value.filter(c => c.id !== id)
      total.value--
      return true
    }
    catch (err: unknown) {
      error.value = (err as { message?: string })?.message || 'Error al eliminar contacto'
      return false
    }
    finally {
      saving.value = false
    }
  }

  return {
    contacts: readonly(contacts),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    total: readonly(total),
    fetchContacts,
    createContact,
    updateContact,
    deleteContact,
  }
}
