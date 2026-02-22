<script setup lang="ts">
/**
 * Dashboard CRM — Dealer contacts management page.
 * Adapted from admin/agenda.vue but scoped to the dealer's own contacts.
 * Requires Basic plan minimum.
 */
import { useDealerDashboard } from '~/composables/useDealerDashboard'
import { useSubscriptionPlan } from '~/composables/useSubscriptionPlan'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const { userId } = useAuth()

// ── Dealer profile ──
const { dealerProfile, loadDealer } = useDealerDashboard()

const dealerId = computed<string | null>(() => dealerProfile.value?.id ?? null)

// ── Subscription gate ──
const { currentPlan, fetchSubscription } = useSubscriptionPlan()

// ── Contact types ──
type ContactType = 'client' | 'provider' | 'transporter' | 'other'

interface ContactFormData {
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

interface Contact extends ContactFormData {
  id: string
  dealer_id: string
  created_at: string
  updated_at: string
}

interface ContactFilters {
  contact_type?: ContactType | null
  search?: string
}

const CONTACT_TYPES: { value: ContactType; labelKey: string; color: string }[] = [
  { value: 'client', labelKey: 'dashboard.crm.typeClient', color: '#0ea5e9' },
  { value: 'provider', labelKey: 'dashboard.crm.typeProvider', color: '#8b5cf6' },
  { value: 'transporter', labelKey: 'dashboard.crm.typeTransporter', color: '#f59e0b' },
  { value: 'other', labelKey: 'dashboard.crm.typeOther', color: '#64748b' },
]

// ── Inline composable: useDealerContacts ──
function useDealerContacts(dId: Ref<string | null>) {
  const contacts = ref<Contact[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  const PAGE_SIZE = 100

  async function fetchContacts(filters: ContactFilters = {}): Promise<void> {
    if (!dId.value) return
    loading.value = true
    error.value = null
    try {
      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('dealer_id', dId.value)
        .order('company', { ascending: true })
        .limit(PAGE_SIZE)

      if (filters.contact_type) {
        query = query.eq('contact_type', filters.contact_type)
      }

      if (filters.search) {
        const term = `%${filters.search}%`
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

  async function createContact(formData: ContactFormData): Promise<string | null> {
    if (!dId.value) return null
    saving.value = true
    error.value = null
    try {
      const payload = {
        ...formData,
        dealer_id: dId.value,
        last_contact_date: formData.last_contact_date || null,
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

  async function updateContact(id: string, formData: Partial<ContactFormData>): Promise<boolean> {
    saving.value = true
    error.value = null
    try {
      const payload = {
        ...formData,
        last_contact_date: formData.last_contact_date || null,
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

// ── Use inline composable ──
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
} = useDealerContacts(dealerId)

// ── Filters ──
const filters = ref<ContactFilters>({
  contact_type: null,
  search: '',
})

// ── Modals ──
const activeModal = ref<'form' | 'delete' | null>(null)
const editingContact = ref<Contact | null>(null)

const emptyForm: ContactFormData = {
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

const formData = ref<ContactFormData>({ ...emptyForm })
const deleteConfirmText = ref('')
const deletingContact = ref<Contact | null>(null)

function openCreateModal(): void {
  editingContact.value = null
  formData.value = { ...emptyForm }
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

async function submitForm(): Promise<void> {
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

async function executeDelete(): Promise<void> {
  const confirmWord = t('dashboard.crm.deleteTypeWord')
  if (!deletingContact.value || deleteConfirmText.value.toLowerCase() !== confirmWord.toLowerCase())
    return
  const ok = await deleteContact(deletingContact.value.id)
  if (ok) closeModal()
}

function getTypeLabel(type: ContactType): string {
  const ct = CONTACT_TYPES.find((c) => c.value === type)
  return ct ? t(ct.labelKey) : type
}

function getTypeColor(type: ContactType): string {
  return CONTACT_TYPES.find((c) => c.value === type)?.color || '#64748b'
}

// ── Lifecycle ──
onMounted(async () => {
  await loadDealer()
  if (userId.value) {
    await fetchSubscription(userId.value)
  }
  if (dealerId.value) {
    await fetchContacts(filters.value)
  }
})

watch(
  filters,
  () => {
    if (dealerId.value) {
      fetchContacts(filters.value)
    }
  },
  { deep: true },
)

watch(dealerId, (newId) => {
  if (newId) {
    fetchContacts(filters.value)
  }
})
</script>

<template>
  <div class="crm-page">
    <!-- Upgrade gate: free plan -->
    <div v-if="currentPlan === 'free'" class="upgrade-gate">
      <div class="upgrade-card">
        <span class="upgrade-icon">&#128274;</span>
        <h2>{{ t('dashboard.crm.upgradeTitle') }}</h2>
        <p>{{ t('dashboard.crm.upgradeDesc') }}</p>
        <NuxtLink to="/dashboard/suscripcion" class="btn-primary">
          {{ t('dashboard.crm.upgradeCta') }}
        </NuxtLink>
      </div>
    </div>

    <!-- CRM content (Basic+ plans) -->
    <template v-else>
      <!-- Header -->
      <header class="page-header">
        <div class="header-left">
          <h1>{{ t('dashboard.crm.title') }}</h1>
          <span class="count-badge">{{ total }}</span>
        </div>
        <button class="btn-primary" @click="openCreateModal">
          {{ t('dashboard.crm.newContact') }}
        </button>
      </header>

      <!-- Filters -->
      <div class="toolbar">
        <div class="toolbar-row">
          <div class="search-box">
            <span class="search-icon">&#128269;</span>
            <input
              v-model="filters.search"
              type="text"
              :placeholder="t('dashboard.crm.searchPlaceholder')"
            >
            <button v-if="filters.search" class="clear-btn" @click="filters.search = ''">
              &#215;
            </button>
          </div>

          <div class="filter-group">
            <label class="filter-label">{{ t('dashboard.crm.filterType') }}</label>
            <div class="segment-control">
              <button
                :class="{ active: !filters.contact_type }"
                @click="filters.contact_type = null"
              >
                {{ t('dashboard.crm.filterAll') }}
              </button>
              <button
                v-for="ct in CONTACT_TYPES"
                :key="ct.value"
                :class="{ active: filters.contact_type === ct.value }"
                @click="filters.contact_type = ct.value"
              >
                {{ t(ct.labelKey) }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="alert-error">
        {{ error }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <span>{{ t('dashboard.crm.loading') }}</span>
      </div>

      <!-- Table -->
      <div v-else class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th class="col-type">{{ t('dashboard.crm.colType') }}</th>
              <th>{{ t('dashboard.crm.colCompany') }}</th>
              <th>{{ t('dashboard.crm.colContact') }}</th>
              <th>{{ t('dashboard.crm.colPhone') }}</th>
              <th>{{ t('dashboard.crm.colEmail') }}</th>
              <th>{{ t('dashboard.crm.colLocation') }}</th>
              <th>{{ t('dashboard.crm.colVertical') }}</th>
              <th class="col-actions">{{ t('dashboard.crm.colActions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in contacts" :key="c.id">
              <td class="col-type">
                <span
                  class="type-pill"
                  :style="{
                    background: getTypeColor(c.contact_type) + '20',
                    color: getTypeColor(c.contact_type),
                  }"
                >
                  {{ getTypeLabel(c.contact_type) }}
                </span>
              </td>
              <td>
                <strong>{{ c.company || '-' }}</strong>
              </td>
              <td>{{ c.contact_name }}</td>
              <td>
                <a v-if="c.phone" :href="`tel:${c.phone}`" class="link">{{ c.phone }}</a>
                <span v-else>-</span>
              </td>
              <td>
                <a v-if="c.email" :href="`mailto:${c.email}`" class="link">{{ c.email }}</a>
                <span v-else>-</span>
              </td>
              <td class="text-small">{{ c.location || '-' }}</td>
              <td class="text-small col-vertical">
                <span class="truncate">{{ c.vertical || '-' }}</span>
              </td>
              <td class="col-actions">
                <div class="row-actions">
                  <button
                    class="action-btn"
                    :title="t('dashboard.crm.editAction')"
                    @click="openEditModal(c)"
                  >
                    &#9998;&#65039;
                  </button>
                  <button
                    class="action-btn delete"
                    :title="t('dashboard.crm.deleteAction')"
                    @click="openDeleteModal(c)"
                  >
                    &#128465;&#65039;
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="contacts.length === 0">
              <td colspan="8" class="empty-cell">
                <div class="empty-state">
                  <span class="empty-icon">&#128210;</span>
                  <p>{{ t('dashboard.crm.emptyTitle') }}</p>
                  <button class="btn-primary" @click="openCreateModal">
                    {{ t('dashboard.crm.emptyAction') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Form Modal (Create/Edit) -->
      <Teleport to="body">
        <div v-if="activeModal === 'form'" class="modal-overlay" @click.self="closeModal">
          <div class="modal modal-md">
            <div class="modal-header">
              <h3>
                {{
                  editingContact ? t('dashboard.crm.editContact') : t('dashboard.crm.createContact')
                }}
              </h3>
              <button class="modal-close" @click="closeModal">&#215;</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>{{ t('dashboard.crm.labelType') }}</label>
                <select v-model="formData.contact_type">
                  <option v-for="ct in CONTACT_TYPES" :key="ct.value" :value="ct.value">
                    {{ t(ct.labelKey) }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ t('dashboard.crm.labelCompany') }}</label>
                <input
                  v-model="formData.company"
                  type="text"
                  :placeholder="t('dashboard.crm.placeholderCompany')"
                >
              </div>
              <div class="form-group">
                <label>{{ t('dashboard.crm.labelContactName') }}</label>
                <input
                  v-model="formData.contact_name"
                  type="text"
                  :placeholder="t('dashboard.crm.placeholderName')"
                >
              </div>
              <div class="form-row">
                <div class="form-group half">
                  <label>{{ t('dashboard.crm.labelPhone') }}</label>
                  <input
                    v-model="formData.phone"
                    type="tel"
                    :placeholder="t('dashboard.crm.placeholderPhone')"
                  >
                </div>
                <div class="form-group half">
                  <label>{{ t('dashboard.crm.labelEmail') }}</label>
                  <input
                    v-model="formData.email"
                    type="email"
                    :placeholder="t('dashboard.crm.placeholderEmail')"
                  >
                </div>
              </div>
              <div class="form-group">
                <label>{{ t('dashboard.crm.labelLocation') }}</label>
                <input
                  v-model="formData.location"
                  type="text"
                  :placeholder="t('dashboard.crm.placeholderLocation')"
                >
              </div>
              <div class="form-group">
                <label>{{ t('dashboard.crm.labelVertical') }}</label>
                <input
                  v-model="formData.vertical"
                  type="text"
                  :placeholder="t('dashboard.crm.placeholderVertical')"
                >
              </div>
              <div class="form-group">
                <label>{{ t('dashboard.crm.labelLastContact') }}</label>
                <input v-model="formData.last_contact_date" type="date" >
              </div>
              <div class="form-group">
                <label>{{ t('dashboard.crm.labelNotes') }}</label>
                <textarea
                  v-model="formData.notes"
                  rows="3"
                  :placeholder="t('dashboard.crm.placeholderNotes')"
                />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="closeModal">
                {{ t('dashboard.crm.cancel') }}
              </button>
              <button
                class="btn-primary"
                :disabled="saving || !formData.contact_name.trim()"
                @click="submitForm"
              >
                {{
                  saving
                    ? t('dashboard.crm.saving')
                    : editingContact
                      ? t('dashboard.crm.save')
                      : t('dashboard.crm.create')
                }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Delete Modal -->
      <Teleport to="body">
        <div v-if="activeModal === 'delete'" class="modal-overlay" @click.self="closeModal">
          <div class="modal modal-sm">
            <div class="modal-header danger">
              <h3>{{ t('dashboard.crm.deleteTitle') }}</h3>
              <button class="modal-close" @click="closeModal">&#215;</button>
            </div>
            <div class="modal-body">
              <p>
                {{ t('dashboard.crm.deleteConfirm', { name: deletingContact?.contact_name }) }}
                <span v-if="deletingContact?.company">
                  {{
                    t('dashboard.crm.deleteConfirmCompany', { company: deletingContact.company })
                  }}
                </span>
                ?
              </p>
              <div class="form-group">
                <label>
                  {{
                    t('dashboard.crm.deleteTypePrompt', { word: t('dashboard.crm.deleteTypeWord') })
                  }}
                </label>
                <input
                  v-model="deleteConfirmText"
                  type="text"
                  :placeholder="t('dashboard.crm.deleteTypeWord')"
                  autocomplete="off"
                >
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-secondary" @click="closeModal">
                {{ t('dashboard.crm.cancel') }}
              </button>
              <button
                class="btn-danger"
                :disabled="
                  deleteConfirmText.toLowerCase() !==
                    t('dashboard.crm.deleteTypeWord').toLowerCase() || saving
                "
                @click="executeDelete"
              >
                {{ t('dashboard.crm.delete') }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </template>
  </div>
</template>

<style scoped>
/* ============================================
   BASE LAYOUT - Mobile-first (360px base)
   ============================================ */
.crm-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

/* ============================================
   UPGRADE GATE
   ============================================ */
.upgrade-gate {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 24px;
}

.upgrade-card {
  text-align: center;
  max-width: 420px;
  padding: 48px 32px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.upgrade-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 16px;
  opacity: 0.6;
}

.upgrade-card h2 {
  margin: 0 0 12px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.upgrade-card p {
  margin: 0 0 24px;
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* ============================================
   HEADER
   ============================================ */
.page-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #1e293b;
}

.count-badge {
  background: #e2e8f0;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}

@media (min-width: 480px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

/* ============================================
   BUTTONS
   ============================================ */
.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
  white-space: nowrap;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary:hover {
  background: #1a3238;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  min-height: 44px;
}

.btn-danger:hover {
  background: #b91c1c;
}
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   TOOLBAR
   ============================================ */
.toolbar {
  padding: 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.toolbar-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.search-box {
  position: relative;
  width: 100%;
}

.search-box .search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  opacity: 0.5;
}

.search-box input {
  width: 100%;
  padding: 8px 32px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  min-height: 44px;
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.search-box .clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: #e2e8f0;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}

.segment-control {
  display: flex;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  flex-wrap: wrap;
}

.segment-control button {
  padding: 7px 12px;
  border: none;
  background: white;
  font-size: 0.85rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
  min-height: 44px;
}

.segment-control button:not(:last-child) {
  border-right: 1px solid #e2e8f0;
}

.segment-control button.active {
  background: var(--color-primary, #23424a);
  color: white;
}

.segment-control button:hover:not(.active) {
  background: #f8fafc;
}

@media (min-width: 768px) {
  .toolbar-row {
    flex-direction: row;
    align-items: center;
  }

  .search-box {
    max-width: 320px;
  }
}

/* ============================================
   ALERTS & LOADING
   ============================================ */
.alert-error {
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
  color: #64748b;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e2e8f0;
  border-top-color: var(--color-primary, #23424a);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ============================================
   TABLE
   ============================================ */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}

.data-table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  padding: 12px 14px;
  text-align: left;
  font-weight: 600;
  font-size: 0.8rem;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
  z-index: 10;
}

.data-table td {
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.9rem;
  color: #334155;
}

.data-table tr:hover {
  background: #f8fafc;
}

.col-type {
  width: 110px;
}
.col-actions {
  width: 90px;
}
.col-vertical {
  max-width: 160px;
}
.text-small {
  font-size: 0.8rem;
}

.truncate {
  display: block;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.link {
  color: var(--color-primary, #23424a);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.row-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #f8fafc;
}
.action-btn.delete:hover {
  background: #fee2e2;
  border-color: #fca5a5;
}

.empty-cell {
  text-align: center;
}

.empty-state {
  padding: 60px 20px;
  color: #64748b;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.3;
  display: block;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 0 0 16px;
}

/* ============================================
   MODALS
   ============================================ */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
  backdrop-filter: blur(2px);
}

.modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalIn 0.2s ease-out;
  max-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-sm {
  max-width: 420px;
}
.modal-md {
  max-width: 540px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.modal-header.danger {
  background: #fef2f2;
  border-color: #fecaca;
}

.modal-header.danger h3 {
  color: #dc2626;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #475569;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 0 0 16px 16px;
  flex-shrink: 0;
}

/* ============================================
   FORMS
   ============================================ */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #475569;
  margin-bottom: 6px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  min-height: 44px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.form-group.half {
  width: 100%;
}

@media (min-width: 480px) {
  .form-row {
    flex-direction: row;
    gap: 16px;
  }

  .form-group.half {
    width: calc(50% - 8px);
  }
}
</style>
