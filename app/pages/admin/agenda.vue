<script setup lang="ts">
import {
  useAdminContacts,
  CONTACT_TYPES,
  type Contact,
  type ContactType,
  type ContactFormData,
  type ContactFilters,
} from '~/composables/admin/useAdminContacts'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

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
const activeModal = ref<'form' | 'delete' | null>(null)
const editingContact = ref<Contact | null>(null)

const emptyForm: ContactFormData = {
  contact_type: 'client',
  company: '',
  contact_name: '',
  phone: '',
  email: '',
  location: '',
  products: '',
  notes: '',
}

const formData = ref<ContactFormData>({ ...emptyForm })
const deleteConfirmText = ref('')
const deletingContact = ref<Contact | null>(null)

function openCreateModal() {
  editingContact.value = null
  formData.value = { ...emptyForm }
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
  }
  else {
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

function getTypeLabel(type: ContactType): string {
  return CONTACT_TYPES.find(t => t.value === type)?.label || type
}

function getTypeColor(type: ContactType): string {
  return CONTACT_TYPES.find(t => t.value === type)?.color || '#64748b'
}

// Load data
onMounted(() => fetchContacts(filters.value))
watch(filters, () => fetchContacts(filters.value), { deep: true })
</script>

<template>
  <div class="agenda-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-left">
        <h1>Agenda</h1>
        <span class="count-badge">{{ total }}</span>
      </div>
      <button class="btn-primary" @click="openCreateModal">
        + Nuevo contacto
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
            placeholder="Buscar empresa, nombre, email, producto..."
          >
          <button v-if="filters.search" class="clear-btn" @click="filters.search = ''">&#215;</button>
        </div>

        <div class="filter-group">
          <label class="filter-label">Tipo:</label>
          <div class="segment-control">
            <button
              :class="{ active: !filters.contact_type }"
              @click="filters.contact_type = null"
            >
              Todos
            </button>
            <button
              v-for="ct in CONTACT_TYPES"
              :key="ct.value"
              :class="{ active: filters.contact_type === ct.value }"
              @click="filters.contact_type = ct.value"
            >
              {{ ct.label }}
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
      <span>Cargando contactos...</span>
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th class="col-type">Tipo</th>
            <th>Empresa</th>
            <th>Contacto</th>
            <th>Telefono</th>
            <th>Email</th>
            <th>Ubicacion</th>
            <th>Productos</th>
            <th class="col-actions">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in contacts" :key="c.id">
            <td class="col-type">
              <span class="type-pill" :style="{ background: getTypeColor(c.contact_type) + '20', color: getTypeColor(c.contact_type) }">
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
            <td class="text-small col-products">
              <span class="truncate">{{ c.products || '-' }}</span>
            </td>
            <td class="col-actions">
              <div class="row-actions">
                <button class="action-btn" title="Editar" @click="openEditModal(c)">&#9998;&#65039;</button>
                <button class="action-btn delete" title="Eliminar" @click="openDeleteModal(c)">&#128465;&#65039;</button>
              </div>
            </td>
          </tr>
          <tr v-if="contacts.length === 0">
            <td colspan="8" class="empty-cell">
              <div class="empty-state">
                <span class="empty-icon">&#128210;</span>
                <p>No hay contactos</p>
                <button class="btn-primary" @click="openCreateModal">Crear primer contacto</button>
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
            <h3>{{ editingContact ? 'Editar contacto' : 'Nuevo contacto' }}</h3>
            <button class="modal-close" @click="closeModal">&#215;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Tipo *</label>
              <select v-model="formData.contact_type">
                <option v-for="ct in CONTACT_TYPES" :key="ct.value" :value="ct.value">
                  {{ ct.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>Empresa</label>
              <input v-model="formData.company" type="text" placeholder="Nombre de la empresa">
            </div>
            <div class="form-group">
              <label>Nombre de contacto *</label>
              <input v-model="formData.contact_name" type="text" placeholder="Nombre y apellidos">
            </div>
            <div class="form-row">
              <div class="form-group half">
                <label>Telefono</label>
                <input v-model="formData.phone" type="tel" placeholder="+34 600 000 000">
              </div>
              <div class="form-group half">
                <label>Email</label>
                <input v-model="formData.email" type="email" placeholder="email@empresa.com">
              </div>
            </div>
            <div class="form-group">
              <label>Ubicacion</label>
              <input v-model="formData.location" type="text" placeholder="Ciudad, pais">
            </div>
            <div class="form-group">
              <label>Producto/s que maneja</label>
              <input v-model="formData.products" type="text" placeholder="Camiones, furgonetas, gruas...">
            </div>
            <div class="form-group">
              <label>Notas</label>
              <textarea v-model="formData.notes" rows="3" placeholder="Notas internas..." />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModal">Cancelar</button>
            <button
              class="btn-primary"
              :disabled="saving || !formData.contact_name.trim()"
              @click="submitForm"
            >
              {{ saving ? 'Guardando...' : editingContact ? 'Guardar' : 'Crear' }}
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
            <h3>Eliminar contacto</h3>
            <button class="modal-close" @click="closeModal">&#215;</button>
          </div>
          <div class="modal-body">
            <p>
              &#191;Eliminar a <strong>{{ deletingContact?.contact_name }}</strong>
              <span v-if="deletingContact?.company"> ({{ deletingContact.company }})</span>?
            </p>
            <div class="form-group">
              <label>Escribe <strong>borrar</strong> para confirmar:</label>
              <input v-model="deleteConfirmText" type="text" placeholder="borrar" autocomplete="off">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModal">Cancelar</button>
            <button
              class="btn-danger"
              :disabled="deleteConfirmText.toLowerCase() !== 'borrar' || saving"
              @click="executeDelete"
            >
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* ============================================
   BASE LAYOUT — Mobile-first
   ============================================ */
.agenda-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  background: var(--color-primary, #23424A);
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
  white-space: nowrap;
}

.btn-primary:hover { background: #1a3238; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary {
  background: white;
  color: #475569;
  border: 1px solid #e2e8f0;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:hover { background: #f8fafc; border-color: #cbd5e1; }

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.btn-danger:hover { background: #b91c1c; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

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
}

.search-box input:focus {
  outline: none;
  border-color: var(--color-primary, #23424A);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.search-box .clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: #e2e8f0;
  border: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
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
  min-height: 36px;
}

.segment-control button:not(:last-child) {
  border-right: 1px solid #e2e8f0;
}

.segment-control button.active {
  background: var(--color-primary, #23424A);
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
  border-top-color: var(--color-primary, #23424A);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ============================================
   TABLE
   ============================================ */
.table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: auto;
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

.col-type { width: 100px; }
.col-actions { width: 90px; }
.col-products { max-width: 160px; }
.text-small { font-size: 0.8rem; }

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
  color: var(--color-primary, #23424A);
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
  min-width: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover { background: #f8fafc; }
.action-btn.delete:hover { background: #fee2e2; border-color: #fca5a5; }

.empty-cell { text-align: center; }

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
  from { opacity: 0; transform: scale(0.95) translateY(-10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-sm { max-width: 420px; }
.modal-md { max-width: 540px; }

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

.modal-header.danger h3 { color: #dc2626; }

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
  min-width: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover { color: #475569; }

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
  border-color: var(--color-primary, #23424A);
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
