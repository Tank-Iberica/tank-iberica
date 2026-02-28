<script setup lang="ts">
import type { SearchAlert } from '~/composables/usePerfilAlertas'

defineProps<{
  alert: SearchAlert
  filterSummary: string
  frequencyLabel: string
}>()

const emit = defineEmits<{
  (e: 'toggle-active' | 'edit' | 'delete'): void
}>()
</script>

<template>
  <div class="alert-card" :class="{ 'alert-card--inactive': !alert.active }">
    <div class="alert-info">
      <p class="alert-filters">{{ filterSummary }}</p>
      <div class="alert-meta">
        <span class="alert-frequency">{{ frequencyLabel }}</span>
        <span class="alert-date">{{ new Date(alert.created_at).toLocaleDateString() }}</span>
      </div>
    </div>

    <div class="alert-actions">
      <label class="toggle" :class="{ 'toggle--active': alert.active }">
        <input
          type="checkbox"
          class="toggle__input"
          :checked="alert.active"
          @change="emit('toggle-active')"
        >
        <span class="toggle__slider" />
      </label>

      <button class="btn-edit" :aria-label="$t('common.edit')" @click="emit('edit')">
        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path
            d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
          />
        </svg>
      </button>

      <button class="btn-delete" :aria-label="$t('common.delete')" @click="emit('delete')">
        <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" aria-hidden="true">
          <path
            fill-rule="evenodd"
            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.alert-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  transition: opacity var(--transition-fast);
}

.alert-card--inactive {
  opacity: 0.6;
}

.alert-info {
  flex: 1;
  min-width: 0;
}

.alert-filters {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: 0.375rem;
  word-break: break-word;
}

.alert-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.alert-frequency {
  background: var(--bg-secondary);
  padding: 0.125rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-medium);
}

.alert-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
  width: 44px;
  height: 24px;
  min-height: 44px;
  min-width: 44px;
  justify-content: center;
}

.toggle__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle__slider {
  position: absolute;
  width: 44px;
  height: 24px;
  background-color: var(--color-gray-300);
  border-radius: var(--border-radius-full);
  transition: background-color var(--transition-fast);
}

.toggle__slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: var(--color-white);
  border-radius: 50%;
  transition: transform var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.toggle--active .toggle__slider {
  background-color: var(--color-primary);
}

.toggle--active .toggle__slider::before {
  transform: translateX(20px);
}

.btn-delete,
.btn-edit {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-auxiliary);
  border-radius: var(--border-radius);
  transition:
    color var(--transition-fast),
    background var(--transition-fast);
}

.btn-delete:hover {
  color: var(--color-error);
  background: var(--bg-secondary);
}

.btn-edit:hover {
  color: var(--color-primary);
  background: var(--bg-secondary);
}
</style>
