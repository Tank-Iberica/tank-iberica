<script setup lang="ts">
import {
  useAdminUsers,
  USER_ROLES,
  type AdminUser,
  type UserRole,
  type UserFilters,
} from '~/composables/admin/useAdminUsers'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const {
  users,
  loading,
  saving,
  error,
  total,
  stats,
  fetchUsers,
  updateRole,
  deleteUser,
  exportCSV,
} = useAdminUsers()

// Filters
const filters = ref<UserFilters>({
  role: null,
  search: '',
})

// Delete confirmation
const deleteModal = ref({
  show: false,
  user: null as AdminUser | null,
  confirmText: '',
})

// Detail modal
const detailModal = ref({
  show: false,
  user: null as AdminUser | null,
  selectedRole: '' as UserRole | '',
})

// Computed
const canDelete = computed(() => deleteModal.value.confirmText.toLowerCase() === 'borrar')

// Load data
onMounted(async () => {
  await fetchUsers()
})

// Watch filters
watch(filters, () => {
  fetchUsers(filters.value)
}, { deep: true })

// Role helpers
function getRoleConfig(role: UserRole) {
  return USER_ROLES.find(r => r.value === role) || USER_ROLES[0]
}

// Quick role update
async function handleRoleChange(user: AdminUser, newRole: UserRole) {
  await updateRole(user.id, newRole)
}

// Open detail modal
function openDetail(user: AdminUser) {
  detailModal.value = {
    show: true,
    user,
    selectedRole: user.role,
  }
}

function closeDetail() {
  detailModal.value = { show: false, user: null, selectedRole: '' }
}

async function saveRole() {
  if (!detailModal.value.user || !detailModal.value.selectedRole) return
  const success = await updateRole(detailModal.value.user.id, detailModal.value.selectedRole as UserRole)
  if (success) {
    closeDetail()
    await fetchUsers(filters.value)
  }
}

// Delete functions
function confirmDelete(user: AdminUser) {
  deleteModal.value = { show: true, user, confirmText: '' }
}

function closeDeleteModal() {
  deleteModal.value = { show: false, user: null, confirmText: '' }
}

async function executeDelete() {
  if (!deleteModal.value.user || !canDelete.value) return
  const success = await deleteUser(deleteModal.value.user.id)
  if (success) {
    closeDeleteModal()
  }
}

// Format helpers
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getDisplayName(user: AdminUser): string {
  if (user.name || user.apellidos) {
    return [user.name, user.apellidos].filter(Boolean).join(' ')
  }
  return '-'
}

function getInitials(user: AdminUser): string {
  if (user.name) return user.name.charAt(0).toUpperCase()
  if (user.pseudonimo) return user.pseudonimo.charAt(0).toUpperCase()
  return user.email.charAt(0).toUpperCase()
}

function getProviderLabel(provider: string): string {
  const map: Record<string, string> = { email: 'Email', google: 'Google' }
  return map[provider] || provider
}

function handleExport() {
  exportCSV([...users.value])
}
</script>

<template>
  <div class="admin-usuarios">
    <!-- Header -->
    <div class="section-header">
      <div class="header-left">
        <h2>Usuarios</h2>
        <span class="total-badge">{{ total }} registros</span>
      </div>
      <button class="btn-export" @click="handleExport">
        Exportar CSV
      </button>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-value">{{ stats.total }}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat-card">
        <span class="stat-value" style="color: #3b82f6">{{ stats.users }}</span>
        <span class="stat-label">Usuarios</span>
      </div>
      <div class="stat-card">
        <span class="stat-value" style="color: #8b5cf6">{{ stats.admins }}</span>
        <span class="stat-label">Admins</span>
      </div>
      <div class="stat-card">
        <span class="stat-value" style="color: #9ca3af">{{ stats.visitors }}</span>
        <span class="stat-label">Visitantes</span>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="filter-group status-filter">
        <button
          class="filter-btn"
          :class="{ active: filters.role === null }"
          @click="filters.role = null"
        >
          Todos
        </button>
        <button
          v-for="r in USER_ROLES"
          :key="r.value"
          class="filter-btn"
          :class="{ active: filters.role === r.value }"
          :style="filters.role === r.value ? { backgroundColor: r.color, color: 'white' } : {}"
          @click="filters.role = r.value"
        >
          {{ r.label }}
        </button>
      </div>
      <input
        v-model="filters.search"
        type="text"
        placeholder="Buscar por nombre, email, pseudónimo..."
        class="filter-search"
      >
    </div>

    <!-- Error -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      Cargando usuarios...
    </div>

    <!-- Table -->
    <div v-else class="table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width: 50px" />
            <th>Pseudónimo</th>
            <th>Nombre</th>
            <th>Email</th>
            <th style="width: 90px">
              Proveedor
            </th>
            <th style="width: 100px">
              Rol
            </th>
            <th style="width: 100px">
              Fecha
            </th>
            <th style="width: 130px">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>
              <div class="avatar">
                <img v-if="u.avatar_url" :src="u.avatar_url" :alt="u.pseudonimo || u.email">
                <span v-else class="avatar-initials">{{ getInitials(u) }}</span>
              </div>
            </td>
            <td>
              <strong>{{ u.pseudonimo || '-' }}</strong>
            </td>
            <td>{{ getDisplayName(u) }}</td>
            <td class="email-cell">
              {{ u.email }}
            </td>
            <td>
              <span class="provider-badge">{{ getProviderLabel(u.provider) }}</span>
            </td>
            <td>
              <select
                :value="u.role"
                class="role-select"
                :style="{ borderColor: getRoleConfig(u.role).color, color: getRoleConfig(u.role).color }"
                @change="handleRoleChange(u, ($event.target as HTMLSelectElement).value as UserRole)"
              >
                <option v-for="r in USER_ROLES" :key="r.value" :value="r.value">
                  {{ r.label }}
                </option>
              </select>
            </td>
            <td>{{ formatDate(u.created_at) }}</td>
            <td>
              <div class="action-buttons">
                <button class="btn-icon btn-view" title="Ver detalles" @click="openDetail(u)">
                  👁️
                </button>
                <button class="btn-icon btn-delete" title="Eliminar" @click="confirmDelete(u)">
                  🗑️
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!users.length">
            <td colspan="8" class="empty-state">
              No hay usuarios que coincidan con los filtros.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Detail Modal -->
    <Teleport to="body">
      <div v-if="detailModal.show" class="modal-overlay" @click.self="closeDetail">
        <div class="modal-content modal-medium">
          <div class="modal-header">
            <h3>Detalles del Usuario</h3>
            <button class="modal-close" @click="closeDetail">
              ×
            </button>
          </div>
          <div class="modal-body">
            <div v-if="detailModal.user" class="detail-grid">
              <!-- Avatar & identity -->
              <div class="detail-section full-width user-identity">
                <div class="avatar large">
                  <img v-if="detailModal.user.avatar_url" :src="detailModal.user.avatar_url" :alt="detailModal.user.email">
                  <span v-else class="avatar-initials">{{ getInitials(detailModal.user) }}</span>
                </div>
                <div>
                  <h4 class="user-main-name">{{ detailModal.user.pseudonimo || detailModal.user.email }}</h4>
                  <p class="user-sub-name">{{ getDisplayName(detailModal.user) }}</p>
                </div>
              </div>

              <!-- Contact -->
              <div class="detail-section">
                <h4>Contacto</h4>
                <p><strong>Email:</strong> {{ detailModal.user.email }}</p>
                <p v-if="detailModal.user.phone"><strong>Teléfono:</strong> {{ detailModal.user.phone }}</p>
                <p><strong>Idioma:</strong> {{ detailModal.user.lang === 'es' ? 'Español' : 'English' }}</p>
              </div>

              <!-- Account -->
              <div class="detail-section">
                <h4>Cuenta</h4>
                <p><strong>Proveedor:</strong> {{ getProviderLabel(detailModal.user.provider) }}</p>
                <p><strong>Registro:</strong> {{ formatDate(detailModal.user.created_at) }}</p>
                <p>
                  <strong>Rol actual:</strong>
                  <span
                    class="role-badge"
                    :style="{ background: getRoleConfig(detailModal.user.role).color }"
                  >
                    {{ getRoleConfig(detailModal.user.role).label }}
                  </span>
                </p>
              </div>

              <!-- Change role -->
              <div class="detail-section full-width">
                <h4>Cambiar Rol</h4>
                <div class="role-change-row">
                  <select v-model="detailModal.selectedRole" class="role-select-large">
                    <option v-for="r in USER_ROLES" :key="r.value" :value="r.value">
                      {{ r.label }}
                    </option>
                  </select>
                  <button
                    class="btn-primary"
                    :disabled="saving || detailModal.selectedRole === detailModal.user.role"
                    @click="saveRole"
                  >
                    {{ saving ? 'Guardando...' : 'Guardar Rol' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="closeDetail">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </Teleport>

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
              ¿Estás seguro de eliminar al usuario
              <strong>{{ deleteModal.user?.pseudonimo || deleteModal.user?.email }}</strong>?
            </p>
            <p class="text-warning">
              Esta acción eliminará la cuenta y todos sus datos asociados.
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
.admin-usuarios {
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

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
}

.stat-label {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 4px;
}

/* Filters */
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  gap: 0;
}

.status-filter {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.filter-btn {
  padding: 8px 12px;
  border: none;
  background: white;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s;
}

.filter-btn:not(:last-child) {
  border-right: 1px solid #e5e7eb;
}

.filter-btn.active {
  background: var(--color-primary, #23424A);
  color: white;
}

.filter-btn:hover:not(.active) {
  background: #f3f4f6;
}

.filter-search {
  flex: 1;
  min-width: 200px;
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
  min-width: 850px;
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

/* Avatar */
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar.large {
  width: 64px;
  height: 64px;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-weight: 600;
  color: #6b7280;
  font-size: 0.9rem;
}

.avatar.large .avatar-initials {
  font-size: 1.5rem;
}

.email-cell {
  font-size: 0.9rem;
  color: #4b5563;
}

.provider-badge {
  background: #f3f4f6;
  color: #6b7280;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.role-select {
  padding: 6px 8px;
  border-radius: 6px;
  border: 2px solid;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  background: white;
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

.btn-view:hover {
  background: #dbeafe;
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
.modal-medium { max-width: 560px; }

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
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
  position: sticky;
  bottom: 0;
}

/* Detail grid */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.detail-section {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
}

.detail-section.full-width {
  grid-column: 1 / -1;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-section p {
  margin: 0 0 8px 0;
  font-size: 0.95rem;
}

.detail-section p:last-child { margin-bottom: 0; }

.user-identity {
  display: flex;
  align-items: center;
  gap: 16px;
  background: white;
  border: 1px solid #e5e7eb;
}

.user-main-name {
  margin: 0 0 4px 0 !important;
  font-size: 1.15rem !important;
  color: #111827;
  text-transform: none !important;
  letter-spacing: 0 !important;
}

.user-sub-name {
  color: #6b7280;
  margin: 0 !important;
  font-size: 0.9rem;
}

.role-badge {
  display: inline-block;
  color: white;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-left: 4px;
}

.role-change-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.role-select-large {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
}

/* Buttons */
.btn-primary {
  background: var(--color-primary, #23424A);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

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

.text-warning {
  color: #d97706;
  font-size: 0.85rem;
  background: #fffbeb;
  padding: 8px 12px;
  border-radius: 6px;
  margin-top: 8px;
}

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

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filters-bar {
    flex-direction: column;
  }

  .status-filter {
    overflow-x: auto;
    width: 100%;
  }

  .filter-btn {
    white-space: nowrap;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .user-identity {
    flex-direction: column;
    text-align: center;
  }
}
</style>
