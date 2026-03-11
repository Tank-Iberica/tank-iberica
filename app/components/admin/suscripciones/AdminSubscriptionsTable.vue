<script setup lang="ts">
import {
  SUBSCRIPTION_PREFS,
  type AdminSubscription,
} from '~/composables/admin/useAdminSubscriptions'

defineProps<{
  subscriptions: AdminSubscription[]
}>()

const emit = defineEmits<{
  'confirm-delete': [sub: AdminSubscription]
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
          <th style="width: 100px">{{ $t('common.date') }}</th>
          <th style="width: 5rem">{{ $t('common.actions') }}</th>
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
            {{ $t('common.noResults') }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-container {
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 37.5em;
}

.admin-table th,
.admin-table td {
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid var(--bg-tertiary);
}

.admin-table th {
  background: var(--color-gray-50);
  font-weight: 600;
  color: var(--color-gray-700);
  font-size: var(--font-size-sm);
}

.admin-table tr:hover {
  background: var(--color-gray-50);
}

.email-cell {
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
}

.pref-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.pref-chip {
  padding: 0.1875rem 0.625rem;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  font-weight: 600;
  border: 1px solid;
  white-space: nowrap;
}

.no-prefs {
  font-size: var(--font-size-xs);
  color: var(--text-disabled);
  font-style: italic;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: 1px solid var(--border-color-light);
  padding: 0.375rem 0.625rem;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.btn-icon:hover {
  background: var(--bg-secondary);
}

.btn-delete:hover {
  background: var(--color-error-bg, var(--color-error-bg));
}

.empty-state {
  text-align: center;
  padding: 2.5rem;
  color: var(--color-gray-500);
}
</style>
