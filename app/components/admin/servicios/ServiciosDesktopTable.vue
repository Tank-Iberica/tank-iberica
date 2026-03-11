<script setup lang="ts">
import type { ServiceRequest, ServiceStatus } from '~/composables/admin/useAdminServicios'

defineProps<{
  requests: ServiceRequest[]
  expandedId: string | null
  updatingStatus: string | null
  notifyingPartner: string | null
  statusOptions: ServiceStatus[]
  getTypeIcon: (type: string) => string
  getTypeLabel: (type: string) => string
  getStatusClass: (status: string) => string
  getStatusLabel: (status: string) => string
  formatDate: (dateStr: string | null) => string
  formatDetailValue: (value: unknown) => string
}>()

const emit = defineEmits<{
  toggleExpand: [id: string]
  updateStatus: [requestId: string, newStatus: string]
  notifyPartner: [requestId: string]
}>()

const { t } = useI18n()
</script>

<template>
  <div class="table-wrapper desktop-only">
    <table class="data-table">
      <thead>
        <tr>
          <th>{{ t('admin.servicios.colType') }}</th>
          <th>{{ t('admin.servicios.colVehicle') }}</th>
          <th>{{ t('admin.servicios.colRequester') }}</th>
          <th>{{ t('admin.servicios.colStatus') }}</th>
          <th>{{ t('admin.servicios.colDate') }}</th>
          <th>{{ t('admin.servicios.colPartnerNotified') }}</th>
          <th>{{ t('admin.servicios.colActions') }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="req in requests" :key="req.id">
          <tr
            class="table-row"
            :class="{ expanded: expandedId === req.id }"
            @click="emit('toggleExpand', req.id)"
          >
            <td class="cell-type">
              <span class="type-icon">{{ getTypeIcon(req.type) }}</span>
              <span class="type-label">{{ getTypeLabel(req.type) }}</span>
            </td>
            <td class="cell-vehicle">{{ req.vehicles?.title || '-' }}</td>
            <td class="cell-requester">{{ req.user_id?.slice(0, 8) }}...</td>
            <td>
              <span class="status-badge" :class="getStatusClass(req.status)">
                {{ getStatusLabel(req.status) }}
              </span>
            </td>
            <td>{{ formatDate(req.created_at) }}</td>
            <td>
              <span v-if="req.partner_notified_at" class="partner-notified">
                {{ formatDate(req.partner_notified_at) }}
              </span>
              <span v-else class="partner-pending">{{ t('admin.servicios.notNotified') }}</span>
            </td>
            <td @click.stop>
              <div class="table-actions">
                <select
                  :value="req.status"
                  :disabled="updatingStatus === req.id"
                  class="status-select"
                  @change="emit('updateStatus', req.id, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="opt in statusOptions" :key="opt" :value="opt">
                    {{ getStatusLabel(opt) }}
                  </option>
                </select>
                <button
                  v-if="!req.partner_notified_at"
                  class="btn-notify"
                  :disabled="notifyingPartner === req.id"
                  @click="emit('notifyPartner', req.id)"
                >
                  {{ t('admin.servicios.notifyPartner') }}
                </button>
              </div>
            </td>
          </tr>
          <!-- Expanded row with details -->
          <tr v-if="expandedId === req.id" class="expanded-row">
            <td colspan="7">
              <div class="expanded-content">
                <h4>{{ t('admin.servicios.details') }}</h4>
                <div v-if="req.details && Object.keys(req.details).length > 0" class="details-grid">
                  <div v-for="(value, key) in req.details" :key="String(key)" class="detail-item">
                    <span class="detail-key">{{ String(key) }}</span>
                    <span class="detail-val">{{ formatDetailValue(value) }}</span>
                  </div>
                </div>
                <p v-else class="no-details">{{ t('admin.servicios.noDetails') }}</p>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.desktop-only {
  display: none;
}

.table-wrapper {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  text-align: left;
  padding: var(--spacing-3) var(--spacing-4);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 1px solid var(--color-gray-200);
  white-space: nowrap;
}

.data-table td {
  padding: var(--spacing-3) var(--spacing-4);
  color: var(--text-primary);
  border-bottom: 1px solid var(--color-gray-100);
}

.table-row {
  cursor: pointer;
  transition: background 0.15s;
}

.table-row:hover {
  background: var(--bg-secondary);
}

.table-row.expanded {
  background: var(--bg-secondary);
}

.cell-type {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.type-icon {
  font-size: 1.1rem;
}

.type-label {
  font-weight: 500;
}

.cell-vehicle {
  font-weight: 600;
  max-width: 12.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-requester {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-auxiliary);
}

.table-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.status-select {
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.8rem;
  min-height: 2.25rem;
  background: var(--bg-primary);
  cursor: pointer;
}

.status-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-md);
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.status-pending {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}

.status-badge.status-progress {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--color-info);
}

.status-badge.status-completed {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
}

.status-badge.status-cancelled {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

/* Partner notification */
.partner-notified {
  color: var(--color-success);
  font-size: 0.85rem;
  font-weight: 500;
}

.partner-pending {
  color: var(--text-disabled);
  font-size: 0.85rem;
  font-style: italic;
}

.btn-notify {
  padding: var(--spacing-2) 0.875rem;
  background: var(--color-focus);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 2.75rem;
  white-space: nowrap;
}

.btn-notify:hover {
  background: var(--color-info);
}

.btn-notify:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Expanded row */
.expanded-row td {
  padding: 0;
  border-bottom: 2px solid var(--color-gray-200);
}

.expanded-content {
  padding: var(--spacing-4);
  background: var(--bg-secondary);
}

.expanded-content h4 {
  margin: 0 0 var(--spacing-3) 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-2);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.375rem 0;
  border-bottom: 1px solid var(--color-gray-200);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-key {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-auxiliary);
  text-transform: capitalize;
}

.detail-val {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: 500;
  text-align: right;
  word-break: break-word;
  max-width: 60%;
}

.no-details {
  margin: 0;
  color: var(--text-disabled);
  font-size: 0.9rem;
  font-style: italic;
}

@media (min-width: 48em) {
  .desktop-only {
    display: block;
  }

  .details-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 64em) {
  .details-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}
</style>
