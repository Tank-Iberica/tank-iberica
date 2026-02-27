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
  <div class="card-list mobile-only">
    <div
      v-for="req in requests"
      :key="req.id"
      class="request-card"
      :class="{ expanded: expandedId === req.id }"
    >
      <button class="card-header" @click="emit('toggleExpand', req.id)">
        <div class="card-top">
          <span class="card-type">
            <span class="type-icon">{{ getTypeIcon(req.type) }}</span>
            {{ getTypeLabel(req.type) }}
          </span>
          <span class="status-badge" :class="getStatusClass(req.status)">
            {{ getStatusLabel(req.status) }}
          </span>
        </div>
        <div class="card-details">
          <div class="card-detail">
            <span class="detail-label">{{ t('admin.servicios.colVehicle') }}</span>
            <span class="detail-value">{{ req.vehicles?.title || '-' }}</span>
          </div>
          <div class="card-detail">
            <span class="detail-label">{{ t('admin.servicios.colDate') }}</span>
            <span class="detail-value">{{ formatDate(req.created_at) }}</span>
          </div>
          <div class="card-detail">
            <span class="detail-label">{{ t('admin.servicios.colPartnerNotified') }}</span>
            <span class="detail-value">
              {{
                req.partner_notified_at
                  ? formatDate(req.partner_notified_at)
                  : t('admin.servicios.notNotified')
              }}
            </span>
          </div>
        </div>
        <div class="card-expand-icon">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            :class="{ rotated: expandedId === req.id }"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      <!-- Expanded section -->
      <div v-if="expandedId === req.id" class="card-expanded">
        <div class="expanded-field">
          <label>{{ t('admin.servicios.colRequester') }}</label>
          <span>{{ req.user_id?.slice(0, 8) }}...</span>
        </div>
        <div class="expanded-field">
          <label>{{ t('admin.servicios.colStatus') }}</label>
          <select
            :value="req.status"
            :disabled="updatingStatus === req.id"
            @change="emit('updateStatus', req.id, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="opt in statusOptions" :key="opt" :value="opt">
              {{ getStatusLabel(opt) }}
            </option>
          </select>
        </div>
        <button
          v-if="!req.partner_notified_at"
          class="btn-notify"
          :disabled="notifyingPartner === req.id"
          @click="emit('notifyPartner', req.id)"
        >
          {{ t('admin.servicios.notifyPartner') }}
        </button>
        <div v-if="req.details && Object.keys(req.details).length > 0" class="expanded-details">
          <h4>{{ t('admin.servicios.details') }}</h4>
          <div class="details-grid">
            <div v-for="(value, key) in req.details" :key="String(key)" class="detail-item">
              <span class="detail-key">{{ String(key) }}</span>
              <span class="detail-val">{{ formatDetailValue(value) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mobile-only {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.request-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.request-card:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}

.request-card.expanded {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  min-height: 44px;
}

.card-header:hover {
  background: #f8fafc;
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.card-type {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  color: #1e293b;
}

.type-icon {
  font-size: 1.1rem;
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

.card-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.card-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 0.75rem;
  color: #94a3b8;
  font-weight: 500;
}

.detail-value {
  font-size: 0.85rem;
  color: #1e293b;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-expand-icon {
  display: flex;
  justify-content: center;
  color: #94a3b8;
}

.card-expand-icon svg {
  transition: transform 0.2s;
}

.card-expand-icon svg.rotated {
  transform: rotate(180deg);
}

/* Card expanded section */
.card-expanded {
  padding: 0 16px 16px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
}

.expanded-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.expanded-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}

.expanded-field select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.9rem;
  min-height: 44px;
  background: white;
  cursor: pointer;
  width: 100%;
}

.expanded-field select:focus {
  outline: none;
  border-color: var(--color-primary, #23424a);
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
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

.expanded-details {
  margin-top: 8px;
}

.expanded-details h4 {
  margin: 0 0 8px 0;
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

@media (min-width: 768px) {
  .mobile-only {
    display: none;
  }
}
</style>
