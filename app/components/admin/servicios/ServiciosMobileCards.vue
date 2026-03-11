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
  gap: var(--spacing-2);
}

.request-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
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
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  min-height: 2.75rem;
}

.card-header:hover {
  background: var(--bg-secondary);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-2);
}

.card-type {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text-primary);
}

.type-icon {
  font-size: 1.1rem;
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

.card-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-2);
}

.card-detail {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.detail-label {
  font-size: 0.75rem;
  color: var(--text-disabled);
  font-weight: 500;
}

.detail-value {
  font-size: 0.85rem;
  color: var(--text-primary);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-expand-icon {
  display: flex;
  justify-content: center;
  color: var(--text-disabled);
}

.card-expand-icon svg {
  transition: transform 0.2s;
}

.card-expand-icon svg.rotated {
  transform: rotate(180deg);
}

/* Card expanded section */
.card-expanded {
  padding: 0 var(--spacing-4) var(--spacing-4);
  border-top: 1px solid var(--color-gray-100);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding-top: var(--spacing-3);
}

.expanded-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.expanded-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.expanded-field select {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  min-height: 2.75rem;
  background: var(--bg-primary);
  cursor: pointer;
  width: 100%;
}

.expanded-field select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
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

.expanded-details {
  margin-top: var(--spacing-2);
}

.expanded-details h4 {
  margin: 0 0 var(--spacing-2) 0;
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

@media (min-width: 48em) {
  .mobile-only {
    display: none;
  }
}
</style>
