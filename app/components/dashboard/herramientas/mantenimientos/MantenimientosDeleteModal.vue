<script setup lang="ts">
/**
 * Delete confirmation modal for maintenance records.
 * Teleported to body for proper stacking context.
 */
import type { MaintenanceRecord } from '~/composables/dashboard/useDashboardMantenimientos'

defineProps<{
  show: boolean
  deleteTarget: MaintenanceRecord | null
  saving: boolean
  fmt: (val: number) => string
  fmtDate: (date: string) => string
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
          <span>{{ t('dashboard.tools.maintenance.deleteTitle') }}</span>
          <button @click="emit('close')">&times;</button>
        </div>
        <div class="modal-body">
          <p>{{ t('dashboard.tools.maintenance.deleteConfirm') }}</p>
          <div v-if="deleteTarget" class="delete-info">
            <strong>{{ deleteTarget.vehicle_brand }} {{ deleteTarget.vehicle_model }}</strong>
            &mdash; {{ fmtDate(deleteTarget.date) }} &mdash; {{ fmt(deleteTarget.cost) }}
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" @click="emit('close')">
            {{ t('dashboard.tools.maintenance.form.cancel') }}
          </button>
          <button class="btn btn-danger" :disabled="saving" @click="emit('confirm')">
            {{ t('dashboard.tools.maintenance.confirmDelete') }}
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
  padding: 16px;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 600;
  position: sticky;
  top: 0;
  background: #fff;
  border-radius: 12px 12px 0 0;
}

.modal-head button {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: #9ca3af;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.modal-head button:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 16px;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  border-radius: 0 0 12px 12px;
  position: sticky;
  bottom: 0;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s;
}

.btn:hover {
  background: #f8fafc;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  font-weight: 600;
  min-height: 44px;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Delete info */
.delete-info {
  padding: 12px;
  background: #f3f4f6;
  border-radius: 6px;
  text-align: center;
  margin-top: 12px;
  font-size: 0.9rem;
}
</style>
