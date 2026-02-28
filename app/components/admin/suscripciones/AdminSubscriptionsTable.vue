<script setup lang="ts">
import {
  SUBSCRIPTION_PREFS,
  type AdminSubscription,
} from '~/composables/admin/useAdminSubscriptions'

defineProps<{
  subscriptions: AdminSubscription[]
}>()

const emit = defineEmits<{
  (e: 'confirm-delete', sub: AdminSubscription): void
}>()

function getActivePrefs(sub: AdminSubscription) {
  return SUBSCRIPTION_PREFS.filter((p) => sub[p.key] === true)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="table-container">
    <table class="admin-table">
      <thead>
        <tr>
          <th>Email</th>
          <th>Preferencias</th>
          <th style="width: 100px">Fecha</th>
          <th style="width: 80px">Acciones</th>
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
                :style="{
                  backgroundColor: pref.color + '18',
                  color: pref.color,
                  borderColor: pref.color + '40',
                }"
              >
                {{ pref.label }}
              </span>
              <span v-if="getActivePrefs(sub).length === 0" class="no-prefs">Sin preferencias</span>
            </div>
          </td>
          <td>{{ formatDate(sub.created_at) }}</td>
          <td>
            <div class="action-buttons">
              <button
                class="btn-icon btn-delete"
                title="Eliminar"
                @click="emit('confirm-delete', sub)"
              >
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
</template>

<style scoped>
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
</style>
