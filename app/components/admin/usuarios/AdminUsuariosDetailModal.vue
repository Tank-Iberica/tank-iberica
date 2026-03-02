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
  show: boolean
  user: AdminUser | null
  selectedRole: UserRole | ''
  saving: boolean
}>()

const emit = defineEmits<{
  (e: 'close' | 'save'): void
  (e: 'update-selected-role', role: UserRole | ''): void
}>()

function onRoleSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement
  emit('update-selected-role', target.value as UserRole | '')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-content modal-medium">
        <div class="modal-header">
          <h3>Detalles del Usuario</h3>
          <button class="modal-close" @click="emit('close')">×</button>
        </div>
        <div class="modal-body">
          <div v-if="user" class="detail-grid">
            <!-- Avatar & identity -->
            <div class="detail-section full-width user-identity">
              <div class="avatar large">
                <img v-if="user.avatar_url" :src="user.avatar_url" :alt="user.email" >
                <span v-else class="avatar-initials">{{ getInitials(user) }}</span>
              </div>
              <div>
                <h4 class="user-main-name">{{ user.pseudonimo || user.email }}</h4>
                <p class="user-sub-name">{{ getDisplayName(user) }}</p>
              </div>
            </div>

            <!-- Contact -->
            <div class="detail-section">
              <h4>Contacto</h4>
              <p><strong>Email:</strong> {{ user.email }}</p>
              <p v-if="user.phone"><strong>Teléfono:</strong> {{ user.phone }}</p>
              <p><strong>Idioma:</strong> {{ user.lang === 'es' ? 'Español' : 'English' }}</p>
            </div>

            <!-- Account -->
            <div class="detail-section">
              <h4>Cuenta</h4>
              <p><strong>Proveedor:</strong> {{ getProviderLabel(user.provider) }}</p>
              <p><strong>Registro:</strong> {{ formatDate(user.created_at) }}</p>
              <p>
                <strong>Rol actual:</strong>
                <span class="role-badge" :style="{ background: getRoleConfig(user.role).color }">
                  {{ getRoleConfig(user.role).label }}
                </span>
              </p>
            </div>

            <!-- Change role -->
            <div class="detail-section full-width">
              <h4>Cambiar Rol</h4>
              <div class="role-change-row">
                <select
                  :value="selectedRole"
                  class="role-select-large"
                  @change="onRoleSelectChange"
                >
                  <option v-for="r in USER_ROLES" :key="r.value" :value="r.value">
                    {{ r.label }}
                  </option>
                </select>
                <button
                  class="btn-primary"
                  :disabled="saving || selectedRole === user.role"
                  @click="emit('save')"
                >
                  {{ saving ? 'Guardando...' : 'Guardar Rol' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="emit('close')">Cerrar</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
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
  background: var(--bg-primary);
  border-radius: 12px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-medium {
  max-width: 560px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: var(--bg-primary);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 24px;
}

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

.detail-section p:last-child {
  margin-bottom: 0;
}

.user-identity {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
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
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: #374151;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .user-identity {
    flex-direction: column;
    text-align: center;
  }
}
</style>
