<script setup lang="ts">
import {
  USER_ROLES,
  getRoleConfig,
  getInitials,
  getDisplayName,
  getProviderLabel,
  formatDate,
  type AdminUser,
  type UserRole,
} from '~/composables/admin/useAdminUsuariosPage'

defineProps<{
  users: ReadonlyArray<AdminUser>
  loading: boolean
  error: string | null
}>()

const emit = defineEmits<{
  (e: 'view-detail' | 'confirm-delete', user: AdminUser): void
  (e: 'role-change', user: AdminUser, role: UserRole): void
}>()

function onRoleChange(user: AdminUser, event: Event) {
  const target = event.target as HTMLSelectElement
  emit('role-change', user, target.value as UserRole)
}
</script>

<template>
  <!-- Error -->
  <div v-if="error" class="error-banner">
    {{ error }}
  </div>

  <!-- Loading -->
  <div v-if="loading" class="loading-state">Cargando usuarios...</div>

  <!-- Table -->
  <div v-else class="table-container">
    <table class="admin-table">
      <thead>
        <tr>
          <th style="width: 50px" />
          <th>Pseudónimo</th>
          <th>Nombre</th>
          <th>Email</th>
          <th style="width: 90px">Proveedor</th>
          <th style="width: 100px">Rol</th>
          <th style="width: 100px">Fecha</th>
          <th style="width: 130px">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="u in users" :key="u.id">
          <td>
            <div class="avatar">
              <img v-if="u.avatar_url" :src="u.avatar_url" :alt="u.pseudonimo || u.email" >
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
              :style="{
                borderColor: getRoleConfig(u.role).color,
                color: getRoleConfig(u.role).color,
              }"
              @change="onRoleChange(u, $event)"
            >
              <option v-for="r in USER_ROLES" :key="r.value" :value="r.value">
                {{ r.label }}
              </option>
            </select>
          </td>
          <td>{{ formatDate(u.created_at) }}</td>
          <td>
            <div class="action-buttons">
              <button
                class="btn-icon btn-view"
                title="Ver detalles"
                @click="emit('view-detail', u)"
              >
                👁️
              </button>
              <button
                class="btn-icon btn-delete"
                title="Eliminar"
                @click="emit('confirm-delete', u)"
              >
                🗑️
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!users.length">
          <td colspan="8" class="empty-state">No hay usuarios que coincidan con los filtros.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.error-banner {
  background: var(--color-error-bg, #fef2f2);
  color: var(--color-error);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.table-container {
  background: var(--bg-primary);
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

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
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

.email-cell {
  font-size: 0.9rem;
  color: #4b5563;
}

.provider-badge {
  background: var(--bg-secondary);
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
  background: var(--bg-primary);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  background: none;
  border: 1px solid var(--border-color-light);
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: var(--bg-secondary);
}

.btn-view:hover {
  background: var(--color-info-bg, #dbeafe);
}

.btn-delete:hover {
  background: var(--color-error-bg, #fef2f2);
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}
</style>
