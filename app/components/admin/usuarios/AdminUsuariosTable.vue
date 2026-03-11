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
  <div v-if="loading" class="loading-state">{{ $t('common.loadingItems') }}</div>

  <!-- Table -->
  <div v-else class="table-container">
    <table class="admin-table">
      <thead>
        <tr>
          <th style="width: 50px" />
          <th>Pseudónimo</th>
          <th>{{ $t('common.name') }}</th>
          <th>Email</th>
          <th style="width: 90px">Proveedor</th>
          <th style="width: 100px">Rol</th>
          <th style="width: 100px">{{ $t('common.date') }}</th>
          <th style="width: 130px">{{ $t('common.actions') }}</th>
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
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.loading-state {
  text-align: center;
  padding: var(--spacing-10);
  color: var(--color-gray-500);
}

.table-container {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 53.125rem;
}

.admin-table th,
.admin-table td {
  padding: var(--spacing-3) var(--spacing-4);
  text-align: left;
  border-bottom: 1px solid var(--color-gray-200);
}

.admin-table th {
  background: var(--color-gray-50);
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: 0.875rem;
}

.admin-table tr:hover {
  background: var(--color-gray-50);
}

.avatar {
  width: 2.25rem;
  height: 2.25rem;
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
  color: var(--color-gray-500);
  font-size: 0.9rem;
}

.email-cell {
  font-size: 0.9rem;
  color: var(--color-gray-600);
}

.provider-badge {
  background: var(--bg-secondary);
  color: var(--color-gray-500);
  padding: 0.1875rem var(--spacing-2);
  border-radius: var(--border-radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
}

.role-select {
  padding: 0.375rem var(--spacing-2);
  border-radius: var(--border-radius);
  border: 2px solid;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  background: var(--bg-primary);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-2);
}

.btn-icon {
  background: none;
  border: 1px solid var(--border-color-light);
  padding: 0.375rem 0.625rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all 0.2s;
}

.btn-icon:hover {
  background: var(--bg-secondary);
}

.btn-view:hover {
  background: var(--color-info-bg, var(--color-info-bg));
}

.btn-delete:hover {
  background: var(--color-error-bg, var(--color-error-bg));
}

.empty-state {
  text-align: center;
  padding: var(--spacing-10);
  color: var(--color-gray-500);
}
</style>
