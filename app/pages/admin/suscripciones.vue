<script setup lang="ts">
import {
  useAdminSubscriptions,
  SUBSCRIPTION_PREFS,
  type AdminSubscription,
  type SubscriptionFilters,
} from '~/composables/admin/useAdminSubscriptions'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  subscriptions,
  loading,
  error,
  total,
  fetchSubscriptions,
  deleteSubscription,
  exportCSV,
} = useAdminSubscriptions()

// Filters
const filters = ref<SubscriptionFilters>({
  search: '',
})

// Delete confirmation
const deleteModal = ref({
  show: false,
  subscription: null as AdminSubscription | null,
  confirmText: '',
})

// Computed
const canDelete = computed(() => deleteModal.value.confirmText.toLowerCase() === 'borrar')

// Load data
onMounted(async () => {
  await fetchSubscriptions()
})

// Watch filters
watch(filters, () => {
  fetchSubscriptions(filters.value)
}, { deep: true })

// Get active prefs for a subscription
function getActivePrefs(sub: AdminSubscription) {
  return SUBSCRIPTION_PREFS.filter(p => sub[p.key] === true)
}

// Delete functions
function confirmDelete(sub: AdminSubscription) {
  deleteModal.value = { show: true, subscription: sub, confirmText: '' }
}

function closeDeleteModal() {
  deleteModal.value = { show: false, subscription: null, confirmText: '' }
}

async function executeDelete() {
  if (!deleteModal.value.subscription || !canDelete.value) return
  const success = await deleteSubscription(deleteModal.value.subscription.id)
  if (success) {
    closeDeleteModal()
  }
}

function handleExport() {
  exportCSV([...subscriptions.value])
}

// Format helpers
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="admin-suscripciones">
    <!-- Header -->
    <div class="section-header">
      <div class="header-left">
        <h2>Suscripciones</h2>
        <span class="total-badge">{{ total }} registros</span>
      </div>
      <button class="btn-export" @click="handleExport">
        Exportar CSV
      </button>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <input
        v-model="filters.search"
        type="text"
        placeholder="Buscar por email..."
        class="filter-search"
      >
    </div>

    <!-- Error -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      Cargando suscripciones...
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Preferencias</th>
            <th style="width: 100px">
              Fecha
            </th>
            <th style="width: 80px">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sub in subscriptions" :key="sub.id">
            <td class="email-cell">
              {{ sub.email }}
            </td>
            <td>
              <div class="pref-chips">
                <span
                  v-for="pref in getActivePrefs(sub)"
                  :key="pref.key"
                  class="pref-chip"
                  :style="{ backgroundColor: pref.color + '18', color: pref.color, borderColor: pref.color + '40' }"
                >
                  {{ pref.label }}
                </span>
                <span v-if="getActivePrefs(sub).length === 0" class="no-prefs">Sin preferencias</span>
              </div>
            </td>
            <td>{{ formatDate(sub.created_at) }}</td>
            <td>
              <div class="action-buttons">
                <button class="btn-icon btn-delete" title="Eliminar" @click="confirmDelete(sub)">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!subscriptions.length">
            <td colspan="4" class="empty-state">
              No hay suscripciones que coincidan con la búsqueda.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="deleteModal.show" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal-content modal-small">
          <div class="modal-header">
            <h3>Confirmar eliminación</h3>
            <button class="modal-close" @click="closeDeleteModal">
              ×
            </button>
          </div>
          <div class="modal-body">
            <p>
              ¿Estás seguro de eliminar la suscripción de
              <strong>{{ deleteModal.subscription?.email }}</strong>?
            </p>
            <div class="form-group delete-confirm-group">
              <label for="delete-confirm">Escribe <strong>Borrar</strong> para confirmar:</label>
              <input
                id="delete-confirm"
                v-model="deleteModal.confirmText"
                type="text"
                placeholder="Borrar"
                autocomplete="off"
              >
              <p v-if="deleteModal.confirmText && !canDelete" class="text-error">
                Escribe "Borrar" exactamente para continuar
              </p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeDeleteModal">
              Cancelar
            </button>
            <button class="btn-danger" :disabled="!canDelete" @click="executeDelete">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.admin-suscripciones {
  padding: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.section-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.total-badge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 0.85rem;
}

.btn-export {
  background: var(--color-primary, #23424A);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
}

.btn-export:hover {
  opacity: 0.9;
}

/* Filters */
.filters-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-search {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
}

.filter-search:focus {
  outline: none;
  border-color: var(--color-primary, #23424A);
}

/* Error / Loading */
.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

/* Table */
.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.admin-table th,
.admin-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.admin-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.admin-table tr:hover {
  background: #f9fafb;
}

.email-cell {
  font-size: 0.9rem;
  color: #4b5563;
}

/* Preference chips */
.pref-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pref-chip {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  border: 1px solid;
  white-space: nowrap;
}

.no-prefs {
  font-size: 0.8rem;
  color: #9ca3af;
  font-style: italic;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: 1px solid #e5e7eb;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f3f4f6;
}

.btn-delete:hover {
  background: #fee2e2;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-small { max-width: 400px; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 { margin: 0; font-size: 1.25rem; }

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
}

.modal-body { padding: 24px; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* Buttons */
.btn-secondary {
  background: #e5e7eb;
  color: #374151;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* Delete confirmation */
.form-group { margin-bottom: 16px; }

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
  color: #374151;
}

.delete-confirm-group {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.delete-confirm-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
}

.delete-confirm-group input:focus {
  outline: none;
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.text-error {
  color: #dc2626;
  font-size: 0.75rem;
  margin-top: 4px;
}

/* Mobile */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .header-left {
    justify-content: space-between;
  }
}
</style>
