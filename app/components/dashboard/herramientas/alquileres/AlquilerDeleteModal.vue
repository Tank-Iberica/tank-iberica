<script setup lang="ts">
/**
 * Delete confirmation modal for rental records.
 * Teleported to body for proper stacking context.
 */
import type { RentalRecord } from '~/composables/dashboard/useDashboardAlquileres'

defineProps<{
  show: boolean
  deleteTarget: RentalRecord | null
  saving: boolean
}>()

const emit = defineEmits<{
  confirm: []
  close: []
}>()

const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="modal-bg" @click.self="emit('close')">
      <div class="modal">
        <div class="modal-head">
          <span>{{ t('dashboard.tools.rentals.deleteTitle') }}</span>
          <button @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ t('dashboard.tools.rentals.deleteConfirm') }}</p>
          <div v-if="deleteTarget" class="delete-info">
            <strong>{{ deleteTarget.vehicle_brand }} {{ deleteTarget.vehicle_model }}</strong>
            &mdash; {{ deleteTarget.client_name }}
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="emit('close')">
            {{ t('dashboard.tools.rentals.form.cancel') }}
          </button>
          <button class="btn btn-danger" :disabled="saving" @click="emit('confirm')">
            {{ t('dashboard.tools.rentals.confirmDelete') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Modal */
.modal-bg {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  width: 100%;
  max-width: 35rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--color-gray-200);
  font-weight: 600;
  position: sticky;
  top: 0;
  background: var(--bg-primary);
  border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
}

.modal-head button {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: var(--text-disabled);
  width: 2.75rem;
  height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius);
}

.modal-head button:hover {
  background: var(--bg-secondary);
}

.modal-body {
  padding: 1rem;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
  border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
  position: sticky;
  bottom: 0;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1rem;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background 0.15s;
}

.btn:hover {
  background: var(--bg-secondary);
}

.btn-danger {
  background: var(--color-error);
  color: white;
  border: none;
  font-weight: 600;
  min-height: 2.75rem;
  padding: 0.625rem 1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-danger:hover {
  background: var(--color-error);
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Delete info */
.delete-info {
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  text-align: center;
  margin-top: 0.75rem;
  font-size: 0.9rem;
}
</style>
