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
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.data-table td {
  padding: 12px 16px;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
}

.table-row {
  cursor: pointer;
  transition: background 0.15s;
}

.table-row:hover {
  background: #f8fafc;
}

.table-row.expanded {
  background: #f1f5f9;
}

.cell-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-icon {
  font-size: 1.1rem;
}

.type-label {
  font-weight: 500;
}

.cell-vehicle {
  font-weight: 600;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-requester {
  font-family: monospace;
  font-size: 0.8rem;
  color: #64748b;
}

.table-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-select {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 0.8rem;
  min-height: 36px;
  background: white;
  cursor: pointer;
}

.status-select:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.status-progress {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-badge.status-completed {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.status-cancelled {
  background: #fee2e2;
  color: #dc2626;
}

/* Partner notification */
.partner-notified {
  color: #16a34a;
  font-size: 0.85rem;
  font-weight: 500;
}

.partner-pending {
  color: #94a3b8;
  font-size: 0.85rem;
  font-style: italic;
}

.btn-notify {
  padding: 8px 14px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 44px;
  white-space: nowrap;
}

.btn-notify:hover {
  background: #1d4ed8;
}

.btn-notify:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Expanded row */
.expanded-row td {
  padding: 0;
  border-bottom: 2px solid #e2e8f0;
}

.expanded-content {
  padding: 16px;
  background: #f8fafc;
}

.expanded-content h4 {
  margin: 0 0 12px 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 6px 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-key {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  text-transform: capitalize;
}

.detail-val {
  font-size: 0.85rem;
  color: #1e293b;
  font-weight: 500;
  text-align: right;
  word-break: break-word;
  max-width: 60%;
}

.no-details {
  margin: 0;
  color: #94a3b8;
  font-size: 0.9rem;
  font-style: italic;
}

@media (min-width: 768px) {
  .desktop-only {
    display: block;
  }

  .details-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .details-grid {
    grid-template-columns: 1fr 1fr 1fr;
  }
}
</style>
